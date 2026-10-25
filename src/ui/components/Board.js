import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { burstAt, flash, shake, useTween } from '../fx';
import { Modal } from './Modal';
import { NemesisSheet } from './NemesisSheet';
import { TreeSheet } from './TreeSheet';
import { CLASSES } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { describeCard } from '../../game/engine';
import { getCard, getNemesis } from '../../game/nemesis';
function useDelta(value, max) {
    const previous = useRef(value);
    const [floaters, setFloaters] = useState([]);
    const [pulse, setPulse] = useState({ dir: null, key: 0, delta: 0 });
    useEffect(() => {
        const delta = value - previous.current;
        previous.current = value;
        if (delta === 0)
            return;
        const id = Date.now() + Math.random();
        setFloaters((f) => [...f, { id, delta, big: Math.abs(delta) >= max * 0.08 }]);
        setPulse({ dir: delta < 0 ? 'down' : 'up', key: id, delta });
        const timer = setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1600);
        return () => clearTimeout(timer);
    }, [value]);
    return { floaters, pulse: pulse.dir, pulseKey: pulse.key, delta: pulse.delta };
}
export function HpBar({ hp, max, tone }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
    const { floaters, pulse, pulseKey } = useDelta(hp, max);
    const shown = useTween(hp, 450);
    return (_jsxs("div", { className: `hp-bar ${tone}${pct <= 25 ? ' low' : ''}`, children: [_jsxs("div", { className: "hp-track", children: [_jsx("div", { className: "hp-ghost", style: { width: `${pct}%` } }), _jsx("div", { className: "hp-fill", style: { width: `${pct}%` } })] }), pulse && _jsx("div", { className: `hp-pulse ${pulse}` }, pulseKey), _jsxs("span", { className: "hp-text", children: [shown, " / ", max] }), floaters.map((f) => (_jsx("span", { className: `floater ${f.delta < 0 ? 'down' : 'up'}${f.big ? ' big' : ''}`, children: f.delta > 0 ? `+${f.delta}` : f.delta }, f.id)))] }));
}
export function Gauge({ value }) {
    const previous = useRef(value);
    const [popped, setPopped] = useState(null);
    useEffect(() => {
        if (value > previous.current)
            setPopped(value - 1);
        previous.current = value;
    }, [value]);
    return (_jsx("span", { className: `gauge${value >= GAUGE_MAX ? ' full' : ''}`, "aria-label": `Jauge ${value}/${GAUGE_MAX}`, children: Array.from({ length: GAUGE_MAX }, (_, i) => (_jsx("span", { className: `pip${i < value ? ' on' : ''}${popped === i ? ' pop' : ''}` }, `${i}-${popped === i ? value : 0}`))) }));
}
function Portrait({ kind, hp, max, onClick, children }) {
    const ref = useRef(null);
    const { pulse, pulseKey, delta } = useDelta(hp, max);
    useEffect(() => {
        if (!pulseKey || !delta)
            return;
        const big = Math.abs(delta) >= max * 0.12;
        if (delta > 0) {
            burstAt(ref.current, 'leaves', 14);
            return;
        }
        if (kind === 'nemesis') {
            burstAt(ref.current, 'shards', big ? 30 : 16);
            if (big)
                shake('soft');
        }
        else {
            burstAt(ref.current, 'splinters', big ? 26 : 14);
            flash('rgba(226, 52, 58, 0.35)');
            shake(big ? 'hard' : 'soft');
        }
    }, [pulseKey]);
    return (_jsx("button", { ref: ref, className: `portrait ${kind}`, onClick: onClick, disabled: !onClick, "aria-label": kind === 'nemesis' ? 'Fiche de la Némésis' : 'Fiche de l’Arbre-Cœur', children: _jsx("span", { className: "portrait-orb", children: _jsx("span", { className: `portrait-hit${pulse ? ` hit-${pulse}` : ''}`, children: _jsx("span", { className: "portrait-face", children: children }) }, pulseKey) }) }));
}
function useGhosts(items) {
    const previous = useRef(items);
    const [ghosts, setGhosts] = useState([]);
    useEffect(() => {
        const gone = previous.current.filter((p) => !items.some((i) => i.uid === p.uid));
        previous.current = items;
        if (gone.length === 0)
            return;
        setGhosts((g) => [...g, ...gone.map((x) => ({ ...x, hp: 0 }))]);
        const timer = setTimeout(() => setGhosts((g) => g.filter((x) => !gone.some((y) => y.uid === x.uid))), 900);
        return () => clearTimeout(timer);
    }, [items]);
    return [...items, ...ghosts.filter((g) => !items.some((i) => i.uid === g.uid)).map((g) => ({ ...g, dying: true }))];
}
const dyingRef = (el) => {
    if (el)
        burstAt(el, 'smoke', 14);
};
const STATUS_LABEL = {
    online: 'connecté',
    offline: 'déconnecté',
    free: 'saisie hôte',
    host: 'hôte',
};
export function Board({ state, roster, you }) {
    const nemesis = getNemesis(state.config.nemesisId);
    const phase = state.phase;
    const revealedCard = state.revealed && state.wrathDeck[0] ? getCard(state.config.nemesisId, state.wrathDeck[0]) : null;
    const [nemesisSheet, setNemesisSheet] = useState(false);
    const [treeSheet, setTreeSheet] = useState(false);
    const creatures = useGhosts(state.creatures);
    const roots = useGhosts(state.roots);
    const treeLow = state.tree.hp <= state.tree.maxHp * 0.3;
    return (_jsxs("div", { className: "board", children: [treeLow && _jsx("div", { className: "danger-vignette", "aria-hidden": true }), _jsxs("section", { className: `arena${treeLow ? ' tree-low' : ''}${state.wrathDeck.length === 0 && state.round > 0 ? ' fury' : ''}`, children: [_jsxs("div", { className: "combatant tree-side", children: [_jsx(Portrait, { kind: "tree", hp: state.tree.hp, max: state.tree.maxHp, onClick: () => setTreeSheet(true), children: "\uD83C\uDF33" }), _jsxs("button", { className: "combatant-name link-name", onClick: () => setTreeSheet(true), children: ["Arbre-C\u0153ur ", _jsx("small", { children: "\uD83D\uDCDC" })] }), _jsx(HpBar, { hp: state.tree.hp, max: state.tree.maxHp, tone: "tree" })] }), _jsx("div", { className: "versus", children: "VS" }), _jsxs("div", { className: "combatant nemesis-side", children: [_jsx(Portrait, { kind: "nemesis", hp: state.nemesis.hp, max: state.nemesis.maxHp, onClick: () => setNemesisSheet(true), children: nemesis.portrait }), _jsxs("button", { className: "combatant-name link-name", onClick: () => setNemesisSheet(true), children: [nemesis.name, " ", _jsx("small", { children: "\uD83D\uDCDC" })] }), _jsx(HpBar, { hp: state.nemesis.hp, max: state.nemesis.maxHp, tone: "nemesis" })] })] }), _jsxs("section", { className: "panel turn-panel", children: [_jsxs("div", { className: "turn-info", children: [_jsxs("strong", { children: ["Manche ", state.round || '—'] }), _jsxs("span", { className: "turn-cards", "aria-label": "Ordre des tours", children: [state.turnDiscard.map((c, i) => (_jsx("span", { className: `turn-card played ${c}`, children: c === 'volley' ? '🏹' : '💀' }, `d${i}`))), state.turnDeck.map((_, i) => (_jsx("span", { className: "turn-card hidden" }, `r${i}`)))] })] }), state.wrathDeck.length > 0 ? (_jsxs("div", { className: "wrath-info", title: "Cartes de col\u00E8re restantes", children: [_jsx("span", { className: "wrath-stack", children: "\uD83D\uDCDC" }), " ", state.wrathDeck.length] })) : (_jsxs("div", { className: "wrath-info fury", title: "Paquet de col\u00E8re vide : Furie finale", children: ["\uD83D\uDD25 ", state.fury > 0 ? `Furie ${state.fury}` : 'Furie imminente'] })), state.wolfBoost > 0 && (_jsxs("div", { className: "badge power", children: ["\uD83D\uDC3A La Meute chasse : d\u00E9g\u00E2ts \u00D7", String(state.wolfBoost).replace('.', ','), " \u00E0 la prochaine vol\u00E9e"] })), revealedCard && (_jsxs("div", { className: "revealed", children: ["\uD83E\uDD89 Prochaine carte : ", _jsx("strong", { children: revealedCard.name }), " \u2014 ", describeCard(revealedCard, state)] }))] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-title", children: ["\uD83D\uDC3E Cr\u00E9atures ", _jsx("small", { children: "agissent \u00E0 chaque fin de manche" })] }), creatures.length === 0 && _jsx("p", { className: "empty", children: "Aucune cr\u00E9ature : les fl\u00E8ches \u00AB Cr\u00E9atures \u00BB frappent la N\u00E9m\u00E9sis." }), _jsx("div", { className: "minion-grid", children: creatures.map((c) => {
                            const card = getCard(state.config.nemesisId, c.cardId);
                            return (_jsxs("div", { ref: c.dying ? dyingRef : undefined, className: `minion creature${c.dying ? ' dying' : ''}`, children: [_jsx("div", { className: "minion-head", children: card.name }), _jsx(HpBar, { hp: c.hp, max: c.maxHp, tone: "creature" }), _jsx("small", { children: describeCard(card, state) })] }, c.uid));
                        }) })] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-title", children: ["\uD83C\uDF3F Racines ", _jsx("small", { children: "\u00E9closent \u00E0 la fin du compte \u00E0 rebours" })] }), roots.length === 0 && _jsx("p", { className: "empty", children: "Aucune racine : les fl\u00E8ches \u00AB Racines \u00BB frappent la N\u00E9m\u00E9sis." }), _jsx("div", { className: "minion-grid", children: roots.map((r) => {
                            const card = getCard(state.config.nemesisId, r.cardId);
                            return (_jsxs("div", { ref: r.dying ? dyingRef : undefined, className: `minion root${r.countdown <= 1 && !r.dying ? ' urgent' : ''}${r.dying ? ' dying' : ''}`, children: [_jsxs("span", { className: "countdown", title: "Manches avant \u00E9closion", children: ["\u23F3", r.countdown] }), _jsx("div", { className: "minion-head", children: card.name }), _jsx(HpBar, { hp: r.hp, max: r.maxHp, tone: "root" }), _jsx("small", { children: describeCard(card, state) })] }, r.uid));
                        }) })] }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\uD83C\uDFF9 Gardiens" }), _jsx("ul", { className: "roster", children: state.players.map((p) => {
                            const entry = roster.find((r) => r.playerId === p.id);
                            const submitted = phase.kind === 'volley' && !!phase.submissions[p.id];
                            return (_jsxs("li", { className: `${p.id === you ? 'you' : ''}${p.hp <= 0 ? ' down' : ''}`, children: [_jsxs("div", { className: "roster-row", children: [_jsxs("span", { className: "who", children: [_jsx("span", { className: "avatar", style: { ['--class-color']: CLASSES[p.classId].color }, children: p.hp <= 0 ? '💤' : CLASSES[p.classId].emoji }), p.name, p.hp <= 0 && _jsx("span", { className: "status down", children: "\u00E0 terre \u00D7\u00BD" }), entry && entry.status !== 'free' && _jsx("span", { className: `status ${entry.status}`, children: STATUS_LABEL[entry.status] })] }), _jsxs("span", { className: "right", children: [phase.kind === 'volley' && _jsx("span", { className: `submitted${submitted ? ' yes' : ''}`, children: submitted ? '✓' : '…' }), _jsx(Gauge, { value: p.gauge })] })] }), _jsx(HpBar, { hp: p.hp, max: p.maxHp, tone: "archer" })] }, p.id));
                        }) })] }), treeSheet && (_jsx(Modal, { label: "Fiche de l\u2019Arbre-C\u0153ur", onClose: () => setTreeSheet(false), children: _jsx(TreeSheet, { state: state }) })), nemesisSheet && (_jsx(Modal, { label: "Fiche de la N\u00E9m\u00E9sis", onClose: () => setNemesisSheet(false), children: _jsx(NemesisSheet, { nemesisId: state.config.nemesisId, state: state }) }))] }));
}
