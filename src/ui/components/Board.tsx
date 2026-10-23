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

export function HpBar({ hp, max, tone }: { hp: number; max: number; tone: 'nemesis' | 'tree' | 'creature' | 'root' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
  return (
    <div className={`hp-bar ${tone}`}>
      <div className="hp-fill" style={{ width: `${pct}%` }} />
      <span className="hp-text">
        {hp} / {max}
      </span>
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
              <span key={`r${i}`} className="turn-card hidden">
                ?
              </span>
            ))}
          </span>
        </div>
        <div className="wrath-info">
          Colère : <strong>{state.wrathDeck.length}</strong> carte{state.wrathDeck.length > 1 ? 's' : ''}
        </div>
      </section>

      <section className="panel foe">
        <div className="panel-title">
          💀 {nemesis.name}, <em>{nemesis.title}</em>
        </div>
        <HpBar hp={state.nemesis.hp} max={state.nemesis.maxHp} tone="nemesis" />
        {state.wolfBoost > 0 && <div className="badge power">🐺 La Meute chasse : dégâts ×2 à la prochaine volée</div>}
        {revealedCard && (
          <div className="revealed">
            🦉 Prochaine carte : <strong>{revealedCard.name}</strong> — {describeCard(revealedCard, state)}
          </div>
        )}
      </section>

      <section className="panel tree">
        <div className="panel-title">🌳 Arbre-Cœur</div>
        <HpBar hp={state.tree.hp} max={state.tree.maxHp} tone="tree" />
      </section>

      <section className="panel">
        <div className="panel-title">🐾 Créatures</div>
        {state.creatures.length === 0 && <p className="empty">Aucune créature. Les flèches « Créatures » frappent la Némésis.</p>}
        {state.creatures.map((c) => {
          const card = getCard(state.config.nemesisId, c.cardId);
          const focused = state.focus.creature === c.uid;
          return (
            <button
              key={c.uid}
              className={`minion${focused ? ' focused' : ''}`}
              disabled={!onFocus}
              onClick={() => onFocus?.('creature', focused ? null : c.uid)}
            >
              <div className="minion-head">
                <span>
                  {focused && '🎯 '}
                  {card.name}
                </span>
              </div>
              <HpBar hp={c.hp} max={c.maxHp} tone="creature" />
              <small>{describeCard(card, state)}</small>
            </button>
          );
        })}
      </section>

      <section className="panel">
        <div className="panel-title">🌿 Racines</div>
        {state.roots.length === 0 && <p className="empty">Aucune racine. Les flèches « Racines » frappent la Némésis.</p>}
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
              <div className="minion-head">
                <span>
                  {focused && '🎯 '}
                  {card.name}
                </span>
                <span className="countdown" title="Manches avant éclosion">
                  ⏳ {r.countdown}
                </span>
              </div>
              <HpBar hp={r.hp} max={r.maxHp} tone="root" />
              <small>{describeCard(card, state)}</small>
            </button>
          );
        })}
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
                  {CLASSES[p.classId].emoji} {p.name}
                  {entry && <span className={`status ${entry.status}`}>{STATUS_LABEL[entry.status]}</span>}
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
