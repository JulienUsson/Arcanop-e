import type { Difficulty } from './types';

export interface DifficultyDef {
  id: Difficulty;
  label: string;
  description: string;
  nemesisHpPerArrow: number;
  treeHp: number;
  volleyCards: number;
  nemesisCards: number;
  tiers: [number, number, number];
  treeDamage: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  facile: {
    id: 'facile',
    label: 'Facile',
    description: '3 volées et 1 tour de Némésis par manche, Arbre-Cœur robuste.',
    nemesisHpPerArrow: 62,
    treeHp: 60,
    volleyCards: 3,
    nemesisCards: 1,
    tiers: [4, 4, 3],
    treeDamage: 1.2,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '3 volées et 2 tours de Némésis par manche.',
    nemesisHpPerArrow: 88,
    treeHp: 45,
    volleyCards: 3,
    nemesisCards: 2,
    tiers: [4, 5, 4],
    treeDamage: 1.8,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    description: '2 volées et 2 tours de Némésis par manche, Corruption féroce.',
    nemesisHpPerArrow: 88,
    treeHp: 40,
    volleyCards: 2,
    nemesisCards: 2,
    tiers: [4, 5, 5],
    treeDamage: 1.9,
  },
};

export const GAUGE_MAX = 3;
export const HEAL_FACTOR = 0.5;
export const CERF_HEAL = 15;
export const REFERENCE_ARROWS = 12;
