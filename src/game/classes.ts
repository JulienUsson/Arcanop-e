import type { Action, ClassId, Quadrant } from './types';

export interface ClassDef {
  id: ClassId;
  name: string;
  spirit: string;
  emoji: string;
  color: string;
  quadrants: [Action, Action, Action, Action];
  powerName: string;
  powerText: string;
  needsRootTarget: boolean;
}

export const ACTION_LABELS: Record<Action, string> = {
  nemesis: 'Némésis',
  creatures: 'Créatures',
  roots: 'Racines',
  heal: 'Soin',
};

export const ACTION_ICONS: Record<Action, string> = {
  nemesis: '💀',
  creatures: '🐾',
  roots: '🌿',
  heal: '💚',
};

export const CLASSES: Record<ClassId, ClassDef> = {
  loup: {
    id: 'loup',
    name: 'Loup',
    spirit: 'Esprit de la Meute',
    emoji: '🐺',
    color: '#8fa3b8',
    quadrants: ['nemesis', 'creatures', 'roots', 'nemesis'],
    powerName: 'Hurlement de la Meute',
    powerText: 'Double les dégâts de toute l’équipe à la prochaine volée.',
    needsRootTarget: false,
  },
  ours: {
    id: 'ours',
    name: 'Ours',
    spirit: 'Esprit du Rempart',
    emoji: '🐻',
    color: '#b5835a',
    quadrants: ['creatures', 'nemesis', 'heal', 'creatures'],
    powerName: 'Étreinte du Rempart',
    powerText: 'Retarde une racine d’une manche.',
    needsRootTarget: true,
  },
  hibou: {
    id: 'hibou',
    name: 'Hibou',
    spirit: 'Esprit de la Veille',
    emoji: '🦉',
    color: '#a58fd0',
    quadrants: ['roots', 'nemesis', 'creatures', 'roots'],
    powerName: 'Œil de la Veille',
    powerText: 'Révèle la prochaine carte de la Corruption.',
    needsRootTarget: false,
  },
  cerf: {
    id: 'cerf',
    name: 'Cerf',
    spirit: 'Esprit de la Sève',
    emoji: '🦌',
    color: '#7cc47f',
    quadrants: ['heal', 'nemesis', 'roots', 'heal'],
    powerName: 'Bramement de la Sève',
    powerText: 'Soigne fortement l’Arbre-Cœur.',
    needsRootTarget: false,
  },
};

export const CLASS_IDS: ClassId[] = ['loup', 'ours', 'hibou', 'cerf'];

export function quadrantAction(classId: ClassId, quadrant: Quadrant): Action {
  return CLASSES[classId].quadrants[quadrant];
}

export const LEVELS: { label: string; coef: number }[] = [
  { label: 'Découverte', coef: 1.5 },
  { label: 'Débutant', coef: 1.3 },
  { label: 'Confirmé', coef: 1.1 },
  { label: 'Compétiteur', coef: 1 },
  { label: 'Expert', coef: 0.8 },
];
