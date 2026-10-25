import { useEffect, useRef, useState } from 'react';
import { burstAt, flash, punch, shake, useTween } from '../fx';
import { play } from '../sfx';
import { Modal } from './Modal';
import { NemesisSheet } from './NemesisSheet';
import { TreeSheet } from './TreeSheet';
import { CLASSES } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { describeCard, nemesisActions } from '../../game/engine';
import { getCard, getNemesis } from '../../game/nemesis';
import type { GameState, Player } from '../../game/types';
import type { RosterEntry } from '../../net/protocol';

interface Props {
  state: GameState;
  roster: RosterEntry[];
  you?: string | null;
}

interface Floater {
  id: number;
  delta: number;
  big: boolean;
}

function useDelta(value: number, max: number): { floaters: Floater[]; pulse: 'up' | 'down' | null; pulseKey: number; delta: number } {
  const previous = useRef(value);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [pulse, setPulse] = useState<{ dir: 'up' | 'down' | null; key: number; delta: number }>({ dir: null, key: 0, delta: 0 });
  useEffect(() => {
    const delta = value - previous.current;
    previous.current = value;
    if (delta === 0) return;
    const id = Date.now() + Math.random();
    setFloaters((f) => [...f, { id, delta, big: Math.abs(delta) >= max * 0.08 }]);
    setPulse({ dir: delta < 0 ? 'down' : 'up', key: id, delta });
    const timer = setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1600);
    return () => clearTimeout(timer);
  }, [value]);
  return { floaters, pulse: pulse.dir, pulseKey: pulse.key, delta: pulse.delta };
}

