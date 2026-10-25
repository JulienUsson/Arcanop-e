import { useState } from 'react';
import { chargeText, CLASSES } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { powerAvailability } from '../../game/engine';
import { getCard } from '../../game/nemesis';
import { burstAt } from '../fx';
import type { GameState } from '../../game/types';
import { Gauge } from './Board';

interface Props {
  state: GameState;
  playerId: string;
  disabled?: boolean;
  onActivate: (targetUid?: string) => void;
}

export function PowerPanel({ state, playerId, disabled, onActivate }: Props) {
  const [choosing, setChoosing] = useState(false);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;
  const cls = CLASSES[player.classId];
  const availability = powerAvailability(state, playerId);
  const ready = player.gauge >= GAUGE_MAX;

  const fire = (targetUid?: string) => {
    burstAt(document.querySelector('.power-panel'), 'sparks', 24, cls.color);
    onActivate(targetUid);
  };

  const activate = () => {
    if (cls.needsRootTarget && state.roots.length > 1) setChoosing(true);
    else fire(state.roots[0]?.uid);
  };

  return (
    <section className={`panel power-panel${ready ? ' ready' : ''}`} style={{ ['--class-color' as string]: cls.color }}>
      <div className="power-head">
        <div>
          <div className="panel-title">
            {cls.emoji} {cls.powerName}
          </div>
          <small>{cls.powerText}</small>
        </div>
        <Gauge value={player.gauge} />
      </div>
      {choosing ? (
        <div className="root-choice">
          <p>Quelle racine retenir ?</p>
          {state.roots.map((r) => (
            <button
              key={r.uid}
              className="secondary"
              onClick={() => {
                setChoosing(false);
                fire(r.uid);
              }}
            >
              {getCard(state.config.nemesisId, r.cardId).name} (⏳ {r.countdown})
            </button>
          ))}
          <button className="ghost" onClick={() => setChoosing(false)}>
            Annuler
          </button>
        </div>
      ) : (
        <button className="power big" disabled={disabled || !availability.ok} onClick={activate}>
          {availability.ok ? 'Activer le pouvoir' : availability.reason}
        </button>
      )}
      {player.hp <= 0 && <p className="hint">🩹 À terre : ce pouvoir n’agira qu’à moitié.</p>}
      <p className="hint">Charge de la jauge : {chargeText(player.level)}.</p>
    </section>
  );
}
