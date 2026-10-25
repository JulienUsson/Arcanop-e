import { useEffect, useRef, useState } from 'react';

export type FxKind = 'shards' | 'splinters' | 'leaves' | 'sparks' | 'smoke' | 'confetti' | 'petals' | 'embers' | 'dust';

export interface FxBurst {
  kind: FxKind;
  x: number;
  y: number;
  count: number;
  color?: string;
}

type FxMessage = { type: 'burst'; burst: FxBurst } | { type: 'flash'; color: string } | { type: 'shake'; strength: 'soft' | 'hard' };

const listeners = new Set<(message: FxMessage) => void>();

export function subscribeFx(listener: (message: FxMessage) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function emit(message: FxMessage) {
  if (reducedMotion()) return;
  listeners.forEach((l) => l(message));
}

export function burst(kind: FxKind, x: number, y: number, count = 16, color?: string) {
  emit({ type: 'burst', burst: { kind, x, y, count, color } });
}

export function burstAt(element: Element | null | undefined, kind: FxKind, count = 16, color?: string) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  burst(kind, rect.left + rect.width / 2, rect.top + rect.height / 2, count, color);
}

export function flash(color: string) {
  emit({ type: 'flash', color });
}

export function shake(strength: 'soft' | 'hard' = 'soft') {
  emit({ type: 'shake', strength });
}

export function punch(element: Element | null | undefined, scale = 1.06) {
  if (!element || reducedMotion()) return;
  element.animate([{ transform: `scale(${scale})` }, { transform: 'scale(1)' }], { duration: 280, easing: 'cubic-bezier(0.2, 1.6, 0.4, 1)' });
}

export function useTween(value: number, duration = 650): number {
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
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(origin + (value - origin) * eased);
      from.current = current;
      setShown(current);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);
  return shown;
}

