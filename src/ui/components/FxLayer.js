import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { subscribeFx } from '../fx';
const KINDS = {
    shards: { colors: ['#c47be6', '#9b3fbf', '#e6c2f5', '#5a1d7a'], shape: 'shard', spread: 140, rise: 20, size: [6, 13], life: 900 },
    splinters: { colors: ['#e2606a', '#8b5a2b', '#ffb3b3', '#4fbf6a'], shape: 'shard', spread: 120, rise: 10, size: [5, 11], life: 850 },
    leaves: { colors: ['#7fe08e', '#4fbf6a', '#c8f7a6', '#2f8a47'], shape: 'leaf', spread: 90, rise: 120, size: [8, 14], life: 1300 },
    sparks: { colors: ['#fff3b0', '#f6d32d', '#ffffff', '#f1d27a'], shape: 'spark', spread: 170, rise: 40, size: [4, 9], life: 1000 },
    smoke: { colors: ['#6b6b6b', '#3d3d3d', '#9a9a9a'], shape: 'dot', spread: 70, rise: 90, size: [14, 30], life: 1300 },
    confetti: { colors: ['#f6d32d', '#7fe08e', '#c47be6', '#f0995e', '#ffffff'], shape: 'glyph', spread: 260, rise: 160, size: [14, 24], life: 2400, glyphs: ['🍃', '✦', '🌿', '✧', '🍂'] },
    petals: { colors: ['#5a1d7a', '#2a0b3a', '#9b3fbf'], shape: 'glyph', spread: 220, rise: -60, size: [14, 22], life: 2600, glyphs: ['🥀', '🍂', '·'] },
    embers: { colors: ['#ff9f43', '#f6d32d', '#ff6b6b'], shape: 'spark', spread: 80, rise: 140, size: [3, 6], life: 1400 },
    dust: { colors: ['#f1d27a', '#ffffff'], shape: 'dot', spread: 60, rise: 30, size: [3, 6], life: 600 },
};
let nextId = 1;
function spawn(b) {
    const def = KINDS[b.kind];
    return Array.from({ length: b.count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = def.spread * (0.35 + Math.random() * 0.65);
        return {
            id: nextId++,
            x: b.x,
            y: b.y,
            dx: Math.cos(angle) * distance,
            dy: Math.sin(angle) * distance * 0.8 - def.rise * (0.5 + Math.random()),
            rot: (Math.random() - 0.5) * 720,
            size: def.size[0] + Math.random() * (def.size[1] - def.size[0]),
            delay: Math.random() * 120,
            life: def.life * (0.75 + Math.random() * 0.5),
            color: b.color ?? def.colors[Math.floor(Math.random() * def.colors.length)],
            shape: def.shape,
            glyph: def.glyphs ? def.glyphs[Math.floor(Math.random() * def.glyphs.length)] : undefined,
        };
    });
}
export function FxLayer() {
    const [particles, setParticles] = useState([]);
    const [flash, setFlash] = useState(null);
    useEffect(() => subscribeFx((message) => {
        if (message.type === 'burst') {
            const created = spawn(message.burst);
            setParticles((p) => [...p, ...created].slice(-160));
            const longest = Math.max(...created.map((c) => c.life + c.delay));
            window.setTimeout(() => {
                const ids = new Set(created.map((c) => c.id));
                setParticles((p) => p.filter((x) => !ids.has(x.id)));
            }, longest + 50);
        }
        else if (message.type === 'flash') {
            setFlash({ key: Date.now(), color: message.color });
        }
        else {
            const root = document.querySelector('.app');
            if (!root)
                return;
            const cls = message.strength === 'hard' ? 'shake-hard' : 'shake-soft';
            root.classList.remove('shake-soft', 'shake-hard');
            void root.offsetWidth;
            root.classList.add(cls);
            window.setTimeout(() => root.classList.remove(cls), 520);
        }
    }), []);
    useEffect(() => {
        const onDown = (e) => {
            const button = e.target?.closest?.('button.primary, button.secondary, button.key, button.step-btn, button.power, button.claim, .tabs button, button.chip');
            if (!button || button.disabled)
                return;
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height) * 2.2;
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            button.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 650);
        };
        window.addEventListener('pointerdown', onDown, { passive: true });
        return () => window.removeEventListener('pointerdown', onDown);
    }, []);
    return (_jsxs("div", { className: "fx-layer", "aria-hidden": true, children: [flash && _jsx("div", { className: "fx-flash", style: { ['--flash']: flash.color }, onAnimationEnd: () => setFlash(null) }, flash.key), particles.map((p) => (_jsx("span", { className: `particle ${p.shape}`, style: {
                    left: p.x,
                    top: p.y,
                    width: p.shape === 'glyph' ? undefined : p.size,
                    height: p.shape === 'glyph' ? undefined : p.shape === 'spark' ? p.size * 2.4 : p.size,
                    fontSize: p.shape === 'glyph' ? p.size : undefined,
                    background: p.shape === 'glyph' ? undefined : p.color,
                    color: p.color,
                    animationDuration: `${p.life}ms`,
                    animationDelay: `${p.delay}ms`,
                    ['--dx']: `${p.dx}px`,
                    ['--dy']: `${p.dy}px`,
                    ['--rot']: `${p.rot}deg`,
                }, children: p.glyph }, p.id)))] }));
}
