import { describe, expect, it } from 'vitest';
import { wifiPayload } from './wifi';

describe('QR code Wi-Fi', () => {
  it('encode un réseau protégé', () => {
    expect(wifiPayload({ ssid: 'iPhone de Julien', password: 'secret123', open: false })).toBe('WIFI:T:WPA;S:iPhone de Julien;P:secret123;;');
  });

  it('échappe les caractères spéciaux', () => {
    expect(wifiPayload({ ssid: 'Box;2:4G', password: 'a,b"c\\d', open: false })).toBe('WIFI:T:WPA;S:Box\\;2\\:4G;P:a\\,b\\"c\\\\d;;');
  });

  it('encode un réseau ouvert sans mot de passe', () => {
    expect(wifiPayload({ ssid: 'Club', password: 'ignoré', open: true })).toBe('WIFI:T:nopass;S:Club;;');
  });
});
