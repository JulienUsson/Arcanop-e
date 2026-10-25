import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { play } from '../sfx';
const DialogContext = createContext(() => Promise.resolve(false));
export function useConfirm() {
    return useContext(DialogContext);
}
export function DialogProvider({ children }) {
    const [pending, setPending] = useState(null);
    const confirmRef = useRef(null);
    const ask = useCallback((options) => new Promise((resolve) => {
        play('card');
        navigator.vibrate?.(20);
        setPending({ ...options, resolve });
    }), []);
    const close = useCallback((ok) => {
        pending?.resolve(ok);
        setPending(null);
    }, [pending]);
    useEffect(() => {
        if (!pending)
            return;
        confirmRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape')
                close(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [pending, close]);
    return (_jsxs(DialogContext.Provider, { value: ask, children: [children, pending && (_jsx("div", { className: "dialog-backdrop", onClick: () => close(false), children: _jsxs("div", { className: `dialog tone-${pending.tone ?? 'default'}`, role: "alertdialog", "aria-modal": "true", "aria-labelledby": "dialog-title", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: "dialog-corner tl" }), _jsx("span", { className: "dialog-corner tr" }), _jsx("span", { className: "dialog-corner bl" }), _jsx("span", { className: "dialog-corner br" }), _jsx("div", { className: "dialog-icon", children: pending.icon ?? (pending.tone === 'danger' ? '⚠️' : '🌳') }), _jsx("h2", { id: "dialog-title", children: pending.title }), _jsx("div", { className: "dialog-message", children: pending.message }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { className: "secondary big", onClick: () => close(false), children: pending.cancelLabel ?? 'Annuler' }), _jsx("button", { ref: confirmRef, className: `big ${pending.tone === 'danger' ? 'danger-solid' : 'primary'}`, onClick: () => close(true), children: pending.confirmLabel ?? 'Confirmer' })] })] }) }))] }));
}
