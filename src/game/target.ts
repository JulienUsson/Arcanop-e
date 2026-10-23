import type { Quadrant } from './types';

export const RINGS = 10;

export interface TargetHit {
  score: number;
  quadrants: Quadrant[];
}

export function scoreAt(x: number, y: number): number {
  const r = Math.hypot(x, y);
  if (r >= 1) return 0;
  return RINGS - Math.floor(r * RINGS);
}

export function quadrantAt(x: number, y: number): Quadrant {
  return (((y < 0 ? 0 : 2) + (x < 0 ? 0 : 1)) as Quadrant);
}

export function hitAt(x: number, y: number, lineTolerance: number): TargetHit | null {
  const score = scoreAt(x, y);
  if (score === 0) return null;
  const onVertical = Math.abs(x) <= lineTolerance;
  const onHorizontal = Math.abs(y) <= lineTolerance;
  if (onVertical && onHorizontal) return { score, quadrants: [0, 1, 2, 3] };
  if (onVertical) return { score, quadrants: y < 0 ? [0, 1] : [2, 3] };
  if (onHorizontal) return { score, quadrants: x < 0 ? [0, 2] : [1, 3] };
  return { score, quadrants: [quadrantAt(x, y)] };
}

export function isYellow(score: number): boolean {
  return score >= 9;
}

export const RING_COLORS: Record<number, { fill: string; text: string; line: string }> = {
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
