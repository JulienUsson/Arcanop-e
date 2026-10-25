import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { CLASSES } from '../../game/classes';
import { getNemesis } from '../../game/nemesis';
function average(p) {
    const shots = p.stats.arrows;
    return shots ? (p.stats.totalScore / shots).toFixed(1) : '—';
}
function damage(p) {
    return p.stats.damageNemesis + p.stats.damageCreatures + p.stats.damageRoots;
}
function best(items, score) {
    const sorted = [...items].sort((a, b) => score(b) - score(a));
    return sorted[0] && score(sorted[0]) > 0 ? sorted[0] : null;
}
export function EndSummary({ state, actions }) {
    useEffect(() => window.scrollTo(0, 0), []);
    if (state.phase.kind !== 'over')
        return null;
    const nemesis = getNemesis(state.config.nemesisId);
    const victory = state.phase.result === 'victory';
    const players = state.players;
    const awards = [
        { label: 'Plus gros dégâts', player: best(players, damage), value: (p) => `${damage(p)} dégâts` },
        { label: 'Meilleure moyenne', player: best(players, (p) => (p.stats.arrows ? p.stats.totalScore / p.stats.arrows : 0)), value: (p) => `${average(p)} pts` },
        { label: 'Gardien de l’Arbre', player: best(players, (p) => p.stats.healing), value: (p) => `${p.stats.healing} PV soignés` },
        { label: 'Rempart vivant', player: best(players, (p) => p.stats.damageTaken), value: (p) => `${p.stats.damageTaken} dégâts encaissés` },
        { label: 'Œil d’or', player: best(players, (p) => p.stats.yellows), value: (p) => `${p.stats.yellows} flèches jaunes` },
    ];
    return (_jsxs("div", { className: `end-summary ${victory ? 'victory' : 'defeat'}`, children: [_jsx("h1", { children: victory ? 'Victoire !' : 'Défaite…' }), _jsx("p", { className: "reason", children: state.phase.reason }), _jsx("p", { className: "story", children: victory ? nemesis.victory : nemesis.defeat }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "Bilan de la partie" }), _jsxs("ul", { className: "facts", children: [_jsxs("li", { children: [state.round, " manche", state.round > 1 ? 's' : '', ", ", state.volleyCount, " vol\u00E9e", state.volleyCount > 1 ? 's' : ''] }), _jsxs("li", { children: [nemesis.name, " : ", state.nemesis.hp, " / ", state.nemesis.maxHp, " PV"] }), _jsxs("li", { children: ["Arbre-C\u0153ur : ", state.tree.hp, " / ", state.tree.maxHp, " PV"] }), _jsxs("li", { children: ["Cartes de col\u00E8re restantes : ", state.wrathDeck.length] })] })] }), _jsx("section", { className: "panel awards", children: awards.map((a) => a.player && (_jsxs("div", { className: "award", children: [_jsx("small", { children: a.label }), _jsxs("strong", { children: [CLASSES[a.player.classId].emoji, " ", a.player.name] }), _jsx("span", { children: a.value(a.player) })] }, a.label))) }), _jsxs("section", { className: "panel stats", children: [_jsx("div", { className: "panel-title", children: "Statistiques par archer" }), _jsx("div", { className: "table-scroll", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Archer" }), _jsx("th", { children: "Fl\u00E8ches" }), _jsx("th", { children: "Points" }), _jsx("th", { children: "Moy." }), _jsx("th", { children: "Jaunes" }), _jsx("th", { children: "10" }), _jsx("th", { children: "Rat\u00E9s" }), _jsx("th", { children: "N\u00E9m\u00E9sis" }), _jsx("th", { children: "Cr\u00E9at." }), _jsx("th", { children: "Racines" }), _jsx("th", { children: "Soin" }), _jsx("th", { children: "Pouvoirs" }), _jsx("th", { children: "PV" }), _jsx("th", { children: "Encaiss\u00E9s" }), _jsx("th", { children: "\u00C0 terre" }), _jsx("th", { children: "Meill. vol\u00E9e" })] }) }), _jsx("tbody", { children: players.map((p) => (_jsxs("tr", { children: [_jsxs("th", { children: [CLASSES[p.classId].emoji, " ", p.name] }), _jsx("td", { children: p.stats.arrows }), _jsx("td", { children: p.stats.totalScore }), _jsx("td", { children: average(p) }), _jsx("td", { children: p.stats.yellows }), _jsx("td", { children: p.stats.tens }), _jsx("td", { children: p.stats.misses }), _jsx("td", { children: p.stats.damageNemesis }), _jsx("td", { children: p.stats.damageCreatures }), _jsx("td", { children: p.stats.damageRoots }), _jsx("td", { children: p.stats.healing }), _jsx("td", { children: p.stats.powersUsed }), _jsxs("td", { children: [p.hp, "/", p.maxHp] }), _jsx("td", { children: p.stats.damageTaken }), _jsx("td", { children: p.stats.knockouts }), _jsx("td", { children: p.stats.bestVolley })] }, p.id))) })] }) })] }), _jsx("div", { className: "footer-actions", children: actions })] }));
}
