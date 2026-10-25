import { reduce } from '../game/engine';
import type { GameAction, GameState } from '../game/types';
import { decode, encode, type GuestMessage, type HostMessage, type RosterEntry } from './protocol';
import { acceptAnswer, closePeer, createOffer, type PeerLink } from './rtc';
import { decodeSignal, signalToQr, signalToText } from './sdp';

const STORAGE_KEY = 'arcanopee.host';
const HISTORY_LIMIT = 40;
const OPEN_TIMEOUT = 25000;

interface Conn {
  id: number;
  link: PeerLink;
  token: string | null;
  playerId: string | null;
  open: boolean;
}

export type InviteStatus = 'idle' | 'preparing' | 'ready' | 'connecting' | 'error';

export interface HostSnapshot {
  state: GameState;
  roster: RosterEntry[];
  canUndo: boolean;
  invite: { qr: string; text: string } | null;
  inviteStatus: InviteStatus;
  inviteError: string | null;
  phones: number;
}

interface Saved {
  state: GameState;
  claims: Record<string, string>;
}

export class HostSession {
  private state: GameState;
  private claims: Record<string, string>;
  private history: GameState[] = [];
  private conns = new Map<number, Conn>();
  private nextConnId = 1;
  private listeners = new Set<() => void>();
  private invite: { link: PeerLink; qr: string; text: string } | null = null;
  private inviteStatus: InviteStatus = 'idle';
  private inviteError: string | null = null;
  private snapshot: HostSnapshot;

  constructor(state: GameState, claims: Record<string, string> = {}) {
    this.state = state;
    this.claims = claims;
    this.snapshot = this.buildSnapshot();
    this.persist();
  }

  static load(): HostSession | null {
    const saved = HostSession.saved();
    if (!saved) return null;
    const { state } = saved;
    if (state.phase.kind === 'volley') {
      if (!state.phase.step) state.phase.step = 'input';
      if (Object.values(state.phase.submissions).some((sub) => Array.isArray(sub))) state.phase.submissions = {};
    }
    if (state.lastEvent && (!state.lastEvent.kind || 'hits' in state.lastEvent)) state.lastEvent = null;
    state.players.forEach((p) => (p.stats.crits ??= 0));
    return new HostSession(state, saved.claims);
  }

