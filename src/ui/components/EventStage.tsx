import { useEffect, useRef, useState } from 'react';
import { ACTION_ICONS, CLASSES } from '../../game/classes';
import { describeCard, nextFury } from '../../game/engine';
import { getCard, getNemesis } from '../../game/nemesis';
import { arrowLabel, RING_COLORS } from '../../game/target';
import type { CorruptionCard, GameEvent, GameState, VolleyResult } from '../../game/types';
import { burst, burstAt, flash, punch, shake, useTween } from '../fx';
import { play, type Sound } from '../sfx';

const STEP_MS = 420;

const CONTINUE_LABEL: Record<GameEvent['kind'], string> = {
  intro: 'Que la chasse commence !',
  nemesis: 'Continuer',
  fury: 'Tenir bon !',
  resolve: 'Continuer',
  power: 'Continuer',
  victory: 'Voir le bilan',
  defeat: 'Voir le bilan',
};

const OPENING_SOUND: Partial<Record<GameEvent['kind'], Sound>> = {
  intro: 'nemesis',
  nemesis: 'nemesis',
  fury: 'defeat',
  power: 'power',
  victory: 'victory',
  defeat: 'defeat',
};

function resultSound(result: VolleyResult): Sound {
  if (result.effects.some((e) => e.killed)) return 'kill';
  if (result.arrows.some((a) => a.x)) return 'power';
  if (result.pool === 0) return 'miss';
  return result.effects.every((e) => e.action === 'heal') ? 'heal' : 'hit';
}

interface Rating {
  label: string;
  tier: number;
}

export function volleyRating(results: VolleyResult[]): Rating | null {
  const arrows = results.flatMap((r) => r.arrows);
  if (arrows.length === 0) return null;
  const mean = arrows.reduce((sum, a) => sum + a.score, 0) / arrows.length;
  if (arrows.every((a) => a.score === 10)) return { label: 'Volée parfaite !', tier: 4 };
  if (mean >= 8.5) return { label: 'Volée héroïque !', tier: 3 };
  if (mean >= 7.5) return { label: 'Belle volée !', tier: 2 };
  if (mean >= 6) return { label: 'Volée honnête', tier: 1 };
  return { label: 'La forêt retient son souffle…', tier: 0 };
}

function steps(event: GameEvent): number {
  if (event.results?.length) return event.results.length;
  return 0;
}

export function useStage(state: GameState | null) {
  const event = state?.lastEvent ?? null;
  const ackId = useRef<number | null>(null);
  const committed = useRef<GameState | null>(null);
  const [, rerender] = useState(0);
  if (ackId.current === null || (committed.current === null && state)) ackId.current = event?.id ?? 0;
  const pending = !!event && event.id !== ackId.current;
  if (!pending) committed.current = state;
  const close = () => {
    ackId.current = event?.id ?? 0;
    rerender((n) => n + 1);
  };
  return { event: pending ? event : null, boardState: pending && committed.current ? committed.current : state, close };
}

const OPENING_FX: Partial<Record<GameEvent['kind'], () => void>> = {
  intro: () => {
    flash('rgba(155, 63, 191, 0.55)');
    setTimeout(() => burst('petals', innerWidth / 2, innerHeight * 0.32, 18), 300);
  },
  fury: () => {
    flash('rgba(200, 30, 40, 0.6)');
    shake('hard');
    [0, 400, 900].forEach((t) => setTimeout(() => burst('embers', innerWidth / 2, innerHeight * 0.3, 30), t));
    setTimeout(() => burst('shards', innerWidth / 2, innerHeight * 0.3, 24, '#e2343a'), 200);
  },
  nemesis: () => {
    flash('rgba(120, 30, 160, 0.5)');
    shake('soft');
    setTimeout(() => burst('shards', innerWidth / 2, innerHeight * 0.4, 28), 650);
  },
  victory: () => {
    flash('rgba(246, 211, 45, 0.55)');
    [0, 500, 1100, 1800].forEach((t, i) =>
      setTimeout(() => burst('confetti', innerWidth * (0.2 + 0.3 * (i % 3)), innerHeight * 0.3, 26), t),
    );
  },
  defeat: () => {
    flash('rgba(120, 0, 20, 0.6)');
    shake('hard');
    [0, 700, 1500].forEach((t) => setTimeout(() => burst('petals', innerWidth / 2, innerHeight * 0.15, 22), t));
  },
};

