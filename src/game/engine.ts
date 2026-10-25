import { ACTION_LABELS, ACTIONS, actionMultiplier, CLASSES } from './classes';
import { CERF_HEAL, DIFFICULTIES, GAUGE_MAX, HEAL_FACTOR, REFERENCE_ARROWS } from './difficulty';
import { getCard, getNemesis, ROUND_NARRATIONS, VOLLEY_NARRATIONS } from './nemesis';
import { nextRandom, shuffle } from './rng';
import { arrowLabel, arrowPoints, isYellow } from './target';
import type {
  Action,
  Arrow,
  AttackEffect,
  CorruptionCard,
  CreatureCard,
  ClassId,
  CreatureEffect,
  Effect,
  EventKind,
  GameAction,
  GameEvent,
  GameConfig,
  GameState,
  LogTone,
  Player,
  PlayerStats,
  RootCard,
  RootEffect,
  Submission,
  TurnCard,
  VolleyResult,
  VolleyStep,
} from './types';

const LOG_LIMIT = 80;

export function emptyStats(): PlayerStats {
  return {
    arrows: 0,
    misses: 0,
    totalScore: 0,
    yellows: 0,
    tens: 0,
    crits: 0,
    damageNemesis: 0,
    damageCreatures: 0,
    damageRoots: 0,
    healing: 0,
    powersUsed: 0,
    bestVolley: 0,
    volleys: 0,
  };
}

export function arrowSlots(config: GameConfig): number {
  return Math.max(1, config.players.length * config.arrowsPerVolley);
}

export function scaleFactor(config: GameConfig): number {
  return Math.max(0.4, arrowSlots(config) / REFERENCE_ARROWS);
}

function scaled(state: GameState, amount: number): number {
  return Math.max(1, Math.round(amount * scaleFactor(state.config)));
}

export function treeDamageFactor(config: GameConfig): number {
  const team = Math.min(1.5, Math.max(0.6, 0.5 + 0.5 * scaleFactor(config)));
  return team * DIFFICULTIES[config.difficulty].treeDamage;
}

function treeDamage(state: GameState, amount: number): number {
  return Math.max(1, Math.round(amount * treeDamageFactor(state.config)));
}

export function volleyPool(arrows: Pick<Arrow, 'score' | 'x'>[], coef: number): number {
  const raw = arrows.reduce((sum, a) => sum + arrowPoints(a), 0);
  return raw > 0 ? Math.max(1, Math.round(raw * coef)) : 0;
}

export function actionPoints(arrows: Arrow[], action: Action, coef: number): number {
  return volleyPool(
    arrows.filter((a) => a.action === action),
    coef,
  );
}

export function effectAmount(classId: ClassId, action: Action, points: number, boost = 1): number {
  const multiplier = actionMultiplier(classId, action);
  if (multiplier === 0 || points <= 0) return 0;
  const base = points * multiplier;
  if (action === 'heal') return Math.max(1, Math.round(base * HEAL_FACTOR));
  return Math.max(1, Math.round(base * boost));
}

export function createGame(config: GameConfig, seed: number, gameId: string): GameState {
  const diff = DIFFICULTIES[config.difficulty];
  const nemesis = getNemesis(config.nemesisId);
  let rng = seed;
  const wrathDeck: string[] = [];
  diff.tiers.forEach((count, index) => {
    const pool = nemesis.cards.filter((c) => c.tier === index + 1).map((c) => c.id);
    const [shuffled, next] = shuffle(pool, rng);
    rng = next;
    wrathDeck.push(...shuffled.slice(0, count));
  });
  const nemesisHp = Math.round(diff.nemesisHpPerArrow * arrowSlots(config));
  const players: Player[] = config.players.map((p) => ({ ...p, gauge: 0, stats: emptyStats() }));
  return {
    gameId,
    config,
    rng,
    round: 0,
    volleyCount: 0,
    phase: { kind: 'lobby' },
    nemesis: { hp: nemesisHp, maxHp: nemesisHp },
    tree: { hp: diff.treeHp, maxHp: diff.treeHp },
    players,
    creatures: [],
    roots: [],
    turnDeck: [],
    turnDiscard: [],
    wrathDeck,
    wrathDiscard: [],
    revealed: false,
    wolfBoost: 0,
    uidCounter: 0,
    eventCounter: 0,
    lastEvent: null,
    log: [],
  };
}

