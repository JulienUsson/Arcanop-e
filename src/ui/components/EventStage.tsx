import { useEffect, useRef, useState } from 'react';
import { ACTION_ICONS, CLASSES } from '../../game/classes';
import { describeCard } from '../../game/engine';
import { getCard, getNemesis } from '../../game/nemesis';
import type { CorruptionCard, GameEvent, GameState, Hit } from '../../game/types';
import { play, type Sound } from '../sfx';

const STEP_MS = 420;

const CONTINUE_LABEL: Record<GameEvent['kind'], string> = {
  intro: 'Que la chasse commence !',
  volley: 'Au conseil !',
  nemesis: 'Continuer',
  resolve: 'Continuer',
  round: 'Nouvelle manche',
  power: 'Continuer',
  victory: 'Voir le bilan',
  defeat: 'Voir le bilan',
};

const OPENING_SOUND: Partial<Record<GameEvent['kind'], Sound>> = {
  intro: 'nemesis',
  volley: 'card',
  nemesis: 'nemesis',
  round: 'card',
  power: 'power',
  victory: 'victory',
  defeat: 'defeat',
};

function hitSound(hit: Hit): Sound {
  if (hit.killed) return 'kill';
  if (!hit.action) return 'miss';
  return hit.action === 'heal' ? 'heal' : 'hit';
}

function steps(event: GameEvent): number {
  if (event.hits?.length) return event.hits.length;
  if (event.kind === 'round') return event.lines.length;
  return 0;
}

export function EventStage({ state, event }: { state: GameState; event: GameEvent | null }) {
  const [shown, setShown] = useState<GameEvent | null>(null);
  const [revealed, setRevealed] = useState(0);
  const lastId = useRef<number | null>(null);

  useEffect(() => {
    if (lastId.current === null) {
      lastId.current = event?.id ?? 0;
      return;
    }
    if (!event || event.id === lastId.current) return;
    lastId.current = event.id;
    setShown(event);
    setRevealed(0);
    const sound = OPENING_SOUND[event.kind];
    if (sound) play(sound);
    navigator.vibrate?.(event.tone === 'bad' ? [60, 40, 60] : 30);
  }, [event]);

  const total = shown ? steps(shown) : 0;

  useEffect(() => {
    if (!shown || revealed >= total) return;
    const timer = setTimeout(() => {
      const hit = shown.hits?.[revealed];
      if (hit) play(hitSound(hit));
      setRevealed((r) => r + 1);
    }, revealed === 0 ? 700 : STEP_MS);
    return () => clearTimeout(timer);
  }, [shown, revealed, total]);

  if (!shown) return null;

  const done = revealed >= total;
  const close = () => {
    if (!done) setRevealed(total);
    else setShown(null);
  };

  return (
    <div className={`stage stage-${shown.kind} tone-${shown.tone}`} onClick={close} role="dialog" aria-live="polite">
      <div className="stage-glow" />
      <div className="stage-body" onClick={(e) => e.stopPropagation()}>
        <StageContent event={shown} state={state} revealed={revealed} />
        <button className={`primary big stage-continue${done ? '' : ' skipping'}`} onClick={close}>
          {done ? CONTINUE_LABEL[shown.kind] : 'Passer ▸▸'}
        </button>
      </div>
    </div>
  );
}

function StageContent({ event, state, revealed }: { event: GameEvent; state: GameState; revealed: number }) {
  const nemesis = getNemesis(state.config.nemesisId);
  switch (event.kind) {
    case 'intro':
      return (
        <>
          <div className="stage-portrait nemesis rise">🥀</div>
          <h1 className="stage-title">{event.title}</h1>
          <p className="stage-story">{event.narration}</p>
          <p className="stage-sub">
            {state.nemesis.maxHp} PV · {state.wrathDeck.length} cartes de colère
          </p>
        </>
      );
    case 'volley':
      return (
        <>
          <FlipCard back="🃏" className="volley-card">
            <div className="card-icon">🏹</div>
            <div className="card-name">{event.title}</div>
          </FlipCard>
          <p className="stage-story">{event.narration}</p>
          <ol className="stage-steps">
            <li>🗣️ Conseil</li>
            <li>🏹 Tir</li>
            <li>🎯 Saisie</li>
          </ol>
        </>
      );
    case 'nemesis':
      return <NemesisCard event={event} state={state} />;
    case 'power': {
      const player = state.players.find((p) => p.id === event.playerId);
      const cls = player ? CLASSES[player.classId] : null;
      return (
        <>
          <div className="stage-portrait power burst" style={{ ['--class-color' as string]: cls?.color }}>
            {cls?.emoji ?? '✨'}
          </div>
          <h1 className="stage-title">{cls?.powerName ?? event.title}</h1>
          {player && <p className="stage-sub">{player.name} invoque son esprit</p>}
          <p className="stage-story">{event.narration}</p>
          <p className="stage-effect">{event.lines[0]}</p>
        </>
      );
    }
    case 'round':
      return (
        <>
          <div className="stage-portrait moon">🌒</div>
          <h1 className="stage-title">{event.title}</h1>
          <p className="stage-story">{event.narration}</p>
          <ul className="stage-lines">
            {event.lines.slice(0, revealed).map((line, i) => (
              <li key={i} className="pop">
                {line}
              </li>
            ))}
          </ul>
        </>
      );
    case 'resolve':
      return (
        <>
          <h1 className="stage-title">{event.title}</h1>
          {event.boosted && <div className="stage-boost">🐺 La Meute chasse : dégâts ×2</div>}
          <HitList event={event} state={state} revealed={revealed} />
          {revealed >= (event.hits?.length ?? 0) && <p className="stage-story pop">{event.narration}</p>}
        </>
      );
    case 'victory':
    case 'defeat':
      return (
        <>
          {event.hits && event.hits.length > 0 && <HitList event={event} state={state} revealed={revealed} />}
          {event.cardId && !event.hits?.length && <NemesisCard event={{ ...event, lines: [] }} state={state} />}
          {revealed >= (event.hits?.length ?? 0) && (
            <div className="pop">
              <div className={`stage-portrait ${event.kind === 'victory' ? 'tree burst' : 'nemesis rise'}`}>
                {event.kind === 'victory' ? '🌳' : '🥀'}
              </div>
              <h1 className={`stage-title huge ${event.kind}`}>{event.title}</h1>
              <p className="stage-story">{event.kind === 'victory' ? nemesis.victory : nemesis.defeat}</p>
            </div>
          )}
        </>
      );
  }
}

