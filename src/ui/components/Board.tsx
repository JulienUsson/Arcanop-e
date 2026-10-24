import { useEffect, useRef, useState } from 'react';
import { CLASSES } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { describeCard } from '../../game/engine';
import { getCard, getNemesis } from '../../game/nemesis';
import type { GameState } from '../../game/types';
import type { RosterEntry } from '../../net/protocol';

interface Props {
  state: GameState;
  roster: RosterEntry[];
  you?: string | null;
  onFocus?: (kind: 'creature' | 'root', uid: string | null) => void;
}

interface Floater {
  id: number;
  delta: number;
}

function useDelta(value: number): { floaters: Floater[]; pulse: 'up' | 'down' | null; pulseKey: number } {
  const previous = useRef(value);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [pulse, setPulse] = useState<{ dir: 'up' | 'down' | null; key: number }>({ dir: null, key: 0 });
  useEffect(() => {
    const delta = value - previous.current;
    previous.current = value;
    if (delta === 0) return;
    const id = Date.now() + Math.random();
    setFloaters((f) => [...f, { id, delta }]);
    setPulse({ dir: delta < 0 ? 'down' : 'up', key: id });
    const timer = setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1400);
    return () => clearTimeout(timer);
  }, [value]);
  return { floaters, pulse: pulse.dir, pulseKey: pulse.key };
}

