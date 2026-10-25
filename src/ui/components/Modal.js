import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
export function Modal({ onClose, children, label }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (_jsx("div", { className: "modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "modal", role: "dialog", "aria-label": label, onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "modal-close", onClick: onClose, "aria-label": "Fermer", children: "\u2715" }), children] }) }));
}
