import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ACTION_ICONS, CLASSES } from '../../game/classes';
import { describeCard, nextFury } from '../../game/engine';
import { getCard, getNemesis } from '../../game/nemesis';
import { arrowLabel, RING_COLORS } from '../../game/target';
import { burst, burstAt, flash, shake } from '../fx';
import { play } from '../sfx';
const STEP_MS = 420;
const CONTINUE_LABEL = {
    intro: 'Que la chasse commence !',
    volley: 'Au conseil !',
    nemesis: 'Continuer',
    fury: 'Tenir bon !',
    resolve: 'Continuer',
    round: 'Nouvelle manche',
    power: 'Continuer',
    victory: 'Voir le bilan',
    defeat: 'Voir le bilan',
};
const OPENING_SOUND = {
    intro: 'nemesis',
    volley: 'card',
    nemesis: 'nemesis',
    fury: 'defeat',
    round: 'card',
    power: 'power',
    victory: 'victory',
    defeat: 'defeat',
};
function resultSound(result) {
    if (result.effects.some((e) => e.killed))
        return 'kill';
    if (result.arrows.some((a) => a.x))
        return 'power';
    if (result.pool === 0)
        return 'miss';
    return result.effects.every((e) => e.action === 'heal') ? 'heal' : 'hit';
}
function steps(event) {
    if (event.results?.length)
        return event.results.length;
    if (event.kind === 'round')
        return event.lines.length;
    return 0;
}
export function useStage(state) {
    const event = state?.lastEvent ?? null;
    const ackId = useRef(null);
    const committed = useRef(null);
    const [, rerender] = useState(0);
    if (ackId.current === null || (committed.current === null && state))
        ackId.current = event?.id ?? 0;
    const pending = !!event && event.id !== ackId.current;
    if (!pending)
        committed.current = state;
    const close = () => {
        ackId.current = event?.id ?? 0;
        rerender((n) => n + 1);
    };
    return { event: pending ? event : null, boardState: pending && committed.current ? committed.current : state, close };
}
const OPENING_FX = {
    intro: () => {
        flash('rgba(155, 63, 191, 0.55)');
        setTimeout(() => burst('petals', innerWidth / 2, innerHeight * 0.32, 18), 300);
    },
    volley: () => setTimeout(() => burst('sparks', innerWidth / 2, innerHeight * 0.35, 26), 650),
    fury: () => {
        flash('rgba(200, 30, 40, 0.6)');
        shake('hard');
        [0, 400, 900].forEach((t) => setTimeout(() => burst('embers', innerWidth / 2, innerHeight * 0.3, 30), t));
        setTimeout(() => burst('shards', innerWidth / 2, innerHeight * 0.3, 24, '#e2343a'), 200);
    },
    nemesis: () => {
        flash('rgba(120, 30, 160, 0.5)');
        shake('soft');
        setTimeout(() => burst('shards', innerWidth / 2, innerHeight * 0.4, 28), 650);
    },
    round: () => burst('embers', innerWidth / 2, innerHeight * 0.3, 20),
    victory: () => {
        flash('rgba(246, 211, 45, 0.55)');
        [0, 500, 1100, 1800].forEach((t, i) => setTimeout(() => burst('confetti', innerWidth * (0.2 + 0.3 * (i % 3)), innerHeight * 0.3, 26), t));
    },
    defeat: () => {
        flash('rgba(120, 0, 20, 0.6)');
        shake('hard');
        [0, 700, 1500].forEach((t) => setTimeout(() => burst('petals', innerWidth / 2, innerHeight * 0.15, 22), t));
    },
};
export function EventStage({ state, event, onClose }) {
    const [revealed, setRevealed] = useState(0);
    const listRef = useRef(null);
    const eventId = event?.id;
    useEffect(() => {
        if (!event)
            return;
        setRevealed(0);
        const sound = OPENING_SOUND[event.kind];
        if (sound)
            play(sound);
        OPENING_FX[event.kind]?.();
        if (event.kind === 'power') {
            const player = state.players.find((p) => p.id === event.playerId);
            flash(`${player ? CLASSES[player.classId].color : '#b48cf2'}88`);
            setTimeout(() => burst('sparks', innerWidth / 2, innerHeight * 0.3, 34, player ? CLASSES[player.classId].color : undefined), 250);
        }
        navigator.vibrate?.(event.tone === 'bad' ? [60, 40, 60] : 30);
    }, [eventId]);
    const total = event ? steps(event) : 0;
    useEffect(() => {
        if (!event || revealed >= total)
            return;
        const timer = setTimeout(() => {
            const result = event.results?.[revealed];
            if (result)
                play(resultSound(result));
            setRevealed((r) => r + 1);
        }, revealed === 0 ? 700 : STEP_MS);
        return () => clearTimeout(timer);
    }, [eventId, revealed, total]);
    useEffect(() => {
        if (!event?.results || revealed === 0)
            return;
        const result = event.results[revealed - 1];
        const el = listRef.current?.querySelector('.hit-list li:last-child');
        if (!result || !el)
            return;
        if (result.arrows.some((a) => a.x)) {
            burstAt(el, 'sparks', 30);
            flash('rgba(246, 211, 45, 0.35)');
            shake('soft');
        }
        if (result.effects.some((e) => e.killed))
            burstAt(el, 'smoke', 14);
        if (result.effects.some((e) => e.action === 'heal'))
            burstAt(el, 'leaves', 12);
        if (result.effects.some((e) => e.action !== 'heal'))
            burstAt(el, 'shards', 10);
    }, [revealed]);
    if (!event)
        return null;
    const done = revealed >= total;
    const close = () => {
        if (!done)
            setRevealed(total);
        else
            onClose();
    };
    return (_jsxs("div", { className: `stage stage-${event.kind} tone-${event.tone}`, onClick: close, role: "dialog", "aria-live": "polite", children: [_jsx("div", { className: "stage-glow" }), _jsx("div", { className: "stage-rays" }), _jsxs("div", { className: "stage-body", ref: listRef, onClick: (e) => e.stopPropagation(), children: [_jsx(StageContent, { event: event, state: state, revealed: revealed }), _jsx("button", { className: `primary big stage-continue${done ? '' : ' skipping'}`, onClick: close, children: done ? CONTINUE_LABEL[event.kind] : 'Passer ▸▸' })] })] }));
}
function StageContent({ event, state, revealed }) {
    const nemesis = getNemesis(state.config.nemesisId);
    switch (event.kind) {
        case 'intro':
            return (_jsxs(_Fragment, { children: [_jsx("div", { className: "stage-portrait nemesis rise", children: nemesis.portrait }), _jsx("h1", { className: "stage-title", children: event.title }), _jsx("p", { className: "stage-story", children: event.narration }), _jsxs("p", { className: "stage-sub", children: [state.nemesis.maxHp, " PV \u00B7 ", state.wrathDeck.length, " cartes de col\u00E8re"] })] }));
        case 'volley':
            return (_jsxs(_Fragment, { children: [_jsxs(FlipCard, { back: "\uD83C\uDCCF", className: "volley-card", children: [_jsx("div", { className: "card-icon", children: "\uD83C\uDFF9" }), _jsx("div", { className: "card-name", children: event.title })] }), _jsx("p", { className: "stage-story", children: event.narration }), _jsxs("ol", { className: "stage-steps", children: [_jsx("li", { children: "\uD83D\uDDE3\uFE0F Conseil" }), _jsx("li", { children: "\uD83C\uDFF9 Tir" }), _jsx("li", { children: "\uD83C\uDFAF Saisie" })] })] }));
        case 'nemesis':
            return _jsx(NemesisCard, { event: event, state: state });
        case 'fury': {
            const next = nextFury(state);
            return (_jsxs(_Fragment, { children: [_jsx("div", { className: "stage-portrait nemesis fury rise", children: nemesis.portrait }), _jsxs("div", { className: "fury-badge", children: ["\uD83D\uDD25 Furie ", event.fury] }), _jsx("h1", { className: "stage-title fury-title", children: event.title }), _jsx("p", { className: "stage-story", children: event.narration }), _jsx("ul", { className: "stage-lines", children: event.lines
                            .filter((l) => l.includes('Déchaînement') || l.includes('à terre'))
                            .map((line, i) => (_jsx("li", { className: "pop delayed", children: line }, i))) }), _jsxs("p", { className: "stage-sub", children: ["Prochain D\u00E9cha\u00EEnement : ", next.tree, " \u00E0 l\u2019Arbre-C\u0153ur, ", next.archers, " \u00E0 chaque Gardien."] })] }));
        }
        case 'power': {
            const player = state.players.find((p) => p.id === event.playerId);
            const cls = player ? CLASSES[player.classId] : null;
            return (_jsxs(_Fragment, { children: [_jsx("div", { className: "stage-portrait power burst", style: { ['--class-color']: cls?.color }, children: cls?.emoji ?? '✨' }), _jsx("h1", { className: "stage-title", children: cls?.powerName ?? event.title }), player && _jsxs("p", { className: "stage-sub", children: [player.name, " invoque son esprit"] }), _jsx("p", { className: "stage-story", children: event.narration }), _jsx("p", { className: "stage-effect", children: event.lines[0] })] }));
        }
        case 'round':
            return (_jsxs(_Fragment, { children: [_jsx("div", { className: "stage-portrait moon", children: "\uD83C\uDF12" }), _jsx("h1", { className: "stage-title", children: event.title }), _jsx("p", { className: "stage-story", children: event.narration }), _jsx("ul", { className: "stage-lines", children: event.lines.slice(0, revealed).map((line, i) => (_jsx("li", { className: "pop", children: line }, i))) })] }));
        case 'resolve':
            return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "stage-title", children: event.title }), event.boosted && _jsx("div", { className: "stage-boost", children: "\uD83D\uDC3A La Meute chasse : d\u00E9g\u00E2ts multipli\u00E9s" }), _jsx(ResultList, { event: event, state: state, revealed: revealed }), revealed >= (event.results?.length ?? 0) && _jsx("p", { className: "stage-story pop", children: event.narration })] }));
        case 'victory':
        case 'defeat':
            return (_jsxs(_Fragment, { children: [event.results && event.results.length > 0 && _jsx(ResultList, { event: event, state: state, revealed: revealed }), event.cardId && !event.results?.length && _jsx(NemesisCard, { event: { ...event, lines: [] }, state: state }), revealed >= (event.results?.length ?? 0) && (_jsxs("div", { className: "pop", children: [_jsx("div", { className: `stage-portrait ${event.kind === 'victory' ? 'tree burst' : 'nemesis rise'}`, children: event.kind === 'victory' ? '🌳' : nemesis.portrait }), _jsx("h1", { className: `stage-title huge ${event.kind}`, children: event.title }), _jsx("p", { className: "stage-story", children: event.kind === 'victory' ? nemesis.victory : nemesis.defeat })] }))] }));
    }
}
function FlipCard({ back, className, children }) {
    return (_jsx("div", { className: `flip-card ${className ?? ''}`, children: _jsxs("div", { className: "flip-inner", children: [_jsx("div", { className: "flip-face flip-back", children: back }), _jsx("div", { className: "flip-face flip-front", children: children })] }) }));
}
const CARD_TYPES = {
    attack: { label: 'Attaque', icon: '🗡️' },
    creature: { label: 'Créature', icon: '🐾' },
    root: { label: 'Racine', icon: '🌿' },
};
function NemesisCard({ event, state }) {
    const nemesis = getNemesis(state.config.nemesisId);
    let card = null;
    try {
        card = event.cardId ? getCard(state.config.nemesisId, event.cardId) : null;
    }
    catch {
        card = null;
    }
    if (!card) {
        return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "stage-title", children: event.title }), _jsx("p", { className: "stage-story", children: event.narration })] }));
    }
    const type = CARD_TYPES[card.type];
    return (_jsxs(_Fragment, { children: [_jsxs("p", { className: "stage-sub", children: [nemesis.name, " joue une carte de col\u00E8re"] }), _jsxs(FlipCard, { back: nemesis.portrait, className: `wrath-card type-${card.type} tier-${card.tier}`, children: [_jsxs("div", { className: "card-ribbon", children: [type.icon, " ", type.label] }), _jsx("div", { className: "card-name", children: card.name }), _jsx("div", { className: "card-flavor", children: card.flavor }), _jsx("div", { className: "card-effect", children: describeCard(card, state) }), card.type !== 'attack' && (_jsx("div", { className: "card-stats", children: card.type === 'root' && _jsxs("span", { children: ["\u23F3 ", card.countdown, " manches"] }) }))] }), _jsx("ul", { className: "stage-lines", children: event.lines.slice(1).map((line, i) => (_jsx("li", { className: "pop delayed", children: line }, i))) })] }));
}
function ResultList({ event, state, revealed }) {
    const shown = (event.results ?? []).slice(0, revealed);
    const effects = shown.flatMap((r) => r.effects);
    const damage = effects.filter((e) => e.action !== 'heal').reduce((sum, e) => sum + e.amount, 0);
    const heal = effects.filter((e) => e.action === 'heal').reduce((sum, e) => sum + e.amount, 0);
    return (_jsxs(_Fragment, { children: [_jsx("ul", { className: "hit-list", children: shown.map((result) => {
                    const player = state.players.find((p) => p.id === result.playerId);
                    const cls = player ? CLASSES[player.classId] : null;
                    const crit = result.arrows.some((a) => a.x);
                    return (_jsxs("li", { className: `result pop${crit ? ' crit' : ''}`, children: [_jsxs("div", { className: "result-head", children: [_jsxs("span", { className: "hit-who", children: [cls?.emoji, " ", player?.name] }), _jsx("span", { className: "result-arrows", children: result.arrows.map((a, i) => (_jsxs("span", { className: "result-arrow", children: [_jsx("span", { className: `score-slot filled small${a.x ? ' crit' : ''}`, style: { background: RING_COLORS[a.score].fill, color: RING_COLORS[a.score].text }, children: arrowLabel(a) }), _jsx("span", { className: "result-arrow-action", children: a.action ? ACTION_ICONS[a.action] : '✗' })] }, i))) }), _jsxs("span", { className: "result-pool", children: [result.pool, " pts"] })] }), crit && _jsx("div", { className: "result-crit", children: "\u2726 Coup critique ! \u2726" }), _jsxs("div", { className: "result-effects", children: [result.effects.length === 0 && _jsx("small", { children: "Aucun effet" }), result.effects.map((e, i) => (_jsxs("span", { className: `power-chip action-${e.action}`, children: [ACTION_ICONS[e.action], " ", e.action === 'heal' ? `+${e.amount}` : `−${e.amount}`, _jsxs("small", { children: [" ", e.target] })] }, i)))] }), result.effects
                                .filter((e) => e.killed)
                                .map((e, i) => (_jsxs("div", { className: "hit-kill", children: ["\u2620 ", e.killed, " abattu !"] }, i)))] }, result.playerId));
                }) }), _jsxs("div", { className: "hit-totals", children: [_jsxs("span", { children: ["\u2694\uFE0F ", damage, " d\u00E9g\u00E2ts"] }), heal > 0 && _jsxs("span", { children: ["\uD83D\uDC9A +", heal, " PV"] })] })] }));
}
