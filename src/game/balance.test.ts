import { it } from 'vitest';
import { CLASSES } from './classes';
import { createGame, powerAvailability, reduce } from './engine';
import type { Action, Arrow, ClassId, Difficulty, GameConfig, GameState, Quadrant } from './types';

interface Rng {
  value: number;
}

function random(rng: Rng): number {
  rng.value = (rng.value * 1103515245 + 12345) % 2147483648;
  return rng.value / 2147483648;
}

function gaussian(rng: Rng): number {
  return Math.sqrt(-2 * Math.log(random(rng) || 1e-9)) * Math.cos(2 * Math.PI * random(rng));
}

function intent(state: GameState, classId: ClassId): Action {
  const actions = new Set(CLASSES[classId].quadrants);
  if (actions.has('heal') && state.tree.hp < state.tree.maxHp * 0.6) return 'heal';
  if (actions.has('roots') && state.roots.some((r) => r.countdown <= 1)) return 'roots';
  if (classId === 'ours' && state.creatures.length > 0) return 'creatures';
  if (classId === 'hibou' && state.roots.length > 0) return 'roots';
  if (actions.has('creatures') && state.creatures.length > 1) return 'creatures';
  return 'nemesis';
}

function volley(state: GameState, classId: ClassId, mean: number, count: number, rng: Rng): Arrow[] {
  const quadrants = CLASSES[classId].quadrants;
  return Array.from({ length: count }, () => {
    const score = Math.max(0, Math.min(10, Math.round(mean + gaussian(rng) * 2)));
    if (score === 0) return { score, quadrant: null, action: null };
    let quadrant = quadrants.indexOf(intent(state, classId)) as Quadrant;
    if (random(rng) > 0.75) quadrant = Math.floor(random(rng) * 4) as Quadrant;
    return { score, quadrant, action: quadrants[quadrant] };
  });
}

function simulate(difficulty: Difficulty, classes: ClassId[], mean: number, games: number, arrows = 3): string {
  let wins = 0;
  let deckOuts = 0;
  let volleys = 0;
  for (let game = 0; game < games; game++) {
    const rng = { value: game * 7919 + 1 };
    const config: GameConfig = {
      nemesisId: 'mordelune',
      difficulty,
      arrowsPerVolley: arrows,
      players: classes.map((classId, i) => ({ id: `p${i}`, name: `P${i}`, classId, coef: 1 })),
    };
    let s = reduce(createGame(config, game + 1, 'sim'), { type: 'start' });
    while (s.phase.kind !== 'over') {
      if (s.phase.kind === 'turn') {
        s = reduce(s, { type: 'draw' });
        continue;
      }
      for (const p of s.players) {
        if (powerAvailability(s, p.id).ok) s = reduce(s, { type: 'power', playerId: p.id, targetUid: s.roots[0]?.uid });
      }
      for (const p of s.players) {
        s = reduce(s, { type: 'submit', playerId: p.id, arrows: volley(s, p.classId, mean, arrows, rng) });
      }
      s = reduce(s, { type: 'resolve' });
    }
    if (s.phase.result === 'victory') wins++;
    if (s.phase.reason.includes('paquet')) deckOuts++;
    volleys += s.volleyCount;
  }
  const rate = ((wins / games) * 100).toFixed(0);
  return `${difficulty.padEnd(9)} ${classes.join(',').padEnd(34)} moy ${mean} × ${arrows} : ${rate}% victoires, ${deckOuts} paquets épuisés, ${(volleys / games).toFixed(1)} volées`;
}

it.skipIf(!process.env.BALANCE)('équilibrage', () => {
  const lines: string[] = [];
  for (const difficulty of ['facile', 'normal', 'difficile'] as Difficulty[]) {
    for (const mean of [5, 6.5, 8]) lines.push(simulate(difficulty, ['loup', 'ours', 'hibou', 'cerf'], mean, 300));
    lines.push(simulate(difficulty, ['loup', 'loup'], 6.5, 300));
    lines.push(simulate(difficulty, ['loup', 'ours', 'cerf', 'hibou', 'loup', 'cerf'], 6.5, 300, 6));
    lines.push(simulate(difficulty, ['hibou'], 6.5, 300));
  }
  console.log(lines.join('\n'));
});