function FlipCard({ back, className, children }: { back: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flip-card ${className ?? ''}`}>
      <div className="flip-inner">
        <div className="flip-face flip-back">{back}</div>
        <div className="flip-face flip-front">{children}</div>
      </div>
    </div>
  );
}

const CARD_TYPES: Record<CorruptionCard['type'], { label: string; icon: string }> = {
  attack: { label: 'Attaque', icon: '🗡️' },
  creature: { label: 'Créature', icon: '🐾' },
  root: { label: 'Racine', icon: '🌿' },
};

function NemesisCard({ event, state }: { event: GameEvent; state: GameState }) {
  const nemesis = getNemesis(state.config.nemesisId);
  let card: CorruptionCard | null = null;
  try {
    card = event.cardId ? getCard(state.config.nemesisId, event.cardId) : null;
  } catch {
    card = null;
  }
  if (!card) {
    return (
      <>
        <h1 className="stage-title">{event.title}</h1>
        <p className="stage-story">{event.narration}</p>
      </>
    );
  }
  const type = CARD_TYPES[card.type];
  return (
    <>
      <p className="stage-sub">{nemesis.name} joue une carte de colère</p>
      <FlipCard back="🥀" className={`wrath-card type-${card.type} tier-${card.tier}`}>
        <div className="card-ribbon">
          {type.icon} {type.label}
        </div>
        <div className="card-name">{card.name}</div>
        <div className="card-flavor">{card.flavor}</div>
        <div className="card-effect">{describeCard(card, state)}</div>
        {card.type !== 'attack' && (
          <div className="card-stats">
            {card.type === 'root' && <span>⏳ {card.countdown} manches</span>}
          </div>
        )}
      </FlipCard>
      <ul className="stage-lines">
        {event.lines.slice(1).map((line, i) => (
          <li key={i} className="pop delayed">
            {line}
          </li>
        ))}
      </ul>
    </>
  );
}

function HitList({ event, state, revealed }: { event: GameEvent; state: GameState; revealed: number }) {
  const hits = event.hits ?? [];
  const shownHits = hits.slice(0, revealed);
  const damage = shownHits.filter((h) => h.action && h.action !== 'heal').reduce((sum, h) => sum + h.amount, 0);
  const heal = shownHits.filter((h) => h.action === 'heal').reduce((sum, h) => sum + h.amount, 0);
  return (
    <>
      <ul className="hit-list">
        {shownHits.map((hit, i) => {
          const player = state.players.find((p) => p.id === hit.playerId);
          const cls = player ? CLASSES[player.classId] : null;
          return (
            <li key={i} className={`hit pop ${hit.action ? `action-${hit.action}` : 'miss'}${hit.score >= 9 ? ' gold' : ''}`}>
              <span className="hit-who">
                {cls?.emoji} {player?.name}
              </span>
              <span className="hit-score">{hit.score || '✗'}</span>
              <span className="hit-effect">
                {hit.action ? (
                  <>
                    {ACTION_ICONS[hit.action]} {hit.action === 'heal' ? `+${hit.amount}` : `−${hit.amount}`}
                    <small>{hit.target}</small>
                  </>
                ) : (
                  <small>hors cible</small>
                )}
              </span>
              {hit.killed && <span className="hit-kill">☠ {hit.killed} abattu !</span>}
            </li>
          );
        })}
      </ul>
      <div className="hit-totals">
        <span>⚔️ {damage} dégâts</span>
        {heal > 0 && <span>💚 +{heal} PV</span>}
      </div>
    </>
  );
}
