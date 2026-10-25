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
  archerHp: number;
  archerDamage: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  facile: {
    id: 'facile',
    label: 'Facile',
    description: '3 volées et 1 tour de Némésis par manche, Arbre-Cœur robuste, Gardiens à 20 PV.',
    nemesisHpPerArrow: 62,
    treeHp: 60,
    volleyCards: 3,
    nemesisCards: 1,
    tiers: [4, 4, 3],
    treeDamage: 1.2,
    archerHp: 20,
    archerDamage: 0.75,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '3 volées et 2 tours de Némésis par manche, Gardiens à 15 PV.',
    nemesisHpPerArrow: 88,
    treeHp: 45,
    volleyCards: 3,
    nemesisCards: 2,
    tiers: [4, 5, 4],
    treeDamage: 1.8,
    archerHp: 15,
    archerDamage: 1,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    description: '2 volées et 2 tours de Némésis par manche, Corruption féroce, Gardiens à 12 PV.',
    nemesisHpPerArrow: 88,
    treeHp: 40,
    volleyCards: 2,
    nemesisCards: 2,
    tiers: [4, 5, 5],
    treeDamage: 1.9,
    archerHp: 12,
    archerDamage: 1.25,
  },
};

export const GAUGE_MAX = 3;
export const HEAL_FACTOR = 0.5;
export const CERF_HEAL = 15;
export const CERF_ARCHER_HEAL = 5;
export const WEAKENED_FACTOR = 0.5;
export const FURY_TREE_BASE = 10;
export const FURY_TREE_STEP = 6;
export const FURY_ARCHERS_BASE = 3;
export const FURY_ARCHERS_STEP = 1;
export const REFERENCE_ARROWS = 12;