class Ctx {
  lines: string[] = [];
  extra: Partial<GameEvent> = {};
  constructor(public state: GameState) {}

  line(text: string, tone: LogTone = 'info') {
    this.lines.push(text);
    const id = (this.state.log.at(-1)?.id ?? 0) + 1;
    this.state.log = [...this.state.log, { id, tone, text }].slice(-LOG_LIMIT);
  }

  random(): number {
    const [value, next] = nextRandom(this.state.rng);
    this.state.rng = next;
    return value;
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.random() * items.length)];
  }

  event(kind: EventKind, title: string, narration: string, tone: LogTone) {
    this.state.eventCounter += 1;
    this.state.lastEvent = { ...this.extra, id: this.state.eventCounter, kind, title, narration, lines: this.lines, tone };
  }
}

function clone(state: GameState): GameState {
  return structuredClone(state);
}

function nemesisName(state: GameState): string {
  return getNemesis(state.config.nemesisId).name;
}

function cardName(state: GameState, cardId: string): string {
  return getCard(state.config.nemesisId, cardId).name;
}

function damageTreeBy(ctx: Ctx, amount: number, source: string) {
  const dmg = treeDamage(ctx.state, amount);
  ctx.state.tree.hp = Math.max(0, ctx.state.tree.hp - dmg);
  ctx.line(`${source} inflige ${dmg} dégâts à l’Arbre-Cœur.`, 'bad');
}

function healNemesisBy(ctx: Ctx, amount: number, source: string) {
  const s = ctx.state;
  const heal = Math.min(scaled(s, amount), s.nemesis.maxHp - s.nemesis.hp);
  s.nemesis.hp += heal;
  ctx.line(`${source} rend ${heal} PV à ${nemesisName(s)}.`, 'bad');
}

function drainGaugesBy(ctx: Ctx, amount: number, source: string) {
  ctx.state.players.forEach((p) => {
    p.gauge = Math.max(0, p.gauge - amount);
  });
  ctx.line(`${source} vide ${amount} point${amount > 1 ? 's' : ''} de jauge à chaque Gardien.`, 'bad');
}

function healCreaturesBy(ctx: Ctx, amount: number, source: string) {
  if (ctx.state.creatures.length === 0) return;
  const heal = scaled(ctx.state, amount);
  ctx.state.creatures.forEach((c) => {
    c.hp = Math.min(c.maxHp, c.hp + heal);
  });
  ctx.line(`${source} soigne les créatures de ${heal} PV.`, 'bad');
}

function spawnCreature(ctx: Ctx, card: CreatureCard) {
  const s = ctx.state;
  s.uidCounter += 1;
  const hp = scaled(s, card.hp);
  s.creatures.push({ uid: `c${s.uidCounter}`, cardId: card.id, hp, maxHp: hp });
  ctx.line(`${card.name} entre en jeu (${hp} PV).`, 'bad');
}

function spawnRoot(ctx: Ctx, card: RootCard) {
  const s = ctx.state;
  s.uidCounter += 1;
  const hp = scaled(s, card.hp);
  s.roots.push({ uid: `r${s.uidCounter}`, cardId: card.id, hp, maxHp: hp, countdown: card.countdown });
  ctx.line(`${card.name} s’enracine (${hp} PV, éclot dans ${card.countdown} manche${card.countdown > 1 ? 's' : ''}).`, 'bad');
}

function applyAttackEffect(ctx: Ctx, effect: AttackEffect, source: string) {
  switch (effect.kind) {
    case 'damageTree':
      damageTreeBy(ctx, effect.amount, source);
      break;
    case 'drainGauges':
      drainGaugesBy(ctx, effect.amount, source);
      break;
    case 'healNemesis':
      healNemesisBy(ctx, effect.amount, source);
      break;
    case 'healCreatures':
      healCreaturesBy(ctx, effect.amount, source);
      break;
    case 'hastenRoots':
      if (ctx.state.roots.length > 0) {
        ctx.state.roots.forEach((r) => {
          r.countdown = Math.max(1, r.countdown - effect.amount);
        });
        ctx.line(`${source} accélère les racines.`, 'bad');
      }
      break;
  }
}

