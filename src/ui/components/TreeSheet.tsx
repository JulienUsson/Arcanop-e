import { DIFFICULTIES } from '../../game/difficulty';
import { HEART_TREE } from '../../game/tree';
import type { GameState } from '../../game/types';

export function TreeSheet({ state }: { state?: GameState }) {
  const maxHp = state?.tree.maxHp;
  const ratio = state ? state.tree.hp / state.tree.maxHp : 1;
  const mood =
    ratio > 0.7 ? 'Ses feuilles bruissent, sereines.' : ratio > 0.35 ? 'Son écorce se fend, la sève coule plus lentement.' : 'Ses feuilles tombent une à une : il ne tiendra plus longtemps.';
  return (
    <article className="tree-sheet">
      <header className="sheet-head">
        <div className="tree-portrait">{HEART_TREE.portrait}</div>
        <div>
          <h2>{HEART_TREE.name}</h2>
          <p className="sheet-spirit">{HEART_TREE.title}</p>
          <span className="sheet-role tree">À protéger</span>
        </div>
      </header>
      <p className="sheet-lore">{HEART_TREE.lore}</p>
      {state && maxHp && (
        <section className="nemesis-stats tree-stats">
          <div className="stat">
            <span className="stat-value">
              {state.tree.hp} / {maxHp}
            </span>
            <span className="stat-label">PV</span>
          </div>
          <div className="stat">
            <span className="stat-value">{DIFFICULTIES[state.config.difficulty].label}</span>
            <span className="stat-label">difficulté</span>
          </div>
          <div className="stat">
            <span className="stat-value">{state.creatures.length + state.roots.length}</span>
            <span className="stat-label">menaces en jeu</span>
          </div>
        </section>
      )}
      {state && <p className="tree-mood">{mood}</p>}
      <section>
        <h3>Ce qui le menace</h3>
        <ul className="sheet-tips">
          {HEART_TREE.threats.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Comment le soigner</h3>
        <ul className="sheet-tips">
          {HEART_TREE.care.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="hint">S’il tombe à 0 PV, la partie est perdue.</p>
      </section>
      <section className="sheet-power tree-legend">
        <h3>Légende</h3>
        <p>{HEART_TREE.legend}</p>
      </section>
    </article>
  );
}
