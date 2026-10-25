import { useEffect, useState } from 'react';
import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, ACTIONS, availableActions, CLASSES } from '../../game/classes';
import { actionPoints, effectAmount, volleyPool } from '../../game/engine';
import { arrowLabel, arrowPoints, CRIT_POINTS, isYellow, RING_COLORS } from '../../game/target';
import type { Action, Arrow, ClassId, Submission } from '../../game/types';
import { burstAt, flash, shake, useTween } from '../fx';
import { play } from '../sfx';

interface Props {
  draftKey: string;
  classId: ClassId;
  coef: number;
  arrowsPerVolley: number;
  boost?: number;
  suggested?: Action | null;
  submitted?: Submission;
  canSubmit: boolean;
  blockedReason?: string;
  onSubmit: (submission: Submission) => void;
}

interface Draft {
  arrows: Arrow[];
  editing: boolean;
}

const drafts = new Map<string, Draft>();

const KEYS: Pick<Arrow, 'score' | 'x'>[] = [
  { score: 10, x: true },
  { score: 10, x: false },
  { score: 9, x: false },
  { score: 8, x: false },
  { score: 7, x: false },
  { score: 6, x: false },
  { score: 5, x: false },
  { score: 4, x: false },
  { score: 3, x: false },
  { score: 2, x: false },
  { score: 1, x: false },
  { score: 0, x: false },
];

function formatMultiplier(n: number): string {
  return String(n).replace('.', ',');
}

function ScoreChip({ arrow, small }: { arrow: Pick<Arrow, 'score' | 'x'>; small?: boolean }) {
  return (
    <span
      className={`score-slot filled${small ? ' small' : ''}${arrow.x ? ' crit' : ''}`}
      style={{ background: RING_COLORS[arrow.score].fill, color: RING_COLORS[arrow.score].text }}
    >
      {arrowLabel(arrow)}
    </span>
  );
}

