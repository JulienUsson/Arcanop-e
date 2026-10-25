import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DIFFICULTIES, FURY_ARCHERS_BASE, FURY_ARCHERS_STEP, FURY_TREE_BASE, FURY_TREE_STEP } from '../../game/difficulty';
import { arrowSlots, describeCard, nextFury, scaleFactor } from '../../game/engine';
import { getNemesis } from '../../game/nemesis';
const TYPES = [
    { type: 'attack', label: 'Attaques', icon: '🗡️', help: 'Effet immédiat, puis la carte est défaussée.' },
    { type: 'creature', label: 'Créatures', icon: '🐾', help: 'Restent en jeu et agissent à chaque fin de manche.' },
    { type: 'root', label: 'Racines', icon: '🌿', help: 'Comptent à rebours et éclosent en fin de manche si elles survivent.' },
];
const TIERS = ['', 'I', 'II', 'III'];
function cardStatus(card, state) {
    if (!state)
        return null;
    if (state.creatures.some((c) => c.cardId === card.id) || state.roots.some((r) => r.cardId === card.id))
        return 'en jeu';
    if (state.wrathDiscard.includes(card.id))
        return 'jouée';
    return null;
}
export function NemesisSheet({ nemesisId, config, state }) {
    const nemesis = getNemesis(nemesisId);
    const cfg = state?.config ?? config;
    const diff = cfg ? DIFFICULTIES[cfg.difficulty] : null;
    const maxHp = state?.nemesis.maxHp ?? (cfg && diff ? Math.round(diff.nemesisHpPerArrow * arrowSlots(cfg)) : null);
    const deckSize = diff ? diff.tiers.reduce((a, b) => a + b, 0) : null;
    const scale = cfg ? scaleFactor(cfg) : 1;
    return (_jsxs("article", { className: "nemesis-sheet", children: [_jsxs("header", { className: "sheet-head", children: [_jsx("div", { className: "nemesis-portrait", children: nemesis.portrait }), _jsxs("div", { children: [_jsx("h2", { children: nemesis.name }), _jsx("p", { className: "sheet-spirit", children: nemesis.title }), _jsx("span", { className: "sheet-role danger", children: "N\u00E9m\u00E9sis" })] })] }), _jsx("p", { className: "sheet-lore", children: nemesis.lore }), (maxHp || deckSize) && (_jsxs("section", { className: "nemesis-stats", children: [maxHp && (_jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-value", children: state ? `${state.nemesis.hp} / ${maxHp}` : maxHp }), _jsx("span", { className: "stat-label", children: "PV" })] })), deckSize && (_jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-value", children: state ? `${state.wrathDeck.length} / ${deckSize}` : deckSize }), _jsx("span", { className: "stat-label", children: "cartes de col\u00E8re" })] })), diff && (_jsxs("div", { className: "stat", children: [_jsxs("span", { className: "stat-value", children: [diff.volleyCards, "\uD83C\uDFF9 ", diff.nemesisCards, "\uD83D\uDC80"] }), _jsx("span", { className: "stat-label", children: "par manche" })] }))] })), _jsxs("section", { children: [_jsx("h3", { children: "Comment la vaincre" }), _jsx("ul", { className: "sheet-tips", children: nemesis.tips.map((tip) => (_jsx("li", { children: tip }, tip))) }), _jsx("p", { className: "hint", children: "Victoire quand ses PV tombent \u00E0 0. D\u00E9faite si l\u2019Arbre-C\u0153ur tombe." })] }), _jsxs("section", { className: "fury-section", children: [_jsx("h3", { children: "\uD83D\uDD25 Furie finale" }), _jsxs("p", { children: ["Quand son paquet de col\u00E8re est vide, chaque carte N\u00E9m\u00E9sis d\u00E9clenche un D\u00E9cha\u00EEnement : ", FURY_TREE_BASE, " d\u00E9g\u00E2ts \u00E0 l\u2019Arbre-C\u0153ur et ", FURY_ARCHERS_BASE, " \u00E0 chaque Gardien, puis +", FURY_TREE_STEP, " et +", FURY_ARCHERS_STEP, " \u00E0 chaque D\u00E9cha\u00EEnement suivant (avant le multiplicateur de difficult\u00E9)."] }), state && state.wrathDeck.length === 0 && (_jsxs("p", { className: "fury-next", children: ["Prochain D\u00E9cha\u00EEnement : ", nextFury(state).tree, " \u00E0 l\u2019Arbre-C\u0153ur, ", nextFury(state).archers, " \u00E0 chaque Gardien."] }))] }), _jsxs("section", { children: [_jsx("h3", { children: "Paquet de col\u00E8re" }), diff && (_jsxs("p", { className: "hint", children: ["Pioche ", diff.tiers.join(' + '), " cartes des niveaux I, II et III, jou\u00E9es dans cet ordre."] })), TYPES.map(({ type, label, icon, help }) => (_jsxs("div", { className: "wrath-group", children: [_jsxs("h4", { children: [icon, " ", label] }), _jsx("small", { className: "wrath-help", children: help }), _jsx("ul", { className: "wrath-list", children: nemesis.cards
                                    .filter((c) => c.type === type)
                                    .sort((a, b) => a.tier - b.tier)
                                    .map((card) => {
                                    const status = cardStatus(card, state);
                                    return (_jsxs("li", { className: `wrath-item type-${card.type}${status ? ` is-${status === 'en jeu' ? 'live' : 'played'}` : ''}`, children: [_jsx("span", { className: "tier", children: TIERS[card.tier] }), _jsxs("div", { children: [_jsx("strong", { children: card.name }), status && _jsx("span", { className: "wrath-status", children: status }), _jsxs("small", { children: [card.type !== 'attack' && `${Math.max(1, Math.round(card.hp * scale))} PV · `, card.type === 'root' && `⏳ ${card.countdown} · `, describeCard(card, state)] })] })] }, card.id));
                                }) })] }, type)))] })] }));
}
