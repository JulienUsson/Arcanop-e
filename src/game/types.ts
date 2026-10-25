export type Action = 'nemesis' | 'creatures' | 'roots' | 'heal';

export type ClassId = 'loup' | 'ours' | 'hibou' | 'cerf';

export type Difficulty = 'facile' | 'normal' | 'difficile';

export interface Arrow {
  score: number;
  x: boolean;
}

export type Allocation = Partial<Record<Action, number>>;

export interface Submission {
  arrows: Arrow[];
  allocation: Allocation;
}

export interface PlayerConfig {
  id: string;
  name: string;
  classId: ClassId;
  coef: number;
}

export interface GameConfig {
  players: PlayerConfig[];
  nemesisId: string;
  difficulty: Difficulty;
  arrowsPerVolley: number;
}

export interface PlayerStats {
  arrows: number;
  misses: number;
  totalScore: number;
  yellows: number;
  tens: number;
  crits: number;
  damageNemesis: number;
  damageCreatures: number;
  damageRoots: number;
  healing: number;
  powersUsed: number;
  bestVolley: number;
  volleys: number;
}

export interface Player extends PlayerConfig {
  gauge: number;
  stats: PlayerStats;
}

export type CreatureEffect =
  | { kind: 'damageTree'; amount: number }
  | { kind: 'healNemesis'; amount: number }
  | { kind: 'drainGauges'; amount: number }
  | { kind: 'healCreatures'; amount: number };

export type RootEffect =
  | { kind: 'damageTree'; amount: number }
  | { kind: 'healNemesis'; amount: number }
  | { kind: 'spawn'; cardId: string }
  | { kind: 'drainGauges'; amount: number };

export type AttackEffect =
  | { kind: 'damageTree'; amount: number }
  | { kind: 'drainGauges'; amount: number }
  | { kind: 'healNemesis'; amount: number }
  | { kind: 'healCreatures'; amount: number }
  | { kind: 'hastenRoots'; amount: number };

export interface AttackCard {
  id: string;
  type: 'attack';
  name: string;
  tier: 1 | 2 | 3;
  flavor: string;
  effects: AttackEffect[];
}

export interface CreatureCard {
  id: string;
  type: 'creature';
  name: string;
  tier: 1 | 2 | 3;
  flavor: string;
  hp: number;
  effect: CreatureEffect;
}

export interface RootCard {
  id: string;
  type: 'root';
  name: string;
  tier: 1 | 2 | 3;
  flavor: string;
  hp: number;
  countdown: number;
  effect: RootEffect;
}

export type CorruptionCard = AttackCard | CreatureCard | RootCard;

export interface NemesisDef {
  id: string;
  name: string;
  title: string;
  intro: string;
  victory: string;
  defeat: string;
  cards: CorruptionCard[];
}

export interface Creature {
  uid: string;
  cardId: string;
  hp: number;
  maxHp: number;
}

export interface Root {
  uid: string;
  cardId: string;
  hp: number;
  maxHp: number;
  countdown: number;
}

export type TurnCard = 'volley' | 'nemesis';

export type VolleyStep = 'council' | 'shoot' | 'input';

export type Phase =
  | { kind: 'lobby' }
  | { kind: 'turn' }
  | { kind: 'volley'; volley: number; step: VolleyStep; submissions: Record<string, Submission> }
  | { kind: 'over'; result: 'victory' | 'defeat'; reason: string };

export type LogTone = 'info' | 'good' | 'bad' | 'power';

export interface LogEntry {
  id: number;
  tone: LogTone;
  text: string;
}

export type EventKind = 'intro' | 'volley' | 'nemesis' | 'resolve' | 'round' | 'power' | 'victory' | 'defeat';

export interface Effect {
  action: Action;
  points: number;
  amount: number;
  target: string;
  killed?: string;
}

export interface VolleyResult {
  playerId: string;
  arrows: Arrow[];
  pool: number;
  effects: Effect[];
}

export interface GameEvent {
  id: number;
  kind: EventKind;
  title: string;
  narration: string;
  lines: string[];
  tone: LogTone;
  cardId?: string;
  playerId?: string;
  results?: VolleyResult[];
  boosted?: boolean;
}

export interface Focus {
  creature: string | null;
  root: string | null;
}

export interface GameState {
  gameId: string;
  config: GameConfig;
  rng: number;
  round: number;
  volleyCount: number;
  phase: Phase;
  nemesis: { hp: number; maxHp: number };
  tree: { hp: number; maxHp: number };
  players: Player[];
  creatures: Creature[];
  roots: Root[];
  turnDeck: TurnCard[];
  turnDiscard: TurnCard[];
  wrathDeck: string[];
  wrathDiscard: string[];
  revealed: boolean;
  wolfBoost: number;
  focus: Focus;
  uidCounter: number;
  eventCounter: number;
  lastEvent: GameEvent | null;
  log: LogEntry[];
}

export type GameAction =
  | { type: 'start' }
  | { type: 'draw' }
  | { type: 'advance' }
  | { type: 'submit'; playerId: string; submission: Submission }
  | { type: 'resolve' }
  | { type: 'power'; playerId: string; targetUid?: string }
  | { type: 'focus'; kind: 'creature' | 'root'; uid: string | null };