function applyCreatureEffect(ctx: Ctx, effect: CreatureEffect, source: string) {
  switch (effect.kind) {
    case 'damageTree':
      damageTreeBy(ctx, effect.amount, source);
      break;
    case 'healNemesis':
      healNemesisBy(ctx, effect.amount, source);
      break;
    case 'drainGauges':
      drainGaugesBy(ctx, effect.amount, source);
      break;
    case 'healCreatures':
      healCreaturesBy(ctx, effect.amount, source);
      break;
  }
}

function applyRootEffect(ctx: Ctx, effect: RootEffect, source: string) {
  switch (effect.kind) {
    case 'damageTree':
      damageTreeBy(ctx, effect.amount, source);
      break;
    case 'healNemesis':
      healNemesisBy(ctx, effect.amount, source);
      break;
    case 'drainGauges':
      drainGaugesBy(ctx, effect.amount, source);
      break;
    case 'spawn': {
      const card = getCard(ctx.state.config.nemesisId, effect.cardId);
      if (card.type === 'creature') spawnCreature(ctx, card);
      break;
    }
  }
}

export function describeCard(card: CorruptionCard, state?: GameState): string {
  const tree = (n: number) => (state ? treeDamage(state, n) : n);
  const sc = (n: number) => (state ? scaled(state, n) : n);
  const effectText = (e: AttackEffect | CreatureEffect | RootEffect): string => {
    switch (e.kind) {
      case 'damageTree':
        return `${tree(e.amount)} dégâts à l’Arbre-Cœur`;
      case 'healNemesis':
        return `soigne la Némésis de ${sc(e.amount)}`;
      case 'drainGauges':
        return `−${e.amount} jauge à chaque Gardien`;
      case 'healCreatures':
        return `soigne les créatures de ${sc(e.amount)}`;
      case 'hastenRoots':
        return `racines −${e.amount} manche`;
      case 'spawn':
        return `invoque ${state ? cardName(state, e.cardId) : e.cardId}`;
    }
  };
  if (card.type === 'attack') return card.effects.map(effectText).join(', ');
  if (card.type === 'creature') return `Chaque manche : ${effectText(card.effect)}`;
  return `À l’éclosion : ${effectText(card.effect)}`;
}

function checkEnd(ctx: Ctx): boolean {
  const s = ctx.state;
  const nemesis = getNemesis(s.config.nemesisId);
  if (s.nemesis.hp <= 0) {
    s.phase = { kind: 'over', result: 'victory', reason: `${nemesis.name} est vaincue !` };
    ctx.line(`${nemesis.name} s’effondre. Victoire !`, 'good');
    ctx.event('victory', 'Victoire !', nemesis.victory, 'good');
    return true;
  }
  if (s.tree.hp <= 0) {
    s.phase = { kind: 'over', result: 'defeat', reason: 'L’Arbre-Cœur est tombé.' };
    ctx.line('L’Arbre-Cœur s’effondre. Défaite…', 'bad');
    ctx.event('defeat', 'Défaite…', nemesis.defeat, 'bad');
    return true;
  }
  return false;
}

function newRound(ctx: Ctx) {
  const s = ctx.state;
  const diff = DIFFICULTIES[s.config.difficulty];
  const cards: TurnCard[] = [
    ...Array<TurnCard>(diff.volleyCards).fill('volley'),
    ...Array<TurnCard>(diff.nemesisCards).fill('nemesis'),
  ];
  const [deck, rng] = shuffle(cards, s.rng);
  s.rng = rng;
  s.round += 1;
  s.turnDeck = deck;
  s.turnDiscard = [];
  ctx.line(`Manche ${s.round} : l’ordre des tours est mélangé.`);
}

function start(state: GameState): GameState {
  if (state.phase.kind !== 'lobby') return state;
  const s = clone(state);
  const ctx = new Ctx(s);
  const nemesis = getNemesis(s.config.nemesisId);
  ctx.line(`${nemesis.name}, ${nemesis.title}, s’éveille avec ${s.nemesis.hp} PV.`);
  newRound(ctx);
  s.phase = { kind: 'turn' };
  ctx.event('intro', `${nemesis.name}, ${nemesis.title}`, nemesis.intro, 'info');
  return s;
}

