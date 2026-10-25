import { describe, expect, it } from 'vitest';
import { connectionFailure } from './rtc';
import type { Candidate, SignalData } from './sdp';

const signal = (type: 'offer' | 'answer', candidates: Candidate[]): SignalData => ({
  type,
  session: 1,
  ufrag: 'u',
  pwd: 'p',
  fingerprint: 'sha-256 00',
  setup: type === 'offer' ? 'actpass' : 'active',
  candidates,
});

const host = (address: string): Candidate => ({ type: 'host', address, port: 5000 });

describe('diagnostic de connexion', () => {
  it('signale une adresse masquée', () => {
    const text = connectionFailure(signal('offer', [host('0f3c1a2b-1111-4222-8333-444455556666.local')]), signal('answer', [host('192.168.1.9')]));
    expect(text).toContain('autorisez la caméra');
  });

  it('repère deux téléphones sur le même réseau qui ne se joignent pas', () => {
    const text = connectionFailure(signal('offer', [host('10.14.190.145'), host('192.168.1.89')]), signal('answer', [host('192.168.1.99')]));
    expect(text).toContain('même réseau (192.168.1.x)');
    expect(text).toContain('Réseau local');
  });

  it('soupçonne un Wi-Fi qui isole les appareils sinon', () => {
    const text = connectionFailure(signal('offer', [host('192.168.1.89')]), signal('answer', [host('10.0.0.4')]));
    expect(text).toContain('partage de connexion');
  });
});
