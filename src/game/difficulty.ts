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
    description: '3 volées et 2 tours de Némésis par manche, Némésis plus fragile, Arbre-Cœur robuste, Gardiens à 20 PV.',
    nemesisHpPerArrow: 115,
    treeHp: 60,
    volleyCards: 3,
    nemesisCards: 2,
    tiers: [4, 4, 2],
    treeDamage: 1.4,
    archerHp: 20,
    archerDamage: 0.75,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '3 volées et 2 tours de Némésis par manche, paquet de colère court, Gardiens à 15 PV.',
    nemesisHpPerArrow: 160,
    treeHp: 45,
    volleyCards: 3,
    nemesisCards: 2,
    tiers: [3, 4, 3],
    treeDamage: 2.4,
    archerHp: 15,
    archerDamage: 1,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    description: '2 volées et 2 tours de Némésis par manche, Corruption féroce, Gardiens à 12 PV.',
    nemesisHpPerArrow: 130,
    treeHp: 40,
    volleyCards: 2,
    nemesisCards: 2,
    tiers: [4, 5, 5],
    treeDamage: 2.2,
    archerHp: 12,
    archerDamage: 1.25,
  },
};

export const HEAL_FACTOR = 0.5;
export const CERF_HEAL = 15;
export const CERF_ARCHER_HEAL = 5;
export const WEAKENED_FACTOR = 0.5;
export const FURY_TREE_BASE = 10;
export const FURY_TREE_STEP = 6;
export const FURY_ARCHERS_BASE = 3;
export const FURY_ARCHERS_STEP = 1;
export const REFERENCE_ARROWS = 12;
export const TEAM_HP_FACTORS = [1, 0.5, 0.72, 0.87, 1, 1.06, 1.14, 1.21, 1.29];