function endRound(ctx: Ctx) {
  const s = ctx.state;
  ctx.line(`Fin de la manche ${s.round}.`);
  s.creatures.forEach((c) => {
    const card = getCard(s.config.nemesisId, c.cardId) as CreatureCard;
    applyCreatureEffect(ctx, card.effect, card.name);
  });
  const remaining = [];
  for (const root of s.roots) {
    root.countdown -= 1;
    const card = getCard(s.config.nemesisId, root.cardId) as RootCard;
    if (root.countdown <= 0) {
      ctx.line(`${card.name} éclot !`, 'bad');
      applyRootEffect(ctx, card.effect, card.name);
      s.wrathDiscard.push(root.cardId);
    } else {
      ctx.line(`${card.name} : encore ${root.countdown} manche${root.countdown > 1 ? 's' : ''}.`);
      remaining.push(root);
    }
  }
  s.roots = remaining;
  if (checkEnd(ctx)) return;
  const title = `Fin de la manche ${s.round}`;
  newRound(ctx);
  ctx.event('round', title, ctx.pick(ROUND_NARRATIONS), 'info');
}

function playNemesisTurn(ctx: Ctx) {
  const s = ctx.state;
  const nemesis = getNemesis(s.config.nemesisId);
  if (s.wrathDeck.length === 0) {
    s.phase = { kind: 'over', result: 'defeat', reason: 'Le paquet de colère est épuisé.' };
    ctx.line(`Le paquet de colère de ${nemesis.name} est épuisé : la Corruption triomphe.`, 'bad');
    ctx.event('defeat', 'Défaite…', nemesis.defeat, 'bad');
    return;
  }
  const [cardId, ...rest] = s.wrathDeck;
  s.wrathDeck = rest;
  s.revealed = false;
  const card = getCard(s.config.nemesisId, cardId);
  ctx.extra.cardId = cardId;
  ctx.line(`${nemesis.name} joue ${card.name}.`, 'bad');
  if (card.type === 'attack') {
    card.effects.forEach((e) => applyAttackEffect(ctx, e, card.name));
    s.wrathDiscard.push(cardId);
  } else if (card.type === 'creature') {
    spawnCreature(ctx, card);
  } else {
    spawnRoot(ctx, card);
  }
  s.phase = { kind: 'turn' };
  if (checkEnd(ctx)) return;
  const kindLabel = card.type === 'attack' ? 'Attaque' : card.type === 'creature' ? 'Créature' : 'Racine';
  ctx.event('nemesis', `${kindLabel} — ${card.name}`, card.flavor, 'bad');
}

function draw(state: GameState): GameState {
  if (state.phase.kind !== 'turn') return state;
  const s = clone(state);
  const ctx = new Ctx(s);
  if (s.turnDeck.length === 0) {
    endRound(ctx);
    return s;
  }
  const [card, ...rest] = s.turnDeck;
  s.turnDeck = rest;
  s.turnDiscard = [...s.turnDiscard, card];
  if (card === 'volley') {
    s.volleyCount += 1;
    s.phase = { kind: 'volley', volley: s.volleyCount, step: 'council', submissions: {} };
    ctx.line(`Volée ${s.volleyCount} : conseil, tir, puis saisie des impacts.`);
    ctx.event('volley', `Volée ${s.volleyCount}`, ctx.pick(VOLLEY_NARRATIONS), 'good');
  } else {
    playNemesisTurn(ctx);
  }
  return s;
}

const NEXT_STEP: Record<VolleyStep, VolleyStep> = { council: 'shoot', shoot: 'input', input: 'input' };

function advance(state: GameState): GameState {
  if (state.phase.kind !== 'volley' || state.phase.step === 'input') return state;
  return { ...state, phase: { ...state.phase, step: NEXT_STEP[state.phase.step] } };
}

