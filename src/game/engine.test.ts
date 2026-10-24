import { describe, expect, it } from 'vitest';
import { createGame, powerAvailability, reduce, treeDamageFactor } from './engine';
import { CLASSES } from './classes';
import { GAUGE_MAX } from './difficulty';
import type { Arrow, GameConfig, GameState } from './types';

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

const shot = (score: number, action: Arrow['action']): Arrow => ({ score, action, quadrant: 0 });

describe('moteur', () => {
  it('prépare une partie mise à l’échelle', () => {
    const s = createGame(config, 1, 'g');
    expect(s.nemesis.hp).toBe(70 * 12);
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

  it('applique les flèches et remplit les jauges', () => {
    let s = drawUntil(started(), 'volley');
    expect(s.phase.kind).toBe('volley');
    const hp = s.nemesis.hp;
    s = reduce(s, { type: 'submit', playerId: 'a', arrows: [shot(10, 'nemesis'), shot(9, 'nemesis'), shot(0, null)] });
    s = reduce(s, { type: 'resolve' });
    expect(s.phase.kind).toBe('turn');
    expect(s.nemesis.hp).toBe(hp - 19);
    const alice = s.players[0];
    expect(alice.gauge).toBe(2);
    expect(alice.stats.misses).toBe(1);
    expect(alice.stats.damageNemesis).toBe(19);
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

  it('détaille chaque flèche dans l’événement de résolution', () => {
    let s = drawUntil(started(), 'volley');
    s = reduce(s, { type: 'submit', playerId: 'a', arrows: [shot(9, 'nemesis'), shot(0, null)] });
    s = reduce(s, { type: 'resolve' });
    expect(s.lastEvent?.kind).toBe('resolve');
    expect(s.lastEvent?.hits).toEqual([
      { playerId: 'a', score: 9, action: 'nemesis', amount: 9, target: 'Mordelune' },
      { playerId: 'a', score: 0, action: null, amount: 0, target: '' },
    ]);
  });

  it('applique le coefficient et le facteur de soin', () => {
    let s = drawUntil(started(), 'volley');
    s = { ...s, tree: { hp: 10, maxHp: 45 } };
    s = reduce(s, { type: 'submit', playerId: 'd', arrows: [shot(8, 'heal')] });
    s = reduce(s, { type: 'resolve' });
    expect(s.tree.hp).toBe(16);
  });

  it('redirige vers la Némésis faute de créature', () => {
    let s = drawUntil(started(), 'volley');
    const hp = s.nemesis.hp;
    s = reduce(s, { type: 'submit', playerId: 'b', arrows: [shot(7, 'creatures')] });
    s = reduce(s, { type: 'resolve' });
    expect(s.nemesis.hp).toBe(hp - 7);
  });

  it('frappe d’abord la créature ciblée puis déborde', () => {
    let s = drawUntil(started(), 'volley');
    s = structuredClone(s);
    s.creatures = [
      { uid: 'c1', cardId: 'loup-ronce', hp: 5, maxHp: 18 },
      { uid: 'c2', cardId: 'corbeau-cendre', hp: 12, maxHp: 12 },
    ];
    s = reduce(s, { type: 'focus', kind: 'creature', uid: 'c2' });
    s = reduce(s, { type: 'submit', playerId: 'b', arrows: [shot(10, 'creatures'), shot(4, 'creatures')] });
    s = reduce(s, { type: 'resolve' });
    expect(s.creatures).toEqual([{ uid: 'c1', cardId: 'loup-ronce', hp: 3, maxHp: 18 }]);
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
    s = reduce(s, { type: 'submit', playerId: 'a', arrows: [shot(8, 'nemesis')] });
    s = reduce(s, { type: 'resolve' });
    expect(s.nemesis.hp).toBe(hp - 16);
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
    s = reduce(s, { type: 'submit', playerId: 'a', arrows: [shot(6, 'nemesis')] });
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
            const actions = CLASSES[p.classId].quadrants;
            const arrows = [0, 1, 2].map((i) => shot(((seed * 7 + i * 3) % 10) + 1, actions[(seed + i) % 4]));
            s = reduce(s, { type: 'submit', playerId: p.id, arrows });
          }
          s = reduce(s, { type: 'resolve' });
        }
      }
      expect(s.phase.kind).toBe('over');
    }
  });
});
