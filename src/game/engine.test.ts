import { describe, expect, it } from 'vitest';
import { createGame, powerAvailability, reduce, treeDamageFactor, volleyPool } from './engine';
import { availableActions } from './classes';
import { GAUGE_MAX } from './difficulty';
import type { Action, Arrow, GameConfig, GameState, Submission } from './types';

const config: GameConfig = {
  nemesisId: 'mordelune',
  difficulty: 'normal',
  arrowsPerVolley: 3,
  players: [
    { id: 'a', name: 'Alice', classId: 'loup', coef: 1 },
    { id: 'b', name: 'Bruno', classId: 'ours', coef: 1 },
    { id: 'c', name: 'Chloé', classId: 'hibou', coef: 1 },
    { id: 'd', name: 'David', classId: 'cerf', coef: 1.5 },
  ],
};

function started(seed = 42): GameState {
  return reduce(createGame(config, seed, 'g'), { type: 'start' });
}

function drawUntil(state: GameState, kind: 'volley' | 'nemesis'): GameState {
  let s = state;
  for (let i = 0; i < 50; i++) {
    if (s.phase.kind === 'volley') s = reduce(s, { type: 'resolve' });
    if (s.phase.kind !== 'turn') throw new Error('phase inattendue');
    const next = s.turnDeck[0];
    s = reduce(s, { type: 'draw' });
    if (next === kind) return s;
  }
  throw new Error('carte introuvable');
}

const arrow = (score: number | 'X', action: Action | null = null): Arrow =>
  score === 'X' ? { score: 10, x: true, action } : { score, x: false, action: score === 0 ? null : action };
const volley = (scores: (number | 'X')[], actions: Action | (Action | null)[] = []): Submission => ({
  arrows: scores.map((score, i) => arrow(score, Array.isArray(actions) ? (actions[i] ?? null) : actions)),
});