function sanitizeSubmission(state: GameState, submission: Submission, player: Player, max: number): Submission {
  const specialty = CLASSES[player.classId].specialty;
  const arrows: Arrow[] = (Array.isArray(submission?.arrows) ? submission.arrows : []).slice(0, max).map((a) => {
    const score = Math.max(0, Math.min(10, Math.round(Number(a?.score) || 0)));
    if (score === 0) return { score, x: false, action: null };
    const wanted = a?.action as Action;
    const action = ACTIONS.includes(wanted) && actionMultiplier(player.classId, wanted) > 0 ? wanted : specialty;
    if (action === 'creatures' || action === 'roots') {
      const list = action === 'creatures' ? state.creatures : state.roots;
      const target = list.some((m) => m.uid === a?.target) ? (a.target as string) : null;
      return { score, x: score === 10 && a?.x === true, action, target };
    }
    return { score, x: score === 10 && a?.x === true, action };
  });
  return { arrows };
}

function submit(state: GameState, playerId: string, submission: Submission): GameState {
  if (state.phase.kind !== 'volley') return state;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;
  const s = clone(state);
  if (s.phase.kind !== 'volley') return state;
  s.phase.submissions[playerId] = sanitizeSubmission(s, submission, player, s.config.arrowsPerVolley);
  return s;
}

export type TargetKind = 'creatures' | 'roots';

interface MinionDamage {
  dealt: number;
  redirected: boolean;
  target: string;
  killed: string[];
}

export interface TargetOption {
  uid: string;
  name: string;
  hp: number;
  maxHp: number;
  countdown?: number;
}

export function targetOptions(state: GameState, kind: TargetKind): TargetOption[] {
  if (kind === 'creatures') {
    return [...state.creatures]
      .sort((a, b) => a.hp - b.hp)
      .map((c) => ({ uid: c.uid, name: cardName(state, c.cardId), hp: c.hp, maxHp: c.maxHp }));
  }
  return [...state.roots]
    .sort((a, b) => a.countdown - b.countdown || a.hp - b.hp)
    .map((r) => ({ uid: r.uid, name: cardName(state, r.cardId), hp: r.hp, maxHp: r.maxHp, countdown: r.countdown }));
}

export interface ArrowGroup {
  action: Action;
  target: string | null;
  arrows: Arrow[];
}

export function groupArrows(arrows: Arrow[]): ArrowGroup[] {
  const groups: ArrowGroup[] = [];
  for (const action of ACTIONS) {
    for (const arrow of arrows) {
      if (arrow.action !== action || arrow.score <= 0) continue;
      const target = action === 'creatures' || action === 'roots' ? (arrow.target ?? null) : null;
      const group = groups.find((g) => g.action === action && g.target === target);
      if (group) group.arrows.push(arrow);
      else groups.push({ action, target, arrows: [arrow] });
    }
  }
  return groups;
}

function damageMinions(ctx: Ctx, kind: TargetKind, amount: number, player: Player, targetUid: string | null): MinionDamage {
  const s = ctx.state;
  const list = kind === 'creatures' ? s.creatures : s.roots;
  if (list.length === 0) {
    s.nemesis.hp = Math.max(0, s.nemesis.hp - amount);
    player.stats.damageNemesis += amount;
    return { dealt: amount, redirected: true, target: nemesisName(s), killed: [] };
  }
  const priority = targetOptions(s, kind).map((o) => o.uid);
  const order = targetUid && priority.includes(targetUid) ? [targetUid, ...priority.filter((u) => u !== targetUid)] : priority;
  const ordered = order.map((uid) => list.find((m) => m.uid === uid)!);
  let remaining = amount;
  let dealt = 0;
  const killed: string[] = [];
  for (const target of ordered) {
    if (remaining <= 0) break;
    const hit = Math.min(target.hp, remaining);
    target.hp -= hit;
    remaining -= hit;
    dealt += hit;
    if (target.hp <= 0) {
      ctx.line(`${player.name} abat ${cardName(s, target.cardId)} !`, 'good');
      killed.push(cardName(s, target.cardId));
      s.wrathDiscard.push(target.cardId);
    }
  }
  if (kind === 'creatures') {
    s.creatures = s.creatures.filter((c) => c.hp > 0);
    player.stats.damageCreatures += dealt;
  } else {
    s.roots = s.roots.filter((r) => r.hp > 0);
    player.stats.damageRoots += dealt;
  }
  return { dealt, redirected: false, target: cardName(s, ordered[0].cardId), killed };
}

