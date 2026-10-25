import type { Difficulty } from './types';

export interface DifficultyDef {
  id: Difficulty;
  label: string;
  description: string;
  nemesisHp: number;
  treeHp: number;
  tiers: [number, number, number];
  treeDamage: number;
  archerHp: number;
  archerDamage: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  facile: {
    id: 'facile',
    label: 'Facile',
    description: 'Némésis plus fragile, long paquet de colère, Arbre-Cœur robuste, Gardiens à 20 PV.',
    nemesisHp: 1300,
    treeHp: 60,
    tiers: [5, 5, 4],
    treeDamage: 1.2,
    archerHp: 20,
    archerDamage: 0.75,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'Le défi de référence pour une équipe à 8 de moyenne par flèche. Gardiens à 15 PV.',
    nemesisHp: 1600,
    treeHp: 45,
    tiers: [4, 5, 5],
    treeDamage: 2.4,
    archerHp: 15,
    archerDamage: 1,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    description: 'Némésis plus résistante, Corruption féroce, Gardiens à 12 PV.',
    nemesisHp: 1780,
    treeHp: 40,
    tiers: [4, 5, 5],
    treeDamage: 2.2,
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
export const TEAM_SIZE = 4;
export const SIX_ARROWS_HP_FACTOR = 0.9;
export const BOT_MEAN = 8;
export const BOT_SPREAD = 2;
export const BOT_CRIT_CHANCE = 0.35;
export const TEAM_HP_FACTORS = [1, 1.08, 1.14, 1.28, 1.37];
export const TEAM_HP_FACTORS_SIX = [1, 1.2, 1.32, 1.45, 1.65];
