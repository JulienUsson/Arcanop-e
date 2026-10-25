import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, availableActions, CLASSES } from '../../game/classes';
import { effectAmount, groupArrows, volleyPool } from '../../game/engine';
import { arrowLabel, arrowPoints, CRIT_POINTS, isYellow, RING_COLORS } from '../../game/target';
import { burstAt, flash, shake, useTween } from '../fx';
import { play } from '../sfx';
const drafts = new Map();
const KEYS = [
    { score: 10, x: true },
    { score: 10, x: false },
    { score: 9, x: false },
    { score: 8, x: false },
    { score: 7, x: false },
    { score: 6, x: false },
    { score: 5, x: false },
    { score: 4, x: false },
    { score: 3, x: false },
    { score: 2, x: false },
    { score: 1, x: false },
    { score: 0, x: false },
];
function formatMultiplier(n) {
    return String(n).replace('.', ',');
}
function ScoreChip({ arrow, small }) {
    return (_jsx("span", { className: `score-slot filled${small ? ' small' : ''}${arrow.x ? ' crit' : ''}`, style: { background: RING_COLORS[arrow.score].fill, color: RING_COLORS[arrow.score].text }, children: arrowLabel(arrow) }));
}
function TargetPicker({ kind, options, selected, onPick, }) {
    if (options.length === 0 && kind !== 'heal') {
        return _jsxs("p", { className: "target-none", children: ["Aucune ", kind === 'creatures' ? 'créature' : 'racine', " en jeu : la fl\u00E8che frappera la N\u00E9m\u00E9sis."] });
    }
    return (_jsxs("div", { className: "target-picker", role: "radiogroup", "aria-label": "Cible", children: [_jsx("span", { className: "target-label", children: kind === 'heal' ? '💚' : '🎯' }), options.map((o) => (_jsxs("button", { role: "radio", "aria-checked": selected === o.uid, className: `target-chip${selected === o.uid ? ' selected' : ''}${kind === 'heal' && o.uid !== 'tree' && o.hp <= 0 ? ' down' : ''}`, onClick: (e) => onPick(o.uid, e.currentTarget), children: [_jsx("span", { className: "target-name", children: o.name }), _jsxs("span", { className: "target-meta", children: [kind === 'heal' && o.uid !== 'tree' && o.hp <= 0 ? 'à terre' : `${o.hp}/${o.maxHp} PV`, o.countdown !== undefined ? ` · ⏳${o.countdown}` : ''] }), _jsx("span", { className: "target-hp", style: { width: `${(o.hp / o.maxHp) * 100}%` } })] }, o.uid)))] }));
}
export function VolleyInput({ draftKey, classId, coef, favorableCordon = false, arrowsPerVolley, boost = 1, suggested, suggestedTarget, weakened = false, targets, submitted, canSubmit, blockedReason, onSubmit, }) {
    const cls = CLASSES[classId];
    const actions = availableActions(classId);
    const fallback = suggested && actionMultiplier(classId, suggested) > 0 ? suggested : cls.specialty;
    const initial = () => drafts.get(draftKey) ?? (submitted ? { arrows: submitted.arrows, editing: false } : { arrows: [], editing: true });
    const [draft, setDraft] = useState(initial);
    const [sentKey, setSentKey] = useState(0);
    useEffect(() => {
        setDraft(initial());
    }, [draftKey]);
    const update = (next) => {
        drafts.set(draftKey, next);
        setDraft(next);
    };
    const { arrows } = draft;
    const full = arrows.length >= arrowsPerVolley;
    const pool = volleyPool(arrows, coef);
    const raw = arrows.reduce((sum, a) => sum + arrowPoints(a), 0);
    const crits = arrows.filter((a) => a.x).length;
    const shownPool = useTween(pool, 600);
    const submission = { arrows };
    const same = !!submitted && JSON.stringify(submitted.arrows) === JSON.stringify(arrows);
    const setArrows = (next) => update({ arrows: next, editing: next.length < arrowsPerVolley });
    const withAction = (arrow, action) => {
        if (action === 'creatures' || action === 'roots') {
            const options = targets[action];
            const keep = arrow.action === action && options.some((o) => o.uid === arrow.target);
            return { ...arrow, action, target: keep ? arrow.target : (options[0]?.uid ?? null) };
        }
        if (action === 'heal') {
            const keep = arrow.action === 'heal' && targets.heal.some((o) => o.uid === arrow.target);
            const preferred = suggested === 'heal' && targets.heal.some((o) => o.uid === suggestedTarget) ? suggestedTarget : null;
            return { ...arrow, action, target: keep ? arrow.target : preferred };
        }
        const { target: _drop, ...rest } = arrow;
        return { ...rest, action };
    };
    const targetName = (action, uid) => action === 'creatures' || action === 'roots' || action === 'heal' ? targets[action].find((o) => o.uid === (uid ?? (action === 'heal' ? 'tree' : uid)))?.name : undefined;
    const addArrow = (key, origin) => {
        if (full)
            return;
        setArrows([...arrows, withAction({ ...key, action: null }, key.score > 0 ? fallback : null)]);
        if (key.x) {
            burstAt(origin, 'sparks', 34);
            flash('rgba(246, 211, 45, 0.4)');
            shake('soft');
        }
        else if (key.score > 0) {
            burstAt(origin, isYellow(key.score) ? 'sparks' : 'dust', isYellow(key.score) ? 14 : 8, isYellow(key.score) ? undefined : RING_COLORS[key.score].fill);
        }
        else {
            burstAt(origin, 'smoke', 6);
        }
        navigator.vibrate?.(key.x ? [30, 40, 30, 40, 60] : isYellow(key.score) ? [20, 40, 20] : 15);
        play(key.x ? 'power' : 'tap');
    };
    const assign = (index, action, origin) => {
        if (arrows[index].score === 0 || arrows[index].action === action)
            return;
        update({ ...draft, arrows: arrows.map((a, i) => (i === index ? withAction(a, action) : a)) });
        burstAt(origin, 'dust', 6);
        play('tap');
    };
    const aim = (index, uid, origin) => {
        update({ ...draft, arrows: arrows.map((a, i) => (i === index ? { ...a, target: uid === 'tree' ? null : uid } : a)) });
        burstAt(origin, 'dust', 5);
        play('tap');
    };
    const assignAll = (action) => {
        update({ ...draft, arrows: arrows.map((a) => (a.score > 0 ? withAction(a, action) : a)) });
        play('tap');
    };
    const submit = (e) => {
        onSubmit(submission);
        burstAt(e.currentTarget, 'leaves', 22);
        setSentKey(Date.now());
        play('send');
    };
    if (!full || draft.editing) {
        return (_jsxs("div", { className: "volley-input", children: [_jsxs("div", { className: "score-slots", children: [Array.from({ length: arrowsPerVolley }, (_, i) => arrows[i] ? (_jsx(ScoreChip, { arrow: arrows[i] }, i)) : (_jsx("span", { className: "score-slot", children: i + 1 }, i))), _jsxs("span", { className: "score-total", children: [_jsx("strong", { children: raw }), " pts"] })] }), weakened && _jsx("p", { className: "weakened-banner", children: "\uD83E\uDE79 \u00C0 terre : vos fl\u00E8ches comptent moiti\u00E9 jusqu\u2019\u00E0 ce qu\u2019on vous soigne." }), _jsx("p", { className: `cordon-rule${favorableCordon ? ' favorable' : ''}`, children: favorableCordon ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Cordon favorable :" }), " une fl\u00E8che qui touche la ligne entre deux zones compte pour la zone sup\u00E9rieure."] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Cordon d\u00E9favorable :" }), " une fl\u00E8che qui touche la ligne entre deux zones compte pour la zone inf\u00E9rieure."] })) }), _jsx("div", { className: "keypad", children: KEYS.map((key) => (_jsxs("button", { className: `key${key.x ? ' crit' : ''}`, style: { ['--key-bg']: RING_COLORS[key.score].fill, ['--key-fg']: RING_COLORS[key.score].text }, disabled: full, onClick: (e) => addArrow(key, e.currentTarget), children: [_jsx("span", { className: "key-label", children: arrowLabel(key) }), key.x && _jsxs("small", { children: ["critique : ", CRIT_POINTS, " pts"] }), key.score === 0 && _jsx("small", { children: "hors cible" })] }, key.x ? 'X' : key.score))) }), _jsxs("div", { className: "input-actions two", children: [_jsx("button", { className: "secondary big", disabled: arrows.length === 0, onClick: () => setArrows(arrows.slice(0, -1)), children: "\u21B6 Retirer" }), _jsx("button", { className: "primary big", disabled: !full, onClick: () => update({ ...draft, editing: false }), children: "Assigner \u2192" })] })] }));
    }
    const groups = groupArrows(arrows);
    return (_jsxs("div", { className: "volley-input", children: [_jsxs("div", { className: "assign-head", children: [_jsx("button", { className: "ghost small", onClick: () => update({ ...draft, editing: true }), children: "\u270E Scores" }), _jsxs("span", { className: "pool", children: [_jsx("span", { className: "pool-value", children: shownPool }, pool), _jsxs("span", { className: "pool-label", children: ["pts", coef !== 1 && raw > 0 && _jsxs("small", { children: [raw, " \u00D7 ", formatMultiplier(coef)] })] })] })] }), crits > 0 && (_jsxs("div", { className: "crit-banner", children: ["\u2726 ", crits > 1 ? `${crits} coups critiques` : 'Coup critique', " ! \u2726"] }, crits)), weakened && _jsx("p", { className: "weakened-banner", children: "\uD83E\uDE79 \u00C0 terre : vos fl\u00E8ches comptent moiti\u00E9 jusqu\u2019\u00E0 ce qu\u2019on vous soigne." }), _jsxs("div", { className: "assign-all", children: [_jsx("span", { children: "Tout sur" }), actions.map((action) => (_jsxs("button", { className: `chip action-${action}`, onClick: () => assignAll(action), children: [ACTION_ICONS[action], " ", ACTION_LABELS[action]] }, action)))] }), _jsx("ul", { className: "arrow-rows", children: arrows.map((arrow, index) => (_jsxs("li", { className: `arrow-row${arrow.action ? ` action-${arrow.action}` : ' miss'}`, children: [_jsxs("div", { className: "arrow-info", children: [_jsx(ScoreChip, { arrow: arrow }), _jsx("small", { children: arrow.score === 0 ? 'raté' : `${arrowPoints(arrow)} pts` })] }), arrow.score === 0 ? (_jsx("span", { className: "arrow-miss", children: "Hors cible : aucun effet" })) : (_jsx("div", { className: "arrow-actions", children: actions.map((action) => (_jsxs("button", { className: `arrow-action action-${action}${arrow.action === action ? ' selected' : ''}`, onClick: (e) => assign(index, action, e.currentTarget), "aria-pressed": arrow.action === action, children: [_jsx("span", { className: "arrow-action-icon", children: ACTION_ICONS[action] }), _jsx("span", { className: "arrow-action-label", children: ACTION_LABELS[action] }), actionMultiplier(classId, action) > 1 && _jsxs("span", { className: "arrow-action-bonus", children: ["\u00D7", formatMultiplier(actionMultiplier(classId, action))] })] }, action))) })), (arrow.action === 'creatures' || arrow.action === 'roots') && (_jsx(TargetPicker, { kind: arrow.action, options: targets[arrow.action], selected: arrow.target ?? null, onPick: (uid, el) => aim(index, uid, el) })), arrow.action === 'heal' && _jsx(TargetPicker, { kind: "heal", options: targets.heal, selected: arrow.target ?? 'tree', onPick: (uid, el) => aim(index, uid, el) })] }, index))) }), groups.length > 0 && (_jsx("ul", { className: "assign-totals", children: groups.map((group) => {
                    const amount = effectAmount(classId, group.action, volleyPool(group.arrows, coef), boost, weakened);
                    const name = targetName(group.action, group.target);
                    const redirected = (group.action === 'creatures' || group.action === 'roots') && targets[group.action].length === 0;
                    return (_jsxs("li", { className: `action-${redirected ? 'nemesis' : group.action}`, children: [_jsxs("span", { children: [ACTION_ICONS[group.action], " ", name ?? ACTION_LABELS[group.action], redirected && _jsx("small", { children: " \u2192 N\u00E9m\u00E9sis" })] }), _jsx("strong", { children: group.action === 'heal' ? `+${amount} PV` : `${amount} dégâts` })] }, `${group.action}-${group.target}`));
                }) })), _jsx("div", { className: "input-actions single", children: _jsx("button", { className: `primary big${!same && canSubmit ? ' pulse' : ''}`, disabled: !canSubmit || same, onClick: submit, children: same ? 'Volée envoyée ✓' : submitted ? 'Corriger la volée' : 'Valider la volée' }) }), sentKey > 0 && same && (_jsx("div", { className: "sent-stamp", children: "Vol\u00E9e envoy\u00E9e" }, sentKey)), !canSubmit && blockedReason && _jsx("p", { className: "hint center", children: blockedReason })] }));
}
