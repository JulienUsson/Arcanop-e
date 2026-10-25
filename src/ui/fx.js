import { useEffect, useRef, useState } from 'react';
const listeners = new Set();
export function subscribeFx(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
function reducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
function emit(message) {
    if (reducedMotion())
        return;
    listeners.forEach((l) => l(message));
}
export function burst(kind, x, y, count = 16, color) {
    emit({ type: 'burst', burst: { kind, x, y, count, color } });
}
export function burstAt(element, kind, count = 16, color) {
    if (!element)
        return;
    const rect = element.getBoundingClientRect();
    burst(kind, rect.left + rect.width / 2, rect.top + rect.height / 2, count, color);
}
export function flash(color) {
    emit({ type: 'flash', color });
}
export function shake(strength = 'soft') {
    emit({ type: 'shake', strength });
}
export function useTween(value, duration = 650) {
    const [shown, setShown] = useState(value);
    const from = useRef(value);
    const frame = useRef(0);
    useEffect(() => {
        if (reducedMotion()) {
            setShown(value);
            return;
        }
        const start = performance.now();
        const origin = from.current;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const current = Math.round(origin + (value - origin) * eased);
            from.current = current;
            setShown(current);
            if (t < 1)
                frame.current = requestAnimationFrame(tick);
        };
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame.current);
    }, [value, duration]);
    return shown;
}
