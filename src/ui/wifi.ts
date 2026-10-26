export interface WifiSettings {
  ssid: string;
  password: string;
  open: boolean;
}

const KEY = 'arcanopee.wifi';

function escape(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export function wifiPayload({ ssid, password, open }: WifiSettings): string {
  return open ? `WIFI:T:nopass;S:${escape(ssid)};;` : `WIFI:T:WPA;S:${escape(ssid)};P:${escape(password)};;`;
}

export function loadWifi(): WifiSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<WifiSettings> | null;
    return { ssid: saved?.ssid ?? '', password: saved?.password ?? '', open: saved?.open ?? false };
  } catch {
    return { ssid: '', password: '', open: false };
  }
}

export function saveWifi(settings: WifiSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}
