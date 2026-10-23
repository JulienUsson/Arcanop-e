const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export function encodeBase45(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      let n = bytes[i] * 256 + bytes[i + 1];
      const c = n % 45;
      n = (n - c) / 45;
      const d = n % 45;
      const e = (n - d) / 45;
      out += ALPHABET[c] + ALPHABET[d] + ALPHABET[e];
    } else {
      const n = bytes[i];
      out += ALPHABET[n % 45] + ALPHABET[Math.floor(n / 45)];
    }
  }
  return out;
}

export function decodeBase45(text: string): Uint8Array {
  const values = Array.from(text, (ch) => {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error('Caractère base45 invalide');
    return v;
  });
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 3) {
    const chunk = values.slice(i, i + 3);
    if (chunk.length === 3) {
      const n = chunk[0] + chunk[1] * 45 + chunk[2] * 2025;
      if (n > 0xffff) throw new Error('Bloc base45 invalide');
      out.push(n >> 8, n & 0xff);
    } else if (chunk.length === 2) {
      const n = chunk[0] + chunk[1] * 45;
      if (n > 0xff) throw new Error('Bloc base45 invalide');
      out.push(n);
    } else {
      throw new Error('Longueur base45 invalide');
    }
  }
  return new Uint8Array(out);
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