  static saved(): Saved | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      return null;
    }
  }

  static clearSaved() {
    localStorage.removeItem(STORAGE_KEY);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  dispatch(action: GameAction) {
    const next = reduce(this.state, action);
    if (next === this.state) return;
    this.history = [...this.history, this.state].slice(-HISTORY_LIMIT);
    this.state = next;
    this.changed();
  }

  undo() {
    const previous = this.history.at(-1);
    if (!previous) return;
    this.history = this.history.slice(0, -1);
    this.state = previous;
    this.changed();
  }

  release(playerId: string) {
    delete this.claims[playerId];
    this.conns.forEach((c) => {
      if (c.playerId === playerId) c.playerId = null;
    });
    this.changed();
  }

  async openInvite() {
    this.cancelInvite();
    this.inviteStatus = 'preparing';
    this.inviteError = null;
    this.notify();
    try {
      const link = await createOffer();
      if (this.inviteStatus !== 'preparing') {
        closePeer(link);
        return;
      }
      this.invite = { link, qr: signalToQr(link.offer), text: signalToText(link.offer) };
      this.inviteStatus = 'ready';
    } catch (e) {
      this.inviteStatus = 'error';
      this.inviteError = e instanceof Error ? e.message : String(e);
    }
    this.notify();
  }

  cancelInvite() {
    if (this.invite && this.inviteStatus !== 'connecting') closePeer(this.invite.link);
    this.invite = null;
    this.inviteStatus = 'idle';
    this.inviteError = null;
    this.notify();
  }

  async acceptAnswer(code: string): Promise<void> {
    const invite = this.invite;
    if (!invite) throw new Error('Aucune invitation en cours.');
    const answer = decodeSignal(code);
    await acceptAnswer(invite.link, answer);
    this.inviteStatus = 'connecting';
    this.notify();
    const conn = this.attach(invite.link);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.drop(conn);
        reject(new Error('La connexion n’a pas abouti. Vérifiez que les téléphones partagent un réseau.'));
      }, OPEN_TIMEOUT);
      const opened = () => {
        clearTimeout(timer);
        resolve();
      };
      if (invite.link.channel.readyState === 'open') opened();
      else invite.link.channel.addEventListener('open', opened, { once: true });
    }).finally(() => {
      if (this.invite === invite) {
        this.invite = null;
        this.inviteStatus = 'idle';
        this.notify();
      }
    });
  }

  close() {
    this.cancelInvite();
    this.conns.forEach((c) => closePeer(c.link));
    this.conns.clear();
  }

  private attach(link: PeerLink): Conn {
    const conn: Conn = { id: this.nextConnId++, link, token: null, playerId: null, open: false };
    this.conns.set(conn.id, conn);
    const { pc, channel } = link;
    channel.addEventListener('open', () => {
      conn.open = true;
      this.changed();
    });
    channel.addEventListener('message', (e) => {
      const msg = decode<GuestMessage>(e.data);
      if (msg) this.handle(conn, msg);
    });
    channel.addEventListener('close', () => this.drop(conn));
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.drop(conn);
    });
    return conn;
  }

  private drop(conn: Conn) {
    if (!this.conns.has(conn.id)) return;
    this.conns.delete(conn.id);
    closePeer(conn.link);
    this.changed();
  }

  private connected(token: string): Conn | undefined {
    for (const c of this.conns.values()) if (c.open && c.token === token) return c;
    return undefined;
  }

  private send(conn: Conn, message: HostMessage) {
    if (conn.link.channel.readyState !== 'open') return;
    try {
      conn.link.channel.send(encode(message));
    } catch {
      this.drop(conn);
    }
  }

  private handle(conn: Conn, msg: GuestMessage) {
    switch (msg.t) {
      case 'hello': {
        const token = String(msg.token).slice(0, 64);
        for (const other of this.conns.values()) {
          if (other !== conn && other.token === token) this.drop(other);
        }
        conn.token = token;
        conn.playerId = Object.keys(this.claims).find((id) => this.claims[id] === token) ?? null;
        this.changed();
        break;
      }
      case 'claim': {
        if (!conn.token || !this.state.players.some((p) => p.id === msg.playerId)) return;
        const holder = this.claims[msg.playerId];
        if (holder && holder !== conn.token && this.connected(holder)) {
          this.send(conn, { t: 'notice', message: 'Cet archer est déjà pris par un autre téléphone.' });
          return;
        }
        for (const id of Object.keys(this.claims)) {
          if (this.claims[id] === conn.token) delete this.claims[id];
        }
        if (holder && holder !== conn.token) {
          this.conns.forEach((c) => {
            if (c.token === holder) c.playerId = null;
          });
        }
        this.claims[msg.playerId] = conn.token;
        conn.playerId = msg.playerId;
        this.changed();
        break;
      }
      case 'release':
        if (conn.playerId) this.release(conn.playerId);
        break;
      case 'submit':
        if (msg.playerId !== conn.playerId) return;
        if (this.state.phase.kind !== 'volley' || this.state.phase.volley !== msg.volley) {
          this.send(conn, { t: 'notice', message: 'Cette volée est déjà résolue.' });
          return;
        }
        this.dispatch({ type: 'submit', playerId: msg.playerId, submission: msg.submission });
        break;
      case 'power':
        if (msg.playerId !== conn.playerId) return;
        this.dispatch({ type: 'power', playerId: msg.playerId, targetUid: msg.targetUid });
        break;
      case 'focus':
        this.dispatch({ type: 'focus', kind: msg.kind, uid: msg.uid });
        break;
    }
  }

  private roster(): RosterEntry[] {
    return this.state.players.map((p) => {
      const token = this.claims[p.id];
      if (!token) return { playerId: p.id, status: 'free' };
      return { playerId: p.id, status: this.connected(token) ? 'online' : 'offline' };
    });
  }

  private buildSnapshot(): HostSnapshot {
    return {
      state: this.state,
      roster: this.roster(),
      canUndo: this.history.length > 0,
      invite: this.invite ? { qr: this.invite.qr, text: this.invite.text } : null,
      inviteStatus: this.inviteStatus,
      inviteError: this.inviteError,
      phones: [...this.conns.values()].filter((c) => c.open).length,
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: this.state, claims: this.claims } satisfies Saved));
    } catch {}
  }

  private notify() {
    this.snapshot = this.buildSnapshot();
    this.listeners.forEach((l) => l());
  }

  private changed() {
    this.persist();
    this.notify();
    const roster = this.snapshot.roster;
    this.conns.forEach((c) => {
      if (c.open && c.token) this.send(c, { t: 'state', state: this.state, roster, you: c.playerId });
    });
  }
}
