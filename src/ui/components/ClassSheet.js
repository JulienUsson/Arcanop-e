import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, CLASSES } from '../../game/classes';
import { CERF_ARCHER_HEAL, CERF_HEAL, GAUGE_MAX } from '../../game/difficulty';
import { CRIT_POINTS } from '../../game/target';
const ALL_ACTIONS = ['nemesis', 'creatures', 'roots', 'heal'];
const ACTION_HELP = {
    nemesis: 'Dégâts directs à la Némésis.',
    creatures: 'Abat les créatures, qui agissent à chaque fin de manche. Cible choisie par flèche.',
    roots: 'Détruit les racines avant qu’elles n’éclosent. Cible choisie par flèche.',
    heal: 'Rend la moitié des points des flèches à l’Arbre-Cœur ou à un Gardien.',
};
export function ClassSheet({ classId }) {
    const cls = CLASSES[classId];
    const rows = ALL_ACTIONS.map((action) => ({ action, multiplier: actionMultiplier(classId, action) }));
    return (_jsxs("article", { className: "class-sheet", style: { ['--class-color']: cls.color }, children: [_jsxs("header", { className: "sheet-head", children: [_jsx("div", { className: "sheet-portrait", children: cls.emoji }), _jsxs("div", { children: [_jsx("h2", { children: cls.name }), _jsx("p", { className: "sheet-spirit", children: cls.spirit }), _jsx("span", { className: "sheet-role", children: cls.role })] })] }), _jsx("p", { className: "sheet-lore", children: cls.lore }), _jsxs("section", { children: [_jsx("h3", { children: "Vos actions" }), _jsx("ul", { className: "sheet-actions", children: rows.map(({ action, multiplier }) => (_jsxs("li", { className: `action-${action}${multiplier === 0 ? ' absent' : ''}${multiplier > 1 ? ' specialty' : ''}`, children: [_jsxs("span", { className: "sheet-action-name", children: [ACTION_ICONS[action], " ", ACTION_LABELS[action]] }), _jsx("span", { className: "sheet-action-count", children: multiplier === 0 ? 'absente' : multiplier > 1 ? `spécialité ×${String(multiplier).replace('.', ',')}` : '×1' }), _jsx("small", { children: ACTION_HELP[action] })] }, action))) }), _jsxs("p", { className: "hint", children: ["Apr\u00E8s chaque vol\u00E9e, assignez chacune de vos fl\u00E8ches \u00E0 une action (un X vaut ", CRIT_POINTS, " points). Les fl\u00E8ches assign\u00E9es \u00E0 la sp\u00E9cialit\u00E9 comptent \u00D71,5. Une fl\u00E8che sur le cordon compte pour la zone sup\u00E9rieure au niveau Facile, pour la zone inf\u00E9rieure en Normal et Difficile."] })] }), _jsxs("section", { className: "sheet-power", children: [_jsxs("h3", { children: ["Pouvoir : ", cls.powerName] }), _jsx("p", { children: classId === 'cerf' ? `Soigne l’Arbre-Cœur de ${CERF_HEAL} PV et chaque Gardien de ${CERF_ARCHER_HEAL} PV.` : cls.powerText }), _jsxs("p", { className: "hint", children: ["Se charge avec ", GAUGE_MAX, " fl\u00E8ches dans le jaune (9, 10 ou X), puis s\u2019active quand vous le d\u00E9cidez."] })] }), _jsxs("section", { children: [_jsx("h3", { children: "Conseils" }), _jsx("ul", { className: "sheet-tips", children: cls.tips.map((tip) => (_jsx("li", { children: tip }, tip))) })] })] }));
}