function resolve(state: GameState): GameState {
  if (state.phase.kind !== 'volley') return state;
  const s = clone(state);
  const ctx = new Ctx(s);
  const phase = state.phase;
  const boost = s.wolfBoost > 0 ? 2 : 1;
  const totals = { nemesis: 0, creatures: 0, roots: 0, heal: 0 };
  const results: VolleyResult[] = [];
  ctx.extra = { results, boosted: boost > 1 };
  if (boost > 1) ctx.line('La Meute chasse : les dégâts de cette volée sont doublés !', 'power');
  for (const player of s.players) {
    const submission = phase.submissions[player.id];
    if (!submission) {
      ctx.line(`${player.name} n’a pas saisi de volée.`);
      continue;
    }
    const { arrows } = submission;
    let volleyScore = 0;
    for (const arrow of arrows) {
      player.stats.arrows += 1;
      volleyScore += arrow.score;
      player.stats.totalScore += arrow.score;
      if (arrow.score === 0) player.stats.misses += 1;
      if (arrow.score === 10) player.stats.tens += 1;
      if (arrow.x) player.stats.crits += 1;
      if (isYellow(arrow.score)) {
        player.stats.yellows += 1;
        player.gauge = Math.min(GAUGE_MAX, player.gauge + 1);
      }
    }
    const pool = volleyPool(arrows, player.coef);
    const effects: Effect[] = [];
    for (const group of groupArrows(arrows)) {
      const action = group.action;
      const points = volleyPool(group.arrows, player.coef);
      const amount = effectAmount(player.classId, action, points, boost);
      if (amount <= 0) continue;
      if (action === 'heal') {
        const heal = Math.min(amount, s.tree.maxHp - s.tree.hp);
        s.tree.hp += heal;
        player.stats.healing += heal;
        totals.heal += heal;
        effects.push({ action, points, amount: heal, target: 'Arbre-Cœur' });
      } else if (action === 'nemesis') {
        s.nemesis.hp = Math.max(0, s.nemesis.hp - amount);
        player.stats.damageNemesis += amount;
        totals.nemesis += amount;
        effects.push({ action, points, amount, target: nemesisName(s) });
      } else {
        const { dealt, redirected, target, killed } = damageMinions(ctx, action, amount, player, group.target);
        totals[redirected ? 'nemesis' : action] += dealt;
        effects.push({
          action: redirected ? 'nemesis' : action,
          points,
          amount: dealt,
          target,
          ...(killed.length ? { killed: killed.join(', ') } : {}),
        });
      }
    }
    results.push({ playerId: player.id, arrows, pool, effects });
    player.stats.volleys += 1;
    player.stats.bestVolley = Math.max(player.stats.bestVolley, volleyScore);
    const scores = arrows.map(arrowLabel).join(' ');
    const parts = effects.map((e) => `${ACTION_LABELS[e.action]} ${e.action === 'heal' ? '+' : ''}${e.amount}`);
    ctx.line(`${CLASSES[player.classId].emoji} ${player.name} : ${scores} → ${pool} pts${parts.length ? ` (${parts.join(', ')})` : ''}.`, 'good');
  }
  s.wolfBoost = 0;
  const summary: string[] = [];
  if (totals.nemesis) summary.push(`${totals.nemesis} dégâts à ${nemesisName(s)}`);
  if (totals.creatures) summary.push(`${totals.creatures} aux créatures`);
  if (totals.roots) summary.push(`${totals.roots} aux racines`);
  if (totals.heal) summary.push(`${totals.heal} PV rendus à l’Arbre-Cœur`);
  ctx.line(`Bilan : ${summary.join(', ') || 'aucun effet'}.`, 'good');
  s.phase = { kind: 'turn' };
  if (checkEnd(ctx)) return s;
  const crits = results.reduce((n, r) => n + r.arrows.filter((a) => a.x).length, 0);
  const narration =
    crits > 0
      ? `${crits > 1 ? `${crits} coups critiques` : 'Un coup critique'} en plein cœur ! ${nemesisName(s)} chancelle, il lui reste ${s.nemesis.hp} PV.`
      : totals.nemesis > 0
        ? `Les flèches sifflent et ${nemesisName(s)} gémit sous les coups. Il lui reste ${s.nemesis.hp} PV.`
        : 'Les flèches se plantent dans la Corruption. La forêt respire un peu mieux.';
  ctx.event('resolve', `Volée ${phase.volley} résolue`, narration, 'good');
  return s;
}