describe('moteur', () => {
  it('prépare une partie mise à l’échelle', () => {
    const s = createGame(config, 1, 'g');
    expect(s.nemesis.hp).toBe(88 * 12);
    expect(s.tree.hp).toBe(45);
    expect(s.wrathDeck).toHaveLength(13);
    expect(s.phase.kind).toBe('lobby');
  });

  it('mélange un paquet d’ordre de tour par manche', () => {
    const s = started();
    expect(s.round).toBe(1);
    expect(s.turnDeck.filter((c) => c === 'volley')).toHaveLength(3);
    expect(s.turnDeck.filter((c) => c === 'nemesis')).toHaveLength(2);
  });

  it('additionne la volée, applique la spécialité et remplit les jauges', () => {
    let s = drawUntil(started(), 'volley');
    const hp = s.nemesis.hp;
    s = reduce(s, { type: 'submit', playerId: 'a', submission: volley([10, 9, 0], 'nemesis') });
    s = reduce(s, { type: 'resolve' });
    expect(s.phase.kind).toBe('turn');
    expect(s.nemesis.hp).toBe(hp - 29);
    const alice = s.players[0];
    expect(alice.gauge).toBe(2);
    expect(alice.stats.misses).toBe(1);
    expect(alice.stats.totalScore).toBe(19);
    expect(alice.stats.damageNemesis).toBe(29);
  });

  it('compte le X comme un coup critique', () => {
    expect(volleyPool([arrow('X'), arrow(7)], 1)).toBe(22);
    expect(volleyPool([arrow('X'), arrow(7)], 1.5)).toBe(33);
    let s = drawUntil(started(), 'volley');
    s = reduce(s, { type: 'submit', playerId: 'a', submission: volley(['X', 7, 3]) });
    s = reduce(s, { type: 'resolve' });
    const alice = s.players[0];
    expect(alice.stats).toMatchObject({ crits: 1, tens: 1, totalScore: 20, yellows: 1 });
    expect(s.lastEvent?.narration).toContain('coup critique');
  });

  it('répartit les flèches entre les actions disponibles', () => {
    let s = drawUntil(started(), 'volley');
    s = { ...s, tree: { hp: 20, maxHp: 45 } };
    const hp = s.nemesis.hp;
    s = reduce(s, { type: 'submit', playerId: 'b', submission: volley([8, 8, 5], ['nemesis', 'heal', 'roots']) });
    expect(s.phase.kind === 'volley' && s.phase.submissions.b.arrows.map((a) => a.action)).toEqual(['nemesis', 'heal', 'creatures']);
    s = reduce(s, { type: 'resolve' });
    expect(s.tree.hp).toBe(24);
    expect(s.nemesis.hp).toBe(hp - 8 - 8);
  });

  it('ne donne aucune action à une flèche hors cible', () => {
    let s = drawUntil(started(), 'volley');
    s = reduce(s, { type: 'submit', playerId: 'a', submission: { arrows: [{ score: 0, x: true, action: 'nemesis' }, { score: 7, x: true, action: null }] } });
    expect(s.phase.kind === 'volley' && s.phase.submissions.a.arrows).toEqual([
      { score: 0, x: false, action: null },
      { score: 7, x: false, action: 'nemesis' },
    ]);
  });

  it('guide la volée du conseil à la saisie', () => {
    let s = drawUntil(started(), 'volley');
    expect(s.phase).toMatchObject({ kind: 'volley', step: 'council' });
    expect(s.lastEvent?.kind).toBe('volley');
    s = reduce(s, { type: 'advance' });
    expect(s.phase).toMatchObject({ step: 'shoot' });
    s = reduce(s, { type: 'advance' });
    expect(s.phase).toMatchObject({ step: 'input' });
    expect(reduce(s, { type: 'advance' })).toBe(s);
  });

  it('détaille chaque volée dans l’événement de résolution', () => {
    let s = drawUntil(started(), 'volley');
    s = reduce(s, { type: 'submit', playerId: 'a', submission: volley([9, 0], 'nemesis') });
    s = reduce(s, { type: 'resolve' });
    expect(s.lastEvent?.kind).toBe('resolve');
    expect(s.lastEvent?.results).toEqual([
      {
        playerId: 'a',
        arrows: [arrow(9, 'nemesis'), arrow(0)],
        pool: 9,
        effects: [{ action: 'nemesis', points: 9, amount: 14, target: 'Mordelune' }],
      },
    ]);
  });

  it('applique le coefficient et le facteur de soin', () => {
    let s = drawUntil(started(), 'volley');
    s = { ...s, tree: { hp: 10, maxHp: 45 } };
    s = reduce(s, { type: 'submit', playerId: 'd', submission: volley([8], 'heal') });
    s = reduce(s, { type: 'resolve' });
    expect(s.tree.hp).toBe(19);
  });

  it('redirige vers la Némésis faute de créature', () => {
    let s = drawUntil(started(), 'volley');
    const hp = s.nemesis.hp;
    s = reduce(s, { type: 'submit', playerId: 'b', submission: volley([7], 'creatures') });
    s = reduce(s, { type: 'resolve' });
    expect(s.nemesis.hp).toBe(hp - 11);
  });

  it('frappe d’abord la créature ciblée puis déborde', () => {
    let s = drawUntil(started(), 'volley');
    s = structuredClone(s);
    s.creatures = [
      { uid: 'c1', cardId: 'loup-ronce', hp: 5, maxHp: 18 },
      { uid: 'c2', cardId: 'corbeau-cendre', hp: 12, maxHp: 12 },
    ];
    s = reduce(s, { type: 'focus', kind: 'creature', uid: 'c2' });
    s = reduce(s, { type: 'submit', playerId: 'b', submission: volley([6, 4], 'creatures') });
    s = reduce(s, { type: 'resolve' });
    expect(s.creatures).toEqual([{ uid: 'c1', cardId: 'loup-ronce', hp: 2, maxHp: 18 }]);
  });

  it('active les pouvoirs', () => {
    let s = drawUntil(started(), 'volley');
    s = structuredClone(s);
    s.players.forEach((p) => (p.gauge = GAUGE_MAX));
    s.roots = [{ uid: 'r1', cardId: 'racine-etrangleuse', hp: 20, maxHp: 20, countdown: 1 }];
    s.tree.hp = 20;
    expect(powerAvailability(s, 'a').ok).toBe(true);
    s = reduce(s, { type: 'power', playerId: 'a' });
    expect(s.wolfBoost).toBe(1);
    expect(powerAvailability(s, 'a').ok).toBe(false);
    s = reduce(s, { type: 'power', playerId: 'b', targetUid: 'r1' });
    expect(s.roots[0].countdown).toBe(2);
    s = reduce(s, { type: 'power', playerId: 'c' });
    expect(s.revealed).toBe(true);
    s = reduce(s, { type: 'power', playerId: 'd' });
    expect(s.tree.hp).toBe(35);
    const hp = s.nemesis.hp;
    s = reduce(s, { type: 'submit', playerId: 'a', submission: volley([8], 'nemesis') });
    s = reduce(s, { type: 'resolve' });
    expect(s.nemesis.hp).toBe(hp - 24);
    expect(s.wolfBoost).toBe(0);
  });

  it('fait jouer une carte de colère sur une carte Némésis', () => {
    let s = started();
    const deck = s.wrathDeck.length;
    s = drawUntil(s, 'nemesis');
    expect(s.wrathDeck).toHaveLength(deck - 1);
    expect(s.lastEvent?.title).toMatch(/Attaque|Créature|Racine/);
    expect(s.lastEvent?.cardId).toBe(started().wrathDeck[0]);
  });

  it('déclenche les racines en fin de manche', () => {
    let s = started();
    s = structuredClone(s);
    s.turnDeck = [];
    s.roots = [{ uid: 'r1', cardId: 'racine-etrangleuse', hp: 20, maxHp: 20, countdown: 1 }];
    s = reduce(s, { type: 'draw' });
    expect(s.roots).toHaveLength(0);
    expect(s.tree.hp).toBe(45 - Math.round(14 * treeDamageFactor(config)));
    expect(s.round).toBe(2);
  });

  it('perd quand le paquet de colère est épuisé', () => {
    let s = started();
    s = structuredClone(s);
    s.wrathDeck = [];
    s.turnDeck = ['nemesis'];
    s = reduce(s, { type: 'draw' });
    expect(s.phase).toMatchObject({ kind: 'over', result: 'defeat' });
  });

  it('gagne quand la Némésis tombe', () => {
    let s = drawUntil(started(), 'volley');
    s = { ...s, nemesis: { hp: 5, maxHp: 384 } };
    s = reduce(s, { type: 'submit', playerId: 'a', submission: volley([6]) });
    s = reduce(s, { type: 'resolve' });
    expect(s.phase).toMatchObject({ kind: 'over', result: 'victory' });
  });

  it('termine toujours une partie simulée', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = started(seed);
      let guard = 0;
      while (s.phase.kind !== 'over' && guard++ < 500) {
        if (s.phase.kind === 'turn') s = reduce(s, { type: 'draw' });
        else if (s.phase.kind === 'volley') {
          for (const p of s.players) {
            const actions = availableActions(p.classId);
            const scores = [0, 1, 2].map((i) => ((seed * 7 + i * 3) % 11) as number);
            s = reduce(s, { type: 'submit', playerId: p.id, submission: volley(scores, scores.map((_, i) => actions[(seed + i) % actions.length])) });
          }
          s = reduce(s, { type: 'resolve' });
        }
      }
      expect(s.phase.kind).toBe('over');
    }
  });
});
