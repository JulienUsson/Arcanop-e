import { ACTION_ICONS, ACTION_LABELS, CLASSES } from '../../game/classes';
import { CERF_HEAL, GAUGE_MAX } from '../../game/difficulty';
import type { Action, ClassId } from '../../game/types';
import { TargetFace } from './TargetFace';

const ALL_ACTIONS: Action[] = ['nemesis', 'creatures', 'roots', 'heal'];

const ACTION_HELP: Record<Action, string> = {
  nemesis: 'Dégâts directs à la Némésis.',
  creatures: 'Dégâts à la créature ciblée 🎯, le surplus passe à la suivante.',
  roots: 'Dégâts à la racine ciblée, avant qu’elle n’éclose.',
  heal: 'Rend à l’Arbre-Cœur la moitié de la puissance.',
};

export function ClassSheet({ classId }: { classId: ClassId }) {
  const cls = CLASSES[classId];
  const counts = ALL_ACTIONS.map((action) => ({ action, count: cls.quadrants.filter((a) => a === action).length }));
  const missing = counts.find((c) => c.count === 0)?.action;
  const specialty = counts.find((c) => c.count === 2)?.action;

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
        <h3>Votre blason</h3>
        <div className="sheet-target">
          <TargetFace classId={classId} markers={[]} readOnly onHit={() => {}} />
        </div>
        <ul className="sheet-actions">
          {counts.map(({ action, count }) => (
            <li key={action} className={`action-${action}${count === 0 ? ' absent' : ''}`}>
              <span className="sheet-action-name">
                {ACTION_ICONS[action]} {ACTION_LABELS[action]}
              </span>
              <span className="sheet-action-count">{count === 0 ? 'absente' : count === 2 ? 'spécialité ×2' : '1 quadrant'}</span>
              <small>{ACTION_HELP[action]}</small>
            </li>
          ))}
        </ul>
        {specialty && missing && (
          <p className="hint">
            Spécialité : {ACTION_LABELS[specialty]}, sur deux quadrants opposés. Action absente : {ACTION_LABELS[missing]}.
          </p>
        )}
      </section>

      <section className="sheet-power">
        <h3>
          Pouvoir : {cls.powerName}
        </h3>
        <p>
          {classId === 'cerf' ? `Soigne l’Arbre-Cœur de ${CERF_HEAL} PV.` : cls.powerText}
        </p>
        <p className="hint">
          Se charge avec {GAUGE_MAX} flèches dans le jaune (9 ou 10), puis s’active quand vous le décidez.
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
