import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function CopyCode({ code }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
        catch {
            setCopied(false);
        }
    };
    return (_jsxs("details", { className: "copy-code", children: [_jsx("summary", { children: "Pas de cam\u00E9ra ? Utiliser le code texte" }), _jsx("code", { "data-testid": "signal-code", children: code }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "secondary", onClick: () => void copy(), children: copied ? 'Copié ✓' : 'Copier' }), 'share' in navigator && (_jsx("button", { className: "secondary", onClick: () => void navigator.share({ text: code }).catch(() => { }), children: "Partager" }))] })] }));
}
