import type { CorruptionCard, NemesisDef } from './types';

export const MORDELUNE: NemesisDef = {
  id: 'mordelune',
  name: 'Mordelune',
  title: 'la Ronce Noire',
  intro:
    'Au cœur de la nuit, une ronce noire a percé le sol de la Lisière. Mordelune s’éveille, et sa Corruption rampe vers l’Arbre-Cœur. Gardiens, appelez vos esprits : la forêt n’a plus que vous.',
  victory:
    'Dans un dernier craquement, Mordelune se dessèche et retombe en poussière. La sève reprend sa course et l’Arbre-Cœur frémit de lumière. La Lisière est sauve.',
  defeat:
    'La Ronce Noire enserre la forêt tout entière. Les esprits se taisent un à un… Mais tant qu’un Gardien tient son arc, la Lisière peut encore renaître.',
  cards: [
    {
      id: 'pluie-epines',
      type: 'attack',
      name: 'Pluie d’épines',
      tier: 1,
      flavor: 'Des milliers d’épines noires s’abattent en sifflant sur l’écorce de l’Arbre-Cœur.',
      effects: [{ kind: 'damageTree', amount: 8 }],
    },
    {
      id: 'souffle-cendre',
      type: 'attack',
      name: 'Souffle de cendre',
      tier: 1,
      flavor: 'Une brume grise roule entre les troncs. Les esprits toussent et leur lien faiblit.',
      effects: [
        { kind: 'damageTree', amount: 5 },
        { kind: 'drainGauges', amount: 1 },
      ],
    },
    {
      id: 'loup-ronce',
      type: 'creature',
      name: 'Loup-Ronce',
      tier: 1,
      flavor: 'Un loup tissé de branches mortes surgit des fourrés, les crocs ruisselants de sève noire.',
      hp: 18,
      effect: { kind: 'damageTree', amount: 4 },
    },
    {
      id: 'corbeau-cendre',
      type: 'creature',
      name: 'Corbeau de Cendre',
      tier: 1,
      flavor: 'Un corbeau aux ailes de suie tournoie au-dessus des Gardiens et croasse des murmures de doute.',
      hp: 12,
      effect: { kind: 'drainGauges', amount: 1 },
    },
    {
      id: 'rampeur-mousse',
      type: 'creature',
      name: 'Rampeur de Mousse',
      tier: 1,
      flavor: 'Une masse de mousse pourrie glisse vers la Ronce Noire pour la nourrir.',
      hp: 14,
      effect: { kind: 'healNemesis', amount: 5 },
    },
    {
      id: 'racine-etrangleuse',
      type: 'root',
      name: 'Racine Étrangleuse',
      tier: 1,
      flavor: 'Une racine épaisse se faufile sous la terre et s’enroule lentement autour du tronc sacré.',
      hp: 20,
      countdown: 2,
      effect: { kind: 'damageTree', amount: 14 },
    },
    {
      id: 'ronces-jaillissantes',
      type: 'attack',
      name: 'Ronces jaillissantes',
      tier: 2,
      flavor: 'Le sol éclate : des ronces acérées jaillissent et lacèrent les racines de l’Arbre-Cœur.',
      effects: [{ kind: 'damageTree', amount: 12 }],
    },
    {
      id: 'maree-corruption',
      type: 'attack',
      name: 'Marée de Corruption',
      tier: 2,
      flavor: 'Une vague de sève noire déferle sous l’humus et presse chaque racine maudite.',
      effects: [
        { kind: 'damageTree', amount: 6 },
        { kind: 'hastenRoots', amount: 1 },
      ],
    },
    {
      id: 'seve-noire',
      type: 'attack',
      name: 'Sève Noire',
      tier: 2,
      flavor: 'Mordelune boit la nuit elle-même. Ses blessures se referment, ses serviteurs se redressent.',
      effects: [
        { kind: 'healNemesis', amount: 12 },
        { kind: 'healCreatures', amount: 5 },
      ],
    },
    {
      id: 'sanglier-fletri',
      type: 'creature',
      name: 'Sanglier Flétri',
      tier: 2,
      flavor: 'Un sanglier couvert de lichens gris charge en labourant la terre sacrée.',
      hp: 26,
      effect: { kind: 'damageTree', amount: 6 },
    },
    {
      id: 'mere-seve',
      type: 'creature',
      name: 'Mère-Sève',
      tier: 2,
      flavor: 'Une silhouette de résine sombre s’agenouille et nourrit la Ronce Noire de sa propre substance.',
      hp: 22,
      effect: { kind: 'healNemesis', amount: 6 },
    },
    {
      id: 'racine-sanguine',
      type: 'root',
      name: 'Racine Sanguine',
      tier: 2,
      flavor: 'Une racine rouge sombre pulse comme un cœur et pompe la vie de la forêt vers Mordelune.',
      hp: 26,
      countdown: 3,
      effect: { kind: 'healNemesis', amount: 30 },
    },
    {
      id: 'racine-devorante',
      type: 'root',
      name: 'Racine Dévorante',
      tier: 2,
      flavor: 'Une racine hérissée de dents de bois ronge la terre en direction de l’Arbre-Cœur.',
      hp: 24,
      countdown: 2,
      effect: { kind: 'damageTree', amount: 20 },
    },
    {
      id: 'chute-cimes',
      type: 'attack',
      name: 'Chute des Cimes',
      tier: 3,
      flavor: 'Les grands arbres corrompus s’effondrent d’un seul bloc sur l’Arbre-Cœur.',
      effects: [{ kind: 'damageTree', amount: 18 }],
    },
    {
      id: 'hurlement-mordelune',
      type: 'attack',
      name: 'Hurlement de Mordelune',
      tier: 3,
      flavor: 'Le cri de la Ronce Noire fait trembler la Lisière. Ses créatures répondent par un rugissement.',
      effects: [
        { kind: 'damageTree', amount: 10 },
        { kind: 'healCreatures', amount: 10 },
      ],
    },
    {
      id: 'cerf-corrompu',
      type: 'creature',
      name: 'Cerf Corrompu',
      tier: 3,
      flavor: 'Un cerf immense aux bois de ronce s’avance, et chacun de ses pas fait noircir l’herbe.',
      hp: 34,
      effect: { kind: 'damageTree', amount: 8 },
    },
    {
      id: 'essaim-spores',
      type: 'creature',
      name: 'Essaim de Spores',
      tier: 3,
      flavor: 'Un nuage de spores luisantes enveloppe les Gardiens et étouffe la voix des esprits.',
      hp: 20,
      effect: { kind: 'drainGauges', amount: 2 },
    },
    {
      id: 'racine-mere',
      type: 'root',
      name: 'Racine-Mère',
      tier: 3,
      flavor: 'La plus ancienne racine de Mordelune remonte des profondeurs, droit vers le cœur de la forêt.',
      hp: 38,
      countdown: 3,
      effect: { kind: 'damageTree', amount: 30 },
    },
    {
      id: 'racine-ronces',
      type: 'root',
      name: 'Racine des Ronces',
      tier: 3,
      flavor: 'Une racine gonflée comme un cocon palpite. Quelque chose grandit à l’intérieur.',
      hp: 30,
      countdown: 2,
      effect: { kind: 'spawn', cardId: 'cerf-corrompu' },
    },
  ],
};

