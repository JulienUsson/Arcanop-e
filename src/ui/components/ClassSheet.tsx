import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, CLASSES } from '../../game/classes';
import { CERF_HEAL, GAUGE_MAX } from '../../game/difficulty';
import { CRIT_POINTS } from '../../game/target';
import type { Action, ClassId } from '../../game/types';

const ALL_ACTIONS: Action[] = ['nemesis', 'creatures', 'roots', 'heal'];

const ACTION_HELP: Record<Action, string> = {
  nemesis: 'Dégâts directs à la Némésis.',
  creatures: 'Abat les créatures, qui agissent à chaque fin de manche. Cible choisie par flèche.',
  roots: 'Détruit les racines avant qu’elles n’éclosent. Cible choisie par flèche.',
  heal: 'Rend à l’Arbre-Cœur la moitié des points des flèches assignées.',
};

export function ClassSheet({ classId }: { classId: ClassId }) {
  const cls = CLASSES[classId];
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
          spécialité comptent ×1,5. Cordon défavorable : une flèche sur la ligne
          compte pour la zone inférieure.
        </p>
      </section>

      <section className="sheet-power">
        <h3>
          Pouvoir : {cls.powerName}
        </h3>
        <p>
          {classId === 'cerf' ? `Soigne l’Arbre-Cœur de ${CERF_HEAL} PV.` : cls.powerText}
        </p>
        <p className="hint">
          Se charge avec {GAUGE_MAX} flèches dans le jaune (9, 10 ou X), puis s’active quand vous le décidez.
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
