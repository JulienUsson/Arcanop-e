import { describe, expect, it } from 'vitest';
import { hitAt, quadrantAt, scoreAt } from './target';

describe('blason', () => {
  it('compte les anneaux du centre vers l’extérieur', () => {
    expect(scoreAt(0, 0)).toBe(10);
    expect(scoreAt(0.05, 0)).toBe(10);
    expect(scoreAt(0.15, 0)).toBe(9);
    expect(scoreAt(0.95, 0)).toBe(1);
    expect(scoreAt(1, 0)).toBe(0);
  });

  it('donne la zone inférieure sur le cordon', () => {
    expect(scoreAt(0.1, 0)).toBe(9);
    expect(scoreAt(0, 0.5)).toBe(5);
  });

  it('numérote les quadrants en lecture', () => {
    expect(quadrantAt(-0.5, -0.5)).toBe(0);
    expect(quadrantAt(0.5, -0.5)).toBe(1);
    expect(quadrantAt(-0.5, 0.5)).toBe(2);
    expect(quadrantAt(0.5, 0.5)).toBe(3);
  });

  it('propose les deux quadrants adjacents sur un trait', () => {
    expect(hitAt(0.01, -0.5, 0.03)?.quadrants).toEqual([0, 1]);
    expect(hitAt(0.01, 0.5, 0.03)?.quadrants).toEqual([2, 3]);
    expect(hitAt(-0.5, 0.01, 0.03)?.quadrants).toEqual([0, 2]);
    expect(hitAt(0.5, -0.01, 0.03)?.quadrants).toEqual([1, 3]);
    expect(hitAt(0.01, 0.01, 0.03)?.quadrants).toEqual([0, 1, 2, 3]);
    expect(hitAt(0.4, 0.4, 0.03)?.quadrants).toEqual([3]);
    expect(hitAt(1.2, 0, 0.03)).toBeNull();
  });
});
