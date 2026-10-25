import { DIFFICULTIES, FURY_ARCHERS_BASE, FURY_ARCHERS_STEP, FURY_TREE_BASE, FURY_TREE_STEP } from '../../game/difficulty';
import { arrowSlots, describeCard, nextFury, scaleFactor, teamHpFactor } from '../../game/engine';
import { getNemesis } from '../../game/nemesis';
import type { CorruptionCard, GameConfig, GameState } from '../../game/types';

interface Props {
  nemesisId: string;
  config?: GameConfig;
  state?: GameState;
}

const TYPES: { type: CorruptionCard['type']; label: string; icon: string; help: string }[] = [
  { type: 'attack', label: 'Attaques', icon: '🗡️', help: 'Effet immédiat, puis la carte est défaussée.' },
  { type: 'creature', label: 'Créatures', icon: '🐾', help: 'Restent en jeu et agissent à chaque fin de manche.' },
  { type: 'root', label: 'Racines', icon: '🌿', help: 'Comptent à rebours et éclosent en fin de manche si elles survivent.' },
];

const TIERS = ['', 'I', 'II', 'III'];

function cardStatus(card: CorruptionCard, state?: GameState): string | null {
  if (!state) return null;
  if (state.creatures.some((c) => c.cardId === card.id) || state.roots.some((r) => r.cardId === card.id)) return 'en jeu';
  if (state.wrathDiscard.includes(card.id)) return 'jouée';
  return null;
}

export function NemesisSheet({ nemesisId, config, state }: Props) {
  const nemesis = getNemesis(nemesisId);
  const cfg = state?.config ?? config;
  const diff = cfg ? DIFFICULTIES[cfg.difficulty] : null;
  const maxHp = state?.nemesis.maxHp ?? (cfg && diff ? Math.floor(diff.nemesisHpPerArrow * arrowSlots(cfg) * teamHpFactor(cfg)) : null);
  const deckSize = diff ? diff.tiers.reduce((a, b) => a + b, 0) : null;
  const scale = cfg ? scaleFactor(cfg) : 1;

  return (
    <article className="nemesis-sheet">
      <header className="sheet-head">
        <div className="nemesis-portrait">{nemesis.portrait}</div>
        <div>
          <h2>{nemesis.name}</h2>
          <p className="sheet-spirit">{nemesis.title}</p>
          <span className="sheet-role danger">Némésis</span>
        </div>
      </header>
      <p className="sheet-lore">{nemesis.lore}</p>

      {(maxHp || deckSize) && (
        <section className="nemesis-stats">
          {maxHp && (
            <div className="stat">
              <span className="stat-value">{state ? `${state.nemesis.hp} / ${maxHp}` : maxHp}</span>
              <span className="stat-label">PV</span>
            </div>
          )}
          {deckSize && (
            <div className="stat">
              <span className="stat-value">{state ? `${state.wrathDeck.length} / ${deckSize}` : deckSize}</span>
              <span className="stat-label">cartes de colère</span>
            </div>
          )}
          {diff && (
            <div className="stat">
              <span className="stat-value">
                {diff.volleyCards}🏹 {diff.nemesisCards}💀
              </span>
              <span className="stat-label">par manche</span>
            </div>
          )}
        </section>
      )}

      <section>
        <h3>Comment la vaincre</h3>
        <ul className="sheet-tips">
          {nemesis.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p className="hint">Victoire quand ses PV tombent à 0. Défaite si l’Arbre-Cœur tombe.</p>
      </section>

      <section className="fury-section">
        <h3>🔥 Furie finale</h3>
        <p>
          Quand son paquet de colère est vide, chaque carte Némésis déclenche un Déchaînement : {FURY_TREE_BASE} dégâts à l’Arbre-Cœur
          et {FURY_ARCHERS_BASE} à chaque Gardien, puis +{FURY_TREE_STEP} et +{FURY_ARCHERS_STEP} à chaque Déchaînement suivant (avant le
          multiplicateur de difficulté).
        </p>
        {state && state.wrathDeck.length === 0 && (
          <p className="fury-next">
            Prochain Déchaînement : {nextFury(state).tree} à l’Arbre-Cœur, {nextFury(state).archers} à chaque Gardien.
          </p>
        )}
      </section>

      <section>
        <h3>Paquet de colère</h3>
        {diff && (
          <p className="hint">
            Pioche {diff.tiers.join(' + ')} cartes des niveaux I, II et III, jouées dans cet ordre.
          </p>
        )}
        {TYPES.map(({ type, label, icon, help }) => (
          <div key={type} className="wrath-group">
            <h4>
              {icon} {label}
            </h4>
            <small className="wrath-help">{help}</small>
            <ul className="wrath-list">
              {nemesis.cards
                .filter((c) => c.type === type)
                .sort((a, b) => a.tier - b.tier)
                .map((card) => {
                  const status = cardStatus(card, state);
                  return (
                    <li key={card.id} className={`wrath-item type-${card.type}${status ? ` is-${status === 'en jeu' ? 'live' : 'played'}` : ''}`}>
                      <span className="tier">{TIERS[card.tier]}</span>
                      <div>
                        <strong>{card.name}</strong>
                        {status && <span className="wrath-status">{status}</span>}
                        <small>
                          {card.type !== 'attack' && `${Math.max(1, Math.round(card.hp * scale))} PV · `}
                          {card.type === 'root' && `⏳ ${card.countdown} · `}
                          {describeCard(card, state)}
                        </small>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}