export function HpBar({ hp, max, tone }: { hp: number; max: number; tone: 'nemesis' | 'tree' | 'creature' | 'root' | 'archer' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
  const { floaters, pulse, pulseKey } = useDelta(hp, max);
  const shown = useTween(hp, 450);
  return (
    <div className={`hp-bar ${tone}${pct <= 25 ? ' low' : ''}`}>
      <div className="hp-track">
        <div className="hp-ghost" style={{ width: `${pct}%` }} />
        <div className="hp-fill" style={{ width: `${pct}%` }} />
      </div>
      {pulse && <div key={pulseKey} className={`hp-pulse ${pulse}`} />}
      <span className="hp-text">
        {shown} / {max}
      </span>
      {floaters.map((f) => (
        <span key={f.id} className={`floater ${f.delta < 0 ? 'down' : 'up'}${f.big ? ' big' : ''}`}>
          {f.delta > 0 ? `+${f.delta}` : f.delta}
        </span>
      ))}
    </div>
  );
}

export function Gauge({ value }: { value: number }) {
  const previous = useRef(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [popped, setPopped] = useState<number | null>(null);
  useEffect(() => {
    if (value > previous.current) setPopped(value - 1);
    if (value >= GAUGE_MAX && previous.current < GAUGE_MAX) {
      burstAt(ref.current, 'sparks', 18);
      play('ready');
    }
    previous.current = value;
  }, [value]);
  return (
    <span ref={ref} className={`gauge${value >= GAUGE_MAX ? ' full' : ''}`} aria-label={`Jauge ${value}/${GAUGE_MAX}`}>
      {Array.from({ length: GAUGE_MAX }, (_, i) => (
        <span key={`${i}-${popped === i ? value : 0}`} className={`pip${i < value ? ' on' : ''}${popped === i ? ' pop' : ''}`} />
      ))}
    </span>
  );
}

function Portrait({ kind, hp, max, onClick, children }: { kind: 'nemesis' | 'tree'; hp: number; max: number; onClick?: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { pulse, pulseKey, delta } = useDelta(hp, max);
  useEffect(() => {
    if (!pulseKey || !delta) return;
    const big = Math.abs(delta) >= max * 0.12;
    if (delta > 0) {
      burstAt(ref.current, 'leaves', 14);
      return;
    }
    if (kind === 'nemesis') {
      burstAt(ref.current, 'shards', big ? 30 : 16);
      if (big) shake('soft');
    } else {
      burstAt(ref.current, 'splinters', big ? 26 : 14);
      flash('rgba(226, 52, 58, 0.35)');
      shake(big ? 'hard' : 'soft');
    }
  }, [pulseKey]);
  return (
    <button ref={ref} className={`portrait ${kind}`} onClick={onClick} disabled={!onClick} aria-label={kind === 'nemesis' ? 'Fiche de la Némésis' : 'Fiche de l’Arbre-Cœur'}>
      <span className="portrait-orb">
        <span key={pulseKey} className={`portrait-hit${pulse ? ` hit-${pulse}` : ''}`}>
          <span className="portrait-face">{children}</span>
        </span>
      </span>
    </button>
  );
}

function useGhosts<T extends { uid: string }>(items: T[]): (T & { dying?: boolean })[] {
  const previous = useRef(items);
  const [ghosts, setGhosts] = useState<T[]>([]);
  useEffect(() => {
    const gone = previous.current.filter((p) => !items.some((i) => i.uid === p.uid));
    previous.current = items;
    if (gone.length === 0) return;
    setGhosts((g) => [...g, ...gone.map((x) => ({ ...x, hp: 0 }))]);
    const timer = setTimeout(() => setGhosts((g) => g.filter((x) => !gone.some((y) => y.uid === x.uid))), 900);
    return () => clearTimeout(timer);
  }, [items]);
  return [...items, ...ghosts.filter((g) => !items.some((i) => i.uid === g.uid)).map((g) => ({ ...g, dying: true }))];
}

const dyingRef = (el: HTMLElement | null) => {
  if (el) burstAt(el, 'smoke', 14);
};

function useArrivals(uids: string[]): (uid: string) => (el: HTMLElement | null) => void {
  const seen = useRef(new Set(uids));
  return (uid) => (el) => {
    if (!el || seen.current.has(uid)) return;
    seen.current.add(uid);
    burstAt(el, 'shards', 18);
    punch(el, 1.12);
  };
}

interface Banner {
  key: string;
  title: string;
  sub: string;
  tone: 'volley' | 'nemesis' | 'fury';
}

function phaseBanner(state: GameState): Banner | null {
  const phase = state.phase;
  if (phase.kind === 'volley') return { key: `v${phase.volley}`, title: `Volée ${phase.volley}`, sub: 'Conseil, puis à vos arcs !', tone: 'volley' };
  if (phase.kind === 'nemesis' && phase.drawn === 0) {
    const name = getNemesis(state.config.nemesisId).name;
    return state.wrathDeck.length === 0
      ? { key: `n${state.volleyCount}`, title: 'Furie', sub: `${name} se déchaîne`, tone: 'fury' }
      : { key: `n${state.volleyCount}`, title: 'Riposte', sub: `${name} contre-attaque`, tone: 'nemesis' };
  }
  return null;
}

function usePhaseBanner(state: GameState): Banner | null {
  const next = phaseBanner(state);
  const last = useRef(next?.key ?? null);
  const [shown, setShown] = useState<Banner | null>(null);
  useEffect(() => {
    if (!next || next.key === last.current) return;
    last.current = next.key;
    setShown(next);
    play('banner');
    const timer = setTimeout(() => setShown(null), 1700);
    return () => clearTimeout(timer);
  }, [next?.key]);
  return shown;
}

const ROW_SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(0)' },
];

function RosterRow({ player, className, children }: { player: Player; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  const previous = useRef(player.hp);
  const [mark, setMark] = useState<{ key: number; kind: 'hurt' | 'healed'; stamp?: string } | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = player.hp;
    if (player.hp === before) return;
    const key = Date.now();
    if (player.hp < before) {
      const down = before > 0 && player.hp === 0;
      setMark({ key, kind: 'hurt', stamp: down ? 'À terre !' : undefined });
      burstAt(ref.current, down ? 'smoke' : 'splinters', down ? 16 : 8);
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ref.current?.animate(ROW_SHAKE, { duration: 360, easing: 'ease-out' });
      play('hurt');
    } else {
      const revived = before === 0;
      setMark({ key, kind: 'healed', stamp: revived ? 'Relevé !' : undefined });
      burstAt(ref.current, revived ? 'sparks' : 'leaves', revived ? 20 : 8);
    }
  }, [player.hp]);
  return (
    <li ref={ref} className={className}>
      {children}
      {mark && <span key={mark.key} className={`row-flash ${mark.kind}`} aria-hidden />}
      {mark?.stamp && (
        <span key={`s${mark.key}`} className={`row-stamp ${mark.kind}`}>
          {mark.stamp}
        </span>
      )}
    </li>
  );
}

const STATUS_LABEL: Record<RosterEntry['status'], string> = {
  online: 'connecté',
  offline: 'déconnecté',
  free: 'saisie hôte',
  host: 'hôte',
};

export function Board({ state, roster, you }: Props) {
  const nemesis = getNemesis(state.config.nemesisId);
  const phase = state.phase;
  const revealedCard = state.revealed && state.wrathDeck[0] ? getCard(state.config.nemesisId, state.wrathDeck[0]) : null;
  const [nemesisSheet, setNemesisSheet] = useState(false);
  const [treeSheet, setTreeSheet] = useState(false);
  const creatures = useGhosts(state.creatures);
  const roots = useGhosts(state.roots);
  const treeLow = state.tree.hp <= state.tree.maxHp * 0.3;
  const riposteCards = nemesisActions(state.config);
  const banner = usePhaseBanner(state);
  const arrival = useArrivals([...state.creatures, ...state.roots].map((m) => m.uid));
  const fury = state.wrathDeck.length === 0 && state.phase.kind !== 'lobby' && state.phase.kind !== 'over';

  useEffect(() => {
    document.body.classList.toggle('fury-mode', fury);
    return () => document.body.classList.remove('fury-mode');
  }, [fury]);

  return (
    <div className="board">
      {treeLow && <div className="danger-vignette" aria-hidden />}
      {banner && (
        <div key={banner.key} className={`phase-banner ${banner.tone}`} aria-hidden>
          <strong>{banner.title}</strong>
          <small>{banner.sub}</small>
        </div>
      )}
      <section className={`arena${treeLow ? ' tree-low' : ''}${state.wrathDeck.length === 0 && state.phase.kind !== 'lobby' ? ' fury' : ''}`}>
        <div className="combatant tree-side">
          <Portrait kind="tree" hp={state.tree.hp} max={state.tree.maxHp} onClick={() => setTreeSheet(true)}>
            🌳
          </Portrait>
          <button className="combatant-name link-name" onClick={() => setTreeSheet(true)}>
            Arbre-Cœur <small>📜</small>
          </button>
          <HpBar hp={state.tree.hp} max={state.tree.maxHp} tone="tree" />
        </div>
        <div className="versus">VS</div>
        <div className="combatant nemesis-side">
          <Portrait kind="nemesis" hp={state.nemesis.hp} max={state.nemesis.maxHp} onClick={() => setNemesisSheet(true)}>
            {nemesis.portrait}
          </Portrait>
          <button className="combatant-name link-name" onClick={() => setNemesisSheet(true)}>
            {nemesis.name} <small>📜</small>
          </button>
          <HpBar hp={state.nemesis.hp} max={state.nemesis.maxHp} tone="nemesis" />
        </div>
      </section>

      <section className="panel turn-panel">
        <div className="turn-info">
          <strong>Volée {state.volleyCount || '—'}</strong>
          <small className="turn-next">
            {phase.kind === 'nemesis' ? '💀 Riposte en cours' : `puis 💀 riposte : ${riposteCards} carte${riposteCards > 1 ? 's' : ''}`}
          </small>
        </div>
        {state.wrathDeck.length > 0 ? (
          <div className="wrath-info" title="Cartes de colère restantes">
            <span className="wrath-stack">📜</span> {state.wrathDeck.length}
          </div>
        ) : (
          <div className="wrath-info fury" title="Paquet de colère vide : Furie finale">
            🔥 {state.fury > 0 ? `Furie ${state.fury}` : 'Furie imminente'}
          </div>
        )}
        {state.wolfBoost > 0 && (
          <div className="badge power">🐺 La Meute chasse : dégâts ×{String(state.wolfBoost).replace('.', ',')} à la prochaine volée</div>
        )}
        {revealedCard && (
          <div className="revealed">
            🦉 Prochaine carte : <strong>{revealedCard.name}</strong> — {describeCard(revealedCard, state)}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          🐾 Créatures <small>agissent à chaque tour de la Némésis</small>
        </div>
        {creatures.length === 0 && <p className="empty">Aucune créature : les flèches « Créatures » frappent la Némésis.</p>}
        <div className="minion-grid">
          {creatures.map((c) => {
            const card = getCard(state.config.nemesisId, c.cardId);
            return (
              <div key={c.uid} ref={c.dying ? dyingRef : arrival(c.uid)} className={`minion creature${c.dying ? ' dying' : ''}`}>
                <div className="minion-head">{card.name}</div>
                <HpBar hp={c.hp} max={c.maxHp} tone="creature" />
                <small>{describeCard(card, state)}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          🌿 Racines <small>⏳ tours de la Némésis avant éclosion</small>
        </div>
        {roots.length === 0 && <p className="empty">Aucune racine : les flèches « Racines » frappent la Némésis.</p>}
        <div className="minion-grid">
          {roots.map((r) => {
            const card = getCard(state.config.nemesisId, r.cardId);
            return (
              <div
                key={r.uid}
                ref={r.dying ? dyingRef : arrival(r.uid)}
                className={`minion root${r.countdown <= riposteCards && !r.dying ? ' urgent' : ''}${r.dying ? ' dying' : ''}`}
              >
                <span className="countdown" title="Tours de la Némésis avant éclosion">
                  ⏳{r.countdown}
                </span>
                <div className="minion-head">{card.name}</div>
                <HpBar hp={r.hp} max={r.maxHp} tone="root" />
                <small>{describeCard(card, state)}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">🏹 Gardiens</div>
        <ul className="roster">
          {state.players.map((p) => {
            const entry = roster.find((r) => r.playerId === p.id);
            const submitted = phase.kind === 'volley' && !!phase.submissions[p.id];
            return (
              <RosterRow key={p.id} player={p} className={`roster-item${p.id === you ? ' you' : ''}${p.hp <= 0 ? ' down' : ''}`}>
                <div className="roster-row">
                  <span className="who">
                    <span className="avatar" style={{ ['--class-color' as string]: CLASSES[p.classId].color }}>
                      {p.hp <= 0 ? '💤' : CLASSES[p.classId].emoji}
                    </span>
                    {p.name}
                    {p.bot && <span className="status bot">🤖 compagnon</span>}
                    {p.hp <= 0 && <span className="status down">à terre ×½</span>}
                    {entry && entry.status !== 'free' && <span className={`status ${entry.status}`}>{STATUS_LABEL[entry.status]}</span>}
                  </span>
                  <span className="right">
                    {phase.kind === 'volley' && <span className={`submitted${submitted ? ' yes' : ''}`}>{submitted ? '✓' : '…'}</span>}
                    <Gauge value={p.gauge} />
                  </span>
                </div>
                <HpBar hp={p.hp} max={p.maxHp} tone="archer" />
              </RosterRow>
            );
          })}
        </ul>
      </section>
      {treeSheet && (
        <Modal label="Fiche de l’Arbre-Cœur" onClose={() => setTreeSheet(false)}>
          <TreeSheet state={state} />
        </Modal>
      )}
      {nemesisSheet && (
        <Modal label="Fiche de la Némésis" onClose={() => setNemesisSheet(false)}>
          <NemesisSheet nemesisId={state.config.nemesisId} state={state} />
        </Modal>
      )}
    </div>
  );
}
