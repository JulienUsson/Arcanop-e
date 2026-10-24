import { describe, expect, it } from 'vitest';
import { councilAdvice, suggestion } from './advice';
import { createGame, reduce } from './engine';
import type { GameConfig } from './types';

const config: GameConfig = {
  nemesisId: 'mordelune',
  difficulty: 'normal',
  arrowsPerVolley: 3,
  players: [
    { id: 'h', name: 'Hugo', classId: 'hibou', coef: 1 },
    { id: 'c', name: 'Clara', classId: 'cerf', coef: 1 },
  ],
};

describe('conseil', () => {
  it('signale une racine sur le point d’éclore et oriente le Hibou', () => {
    const s = structuredClone(reduce(createGame(config, 3, 'g'), { type: 'start' }));
    s.roots = [{ uid: 'r1', cardId: 'racine-etrangleuse', hp: 9, maxHp: 20, countdown: 1 }];
    const advice = councilAdvice(s);
    expect(advice[0]).toMatchObject({ urgent: true });
    expect(advice[0].text).toContain('Racine Étrangleuse');
    expect(suggestion(s, 'h')).toMatchObject({ action: 'roots', quadrants: [0, 3] });
  });

  it('pousse le Cerf à soigner un Arbre-Cœur affaibli', () => {
    const s = structuredClone(reduce(createGame(config, 3, 'g'), { type: 'start' }));
    s.tree.hp = 10;
    expect(suggestion(s, 'c')).toMatchObject({ action: 'heal', quadrants: [0, 3] });
    expect(councilAdvice(s).some((a) => a.urgent && a.text.includes('Arbre-Cœur'))).toBe(true);
  });
});
