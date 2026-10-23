import { useEffect, useState } from 'react';
import { ACTION_ICONS, ACTION_LABELS, CLASSES } from '../../game/classes';
import { arrowPower } from '../../game/engine';
import { isYellow, type TargetHit } from '../../game/target';
import type { Action, Arrow, ClassId, Quadrant } from '../../game/types';
import { TargetFace, type Marker } from './TargetFace';

interface DraftArrow extends Arrow {
  x?: number;
  y?: number;
}

interface Props {
  draftKey: string;
  classId: ClassId;
  coef: number;
  arrowsPerVolley: number;
  submitted?: Arrow[];
  canSubmit: boolean;
  blockedReason?: string;
  onSubmit: (arrows: Arrow[]) => void;
}

const drafts = new Map<string, DraftArrow[]>();

interface Pending {
  hit: TargetHit;
  x: number;
  y: number;
}

export function VolleyInput({ draftKey, classId, coef, arrowsPerVolley, submitted, canSubmit, blockedReason, onSubmit }: Props) {
  const [arrows, setArrows] = useState<DraftArrow[]>(() => drafts.get(draftKey) ?? submitted ?? []);
  const [pending, setPending] = useState<Pending | null>(null);
  const cls = CLASSES[classId];

  useEffect(() => {
    setArrows(drafts.get(draftKey) ?? submitted ?? []);
    setPending(null);
  }, [draftKey]);

  const update = (next: DraftArrow[]) => {
    drafts.set(draftKey, next);
    setArrows(next);
  };

  const full = arrows.length >= arrowsPerVolley;

  const add = (arrow: DraftArrow) => {
    if (full) return;
    update([...arrows, arrow]);
    navigator.vibrate?.(15);
  };

  const onHit = (hit: TargetHit, x: number, y: number) => {
    if (full) return;
    const actions = new Set(hit.quadrants.map((q) => cls.quadrants[q]));
    if (actions.size === 1) {
      const quadrant = hit.quadrants[0];
      add({ score: hit.score, quadrant, action: cls.quadrants[quadrant], x, y });
    } else {
      setPending({ hit, x, y });
    }
  };

  const choose = (quadrant: Quadrant) => {
    if (!pending) return;
    add({ score: pending.hit.score, quadrant, action: cls.quadrants[quadrant], x: pending.x, y: pending.y });
    setPending(null);
  };

  const remove = (index: number) => update(arrows.filter((_, i) => i !== index));

  const markers: Marker[] = arrows
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => a.x !== undefined && a.y !== undefined)
    .map(({ a, i }) => ({ x: a.x!, y: a.y!, label: String(i + 1) }));

  const clean = (list: DraftArrow[]): Arrow[] => list.map(({ score, action, quadrant }) => ({ score, action, quadrant }));
  const same = submitted && JSON.stringify(clean(arrows)) === JSON.stringify(submitted);

  const pendingOptions: { quadrant: Quadrant; action: Action }[] = [];
  pending?.hit.quadrants.forEach((q) => {
    const action = cls.quadrants[q];
    if (!pendingOptions.some((o) => o.action === action)) pendingOptions.push({ quadrant: q, action });
  });

  return (
    <div className="volley-input">
      <div className="target-wrap">
        <TargetFace classId={classId} markers={markers} disabled={full || !!pending} onHit={onHit} />
        {pending && (
          <div className="line-chooser" role="dialog">
            <p>
              Flèche sur le trait — <strong>{pending.hit.score}</strong> points. Quelle action ?
            </p>
            <div className="chooser-buttons">
              {pendingOptions.map((o) => (
                <button key={o.quadrant} className={`big action-${o.action}`} onClick={() => choose(o.quadrant)}>
                  {ACTION_ICONS[o.action]} {ACTION_LABELS[o.action]}
                </button>
              ))}
            </div>
            <button className="ghost" onClick={() => setPending(null)}>
              Annuler
            </button>
          </div>
        )}
      </div>
      <div className="arrow-slots">
        {Array.from({ length: arrowsPerVolley }, (_, i) => {
          const a = arrows[i];
          if (!a) return <div key={i} className="arrow-slot empty">{i + 1}</div>;
          const label = a.score === 0 ? 'M' : String(a.score);
          return (
            <button key={i} className={`arrow-slot filled${isYellow(a.score) ? ' yellow' : ''}`} onClick={() => remove(i)} title="Retirer">
              <span className="slot-score">{label}</span>
              <span className="slot-action">
                {a.action ? `${ACTION_ICONS[a.action]} ${arrowPower(a.score, coef)}` : 'raté'}
              </span>
              <span className="slot-remove">✕</span>
            </button>
          );
        })}
      </div>
      <div className="input-actions">
        <button className="secondary big" disabled={full} onClick={() => add({ score: 0, action: null, quadrant: null })}>
          Hors cible
        </button>
        <button
          className="primary big"
          disabled={!canSubmit || arrows.length !== arrowsPerVolley || !!same}
          onClick={() => onSubmit(clean(arrows))}
        >
          {same ? 'Volée envoyée ✓' : submitted ? 'Corriger la volée' : 'Valider la volée'}
        </button>
      </div>
      {!canSubmit && blockedReason && <p className="hint">{blockedReason}</p>}
    </div>
  );
}
