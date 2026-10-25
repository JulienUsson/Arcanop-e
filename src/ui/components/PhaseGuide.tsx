import { useState } from 'react';
import { councilAdvice, describeSuggestion, suggestion } from '../../game/advice';
import { ARCHER_LEVELS } from '../../game/classes';
import { getNemesis } from '../../game/nemesis';
import type { GameState } from '../../game/types';

interface Props {
  state: GameState;
  role: 'host' | 'guest';
  playerId?: string | null;
  compact?: boolean;
  children?: React.ReactNode;
}

const STEPS = [
  { id: 'council', icon: '🏹', label: 'Conseil & tir' },
  { id: 'input', icon: '🎯', label: 'Saisie' },
  { id: 'resolve', icon: '⚔️', label: 'Résolution' },
  { id: 'nemesis', icon: '💀', label: 'Riposte' },
];

function currentStep(state: GameState): string {
  const phase = state.phase;
  if (phase.kind === 'volley') return phase.step;
  if (phase.kind === 'nemesis') return 'nemesis';
  return 'council';
}

function texts(state: GameState, role: 'host' | 'guest', playerId?: string | null): { title: string; text: string } {
  const phase = state.phase;
  const arrows = state.config.arrowsPerVolley;
  if (phase.kind === 'lobby') {
    return role === 'host'
      ? { title: 'Rassemblez les Gardiens', text: 'Connectez les téléphones des archers, puis lancez la partie.' }
      : { title: 'Rassemblement', text: 'L’hôte va bientôt lancer la partie.' };
  }
  if (phase.kind === 'nemesis') {
    const name = getNemesis(state.config.nemesisId).name;
    const count = phase.total > 1 ? ` (${phase.drawn + 1}/${phase.total})` : '';
    const card = state.wrathDeck.length > 0 ? 'une carte de colère' : 'un Déchaînement de sa Furie';
    return role === 'guest'
      ? { title: `Riposte de ${name}${count}`, text: `L’hôte révèle ${card}. Ses créatures agissent et ses racines grandissent.` }
      : {
          title: `Riposte de ${name}${count}`,
          text: `Révélez ${card} : elle prend effet, puis les créatures agissent et les racines grandissent. La volée suivante commence ensuite.`,
        };
  }
  if (phase.kind === 'volley') {
    const me = state.players.find((p) => p.id === playerId);
    const done = Object.keys(phase.submissions).length;
    const total = state.players.length;
    if (phase.step === 'council') {
      return {
        title: 'Conseil & tir',
        text:
          role === 'host'
            ? `Regardez les menaces ensemble, décidez qui vise quoi, puis chacun tire ses ${arrows} flèches. Passez à la saisie quand toutes sont plantées.`
            : `Décidez de votre cible avec l’équipe, puis tirez vos ${arrows} flèches.`,
      };
    }
    if (role === 'guest' && playerId && phase.submissions[playerId]) {
      return { title: 'Volée envoyée', text: `En attente des autres Gardiens (${done}/${total}).` };
    }
    return {
      title: 'Saisie des scores',
      text:
        role === 'host'
          ? `${done}/${total} archers ont saisi leur volée.`
          : `Saisissez le score de chaque flèche (cordon : zone ${me && ARCHER_LEVELS[me.level]?.favorableCordon ? 'supérieure' : 'inférieure'}), puis assignez chaque flèche à une action.`,
    };
  }
  return { title: phase.result === 'victory' ? 'Victoire !' : 'Défaite…', text: phase.reason };
}

export function PhaseGuide({ state, role, playerId, compact, children }: Props) {
  const [showAll, setShowAll] = useState(false);
  const step = currentStep(state);
  const index = STEPS.findIndex((s) => s.id === step);
  const { title, text } = texts(state, role, playerId);
  const council = state.phase.kind === 'volley' && state.phase.step === 'council';
  const advice = council ? councilAdvice(state) : [];
  const visible = showAll ? advice : advice.slice(0, 3);
  const mine = playerId && state.phase.kind === 'volley' && state.phase.step !== 'input' ? suggestion(state, playerId) : null;

  if (compact) {
    return (
      <section className={`phase-guide compact step-${step}`} key={`${state.phase.kind}-${step}`}>
        <div className="compact-row">
          <span className="step-icon current">{STEPS[index]?.icon ?? '🃏'}</span>
          <div>
            <h2 className="guide-title">{title}</h2>
            <p className="guide-text">{mine ? `Suggestion : ${describeSuggestion(mine)}` : text}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`phase-guide step-${step}`} key={`${state.phase.kind}-${step}`}>
      {state.phase.kind !== 'lobby' && (
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < index ? 'done' : i === index ? 'current' : ''}>
              <span className="step-icon">{s.icon}</span>
              <span className="step-label">{s.label}</span>
            </li>
          ))}
        </ol>
      )}
      <h2 className="guide-title">{title}</h2>
      <p className="guide-text">{text}</p>
      {mine && (
        <p className="guide-suggestion">
          <span>Suggestion</span> {describeSuggestion(mine)} — {mine.reason}
        </p>
      )}
      {advice.length > 0 && (
        <ul className="advice">
          {visible.map((a, i) => (
            <li key={i} className={a.urgent ? 'urgent' : ''}>
              <span className="advice-icon">{a.icon}</span>
              {a.text}
            </li>
          ))}
          {advice.length > 3 && (
            <li>
              <button className="link" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Moins' : `+${advice.length - 3} autres`}
              </button>
            </li>
          )}
        </ul>
      )}
      {children && <div className="guide-actions">{children}</div>}
    </section>
  );
}