export function HpBar({ hp, max, tone }: { hp: number; max: number; tone: 'nemesis' | 'tree' | 'creature' | 'root' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
  const { floaters, pulse, pulseKey } = useDelta(hp);
  return (
    <div className={`hp-bar ${tone}${pct <= 25 ? ' low' : ''}`}>
      <div className="hp-ghost" style={{ width: `${pct}%` }} />
      <div className="hp-fill" style={{ width: `${pct}%` }} />
      {pulse && <div key={pulseKey} className={`hp-pulse ${pulse}`} />}
      <span className="hp-text">
        {hp} / {max}
      </span>
      {floaters.map((f) => (
        <span key={f.id} className={`floater ${f.delta < 0 ? 'down' : 'up'}`}>
          {f.delta > 0 ? `+${f.delta}` : f.delta}
        </span>
      ))}
    </div>
  );
}

export function Gauge({ value }: { value: number }) {
  return (
    <span className={`gauge${value >= GAUGE_MAX ? ' full' : ''}`} aria-label={`Jauge ${value}/${GAUGE_MAX}`}>
      {Array.from({ length: GAUGE_MAX }, (_, i) => (
        <span key={i} className={`pip${i < value ? ' on' : ''}`} />
      ))}
    </span>
  );
}

function Portrait({ kind, hp, children }: { kind: 'nemesis' | 'tree'; hp: number; children: React.ReactNode }) {
  const { pulse, pulseKey } = useDelta(hp);
  return (
    <div key={pulseKey} className={`portrait ${kind}${pulse ? ` hit-${pulse}` : ''}`}>
      {children}
    </div>
  );
}

const STATUS_LABEL: Record<RosterEntry['status'], string> = {
  online: 'connecté',
  offline: 'déconnecté',
  free: 'saisie hôte',
  host: 'hôte',
};

export function Board({ state, roster, you, onFocus }: Props) {
  const nemesis = getNemesis(state.config.nemesisId);
  const phase = state.phase;
  const revealedCard = state.revealed && state.wrathDeck[0] ? getCard(state.config.nemesisId, state.wrathDeck[0]) : null;

  return (
    <div className="board">
      <section className="arena">
        <div className="combatant tree-side">
          <Portrait kind="tree" hp={state.tree.hp}>
            🌳
          </Portrait>
          <div className="combatant-name">Arbre-Cœur</div>
          <HpBar hp={state.tree.hp} max={state.tree.maxHp} tone="tree" />
        </div>
        <div className="versus">VS</div>
        <div className="combatant nemesis-side">
          <Portrait kind="nemesis" hp={state.nemesis.hp}>
            🥀
          </Portrait>
          <div className="combatant-name">{nemesis.name}</div>
          <HpBar hp={state.nemesis.hp} max={state.nemesis.maxHp} tone="nemesis" />
        </div>
      </section>

      <section className="panel turn-panel">
        <div className="turn-info">
          <strong>Manche {state.round || '—'}</strong>
          <span className="turn-cards" aria-label="Ordre des tours">
            {state.turnDiscard.map((c, i) => (
              <span key={`d${i}`} className={`turn-card played ${c}`}>
                {c === 'volley' ? '🏹' : '💀'}
              </span>
            ))}
            {state.turnDeck.map((_, i) => (
              <span key={`r${i}`} className="turn-card hidden" />
            ))}
          </span>
        </div>
        <div className="wrath-info" title="Cartes de colère restantes">
          <span className="wrath-stack">📜</span> {state.wrathDeck.length}
        </div>
        {state.wolfBoost > 0 && <div className="badge power">🐺 La Meute chasse : dégâts ×2 à la prochaine volée</div>}
        {revealedCard && (
          <div className="revealed">
            🦉 Prochaine carte : <strong>{revealedCard.name}</strong> — {describeCard(revealedCard, state)}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          🐾 Créatures <small>{onFocus ? 'touchez pour cibler 🎯' : ''}</small>
        </div>
        {state.creatures.length === 0 && <p className="empty">Aucune créature : les flèches « Créatures » frappent la Némésis.</p>}
        <div className="minion-grid">
          {state.creatures.map((c) => {
            const card = getCard(state.config.nemesisId, c.cardId);
            const focused = state.focus.creature === c.uid;
            return (
              <button
                key={c.uid}
                className={`minion creature${focused ? ' focused' : ''}`}
                disabled={!onFocus}
                onClick={() => onFocus?.('creature', focused ? null : c.uid)}
              >
                {focused && <span className="focus-mark">🎯</span>}
                <div className="minion-head">{card.name}</div>
                <HpBar hp={c.hp} max={c.maxHp} tone="creature" />
                <small>{describeCard(card, state)}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          🌿 Racines <small>{onFocus ? 'touchez pour cibler 🎯' : ''}</small>
        </div>
        {state.roots.length === 0 && <p className="empty">Aucune racine : les flèches « Racines » frappent la Némésis.</p>}
        <div className="minion-grid">
          {state.roots.map((r) => {
            const card = getCard(state.config.nemesisId, r.cardId);
            const focused = state.focus.root === r.uid;
            return (
              <button
                key={r.uid}
                className={`minion root${focused ? ' focused' : ''}${r.countdown <= 1 ? ' urgent' : ''}`}
                disabled={!onFocus}
                onClick={() => onFocus?.('root', focused ? null : r.uid)}
              >
                {focused && <span className="focus-mark">🎯</span>}
                <span className="countdown" title="Manches avant éclosion">
                  ⏳{r.countdown}
                </span>
                <div className="minion-head">{card.name}</div>
                <HpBar hp={r.hp} max={r.maxHp} tone="root" />
                <small>{describeCard(card, state)}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">🏹 Gardiens</div>
        <ul className="roster">
          {state.players.map((p) => {
            const entry = roster.find((r) => r.playerId === p.id);
            const submitted = phase.kind === 'volley' && !!phase.submissions[p.id];
            return (
              <li key={p.id} className={p.id === you ? 'you' : ''}>
                <span className="who">
                  <span className="avatar" style={{ ['--class-color' as string]: CLASSES[p.classId].color }}>
                    {CLASSES[p.classId].emoji}
                  </span>
                  {p.name}
                  {entry && entry.status !== 'free' && <span className={`status ${entry.status}`}>{STATUS_LABEL[entry.status]}</span>}
                </span>
                <span className="right">
                  {phase.kind === 'volley' && <span className={`submitted${submitted ? ' yes' : ''}`}>{submitted ? '✓' : '…'}</span>}
                  <Gauge value={p.gauge} />
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
