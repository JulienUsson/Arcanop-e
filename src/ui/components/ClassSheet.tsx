import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, CLASSES } from '../../game/classes';
import { CERF_ARCHER_HEAL, CERF_HEAL, GAUGE_MAX } from '../../game/difficulty';
import { cerfHeal } from '../../game/engine';
import { CRIT_POINTS } from '../../game/target';
import type { Action, ClassId, GameConfig } from '../../game/types';

const ALL_ACTIONS: Action[] = ['nemesis', 'creatures', 'roots', 'heal'];

const ACTION_HELP: Record<Action, string> = {
  nemesis: 'Dégâts directs à la Némésis.',
  creatures: 'Abat les créatures, qui agissent à chaque tour de la Némésis. Cible choisie par flèche.',
  roots: 'Détruit les racines avant qu’elles n’éclosent. Cible choisie par flèche.',
  heal: 'Rend la moitié des points des flèches à l’Arbre-Cœur ou à un Gardien.',
};

export function ClassSheet({ classId, config }: { classId: ClassId; config?: GameConfig }) {
  const cls = CLASSES[classId];
  const treeHeal = config ? cerfHeal(config) : CERF_HEAL;
  const rows = ALL_ACTIONS.map((action) => ({ action, multiplier: actionMultiplier(classId, action) }));

  return (
    <article className="class-sheet" style={{ ['--class-color' as string]: cls.color }}>
      <header className="sheet-head">
        <div className="sheet-portrait">{cls.emoji}</div>
        <div>
          <h2>{cls.name}</h2>
          <p className="sheet-spirit">{cls.spirit}</p>
          <span className="sheet-role">{cls.role}</span>
        </div>
      </header>
      <p className="sheet-lore">{cls.lore}</p>

      <section>
        <h3>Vos actions</h3>
        <ul className="sheet-actions">
          {rows.map(({ action, multiplier }) => (
            <li key={action} className={`action-${action}${multiplier === 0 ? ' absent' : ''}${multiplier > 1 ? ' specialty' : ''}`}>
              <span className="sheet-action-name">
                {ACTION_ICONS[action]} {ACTION_LABELS[action]}
              </span>
              <span className="sheet-action-count">
                {multiplier === 0 ? 'absente' : multiplier > 1 ? `spécialité ×${String(multiplier).replace('.', ',')}` : '×1'}
              </span>
              <small>{ACTION_HELP[action]}</small>
            </li>
          ))}
        </ul>
        <p className="hint">
          Après chaque volée, assignez chacune de vos flèches à une action (un X vaut {CRIT_POINTS} points). Les flèches assignées à la
          spécialité comptent ×1,5. Une flèche sur le cordon compte pour la zone supérieure au niveau Facile, pour la zone inférieure en
          Normal et Difficile.
        </p>
      </section>

      <section className="sheet-power">
        <h3>
          Pouvoir : {cls.powerName}
        </h3>
        <p>
          {classId === 'cerf' ? `Soigne l’Arbre-Cœur de ${treeHeal} PV et chaque Gardien de ${CERF_ARCHER_HEAL} PV.` : cls.powerText}
        </p>
        <p className="hint">
          Jauge de {GAUGE_MAX} : un 10 la charge de 1, un X de 2 ; au niveau Facile, un 9 la charge aussi de 1. Le pouvoir s’active quand vous le
          décidez.
        </p>
      </section>

      <section>
        <h3>Conseils</h3>
        <ul className="sheet-tips">
          {cls.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