export function powerAvailability(state: GameState, playerId: string): { ok: boolean; reason?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, reason: 'Archer inconnu' };
  if (state.phase.kind === 'lobby' || state.phase.kind === 'over') return { ok: false, reason: 'Partie non en cours' };
  if (player.gauge < GAUGE_MAX) return { ok: false, reason: `Jauge ${player.gauge}/${GAUGE_MAX}` };
  switch (player.classId) {
    case 'loup':
      return state.wolfBoost > 0 ? { ok: false, reason: 'La Meute chasse déjà' } : { ok: true };
    case 'ours':
      return state.roots.length === 0 ? { ok: false, reason: 'Aucune racine à retarder' } : { ok: true };
    case 'hibou':
      if (state.wrathDeck.length === 0) return { ok: false, reason: 'Paquet de colère vide' };
      return state.revealed ? { ok: false, reason: 'Carte déjà révélée' } : { ok: true };
    case 'cerf':
      return state.tree.hp >= state.tree.maxHp ? { ok: false, reason: 'Arbre-Cœur intact' } : { ok: true };
  }
}

function usePower(state: GameState, playerId: string, targetUid?: string): GameState {
  if (!powerAvailability(state, playerId).ok) return state;
  const s = clone(state);
  const ctx = new Ctx(s);
  const player = s.players.find((p) => p.id === playerId)!;
  const cls = CLASSES[player.classId];
  let narration = '';
  switch (player.classId) {
    case 'loup':
      s.wolfBoost = 1;
      ctx.line(`${player.name} pousse le ${cls.powerName} : dégâts doublés à la prochaine volée.`, 'power');
      narration = 'Un hurlement monte de la Lisière. Les esprits-loups courent aux côtés des flèches.';
      break;
    case 'ours': {
      const root = s.roots.find((r) => r.uid === targetUid) ?? s.roots[0];
      root.countdown += 1;
      ctx.line(`${player.name} retient ${cardName(s, root.cardId)} : encore ${root.countdown} manches.`, 'power');
      narration = 'L’esprit de l’Ours plante ses griffes dans la terre et retient la racine maudite.';
      break;
    }
    case 'hibou':
      s.revealed = true;
      ctx.line(`${player.name} révèle la prochaine carte : ${cardName(s, s.wrathDeck[0])}.`, 'power');
      narration = 'Les yeux du Hibou percent la nuit : la prochaine ruse de la Corruption est dévoilée.';
      break;
    case 'cerf': {
      const heal = Math.min(CERF_HEAL, s.tree.maxHp - s.tree.hp);
      s.tree.hp += heal;
      player.stats.healing += heal;
      ctx.line(`${player.name} lance le ${cls.powerName} : +${heal} PV à l’Arbre-Cœur.`, 'power');
      narration = 'Le brame du Cerf résonne et une sève dorée remonte dans l’écorce de l’Arbre-Cœur.';
      break;
    }
  }
  player.gauge = 0;
  player.stats.powersUsed += 1;
  ctx.extra.playerId = player.id;
  ctx.event('power', `${cls.emoji} ${cls.powerName}`, narration, 'power');
  return s;
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return start(state);
    case 'draw':
      return draw(state);
    case 'advance':
      return advance(state);
    case 'submit':
      return submit(state, action.playerId, action.submission);
    case 'resolve':
      return resolve(state);
    case 'power':
      return usePower(state, action.playerId, action.targetUid);
  }
}

export function nextCardLabel(state: GameState): string {
  if (state.phase.kind !== 'turn') return '';
  return state.turnDeck.length === 0 ? `Terminer la manche ${state.round}` : 'Tirer la carte suivante';
}
