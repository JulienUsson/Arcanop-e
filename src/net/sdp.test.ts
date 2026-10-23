import { describe, expect, it } from 'vitest';
import { decodeBase45, encodeBase45 } from './base45';
import { buildSdp, decodeSignal, parseSdp, signalToQr, signalToText } from './sdp';

const CHROME_OFFER = [
  'v=0',
  'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'a=extmap-allow-mixed',
  'a=msid-semantic: WMS',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 82.64.1.2',
  'a=candidate:3426742012 1 udp 2113937151 0b1f6e2a-6c5d-4c43-9a8e-1f0a3b7c9d11.local 54321 typ host generation 0 network-cost 999',
  'a=candidate:842163049 1 udp 1677729535 82.64.1.2 61000 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999',
  'a=candidate:1 1 udp 2113937151 192.168.43.12 50000 typ host generation 0',
  'a=candidate:2 1 tcp 1518280447 192.168.43.12 9 typ host tcptype active generation 0',
  'a=candidate:3 1 udp 2113939711 2a01:e0a:1f:2c40::1 50001 typ host generation 0',
  'a=candidate:4 1 udp 2113939711 fe80::1 50002 typ host generation 0',
  'a=ice-ufrag:4ZcD',
  'a=ice-pwd:2/1muCWoOi3uLifh0NuRHlhS',
  'a=ice-options:trickle',
  'a=fingerprint:sha-256 3F:A4:1C:7D:3E:8B:24:7A:EF:30:91:C6:5D:57:12:9B:AA:B1:44:6E:16:02:F3:C8:22:D8:58:44:7C:2E:5F:01',
  'a=setup:actpass',
  'a=mid:0',
  'a=sctp-port:5000',
  'a=max-message-size:262144',
  '',
].join('\r\n');

describe('base45', () => {
  it('fait l’aller-retour', () => {
    const bytes = new Uint8Array([0, 1, 2, 255, 254, 128, 7]);
    expect(Array.from(decodeBase45(encodeBase45(bytes)))).toEqual(Array.from(bytes));
    expect(encodeBase45(new TextEncoder().encode('AB'))).toBe('BB8');
  });
});

describe('signalisation', () => {
  it('extrait l’essentiel du SDP', () => {
    const data = parseSdp(CHROME_OFFER, 'offer', 1234);
    expect(data.ufrag).toBe('4ZcD');
    expect(data.setup).toBe('actpass');
    expect(data.candidates).toEqual([
      { type: 'host', address: '192.168.43.12', port: 50000 },
      { type: 'srflx', address: '82.64.1.2', port: 61000 },
      { type: 'host', address: '0b1f6e2a-6c5d-4c43-9a8e-1f0a3b7c9d11.local', port: 54321 },
      { type: 'host', address: '2a01:e0a:1f:2c40::1', port: 50001 },
    ]);
  });

  it('compresse et restaure sans perte', () => {
    const data = parseSdp(CHROME_OFFER, 'offer', 0xdeadbeef);
    const qr = signalToQr(data);
    const text = signalToText(data);
    expect(qr.length).toBeLessThan(260);
    const fromQr = decodeSignal(qr);
    const fromText = decodeSignal(`  ${text}\n`);
    const expected = { ...data, candidates: data.candidates.map((c) => ({ ...c, address: c.address.replace('2a01:e0a:1f:2c40::1', '2a01:e0a:1f:2c40:0:0:0:1') })) };
    expect(fromQr).toEqual(expected);
    expect(fromText).toEqual(expected);
  });

  it('reconstruit un SDP de canal de données', () => {
    const sdp = buildSdp(parseSdp(CHROME_OFFER, 'answer', 7));
    expect(sdp).toContain('m=application 9 UDP/DTLS/SCTP webrtc-datachannel');
    expect(sdp).toContain('a=ice-pwd:2/1muCWoOi3uLifh0NuRHlhS');
    expect(sdp).toContain('typ srflx raddr 0.0.0.0 rport 0');
    expect(sdp.endsWith('\r\n')).toBe(true);
    expect(parseSdp(sdp, 'answer', 7).candidates).toHaveLength(4);
  });
});
