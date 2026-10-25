import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { councilAdvice, describeSuggestion, suggestion } from '../../game/advice';
import { ARCHER_LEVELS } from '../../game/classes';
const STEPS = [
    { id: 'card', icon: '🃏', label: 'Carte' },
    { id: 'council', icon: '🏹', label: 'Conseil & tir' },
    { id: 'input', icon: '🎯', label: 'Saisie' },
    { id: 'resolve', icon: '⚔️', label: 'Résolution' },
];
function currentStep(state) {
    const phase = state.phase;
    if (phase.kind === 'volley')
        return phase.step;
    return 'card';
}
function texts(state, role, playerId) {
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
        const me = state.players.find((p) => p.id === playerId);
        const done = Object.keys(phase.submissions).length;
        const total = state.players.length;
        if (phase.step === 'council') {
            return {
                title: 'Conseil & tir',
                text: role === 'host'
                    ? `Regardez les menaces ensemble, décidez qui vise quoi, puis chacun tire ses ${arrows} flèches. Passez à la saisie quand toutes sont plantées.`
                    : `Décidez de votre cible avec l’équipe, puis tirez vos ${arrows} flèches.`,
            };
        }
        if (role === 'guest' && playerId && phase.submissions[playerId]) {
            return { title: 'Volée envoyée', text: `En attente des autres Gardiens (${done}/${total}).` };
        }
        return {
            title: 'Saisie des scores',
            text: role === 'host'
                ? `${done}/${total} archers ont saisi leur volée.`
                : `Saisissez le score de chaque flèche (cordon : zone ${me && ARCHER_LEVELS[me.level]?.favorableCordon ? 'supérieure' : 'inférieure'}), puis assignez chaque flèche à une action.`,
        };
    }
    return { title: phase.result === 'victory' ? 'Victoire !' : 'Défaite…', text: phase.reason };
}
export function PhaseGuide({ state, role, playerId, compact, children }) {
    const [showAll, setShowAll] = useState(false);
    const step = currentStep(state);
    const index = STEPS.findIndex((s) => s.id === step);
    const { title, text } = texts(state, role, playerId);
    const council = state.phase.kind === 'volley' && state.phase.step === 'council';
    const advice = council ? councilAdvice(state) : [];
    const visible = showAll ? advice : advice.slice(0, 3);
    const mine = playerId && state.phase.kind === 'volley' && state.phase.step !== 'input' ? suggestion(state, playerId) : null;
    if (compact) {
        return (_jsx("section", { className: `phase-guide compact step-${step}`, children: _jsxs("div", { className: "compact-row", children: [_jsx("span", { className: "step-icon current", children: STEPS[index]?.icon ?? '🃏' }), _jsxs("div", { children: [_jsx("h2", { className: "guide-title", children: title }), _jsx("p", { className: "guide-text", children: mine ? `Suggestion : ${describeSuggestion(mine)}` : text })] })] }) }, `${state.phase.kind}-${step}`));
    }
    return (_jsxs("section", { className: `phase-guide step-${step}`, children: [state.phase.kind !== 'lobby' && (_jsx("ol", { className: "stepper", children: STEPS.map((s, i) => (_jsxs("li", { className: i < index ? 'done' : i === index ? 'current' : '', children: [_jsx("span", { className: "step-icon", children: s.icon }), _jsx("span", { className: "step-label", children: s.label })] }, s.id))) })), _jsx("h2", { className: "guide-title", children: title }), _jsx("p", { className: "guide-text", children: text }), mine && (_jsxs("p", { className: "guide-suggestion", children: [_jsx("span", { children: "Suggestion" }), " ", describeSuggestion(mine), " \u2014 ", mine.reason] })), advice.length > 0 && (_jsxs("ul", { className: "advice", children: [visible.map((a, i) => (_jsxs("li", { className: a.urgent ? 'urgent' : '', children: [_jsx("span", { className: "advice-icon", children: a.icon }), a.text] }, i))), advice.length > 3 && (_jsx("li", { children: _jsx("button", { className: "link", onClick: () => setShowAll(!showAll), children: showAll ? 'Moins' : `+${advice.length - 3} autres` }) }))] })), children && _jsx("div", { className: "guide-actions", children: children })] }, `${state.phase.kind}-${step}`));
}
