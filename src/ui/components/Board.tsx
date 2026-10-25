import { useEffect, useRef, useState } from 'react';
import { burstAt, flash, shake, useTween } from '../fx';
import { Modal } from './Modal';
import { NemesisSheet } from './NemesisSheet';
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
  big: boolean;
}

function useDelta(value: number, max: number): { floaters: Floater[]; pulse: 'up' | 'down' | null; pulseKey: number; delta: number } {
  const previous = useRef(value);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [pulse, setPulse] = useState<{ dir: 'up' | 'down' | null; key: number; delta: number }>({ dir: null, key: 0, delta: 0 });
  useEffect(() => {
    const delta = value - previous.current;
    previous.current = value;
    if (delta === 0) return;
    const id = Date.now() + Math.random();
    setFloaters((f) => [...f, { id, delta, big: Math.abs(delta) >= max * 0.08 }]);
    setPulse({ dir: delta < 0 ? 'down' : 'up', key: id, delta });
    const timer = setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1600);
    return () => clearTimeout(timer);
  }, [value]);
  return { floaters, pulse: pulse.dir, pulseKey: pulse.key, delta: pulse.delta };
}

export function HpBar({ hp, max, tone }: { hp: number; max: number; tone: 'nemesis' | 'tree' | 'creature' | 'root' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
  const { floaters, pulse, pulseKey } = useDelta(hp, max);
  const shown = useTween(hp, 900);
  return (
    <div className={`hp-bar ${tone}${pct <= 25 ? ' low' : ''}`}>
      <div className="hp-ghost" style={{ width: `${pct}%` }} />
      <div className="hp-fill" style={{ width: `${pct}%` }}>
        <span className="hp-shine" />
      </div>
      {pulse && <div key={pulseKey} className={`hp-pulse ${pulse}`} />}
      <span className="hp-text">
        {shown} / {max}
      </span>
      {floaters.map((f) => (
        <span key={f.id} className={`floater ${f.delta < 0 ? 'down' : 'up'}${f.big ? ' big' : ''}`}>
          {f.delta > 0 ? `+${f.delta}` : f.delta}
        </span>
      ))}
    </div>
  );
}

export function Gauge({ value }: { value: number }) {
  const previous = useRef(value);
  const [popped, setPopped] = useState<number | null>(null);
  useEffect(() => {
    if (value > previous.current) setPopped(value - 1);
    previous.current = value;
  }, [value]);
  return (
    <span className={`gauge${value >= GAUGE_MAX ? ' full' : ''}`} aria-label={`Jauge ${value}/${GAUGE_MAX}`}>
      {Array.from({ length: GAUGE_MAX }, (_, i) => (
        <span key={`${i}-${popped === i ? value : 0}`} className={`pip${i < value ? ' on' : ''}${popped === i ? ' pop' : ''}`} />
      ))}
    </span>
  );
}

function Portrait({ kind, hp, max, onClick, children }: { kind: 'nemesis' | 'tree'; hp: number; max: number; onClick?: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { pulse, pulseKey, delta } = useDelta(hp, max);
  useEffect(() => {
    if (!pulseKey || !delta) return;
    const big = Math.abs(delta) >= max * 0.12;
    if (delta > 0) {
      burstAt(ref.current, 'leaves', 14);
      return;
    }
    if (kind === 'nemesis') {
      burstAt(ref.current, 'shards', big ? 30 : 16);
      if (big) shake('soft');
    } else {
      burstAt(ref.current, 'splinters', big ? 26 : 14);
      flash('rgba(226, 52, 58, 0.35)');
      shake(big ? 'hard' : 'soft');
    }
  }, [pulseKey]);
  return (
    <button ref={ref} key={pulseKey} className={`portrait ${kind}${pulse ? ` hit-${pulse}` : ''}`} onClick={onClick} disabled={!onClick} aria-label={kind === 'nemesis' ? 'Fiche de la Némésis' : 'Arbre-Cœur'}>
      <span className="portrait-face">{children}</span>
    </button>
  );
}

function useGhosts<T extends { uid: string }>(items: T[]): (T & { dying?: boolean })[] {
  const previous = useRef(items);
  const [ghosts, setGhosts] = useState<T[]>([]);
  useEffect(() => {
    const gone = previous.current.filter((p) => !items.some((i) => i.uid === p.uid));
    previous.current = items;
    if (gone.length === 0) return;
    setGhosts((g) => [...g, ...gone.map((x) => ({ ...x, hp: 0 }))]);
    const timer = setTimeout(() => setGhosts((g) => g.filter((x) => !gone.some((y) => y.uid === x.uid))), 900);
    return () => clearTimeout(timer);
  }, [items]);
  return [...items, ...ghosts.filter((g) => !items.some((i) => i.uid === g.uid)).map((g) => ({ ...g, dying: true }))];
}

const dyingRef = (el: HTMLElement | null) => {
  if (el) burstAt(el, 'smoke', 14);
};

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
  const [nemesisSheet, setNemesisSheet] = useState(false);
  const creatures = useGhosts(state.creatures);
  const roots = useGhosts(state.roots);
  const treeLow = state.tree.hp <= state.tree.maxHp * 0.3;

  return (
    <div className="board">
      {treeLow && <div className="danger-vignette" aria-hidden />}
      <section className={`arena${treeLow ? ' tree-low' : ''}`}>
        <div className="combatant tree-side">
          <Portrait kind="tree" hp={state.tree.hp} max={state.tree.maxHp}>
            🌳
          </Portrait>
          <div className="combatant-name">Arbre-Cœur</div>
          <HpBar hp={state.tree.hp} max={state.tree.maxHp} tone="tree" />
        </div>
        <div className="versus">VS</div>
        <div className="combatant nemesis-side">
          <Portrait kind="nemesis" hp={state.nemesis.hp} max={state.nemesis.maxHp} onClick={() => setNemesisSheet(true)}>
            {nemesis.portrait}
          </Portrait>
          <button className="combatant-name link-name" onClick={() => setNemesisSheet(true)}>
            {nemesis.name} <small>📜</small>
          </button>
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
        {creatures.length === 0 && <p className="empty">Aucune créature : les flèches « Créatures » frappent la Némésis.</p>}
        <div className="minion-grid">
          {creatures.map((c) => {
            const card = getCard(state.config.nemesisId, c.cardId);
            const focused = state.focus.creature === c.uid && !c.dying;
            return (
              <button
                key={c.uid}
                ref={c.dying ? dyingRef : undefined}
                className={`minion creature${focused ? ' focused' : ''}${c.dying ? ' dying' : ''}`}
                disabled={!onFocus || c.dying}
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
        {roots.length === 0 && <p className="empty">Aucune racine : les flèches « Racines » frappent la Némésis.</p>}
        <div className="minion-grid">
          {roots.map((r) => {
            const card = getCard(state.config.nemesisId, r.cardId);
            const focused = state.focus.root === r.uid && !r.dying;
            return (
              <button
                key={r.uid}
                ref={r.dying ? dyingRef : undefined}
                className={`minion root${focused ? ' focused' : ''}${r.countdown <= 1 && !r.dying ? ' urgent' : ''}${r.dying ? ' dying' : ''}`}
                disabled={!onFocus || r.dying}
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
      {nemesisSheet && (
        <Modal label="Fiche de la Némésis" onClose={() => setNemesisSheet(false)}>
          <NemesisSheet nemesisId={state.config.nemesisId} state={state} />
        </Modal>
      )}
    </div>
  );
}
