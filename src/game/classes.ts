import type { Action, ClassId } from './types';

export interface ClassDef {
  id: ClassId;
  name: string;
  spirit: string;
  emoji: string;
  color: string;
  specialty: Action;
  absent: Action;
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
    specialty: 'nemesis',
    absent: 'heal',
    powerName: 'Hurlement de la Meute',
    powerText: 'Double les dégâts de toute l’équipe à la prochaine volée.',
    needsRootTarget: false,
    role: 'Attaquant',
    lore: 'Le Loup ne lâche jamais sa proie. Sa meute invisible court avec chaque flèche vers le cœur de la Corruption.',
    tips: [
      'Vos flèches assignées à la Némésis comptent ×1,5 : c’est vous qui la faites tomber.',
      'Gardez votre pouvoir pour une volée où toute l’équipe vise la Némésis.',
      'Pas d’action Soin : laissez l’Arbre-Cœur au Cerf et à l’Ours.',
    ],
  },
  ours: {
    id: 'ours',
    name: 'Ours',
    spirit: 'Esprit du Rempart',
    emoji: '🐻',
    color: '#b5835a',
    specialty: 'creatures',
    absent: 'roots',
    powerName: 'Étreinte du Rempart',
    powerText: 'Retarde une racine d’une manche.',
    needsRootTarget: true,
    role: 'Protecteur',
    lore: 'L’Ours se dresse entre la forêt et ses ennemis. Rien ne passe tant qu’il tient debout.',
    tips: [
      'Votre spécialité : éliminer les créatures avant qu’elles n’agissent en fin de manche.',
      'Une flèche en Soin dépanne l’Arbre-Cœur ou relève un Gardien à terre quand le Cerf ne suffit plus.',
      'Votre pouvoir gagne une manche sur une racine prête à éclore.',
      'Pas d’action Racines : le Hibou s’en charge.',
    ],
  },
  hibou: {
    id: 'hibou',
    name: 'Hibou',
    spirit: 'Esprit de la Veille',
    emoji: '🦉',
    color: '#a58fd0',
    specialty: 'roots',
    absent: 'heal',
    powerName: 'Œil de la Veille',
    powerText: 'Révèle la prochaine carte de la Corruption.',
    needsRootTarget: false,
    role: 'Éclaireur',
    lore: 'Le Hibou voit ce que la nuit cache. Il traque les racines sous la terre avant qu’elles ne percent.',
    tips: [
      'Votre spécialité : détruire les racines avant la fin de leur compte à rebours.',
      'Votre pouvoir révèle la prochaine carte de colère : l’équipe peut s’y préparer.',
      'Pas d’action Soin : protégez l’Arbre-Cœur en détruisant ce qui le menace.',
    ],
  },
  cerf: {
    id: 'cerf',
    name: 'Cerf',
    spirit: 'Esprit de la Sève',
    emoji: '🦌',
    color: '#7cc47f',
    specialty: 'heal',
    absent: 'creatures',
    powerName: 'Bramement de la Sève',
    powerText: 'Soigne l’Arbre-Cœur de 15 PV et chaque Gardien de 5 PV.',
    needsRootTarget: false,
    role: 'Soigneur',
    lore: 'Le Cerf porte la sève de la forêt. Là où il passe, l’écorce se referme et les feuilles repoussent.',
    tips: [
      'Votre spécialité : maintenir l’Arbre-Cœur en vie. Vos flèches en Soin comptent ×1,5 avant d’être divisées par deux.',
      'Quand l’Arbre est en forme, envoyez vos flèches sur la Némésis ou les racines.',
      'Votre pouvoir rend 15 PV à l’Arbre et 5 PV à chaque Gardien : gardez-le pour une attaque lourde ou pour relever l’équipe.',
      'Vos flèches de Soin peuvent viser un Gardien : relevez ceux qui sont à terre.',
      'Pas d’action Créatures : l’Ours et le Loup s’en occupent.',
    ],
  },
};

export const CLASS_IDS: ClassId[] = ['loup', 'ours', 'hibou', 'cerf'];

export const ACTIONS: Action[] = ['nemesis', 'creatures', 'roots', 'heal'];

export const SPECIALTY_MULTIPLIER = 1.5;

export function actionMultiplier(classId: ClassId, action: Action): number {
  const cls = CLASSES[classId];
  if (action === cls.absent) return 0;
  return action === cls.specialty ? SPECIALTY_MULTIPLIER : 1;
}

export function availableActions(classId: ClassId): Action[] {
  const cls = CLASSES[classId];
  return [cls.specialty, ...ACTIONS.filter((a) => a !== cls.specialty && a !== cls.absent)];
}

export const LEVELS: { label: string; coef: number }[] = [
  { label: 'Découverte', coef: 1.5 },
  { label: 'Débutant', coef: 1.3 },
  { label: 'Confirmé', coef: 1.1 },
  { label: 'Compétiteur', coef: 1 },
  { label: 'Expert', coef: 0.8 },
];
