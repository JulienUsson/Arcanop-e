import { useEffect, useState } from 'react';
import { ACTION_ICONS, ACTION_LABELS, CLASSES } from '../../game/classes';
import { arrowPower, healAmount } from '../../game/engine';
import { isYellow, type TargetHit } from '../../game/target';
import type { Action, Arrow, ClassId, Quadrant } from '../../game/types';
import { play } from '../sfx';
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
const ACTION_ORDER: Action[] = ['nemesis', 'creatures', 'roots', 'heal'];

interface Pending {
  hit: TargetHit;
  x: number;
  y: number;
}

function clean(list: DraftArrow[]): Arrow[] {
  return list.map(({ score, action, quadrant }) => ({ score, action, quadrant }));
}

export function VolleyInput({ draftKey, classId, coef, arrowsPerVolley, submitted, canSubmit, blockedReason, onSubmit }: Props) {
  const [arrows, setArrows] = useState<DraftArrow[]>(() => drafts.get(draftKey) ?? submitted ?? []);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sentKey, setSentKey] = useState(0);
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
    navigator.vibrate?.(isYellow(arrow.score) ? [20, 40, 20] : 15);
    play('tap');
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

  const submit = () => {
    onSubmit(clean(arrows));
    setSentKey(Date.now());
    play('send');
  };

  const markers: Marker[] = arrows.filter((a) => a.x !== undefined && a.y !== undefined).map((a) => ({ x: a.x!, y: a.y! }));
  const same = submitted && JSON.stringify(clean(arrows)) === JSON.stringify(submitted);

  const totals = new Map<Action, number>();
  let points = 0;
  for (const a of arrows) {
    points += a.score;
    if (!a.action) continue;
    const power = arrowPower(a.score, coef);
    totals.set(a.action, (totals.get(a.action) ?? 0) + (a.action === 'heal' ? healAmount(power) : power));
  }
  const yellows = arrows.filter((a) => isYellow(a.score)).length;

  const pendingOptions: { quadrant: Quadrant; action: Action }[] = [];
  pending?.hit.quadrants.forEach((q) => {
    const action = cls.quadrants[q];
    if (!pendingOptions.some((o) => o.action === action)) pendingOptions.push({ quadrant: q, action });
  });

  return (
    <div className="volley-input">
      <div className="quiver" aria-label={`${arrows.length} flèches sur ${arrowsPerVolley}`}>
        {Array.from({ length: arrowsPerVolley }, (_, i) => (
          <span key={i} className={`quiver-arrow${i < arrows.length ? ' used' : ''}${arrows[i] && isYellow(arrows[i].score) ? ' gold' : ''}`}>
            ➶
          </span>
        ))}
        <span className="quiver-count">
          {arrows.length}/{arrowsPerVolley}
        </span>
      </div>

      <div className="target-wrap">
        <TargetFace classId={classId} markers={markers} disabled={full || !!pending} onHit={onHit} />
        {pending && (
          <div className="line-chooser" role="dialog">
            <p>
              Sur le trait — <strong>{pending.hit.score} points</strong>
              <br />
              Quelle action ?
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
        {full && !pending && !same && canSubmit && <div className="target-done">Carquois vide !</div>}
        {sentKey > 0 && same && (
          <div key={sentKey} className="sent-stamp">
            Volée envoyée
          </div>
        )}
      </div>

      <div className="volley-summary">
        <span className="points">
          <strong>{points}</strong> pts
        </span>
        {ACTION_ORDER.filter((a) => totals.has(a)).map((a) => (
          <span key={a} className={`power-chip action-${a}`}>
            {ACTION_ICONS[a]} {a === 'heal' ? '+' : ''}
            {totals.get(a)}
          </span>
        ))}
        {yellows > 0 && <span className="power-chip gold">✦ +{yellows} jauge</span>}
      </div>

      <div className="input-actions">
        <button className="secondary big" disabled={arrows.length === 0} onClick={() => update(arrows.slice(0, -1))} aria-label="Annuler la dernière flèche">
          ↶
        </button>
        <button className="secondary big" disabled={full} onClick={() => add({ score: 0, action: null, quadrant: null })}>
          Hors cible
        </button>
        <button className={`primary big${full && !same && canSubmit ? ' pulse' : ''}`} disabled={!canSubmit || !full || !!same} onClick={submit}>
          {same ? 'Envoyée ✓' : submitted ? 'Corriger' : 'Valider'}
        </button>
      </div>
      {!canSubmit && blockedReason && <p className="hint center">{blockedReason}</p>}
    </div>
  );
}
