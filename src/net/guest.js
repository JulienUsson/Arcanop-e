import { migrateState } from '../game/engine';
import { decode, encode } from './protocol';
import { acceptOffer, closePeer } from './rtc';
import { decodeSignal, signalToQr, signalToText } from './sdp';
const TOKEN_KEY = 'arcanopee.token';
const LAST_KEY = 'arcanopee.guest';
const OPEN_TIMEOUT = 120000;
function deviceToken() {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        token = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
}
export class GuestSession {
    token = deviceToken();
    link = null;
    listeners = new Set();
    noticeId = 0;
    snapshot;
    constructor() {
        let last = null;
        try {
            last = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null');
        }
        catch { }
        if (last?.state)
            migrateState(last.state);
        this.snapshot = {
            status: last?.state ? 'lost' : 'idle',
            answer: null,
            error: null,
            state: last?.state ?? null,
            roster: last?.roster ?? [],
            you: last?.you ?? null,
            notice: null,
        };
    }
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    getSnapshot = () => this.snapshot;
    set(patch) {
        this.snapshot = { ...this.snapshot, ...patch };
        this.listeners.forEach((l) => l());
    }
    async join(code) {
        closePeer(this.link);
        this.link = null;
        this.set({ status: 'answering', error: null, answer: null });
        try {
            const offer = decodeSignal(code);
            const link = await acceptOffer(offer);
            this.link = link;
            this.wire(link);
            this.set({ status: 'answer', answer: { qr: signalToQr(link.answer), text: signalToText(link.answer) } });
            setTimeout(() => {
                if (this.link === link && link.channel.readyState !== 'open') {
                    closePeer(link);
                    this.link = null;
                    this.set({ status: this.snapshot.state ? 'lost' : 'idle', answer: null, error: 'L’hôte n’a pas validé la connexion à temps.' });
                }
            }, OPEN_TIMEOUT);
        }
        catch (e) {
            this.set({ status: this.snapshot.state ? 'lost' : 'idle', error: e instanceof Error ? e.message : String(e) });
        }
    }
    wire(link) {
        const { pc, channel } = link;
        channel.addEventListener('open', () => {
            if (this.link !== link)
                return;
            this.set({ status: 'connected', answer: null, error: null });
            this.send({ t: 'hello', token: this.token, gameId: this.snapshot.state?.gameId ?? null });
        });
        channel.addEventListener('message', (e) => {
            if (this.link !== link)
                return;
            const msg = decode(e.data);
            if (!msg)
                return;
            if (msg.t === 'state') {
                this.set({ state: msg.state, roster: msg.roster, you: msg.you });
                try {
                    localStorage.setItem(LAST_KEY, JSON.stringify({ state: msg.state, roster: msg.roster, you: msg.you }));
                }
                catch { }
            }
            else if (msg.t === 'notice') {
                this.set({ notice: { id: ++this.noticeId, message: msg.message } });
            }
        });
        const lost = () => {
            if (this.link !== link || this.snapshot.status !== 'connected')
                return;
            closePeer(link);
            this.link = null;
            this.set({ status: 'lost' });
        };
        channel.addEventListener('close', lost);
        pc.addEventListener('connectionstatechange', () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed')
                lost();
        });
    }
    send(message) {
        const channel = this.link?.channel;
        if (channel?.readyState === 'open')
            channel.send(encode(message));
    }
    cancel() {
        closePeer(this.link);
        this.link = null;
        this.set({ status: this.snapshot.state ? 'lost' : 'idle', answer: null });
    }
    claim(playerId) {
        this.send({ t: 'claim', playerId });
    }
    release() {
        this.send({ t: 'release' });
    }
    submit(submission) {
        const { state, you } = this.snapshot;
        if (!state || !you || state.phase.kind !== 'volley')
            return;
        this.send({ t: 'submit', playerId: you, volley: state.phase.volley, submission });
    }
    power(targetUid) {
        if (this.snapshot.you)
            this.send({ t: 'power', playerId: this.snapshot.you, targetUid });
    }
    forget() {
        closePeer(this.link);
        this.link = null;
        localStorage.removeItem(LAST_KEY);
        this.set({ status: 'idle', state: null, roster: [], you: null, answer: null, error: null });
    }
}
