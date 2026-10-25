import { useEffect, useRef, useState } from 'react';
import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, availableActions, CLASSES } from '../../game/classes';
import { effectAmount, volleyPool } from '../../game/engine';
import { arrowLabel, arrowPoints, isYellow, RING_COLORS } from '../../game/target';
import type { Action, Allocation, Arrow, ClassId, Submission } from '../../game/types';
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
  allocation: Allocation;
  editing: boolean;
}

const drafts = new Map<string, Draft>();

const KEYS: Arrow[] = [
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

function total(allocation: Allocation): number {
  return Object.values(allocation).reduce((sum, n) => sum + (n ?? 0), 0);
}

function sameSubmission(a: Submission | undefined, b: Submission): boolean {
  if (!a) return false;
  return JSON.stringify(a.arrows) === JSON.stringify(b.arrows) && JSON.stringify(cleanAllocation(a.allocation)) === JSON.stringify(cleanAllocation(b.allocation));
}

function cleanAllocation(allocation: Allocation): Allocation {
  const out: Allocation = {};
  for (const action of ['nemesis', 'creatures', 'roots', 'heal'] as Action[]) {
    if (allocation[action]) out[action] = allocation[action];
  }
  return out;
}

function useHold(callback: () => void) {
  const timer = useRef<number | null>(null);
  const saved = useRef(callback);
  saved.current = callback;
  const stop = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const start = () => {
    saved.current();
    let delay = 380;
    const tick = () => {
      saved.current();
      delay = Math.max(60, delay * 0.75);
      timer.current = window.setTimeout(tick, delay);
    };
    timer.current = window.setTimeout(tick, delay);
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

function Stepper({ onMinus, onPlus, minusDisabled, plusDisabled }: { onMinus: () => void; onPlus: () => void; minusDisabled: boolean; plusDisabled: boolean }) {
  const minus = useHold(onMinus);
  const plus = useHold(onPlus);
  return (
    <>
      <button className="step-btn" disabled={minusDisabled} aria-label="Retirer un point" {...minus}>
        −
      </button>
      <button className="step-btn" disabled={plusDisabled} aria-label="Ajouter un point" {...plus}>
        +
      </button>
    </>
  );
}

export function VolleyInput({ draftKey, classId, coef, arrowsPerVolley, boost = 1, suggested, submitted, canSubmit, blockedReason, onSubmit }: Props) {
  const cls = CLASSES[classId];
  const actions = availableActions(classId);
  const fallback: Action = suggested && actionMultiplier(classId, suggested) > 0 ? suggested : cls.specialty;

  const initial = (): Draft => drafts.get(draftKey) ?? (submitted ? { ...submitted, editing: false } : { arrows: [], allocation: {}, editing: true });
  const [draft, setDraft] = useState<Draft>(initial);
  const [sentKey, setSentKey] = useState(0);

  useEffect(() => {
    setDraft(initial());
  }, [draftKey]);

  const update = (next: Draft) => {
    drafts.set(draftKey, next);
    setDraft(next);
  };

  const { arrows, allocation } = draft;
  const full = arrows.length >= arrowsPerVolley;
  const pool = volleyPool(arrows, coef);
  const raw = arrows.reduce((sum, a) => sum + arrowPoints(a), 0);
  const assigned = total(allocation);
  const remaining = pool - assigned;
  const crits = arrows.filter((a) => a.x).length;
  const shownPool = useTween(pool, 700);
  const submission: Submission = { arrows, allocation: cleanAllocation(allocation) };
  const same = sameSubmission(submitted, submission);

  const setArrows = (next: Arrow[]) => {
    const nextPool = volleyPool(next, coef);
    update({ arrows: next, allocation: nextPool > 0 ? { [fallback]: nextPool } : {}, editing: next.length < arrowsPerVolley });
  };

  const addArrow = (arrow: Arrow, origin?: Element) => {
    if (full) return;
    setArrows([...arrows, arrow]);
    if (arrow.x) {
      burstAt(origin, 'sparks', 34);
      flash('rgba(246, 211, 45, 0.4)');
      shake('soft');
    } else if (arrow.score > 0) {
      burstAt(origin, isYellow(arrow.score) ? 'sparks' : 'dust', isYellow(arrow.score) ? 14 : 8, isYellow(arrow.score) ? undefined : RING_COLORS[arrow.score].fill);
    } else {
      burstAt(origin, 'smoke', 6);
    }
    navigator.vibrate?.(arrow.x ? [30, 40, 30, 40, 60] : isYellow(arrow.score) ? [20, 40, 20] : 15);
    play(arrow.x ? 'power' : 'tap');
  };

  const setPoints = (action: Action, value: number) => {
    const next: Allocation = { ...allocation };
    const current = next[action] ?? 0;
    const target = Math.max(0, Math.min(pool, value));
    let need = target - current;
    if (need > 0) {
      need -= Math.min(need, pool - total(next));
      while (need > 0) {
        const donor = actions.filter((a) => a !== action && (next[a] ?? 0) > 0).sort((a, b) => (next[b] ?? 0) - (next[a] ?? 0))[0];
        if (!donor) break;
        const given = Math.min(need, next[donor] ?? 0);
        next[donor] = (next[donor] ?? 0) - given;
        need -= given;
      }
    }
    next[action] = target - Math.max(0, need);
    update({ ...draft, allocation: next });
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
          {Array.from({ length: arrowsPerVolley }, (_, i) => {
            const a = arrows[i];
            return (
              <span
                key={i}
                className={`score-slot${a ? ' filled' : ''}${a?.x ? ' crit' : ''}`}
                style={a ? { background: RING_COLORS[a.score].fill, color: RING_COLORS[a.score].text } : undefined}
              >
                {a ? arrowLabel(a) : i + 1}
              </span>
            );
          })}
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
              {key.x && <small>critique ×2</small>}
              {key.score === 0 && <small>hors cible</small>}
            </button>
          ))}
        </div>
        <div className="input-actions two">
          <button className="secondary big" disabled={arrows.length === 0} onClick={() => setArrows(arrows.slice(0, -1))}>
            ↶ Retirer
          </button>
          <button className="primary big" disabled={!full} onClick={() => update({ ...draft, editing: false })}>
            Répartir →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="volley-input">
      <button className="volley-recap" onClick={() => update({ ...draft, editing: true })}>
        <span className="recap-arrows">
          {arrows.map((a, i) => (
            <span key={i} className={`score-slot filled small${a.x ? ' crit' : ''}`} style={{ background: RING_COLORS[a.score].fill, color: RING_COLORS[a.score].text }}>
              {arrowLabel(a)}
            </span>
          ))}
        </span>
        <span className="recap-edit">✎ scores</span>
      </button>
      {crits > 0 && (
        <div key={crits} className="crit-banner">
          ✦ {crits > 1 ? `${crits} coups critiques` : 'Coup critique'} ! ✦
        </div>
      )}
      <div className="pool">
        <span className="pool-value" key={pool}>
          {shownPool}
        </span>
        <span className="pool-label">
          points à répartir
          {coef !== 1 && raw > 0 && (
            <small>
              {raw} × {String(coef).replace('.', ',')}
            </small>
          )}
        </span>
      </div>
      {pool > 0 && (
        <div className="split-bar" aria-hidden>
          {actions.map((action) =>
            (allocation[action] ?? 0) > 0 ? (
              <span key={action} className={`split-part action-${action}`} style={{ flexGrow: allocation[action] }}>
                {ACTION_ICONS[action]}
              </span>
            ) : null,
          )}
          {remaining > 0 && <span className="split-part rest" style={{ flexGrow: remaining }} />}
        </div>
      )}
      {remaining > 0 && <p className="remaining">Reste à répartir : {remaining}</p>}
      <ul className="split-rows">
        {actions.map((action) => {
          const points = allocation[action] ?? 0;
          const multiplier = actionMultiplier(classId, action);
          const amount = effectAmount(classId, action, points, boost);
          return (
            <li key={action} className={`split-row action-${action}${points > 0 ? ' active' : ''}`}>
              <button className="split-name" onClick={() => setPoints(action, pool)} disabled={pool === 0} title="Tout mettre ici">
                <span className="split-icon">{ACTION_ICONS[action]}</span>
                <span>
                  {ACTION_LABELS[action]}
                  {multiplier > 1 && <small className="specialty">spécialité ×{String(multiplier).replace('.', ',')}</small>}
                </span>
              </button>
              <span className="split-effect">
                {points > 0 ? (action === 'heal' ? `+${amount} PV` : `${amount} dégâts`) : '—'}
              </span>
              <div className="split-control">
                <Stepper
                  onMinus={() => setPoints(action, (allocation[action] ?? 0) - 1)}
                  onPlus={() => setPoints(action, (allocation[action] ?? 0) + 1)}
                  minusDisabled={points === 0}
                  plusDisabled={points >= pool}
                />
                <span className="split-points">{points}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="hint center">Touchez une action pour tout y placer, ou ajustez point par point (maintenir pour aller vite).</p>
      <div className="input-actions single">
        <button className={`primary big${!same && canSubmit ? ' pulse' : ''}`} disabled={!canSubmit || same || remaining !== 0} onClick={submit}>
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
