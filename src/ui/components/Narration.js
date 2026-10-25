import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { speak } from '../speech';
export function useNarrationVoice(event) {
    const lastSpoken = useRef(null);
    useEffect(() => {
        if (!event)
            return;
        if (lastSpoken.current !== null && event.id !== lastSpoken.current)
            speak(`${event.title}. ${event.narration}`);
        lastSpoken.current = event.id;
    }, [event]);
}
export function Chronicle({ log }) {
    const [open, setOpen] = useState(false);
    if (log.length === 0)
        return null;
    const entries = [...log].reverse().slice(0, open ? 40 : 4);
    return (_jsxs("section", { className: "panel chronicle", children: [_jsx("div", { className: "panel-title", children: "\uD83D\uDCD6 Chronique" }), _jsx("ul", { children: entries.map((e) => (_jsx("li", { className: `tone-${e.tone}`, children: e.text }, e.id))) }), log.length > 4 && (_jsx("button", { className: "link", onClick: () => setOpen(!open), children: open ? 'Réduire' : 'Tout afficher' }))] }));
}