export function VolleyInput({ draftKey, classId, coef, arrowsPerVolley, boost = 1, suggested, submitted, canSubmit, blockedReason, onSubmit }: Props) {
  const cls = CLASSES[classId];
  const actions = availableActions(classId);
  const fallback: Action = suggested && actionMultiplier(classId, suggested) > 0 ? suggested : cls.specialty;

  const initial = (): Draft => drafts.get(draftKey) ?? (submitted ? { arrows: submitted.arrows, editing: false } : { arrows: [], editing: true });
  const [draft, setDraft] = useState<Draft>(initial);
  const [sentKey, setSentKey] = useState(0);

  useEffect(() => {
    setDraft(initial());
  }, [draftKey]);

  const update = (next: Draft) => {
    drafts.set(draftKey, next);
    setDraft(next);
  };

  const { arrows } = draft;
  const full = arrows.length >= arrowsPerVolley;
  const pool = volleyPool(arrows, coef);
  const raw = arrows.reduce((sum, a) => sum + arrowPoints(a), 0);
  const crits = arrows.filter((a) => a.x).length;
  const shownPool = useTween(pool, 600);
  const submission: Submission = { arrows };
  const same = !!submitted && JSON.stringify(submitted.arrows) === JSON.stringify(arrows);

  const setArrows = (next: Arrow[]) => update({ arrows: next, editing: next.length < arrowsPerVolley });

  const addArrow = (key: Pick<Arrow, 'score' | 'x'>, origin?: Element) => {
    if (full) return;
    setArrows([...arrows, { ...key, action: key.score > 0 ? fallback : null }]);
    if (key.x) {
      burstAt(origin, 'sparks', 34);
      flash('rgba(246, 211, 45, 0.4)');
      shake('soft');
    } else if (key.score > 0) {
      burstAt(origin, isYellow(key.score) ? 'sparks' : 'dust', isYellow(key.score) ? 14 : 8, isYellow(key.score) ? undefined : RING_COLORS[key.score].fill);
    } else {
      burstAt(origin, 'smoke', 6);
    }
    navigator.vibrate?.(key.x ? [30, 40, 30, 40, 60] : isYellow(key.score) ? [20, 40, 20] : 15);
    play(key.x ? 'power' : 'tap');
  };

  const assign = (index: number, action: Action, origin?: Element) => {
    if (arrows[index].score === 0 || arrows[index].action === action) return;
    update({ ...draft, arrows: arrows.map((a, i) => (i === index ? { ...a, action } : a)) });
    burstAt(origin, 'dust', 6);
    play('tap');
  };

  const assignAll = (action: Action) => {
    update({ ...draft, arrows: arrows.map((a) => (a.score > 0 ? { ...a, action } : a)) });
    play('tap');
  };

  const submit = (e: React.MouseEvent<HTMLButtonElement>) => {
    onSubmit(submission);
    burstAt(e.currentTarget, 'leaves', 22);
    setSentKey(Date.now());
    play('send');
  };

  if (!full || draft.editing) {
    return (
      <div className="volley-input">
        <div className="score-slots">
          {Array.from({ length: arrowsPerVolley }, (_, i) =>
            arrows[i] ? (
              <ScoreChip key={i} arrow={arrows[i]} />
            ) : (
              <span key={i} className="score-slot">
                {i + 1}
              </span>
            ),
          )}
          <span className="score-total">
            <strong>{raw}</strong> pts
          </span>
        </div>
        <p className="cordon-rule">
          <strong>Cordon défavorable :</strong> une flèche qui touche la ligne entre deux zones compte pour la zone inférieure.
        </p>
        <div className="keypad">
          {KEYS.map((key) => (
            <button
              key={key.x ? 'X' : key.score}
              className={`key${key.x ? ' crit' : ''}`}
              style={{ ['--key-bg' as string]: RING_COLORS[key.score].fill, ['--key-fg' as string]: RING_COLORS[key.score].text }}
              disabled={full}
              onClick={(e) => addArrow(key, e.currentTarget)}
            >
              <span className="key-label">{arrowLabel(key)}</span>
              {key.x && <small>critique : {CRIT_POINTS} pts</small>}
              {key.score === 0 && <small>hors cible</small>}
            </button>
          ))}
        </div>
        <div className="input-actions two">
          <button className="secondary big" disabled={arrows.length === 0} onClick={() => setArrows(arrows.slice(0, -1))}>
            ↶ Retirer
          </button>
          <button className="primary big" disabled={!full} onClick={() => update({ ...draft, editing: false })}>
            Assigner →
          </button>
        </div>
      </div>
    );
  }

  const usedActions = ACTIONS.filter((action) => arrows.some((a) => a.action === action));

  return (
    <div className="volley-input">
      <div className="assign-head">
        <button className="ghost small" onClick={() => update({ ...draft, editing: true })}>
          ✎ Scores
        </button>
        <span className="pool">
          <span className="pool-value" key={pool}>
            {shownPool}
          </span>
          <span className="pool-label">
            pts
            {coef !== 1 && raw > 0 && <small>{raw} × {formatMultiplier(coef)}</small>}
          </span>
        </span>
      </div>
      {crits > 0 && (
        <div key={crits} className="crit-banner">
          ✦ {crits > 1 ? `${crits} coups critiques` : 'Coup critique'} ! ✦
        </div>
      )}

      <div className="assign-all">
        <span>Tout sur</span>
        {actions.map((action) => (
          <button key={action} className={`chip action-${action}`} onClick={() => assignAll(action)}>
            {ACTION_ICONS[action]} {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      <ul className="arrow-rows">
        {arrows.map((arrow, index) => (
          <li key={index} className={`arrow-row${arrow.action ? ` action-${arrow.action}` : ' miss'}`}>
            <div className="arrow-info">
              <ScoreChip arrow={arrow} />
              <small>{arrow.score === 0 ? 'raté' : `${arrowPoints(arrow)} pts`}</small>
            </div>
            {arrow.score === 0 ? (
              <span className="arrow-miss">Hors cible : aucun effet</span>
            ) : (
              <div className="arrow-actions">
                {actions.map((action) => (
                  <button
                    key={action}
                    className={`arrow-action action-${action}${arrow.action === action ? ' selected' : ''}`}
                    onClick={(e) => assign(index, action, e.currentTarget)}
                    aria-pressed={arrow.action === action}
                  >
                    <span className="arrow-action-icon">{ACTION_ICONS[action]}</span>
                    <span className="arrow-action-label">{ACTION_LABELS[action]}</span>
                    {actionMultiplier(classId, action) > 1 && <span className="arrow-action-bonus">×{formatMultiplier(actionMultiplier(classId, action))}</span>}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {usedActions.length > 0 && (
        <ul className="assign-totals">
          {usedActions.map((action) => {
            const points = actionPoints(arrows, action, coef);
            const amount = effectAmount(classId, action, points, boost);
            return (
              <li key={action} className={`action-${action}`}>
                <span>
                  {ACTION_ICONS[action]} {ACTION_LABELS[action]}
                </span>
                <strong>{action === 'heal' ? `+${amount} PV` : `${amount} dégâts`}</strong>
              </li>
            );
          })}
        </ul>
      )}

      <div className="input-actions single">
        <button className={`primary big${!same && canSubmit ? ' pulse' : ''}`} disabled={!canSubmit || same} onClick={submit}>
          {same ? 'Volée envoyée ✓' : submitted ? 'Corriger la volée' : 'Valider la volée'}
        </button>
      </div>
      {sentKey > 0 && same && (
        <div key={sentKey} className="sent-stamp">
          Volée envoyée
        </div>
      )}
      {!canSubmit && blockedReason && <p className="hint center">{blockedReason}</p>}
    </div>
  );
}
