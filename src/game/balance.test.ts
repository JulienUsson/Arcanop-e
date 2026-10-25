import { it } from 'vitest';
import { actionMultiplier } from './classes';
import { createGame, powerAvailability, reduce } from './engine';
import { withBots } from './team';
import type { Action, ClassId, Difficulty, GameConfig, GameState, Submission } from './types';

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
  const has = (a: Action) => actionMultiplier(classId, a) > 0;
  if (has('heal') && (state.tree.hp < state.tree.maxHp * 0.6 || state.players.some((p) => p.hp <= p.maxHp * 0.3))) return 'heal';
  if (has('roots') && state.roots.some((r) => r.countdown <= 1)) return 'roots';
  if (classId === 'ours' && state.creatures.length > 0) return 'creatures';
  if (classId === 'hibou' && state.roots.length > 0) return 'roots';
  if (has('creatures') && state.creatures.length > 1) return 'creatures';
  return 'nemesis';
}

function volley(state: GameState, classId: ClassId, mean: number, count: number, rng: Rng): Submission {
  const arrows = Array.from({ length: count }, () => {
    const score = Math.max(0, Math.min(10, Math.round(mean + gaussian(rng) * 2)));
    const action = score > 0 ? intent(state, classId) : null;
    const hurt = [...state.players].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const target = action === 'heal' && state.tree.hp >= state.tree.maxHp * 0.6 && hurt ? hurt.id : null;
    return { score, x: score === 10 && random(rng) < 0.35, action, target };
  });
  return { arrows };
}

function simulate(difficulty: Difficulty, classes: ClassId[], mean: number, games: number, arrows = 3): string {
  let wins = 0;
  let deckOuts = 0;
  let volleys = 0;
  let knockouts = 0;
  for (let game = 0; game < games; game++) {
    const rng = { value: game * 7919 + 1 };
    let ids = 0;
    const config: GameConfig = {
      nemesisId: 'mordelune',
      difficulty,
      arrowsPerVolley: arrows,
      players: withBots(
        classes.map((classId, i) => ({ id: `p${i}`, name: `P${i}`, classId, level: 'normal', coef: 1 })),
        () => String(ids++),
      ),
    };
    let s = reduce(createGame(config, game + 1, 'sim'), { type: 'start' });
    while (s.phase.kind !== 'over') {
      if (s.phase.kind === 'nemesis') {
        s = reduce(s, { type: 'draw' });
        continue;
      }
      for (const p of s.players) {
        if (powerAvailability(s, p.id).ok) s = reduce(s, { type: 'power', playerId: p.id, targetUid: s.roots[0]?.uid });
      }
      for (const p of s.players) {
        s = reduce(s, { type: 'submit', playerId: p.id, submission: volley(s, p.classId, mean, arrows, rng) });
      }
      s = reduce(s, { type: 'resolve' });
    }
    if (s.phase.result === 'victory') wins++;
    if (s.fury > 0) deckOuts++;
    volleys += s.volleyCount;
    knockouts += s.players.reduce((n, p) => n + p.stats.knockouts, 0);
  }
  const rate = ((wins / games) * 100).toFixed(0);
  return `${difficulty.padEnd(9)} ${classes.join(',').padEnd(34)} moy ${mean} × ${arrows} : ${rate}% victoires, ${deckOuts} en Furie, ${(volleys / games).toFixed(1)} volées, ${(knockouts / games).toFixed(1)} archers à terre`;
}

const CLASS_IDS: ClassId[] = ['loup', 'ours', 'hibou', 'cerf'];

function subsets(k: number, start = 0): ClassId[][] {
  if (k === 0) return [[]];
  return CLASS_IDS.slice(start).flatMap((c, i) => subsets(k - 1, start + i + 1).map((rest) => [c, ...rest]));
}

function teams(size: number): ClassId[][] {
  return size <= 4 ? subsets(size) : subsets(size - 4).map((extra) => [...CLASS_IDS, ...extra]);
}

function bySize(difficulty: Difficulty, arrows: number, sizes = [1, 2, 3, 4, 5, 6, 8]): string {
  const cells = sizes.map((size) => {
    const rates = teams(size).map((team) => Number(simulate(difficulty, team, 8, 40, arrows).match(/: (\d+)% victoires/)![1]));
    return `${size}j ${String(Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)).padStart(3)}%`;
  });
  return `${difficulty.padEnd(9)} moy 8 × ${arrows} selon l’équipe : ${cells.join(' · ')}`;
}

it.skipIf(!process.env.BALANCE)('équilibrage', () => {
  const lines: string[] = [];
  for (const difficulty of ['facile', 'normal', 'difficile'] as Difficulty[]) {
    for (const mean of [6.5, 8, 9]) lines.push(simulate(difficulty, CLASS_IDS, mean, 300));
    for (const arrows of [3, 6]) lines.push(bySize(difficulty, arrows));
  }
  console.log(lines.join('\n'));
}, 600_000);
