import { describe, expect, it } from 'vitest';
import { arrowLabel, arrowPoints, isYellow } from './target';

describe('flèches', () => {
  it('double la valeur d’un X', () => {
    expect(arrowPoints({ score: 10, x: true })).toBe(20);
    expect(arrowPoints({ score: 10, x: false })).toBe(10);
    expect(arrowPoints({ score: 0, x: false })).toBe(0);
  });

  it('libelle les flèches comme sur une feuille de marque', () => {
    expect(arrowLabel({ score: 10, x: true })).toBe('X');
    expect(arrowLabel({ score: 7, x: false })).toBe('7');
    expect(arrowLabel({ score: 0, x: false })).toBe('M');
  });

  it('reconnaît le jaune', () => {
    expect(isYellow(9)).toBe(true);
    expect(isYellow(8)).toBe(false);
  });
});
