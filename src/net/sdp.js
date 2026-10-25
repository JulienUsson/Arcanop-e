import { decodeBase45, decodeBase64Url, encodeBase45, encodeBase64Url } from './base45';
const VERSION = 1;
const TEXT_PREFIX = 'arc1.';
const MAX_CANDIDATES = 8;
const SETUPS = ['actpass', 'active', 'passive'];
const TYPES = ['host', 'srflx', 'prflx', 'relay'];
const TYPE_PREFERENCE = { host: 126, prflx: 110, srflx: 100, relay: 0 };
const MDNS = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/i;
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
function attribute(sdp, name) {
    const line = sdp.split(/\r?\n/).find((l) => l.startsWith(`a=${name}:`));
    return line ? line.slice(name.length + 3).trim() : null;
}
function candidateRank(c) {
    const family = IPV4.test(c.address) ? 0 : MDNS.test(c.address) ? 1 : 2;
    const type = c.type === 'host' ? 0 : c.type === 'srflx' ? 1 : 2;
    return family * 10 + type;
}
export function parseCandidates(sdp) {
    const seen = new Set();
    const out = [];
    for (const line of sdp.split(/\r?\n/)) {
        const m = line.match(/^a=candidate:\S+ (\d+) (\S+) \d+ (\S+) (\d+) typ (\S+)/i);
        if (!m)
            continue;
        const [, component, protocol, address, port, type] = m;
        if (component !== '1' || protocol.toLowerCase() !== 'udp')
            continue;
        if (!TYPES.includes(type))
            continue;
        if (address.toLowerCase().startsWith('fe80'))
            continue;
        const key = `${address}:${port}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push({ type: type, address, port: Number(port) });
    }
    return out.sort((a, b) => candidateRank(a) - candidateRank(b)).slice(0, MAX_CANDIDATES);
}
export function parseSdp(sdp, type, session) {
    const ufrag = attribute(sdp, 'ice-ufrag');
    const pwd = attribute(sdp, 'ice-pwd');
    const fingerprint = attribute(sdp, 'fingerprint');
    const setup = (attribute(sdp, 'setup') ?? (type === 'offer' ? 'actpass' : 'active'));
    if (!ufrag || !pwd || !fingerprint)
        throw new Error('Description de session incomplète');
    return {
        type,
        session: session >>> 0,
        ufrag,
        pwd,
        fingerprint,
        setup: SETUPS.includes(setup) ? setup : 'active',
        candidates: parseCandidates(sdp),
    };
}
export function buildSdp(data) {
    const candidates = data.candidates.map((c, i) => {
        const priority = TYPE_PREFERENCE[c.type] * 2 ** 24 + (65535 - i) * 256 + 255;
        const related = c.type === 'host' ? '' : ' raddr 0.0.0.0 rport 0';
        return `a=candidate:${i + 1} 1 udp ${priority} ${c.address} ${c.port} typ ${c.type}${related}`;
    });
    const lines = [
        'v=0',
        `o=- ${data.session} 2 IN IP4 127.0.0.1`,
        's=-',
        't=0 0',
        'a=group:BUNDLE 0',
        'a=msid-semantic: WMS',
        'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
        'c=IN IP4 0.0.0.0',
        ...candidates,
        `a=ice-ufrag:${data.ufrag}`,
        `a=ice-pwd:${data.pwd}`,
        `a=fingerprint:${data.fingerprint}`,
        `a=setup:${data.setup}`,
        'a=mid:0',
        'a=sctp-port:5000',
        'a=max-message-size:262144',
    ];
    return lines.join('\r\n') + '\r\n';
}
class Writer {
    bytes = [];
    byte(n) {
        this.bytes.push(n & 0xff);
    }
    u16(n) {
        this.byte(n >> 8);
        this.byte(n);
    }
    u32(n) {
        this.u16(n >>> 16);
        this.u16(n & 0xffff);
    }
    text(s) {
        const encoded = new TextEncoder().encode(s);
        if (encoded.length > 255)
            throw new Error('Champ trop long');
        this.byte(encoded.length);
        encoded.forEach((b) => this.byte(b));
    }
    raw(values) {
        Array.from(values).forEach((b) => this.byte(b));
    }
}
class Reader {
    bytes;
    pos = 0;
    constructor(bytes) {
        this.bytes = bytes;
    }
    byte() {
        if (this.pos >= this.bytes.length)
            throw new Error('Code tronqué');
        return this.bytes[this.pos++];
    }
    u16() {
        return (this.byte() << 8) | this.byte();
    }
    u32() {
        return ((this.u16() << 16) | this.u16()) >>> 0;
    }
    raw(n) {
        return Array.from({ length: n }, () => this.byte());
    }
    text() {
        return new TextDecoder().decode(new Uint8Array(this.raw(this.byte())));
    }
}
function ipv6ToBytes(address) {
    const clean = address.replace(/^\[|\]$/g, '').split('%')[0];
    if (!/^[0-9a-f:]+$/i.test(clean) || !clean.includes(':'))
        return null;
    const halves = clean.split('::');
    if (halves.length > 2)
        return null;
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    const missing = 8 - head.length - tail.length;
    if (missing < 0 || (halves.length === 1 && missing !== 0))
        return null;
    const groups = [...head, ...Array(missing).fill('0'), ...tail];
    const out = [];
    for (const g of groups) {
        const n = parseInt(g, 16);
        if (Number.isNaN(n) || g.length > 4)
            return null;
        out.push(n >> 8, n & 0xff);
    }
    return out;
}
function bytesToIpv6(bytes) {
    const groups = [];
    for (let i = 0; i < 16; i += 2)
        groups.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
    return groups.join(':');
}
function hexToBytes(hex) {
    return hex.match(/../g).map((h) => parseInt(h, 16));
}
function bytesToHex(bytes, separator = '') {
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join(separator);
}
export function packSignal(data) {
    const w = new Writer();
    w.byte(VERSION);
    w.byte((data.type === 'answer' ? 1 : 0) | (SETUPS.indexOf(data.setup) << 1));
    w.u32(data.session);
    w.text(data.ufrag);
    w.text(data.pwd);
    const fp = data.fingerprint.match(/^sha-256 ((?:[0-9a-f]{2}:){31}[0-9a-f]{2})$/i);
    if (fp) {
        w.byte(0);
        w.raw(hexToBytes(fp[1].replace(/:/g, '')));
    }
    else {
        w.byte(1);
        w.text(data.fingerprint);
    }
    w.byte(data.candidates.length);
    for (const c of data.candidates) {
        const type = TYPES.indexOf(c.type);
        const v4 = c.address.match(IPV4);
        const mdns = c.address.match(MDNS);
        const v6 = v4 || mdns ? null : ipv6ToBytes(c.address);
        if (v4) {
            w.byte((type << 4) | 0);
            w.raw(v4.slice(1, 5).map(Number));
        }
        else if (v6) {
            w.byte((type << 4) | 1);
            w.raw(v6);
        }
        else if (mdns) {
            w.byte((type << 4) | 2);
            w.raw(hexToBytes(mdns.slice(1, 6).join('')));
        }
        else {
            w.byte((type << 4) | 3);
            w.text(c.address);
        }
        w.u16(c.port);
    }
    return new Uint8Array(w.bytes);
}
export function unpackSignal(bytes) {
    const r = new Reader(bytes);
    if (r.byte() !== VERSION)
        throw new Error('Version de code inconnue');
    const flags = r.byte();
    const session = r.u32();
    const ufrag = r.text();
    const pwd = r.text();
    const fingerprint = r.byte() === 0 ? `sha-256 ${bytesToHex(r.raw(32), ':').toUpperCase()}` : r.text();
    const count = r.byte();
    const candidates = [];
    for (let i = 0; i < count; i++) {
        const head = r.byte();
        const type = TYPES[head >> 4] ?? 'host';
        const kind = head & 0x0f;
        let address;
        if (kind === 0)
            address = r.raw(4).join('.');
        else if (kind === 1)
            address = bytesToIpv6(r.raw(16));
        else if (kind === 2) {
            const hex = bytesToHex(r.raw(16));
            address = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}.local`;
        }
        else
            address = r.text();
        candidates.push({ type, address, port: r.u16() });
    }
    return {
        type: flags & 1 ? 'answer' : 'offer',
        session,
        ufrag,
        pwd,
        fingerprint,
        setup: SETUPS[(flags >> 1) & 3] ?? 'active',
        candidates,
    };
}
export function signalToQr(data) {
    return encodeBase45(packSignal(data));
}
export function signalToText(data) {
    return TEXT_PREFIX + encodeBase64Url(packSignal(data));
}
export function decodeSignal(input) {
    const trimmed = input.trim();
    if (trimmed.toLowerCase().startsWith(TEXT_PREFIX)) {
        return unpackSignal(decodeBase64Url(trimmed.slice(TEXT_PREFIX.length).replace(/\s+/g, '')));
    }
    return unpackSignal(decodeBase45(input.replace(/^[\r\n]+|[\r\n]+$/g, '')));
}