export function EventStage({ state, event, onClose }: { state: GameState; event: GameEvent | null; onClose: () => void }) {
  const [revealed, setRevealed] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const eventId = event?.id;

  useEffect(() => {
    if (!event) return;
    setRevealed(0);
    const sound = OPENING_SOUND[event.kind];
    if (sound) play(sound);
    OPENING_FX[event.kind]?.();
    if (event.kind === 'power') {
      const player = state.players.find((p) => p.id === event.playerId);
      flash(`${player ? CLASSES[player.classId].color : '#b48cf2'}88`);
      setTimeout(() => burst('sparks', innerWidth / 2, innerHeight * 0.3, 34, player ? CLASSES[player.classId].color : undefined), 250);
    }
    navigator.vibrate?.(event.tone === 'bad' ? [60, 40, 60] : 30);
  }, [eventId]);

  const total = event ? steps(event) : 0;

  useEffect(() => {
    if (!event || revealed >= total) return;
    const timer = setTimeout(() => {
      const result = event.results?.[revealed];
      if (result) {
        play(resultSound(result));
        if (result.pool > 0) play('combo', revealed * 2);
      }
      setRevealed((r) => r + 1);
    }, revealed === 0 ? 700 : STEP_MS);
    return () => clearTimeout(timer);
  }, [eventId, revealed, total]);

  useEffect(() => {
    if (!event?.results || revealed === 0) return;
    const result = event.results[revealed - 1];
    const el = listRef.current?.querySelector('.hit-list li:last-child');
    if (!result || !el) return;
    if (result.arrows.some((a) => a.x)) {
      burstAt(el, 'sparks', 30);
      flash('rgba(246, 211, 45, 0.35)');
      shake('soft');
      punch(listRef.current, 1.07);
    } else {
      punch(el, 1.04);
    }
    if (result.effects.some((e) => e.killed)) burstAt(el, 'smoke', 14);
    if (result.effects.some((e) => e.action === 'heal')) burstAt(el, 'leaves', 12);
    if (result.effects.some((e) => e.action !== 'heal')) burstAt(el, 'shards', 10);
  }, [revealed]);

  useEffect(() => {
    if (!event?.results?.length || revealed < total || event.kind !== 'resolve') return;
    const rating = volleyRating(event.results);
    if (!rating) return;
    const timer = setTimeout(() => {
      play(rating.tier >= 3 ? 'power' : 'stamp');
      const stamp = listRef.current?.querySelector('.volley-rating');
      if (rating.tier >= 3) burstAt(stamp, 'sparks', 26);
      if (rating.tier === 4) [0, 300, 650].forEach((t) => setTimeout(() => burst('confetti', innerWidth / 2, innerHeight * 0.35, 24), t));
      if (rating.tier >= 2) shake('soft');
    }, 250);
    return () => clearTimeout(timer);
  }, [eventId, revealed >= total]);

  if (!event) return null;

  const done = revealed >= total;
  const close = () => {
    if (!done) setRevealed(total);
    else onClose();
  };

  return (
    <div className={`stage stage-${event.kind} tone-${event.tone}`} onClick={close} role="dialog" aria-live="polite">
      <div className="stage-glow" />
      <div className="stage-rays" />
      {event.results && revealed > 0 && revealed <= event.results.length && (
        <ArrowVolley key={revealed} result={event.results[revealed - 1]} seed={revealed} />
      )}
      <div className="stage-body" ref={listRef} onClick={(e) => e.stopPropagation()}>
        <StageContent event={event} state={state} revealed={revealed} />
        <button className={`primary big stage-continue${done ? '' : ' skipping'}`} onClick={close}>
          {done ? CONTINUE_LABEL[event.kind] : 'Passer ▸▸'}
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
          <div className="stage-portrait nemesis rise">{nemesis.portrait}</div>
          <h1 className="stage-title">{event.title}</h1>
          <p className="stage-story">{event.narration}</p>
          <p className="stage-sub">
            {state.nemesis.maxHp} PV · {state.wrathDeck.length} cartes de colère
          </p>
        </>
      );
    case 'nemesis':
      return <NemesisCard event={event} state={state} />;
    case 'fury': {
      const next = nextFury(state);
      return (
        <>
          <div className="stage-portrait nemesis fury rise">{nemesis.portrait}</div>
          <div className="fury-badge">🔥 Furie {event.fury}</div>
          <h1 className="stage-title fury-title">{event.title}</h1>
          <p className="stage-story">{event.narration}</p>
          <ul className="stage-lines">
            {event.lines
              .filter((l) => !l.includes('Furie finale'))
              .map((line, i) => (
                <li key={i} className="pop delayed">
                  {line}
                </li>
              ))}
          </ul>
          <p className="stage-sub">
            Prochain Déchaînement : {next.tree} à l’Arbre-Cœur, {next.archers} à chaque Gardien.
          </p>
        </>
      );
    }
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
    case 'resolve':
      return (
        <>
          <h1 className="stage-title">{event.title}</h1>
          {event.boosted && <div className="stage-boost">🐺 La Meute chasse : dégâts multipliés</div>}
          <ResultList event={event} state={state} revealed={revealed} />
          {revealed >= (event.results?.length ?? 0) && <RatingStamp results={event.results ?? []} />}
          {revealed >= (event.results?.length ?? 0) && <p className="stage-story pop">{event.narration}</p>}
        </>
      );
    case 'victory':
    case 'defeat':
      return (
        <>
          {event.results && event.results.length > 0 && <ResultList event={event} state={state} revealed={revealed} />}
          {event.cardId && !event.results?.length && <NemesisCard event={{ ...event, lines: [] }} state={state} />}
          {revealed >= (event.results?.length ?? 0) && (
            <div className="pop">
              <div className={`stage-portrait ${event.kind === 'victory' ? 'tree burst' : 'nemesis rise'}`}>
                {event.kind === 'victory' ? '🌳' : nemesis.portrait}
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
      <p className="stage-sub">
        {nemesis.name} joue une carte de colère{event.title.match(/ \(\d\/\d\)$/)?.[0] ?? ''}
      </p>
      <FlipCard back={nemesis.portrait} className={`wrath-card type-${card.type} tier-${card.tier}`}>
        <div className="card-ribbon">
          {type.icon} {type.label}
        </div>
        <div className="card-name">{card.name}</div>
        <div className="card-flavor">{card.flavor}</div>
        <div className="card-effect">{describeCard(card, state)}</div>
        {card.type !== 'attack' && (
          <div className="card-stats">
            {card.type === 'root' && <span>⏳ {card.countdown} tours</span>}
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

function RatingStamp({ results }: { results: VolleyResult[] }) {
  const rating = volleyRating(results);
  if (!rating) return null;
  return <div className={`volley-rating tier-${rating.tier}`}>{rating.label}</div>;
}

function ArrowVolley({ result, seed }: { result: VolleyResult; seed: number }) {
  return (
    <span className="arrow-volley" aria-hidden>
      {result.arrows
        .filter((a) => a.score > 0)
        .map((a, i) => (
          <span
            key={i}
            className={`arrow-streak${a.x ? ' crit' : ''}`}
            style={{ left: `${18 + ((seed * 37 + i * 23) % 64)}%`, animationDelay: `${i * 70}ms` }}
          />
        ))}
    </span>
  );
}

function ComboMeter({ damage, heal, max }: { damage: number; heal: number; max: number }) {
  const shown = useTween(damage, 380);
  const ratio = max > 0 ? damage / max : 0;
  const tier = ratio >= 0.11 ? 3 : ratio >= 0.08 ? 2 : ratio >= 0.05 ? 1 : 0;
  return (
    <div className={`combo-meter tier-${tier}`}>
      <span key={damage} className="combo-value">
        {shown}
      </span>
      <span className="combo-label">dégâts{heal > 0 ? ` · 💚 +${heal} PV` : ''}</span>
    </div>
  );
}

function ResultList({ event, state, revealed }: { event: GameEvent; state: GameState; revealed: number }) {
  const shown = (event.results ?? []).slice(0, revealed);
  const effects = shown.flatMap((r) => r.effects);
  const damage = effects.filter((e) => e.action !== 'heal').reduce((sum, e) => sum + e.amount, 0);
  const heal = effects.filter((e) => e.action === 'heal').reduce((sum, e) => sum + e.amount, 0);
  return (
    <>
      <ComboMeter damage={damage} heal={heal} max={state.nemesis.maxHp} />
      <ul className="hit-list">
        {shown.map((result) => {
          const player = state.players.find((p) => p.id === result.playerId);
          const cls = player ? CLASSES[player.classId] : null;
          const crit = result.arrows.some((a) => a.x);
          return (
            <li key={result.playerId} className={`result pop${crit ? ' crit' : ''}`}>
              <div className="result-head">
                <span className="hit-who">
                  {cls?.emoji} {player?.name}
                </span>
                <span className="result-arrows">
                  {result.arrows.map((a, i) => (
                    <span key={i} className="result-arrow">
                      <span className={`score-slot filled small${a.x ? ' crit' : ''}`} style={{ background: RING_COLORS[a.score].fill, color: RING_COLORS[a.score].text }}>
                        {arrowLabel(a)}
                      </span>
                      <span className="result-arrow-action">{a.action ? ACTION_ICONS[a.action] : '✗'}</span>
                    </span>
                  ))}
                </span>
                <span className="result-pool">{result.pool} pts</span>
              </div>
              {crit && <div className="result-crit">✦ Coup critique ! ✦</div>}
              <div className="result-effects">
                {result.effects.length === 0 && <small>Aucun effet</small>}
                {result.effects.map((e, i) => (
                  <span key={i} className={`power-chip action-${e.action}`}>
                    {ACTION_ICONS[e.action]} {e.action === 'heal' ? `+${e.amount}` : `−${e.amount}`}
                    <small> {e.target}</small>
                  </span>
                ))}
              </div>
              {result.effects
                .filter((e) => e.killed)
                .map((e, i) => (
                  <div key={i} className="hit-kill">
                    ☠ {e.killed} abattu !
                  </div>
                ))}
            </li>
          );
        })}
      </ul>
    </>
  );
}
