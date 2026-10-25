import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ClassSheet } from '../components/ClassSheet';
import { Modal } from '../components/Modal';
import { NemesisSheet } from '../components/NemesisSheet';
import { ARCHER_LEVEL_IDS, ARCHER_LEVELS, CLASS_IDS, CLASSES, levelFromCoef } from '../../game/classes';
import { DIFFICULTIES } from '../../game/difficulty';
import { MORDELUNE, NEMESES } from '../../game/nemesis';
const SETUP_KEY = 'arcanopee.setup';
const MAX_PLAYERS = 8;
function newPlayer(index, classId) {
    return { id: newId(), name: `Archer ${index + 1}`, classId, level: 'normal', coef: ARCHER_LEVELS.normal.coef };
}
function newId() {
    return Math.random().toString(36).slice(2, 8);
}
function defaultConfig() {
    return {
        nemesisId: MORDELUNE.id,
        difficulty: 'normal',
        arrowsPerVolley: 3,
        players: CLASS_IDS.map((classId, i) => newPlayer(i, classId)),
    };
}
function loadConfig() {
    try {
        const raw = localStorage.getItem(SETUP_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.players?.length) {
                const players = parsed.players.map((p) => {
                    const level = ARCHER_LEVELS[p.level] ? p.level : levelFromCoef(p.coef);
                    return { ...p, level, coef: ARCHER_LEVELS[level].coef };
                });
                return { ...defaultConfig(), ...parsed, players };
            }
        }
    }
    catch { }
    return defaultConfig();
}
export function Setup({ onCreate, onBack }) {
    const [config, setConfig] = useState(loadConfig);
    const [sheet, setSheet] = useState(null);
    const [nemesisSheet, setNemesisSheet] = useState(false);
    const updatePlayer = (id, patch) => setConfig((c) => ({ ...c, players: c.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    const addPlayer = () => setConfig((c) => {
        const used = new Set(c.players.map((p) => p.classId));
        const classId = CLASS_IDS.find((id) => !used.has(id)) ?? CLASS_IDS[c.players.length % 4];
        return { ...c, players: [...c.players, newPlayer(c.players.length, classId)] };
    });
    const removePlayer = (id) => setConfig((c) => ({ ...c, players: c.players.filter((p) => p.id !== id) }));
    const valid = config.players.length > 0 && config.players.every((p) => p.name.trim());
    const create = () => {
        const clean = {
            ...config,
            players: config.players.map((p) => ({ ...p, name: p.name.trim().slice(0, 24), coef: ARCHER_LEVELS[p.level].coef })),
        };
        localStorage.setItem(SETUP_KEY, JSON.stringify(clean));
        onCreate(clean);
    };
    return (_jsxs("div", { className: "screen setup", children: [_jsx("h1", { children: "Mise en place" }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\uD83C\uDFF9 Gardiens" }), config.players.map((p) => {
                        return (_jsxs("div", { className: "player-row", children: [_jsxs("div", { className: "row", children: [_jsx("input", { className: "name", value: p.name, maxLength: 24, onChange: (e) => updatePlayer(p.id, { name: e.target.value }), "aria-label": "Nom" }), _jsx("button", { className: "ghost", onClick: () => removePlayer(p.id), "aria-label": "Retirer", disabled: config.players.length <= 1, children: "\u2715" })] }), _jsx("div", { className: "class-picker", children: CLASS_IDS.map((id) => (_jsxs("button", { className: `class-chip${p.classId === id ? ' selected' : ''}`, style: { ['--class-color']: CLASSES[id].color }, onClick: () => (p.classId === id ? setSheet(id) : updatePlayer(p.id, { classId: id })), children: [_jsx("span", { children: CLASSES[id].emoji }), CLASSES[id].name] }, id))) }), _jsxs("button", { className: "link small-link", onClick: () => setSheet(p.classId), children: ["\uD83D\uDCDC Fiche du ", CLASSES[p.classId].name, " : ", CLASSES[p.classId].role.toLowerCase(), ", pouvoir \u00AB ", CLASSES[p.classId].powerName, " \u00BB"] }), _jsx("div", { className: "level-picker", role: "radiogroup", "aria-label": "Niveau", children: ARCHER_LEVEL_IDS.map((id) => {
                                        const level = ARCHER_LEVELS[id];
                                        return (_jsxs("button", { role: "radio", "aria-checked": p.level === id, className: `level-chip level-${id}${p.level === id ? ' selected' : ''}`, onClick: () => updatePlayer(p.id, { level: id, coef: level.coef }), children: [_jsx("strong", { children: level.label }), _jsxs("small", { children: ["\u00D7", String(level.coef).replace('.', ','), " \u00B7 cordon ", level.favorableCordon ? 'favorable' : 'défavorable'] })] }, id));
                                    }) })] }, p.id));
                    }), _jsx("button", { className: "secondary", onClick: addPlayer, disabled: config.players.length >= MAX_PLAYERS, children: "+ Ajouter un archer" })] }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\uD83D\uDC80 N\u00E9m\u00E9sis" }), Object.values(NEMESES).map((n) => (_jsxs("label", { className: `choice${config.nemesisId === n.id ? ' selected' : ''}`, children: [_jsx("input", { type: "radio", name: "nemesis", checked: config.nemesisId === n.id, onChange: () => setConfig({ ...config, nemesisId: n.id }) }), _jsxs("strong", { children: [n.portrait, " ", n.name, ", ", n.title] })] }, n.id))), _jsx("button", { className: "link small-link", onClick: () => setNemesisSheet(true), children: "\uD83D\uDCDC Fiche de la N\u00E9m\u00E9sis : histoire, PV, paquet de col\u00E8re" })] }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\u2696\uFE0F Difficult\u00E9" }), Object.values(DIFFICULTIES).map((d) => (_jsxs("label", { className: `choice${config.difficulty === d.id ? ' selected' : ''}`, children: [_jsx("input", { type: "radio", name: "difficulty", checked: config.difficulty === d.id, onChange: () => setConfig({ ...config, difficulty: d.id }) }), _jsx("strong", { children: d.label }), _jsx("small", { children: d.description })] }, d.id)))] }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\uD83C\uDFAF Fl\u00E8ches par vol\u00E9e" }), _jsx("div", { className: "segmented", children: [3, 4, 5, 6].map((n) => (_jsx("button", { className: config.arrowsPerVolley === n ? 'selected' : '', onClick: () => setConfig({ ...config, arrowsPerVolley: n }), children: n }, n))) })] }), sheet && (_jsx(Modal, { label: "Fiche de classe", onClose: () => setSheet(null), children: _jsx(ClassSheet, { classId: sheet }) })), nemesisSheet && (_jsx(Modal, { label: "Fiche de la N\u00E9m\u00E9sis", onClose: () => setNemesisSheet(false), children: _jsx(NemesisSheet, { nemesisId: config.nemesisId, config: config }) })), _jsxs("div", { className: "footer-actions", children: [_jsx("button", { className: "ghost", onClick: onBack, children: "Retour" }), _jsx("button", { className: "primary big", disabled: !valid, onClick: create, children: "Cr\u00E9er la partie" })] })] }));
}
