import { useState } from 'react';
import { councilAdvice, describeSuggestion, suggestion } from '../../game/advice';
import type { GameState } from '../../game/types';

interface Props {
  state: GameState;
  role: 'host' | 'guest';
  playerId?: string | null;
  compact?: boolean;
  children?: React.ReactNode;
}

const STEPS = [
  { id: 'card', icon: '🃏', label: 'Carte' },
  { id: 'council', icon: '🗣️', label: 'Conseil' },
  { id: 'shoot', icon: '🏹', label: 'Tir' },
  { id: 'input', icon: '🎯', label: 'Saisie' },
  { id: 'resolve', icon: '⚔️', label: 'Résolution' },
];

function currentStep(state: GameState): string {
  const phase = state.phase;
  if (phase.kind === 'volley') return phase.step;
  return 'card';
}

function texts(state: GameState, role: 'host' | 'guest', playerId?: string | null): { title: string; text: string } {
  const phase = state.phase;
  const arrows = state.config.arrowsPerVolley;
  if (phase.kind === 'lobby') {
    return role === 'host'
      ? { title: 'Rassemblez les Gardiens', text: 'Connectez les téléphones des archers, puis lancez la partie.' }
      : { title: 'Rassemblement', text: 'L’hôte va bientôt lancer la partie.' };
  }
  if (phase.kind === 'turn') {
    const ending = state.turnDeck.length === 0;
    if (role === 'guest') {
      return ending
        ? { title: 'Fin de manche', text: 'Les créatures vont agir et les racines grandir…' }
        : { title: 'Prochaine carte', text: 'L’hôte révèle la prochaine carte d’ordre de tour.' };
    }
    return ending
      ? { title: 'Fin de la manche', text: 'Les créatures agissent, les racines se rapprochent de l’éclosion, puis un nouvel ordre de tour est mélangé.' }
      : { title: 'Révélez la prochaine carte', text: 'Volée : les archers tirent. Némésis : elle joue une carte de colère.' };
  }
  if (phase.kind === 'volley') {
    const done = Object.keys(phase.submissions).length;
    const total = state.players.length;
    if (phase.step === 'council') {
      return {
        title: 'Conseil de guerre',
        text: role === 'host' ? 'Regardez les menaces ensemble et décidez qui vise quoi. Chaque archer choisira sa cible en assignant ses flèches.' : 'Écoutez l’équipe et décidez de votre cible.',
      };
    }
    if (phase.step === 'shoot') {
      return {
        title: 'Tirez !',
        text: role === 'host' ? `Chaque archer tire ses ${arrows} flèches. Passez à la saisie quand toutes sont plantées.` : `Tirez vos ${arrows} flèches, puis saisissez vos scores.`,
      };
    }
    if (role === 'guest' && playerId && phase.submissions[playerId]) {
      return { title: 'Volée envoyée', text: `En attente des autres Gardiens (${done}/${total}).` };
    }
    return {
      title: 'Saisie des scores',
      text: role === 'host' ? `${done}/${total} archers ont saisi leur volée.` : 'Saisissez le score de chaque flèche (cordon : zone inférieure), puis assignez chaque flèche à une action.',
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
