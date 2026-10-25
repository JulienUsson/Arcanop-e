import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { CLASSES } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { powerAvailability } from '../../game/engine';
import { getCard } from '../../game/nemesis';
import { burstAt } from '../fx';
import { Gauge } from './Board';
export function PowerPanel({ state, playerId, disabled, onActivate }) {
    const [choosing, setChoosing] = useState(false);
    const player = state.players.find((p) => p.id === playerId);
    if (!player)
        return null;
    const cls = CLASSES[player.classId];
    const availability = powerAvailability(state, playerId);
    const ready = player.gauge >= GAUGE_MAX;
    const fire = (targetUid) => {
        burstAt(document.querySelector('.power-panel'), 'sparks', 24, cls.color);
        onActivate(targetUid);
    };
    const activate = () => {
        if (cls.needsRootTarget && state.roots.length > 1)
            setChoosing(true);
        else
            fire(state.roots[0]?.uid);
    };
    return (_jsxs("section", { className: `panel power-panel${ready ? ' ready' : ''}`, style: { ['--class-color']: cls.color }, children: [_jsxs("div", { className: "power-head", children: [_jsxs("div", { children: [_jsxs("div", { className: "panel-title", children: [cls.emoji, " ", cls.powerName] }), _jsx("small", { children: cls.powerText })] }), _jsx(Gauge, { value: player.gauge })] }), choosing ? (_jsxs("div", { className: "root-choice", children: [_jsx("p", { children: "Quelle racine retenir ?" }), state.roots.map((r) => (_jsxs("button", { className: "secondary", onClick: () => {
                            setChoosing(false);
                            fire(r.uid);
                        }, children: [getCard(state.config.nemesisId, r.cardId).name, " (\u23F3 ", r.countdown, ")"] }, r.uid))), _jsx("button", { className: "ghost", onClick: () => setChoosing(false), children: "Annuler" })] })) : (_jsx("button", { className: "power big", disabled: disabled || !availability.ok, onClick: activate, children: availability.ok ? 'Activer le pouvoir' : availability.reason })), player.hp <= 0 && _jsx("p", { className: "hint", children: "\uD83E\uDE79 \u00C0 terre : ce pouvoir n\u2019agira qu\u2019\u00E0 moiti\u00E9." }), _jsx("p", { className: "hint", children: "Chaque fl\u00E8che dans le jaune remplit la jauge." })] }));
}