export const NEMESES: Record<string, NemesisDef> = {
  [MORDELUNE.id]: MORDELUNE,
};

export function getNemesis(id: string): NemesisDef {
  return NEMESES[id] ?? MORDELUNE;
}

export function getCard(nemesisId: string, cardId: string): CorruptionCard {
  const card = getNemesis(nemesisId).cards.find((c) => c.id === cardId);
  if (!card) throw new Error(`Carte inconnue : ${cardId}`);
  return card;
}

export const VOLLEY_NARRATIONS = [
  'Les Gardiens encochent leurs flèches. Le vent retient son souffle.',
  'Les esprits animaux murmurent à l’oreille des archers. C’est le moment de frapper.',
  'Les cordes se tendent dans le silence de la Lisière.',
  'Un rayon de lune perce les branches et éclaire les blasons. Tirez !',
  'L’Arbre-Cœur pulse doucement : il compte sur vous.',
  'Les feuilles frissonnent. Chaque flèche porte l’espoir de la forêt.',
];

export const ROUND_NARRATIONS = [
  'La manche s’achève. La Corruption s’agite dans l’ombre.',
  'La lune glisse derrière les nuages. Les serviteurs de la Ronce passent à l’action.',
  'Un frisson parcourt la forêt : la Corruption gagne du terrain.',
];
