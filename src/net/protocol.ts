import type { GameState, Submission } from '../game/types';

export type GuestMessage =
  | { t: 'hello'; token: string; gameId: string | null }
  | { t: 'claim'; playerId: string }
  | { t: 'release' }
  | { t: 'submit'; playerId: string; volley: number; submission: Submission }
  | { t: 'power'; playerId: string; targetUid?: string };

export interface RosterEntry {
  playerId: string;
  status: 'host' | 'online' | 'offline' | 'free';
}

export type HostMessage =
  | { t: 'state'; state: GameState; roster: RosterEntry[]; you: string | null }
  | { t: 'notice'; message: string };

export function encode(message: GuestMessage | HostMessage): string {
  return JSON.stringify(message);
}

export function decode<T>(data: unknown): T | null {
  if (typeof data !== 'string') return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}
