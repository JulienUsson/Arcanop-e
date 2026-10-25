import type { Arrow } from './types';

export const CRIT_MULTIPLIER = 2;

export function isYellow(score: number): boolean {
  return score >= 9;
}

export function arrowPoints(arrow: Arrow): number {
  if (arrow.score <= 0) return 0;
  return arrow.x ? arrow.score * CRIT_MULTIPLIER : arrow.score;
}

export function arrowLabel(arrow: Arrow): string {
  if (arrow.x) return 'X';
  return arrow.score === 0 ? 'M' : String(arrow.score);
}

export const RING_COLORS: Record<number, { fill: string; text: string; line: string }> = {
  0: { fill: '#3a3f3b', text: '#ddd', line: '#666' },
  1: { fill: '#f4f1ea', text: '#222', line: '#222' },
  2: { fill: '#f4f1ea', text: '#222', line: '#222' },
  3: { fill: '#1d1d1f', text: '#eee', line: '#eee' },
  4: { fill: '#1d1d1f', text: '#eee', line: '#eee' },
  5: { fill: '#1f8fd6', text: '#fff', line: '#111' },
  6: { fill: '#1f8fd6', text: '#fff', line: '#111' },
  7: { fill: '#e2343a', text: '#fff', line: '#111' },
  8: { fill: '#e2343a', text: '#fff', line: '#111' },
  9: { fill: '#f6d32d', text: '#222', line: '#111' },
  10: { fill: '#f6d32d', text: '#222', line: '#111' },
};
