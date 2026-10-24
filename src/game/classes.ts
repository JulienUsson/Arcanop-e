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
  role: string;
  lore: string;
  tips: string[];
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
    role: 'Attaquant',
    lore: 'Le Loup ne lâche jamais sa proie. Sa meute invisible court avec chaque flèche vers le cœur de la Corruption.',
    tips: [
      'Deux quadrants sur quatre frappent la Némésis : c’est vous qui la faites tomber.',
      'Gardez votre pouvoir pour une volée où toute l’équipe vise la Némésis.',
      'Vous ne soignez pas : laissez l’Arbre-Cœur au Cerf et à l’Ours.',
    ],
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
    role: 'Protecteur',
    lore: 'L’Ours se dresse entre la forêt et ses ennemis. Rien ne passe tant qu’il tient debout.',
    tips: [
      'Votre spécialité : éliminer les créatures avant qu’elles n’agissent en fin de manche.',
      'Votre quadrant Soin dépanne l’Arbre-Cœur quand le Cerf ne suffit plus.',
      'Votre pouvoir gagne une manche sur une racine prête à éclore.',
      'Vous ne visez pas les racines : le Hibou s’en charge.',
    ],
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
    role: 'Éclaireur',
    lore: 'Le Hibou voit ce que la nuit cache. Il traque les racines sous la terre avant qu’elles ne percent.',
    tips: [
      'Votre spécialité : détruire les racines avant la fin de leur compte à rebours.',
      'Votre pouvoir révèle la prochaine carte de colère : l’équipe peut s’y préparer.',
      'Vous ne soignez pas : protégez l’Arbre-Cœur en détruisant ce qui le menace.',
    ],
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
    role: 'Soigneur',
    lore: 'Le Cerf porte la sève de la forêt. Là où il passe, l’écorce se referme et les feuilles repoussent.',
    tips: [
      'Votre spécialité : maintenir l’Arbre-Cœur en vie. Un soin rend la moitié de la puissance de la flèche.',
      'Quand l’Arbre est en forme, visez la Némésis ou les racines.',
      'Votre pouvoir rend 15 PV d’un coup : gardez-le pour une attaque lourde.',
      'Vous ne visez pas les créatures : l’Ours et le Loup s’en occupent.',
    ],
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
