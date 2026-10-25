import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createGame } from '../game/engine';
import { randomSeed } from '../game/rng';
import { GuestSession } from '../net/guest';
import { HostSession } from '../net/host';
import { DialogProvider } from './components/Dialog';
import { FxLayer } from './components/FxLayer';
import { setSoundEnabled, soundEnabled } from './sfx';
import { setVoiceEnabled, speechAvailable, voiceEnabled } from './speech';
import { GuestScreen } from './screens/GuestScreen';
import { Home } from './screens/Home';
import { HostScreen } from './screens/HostScreen';
import { Rules } from './screens/Rules';
import { Setup } from './screens/Setup';
const MODE_KEY = 'arcanopee.mode';
function initialMode() {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'host' && HostSession.saved())
        return 'host';
    if (saved === 'guest')
        return 'guest';
    return 'home';
}
let guestSingleton = null;
function guestSession() {
    guestSingleton ??= new GuestSession();
    return guestSingleton;
}
export function App() {
    const [mode, setMode] = useState(initialMode);
    const [host, setHost] = useState(() => (mode === 'host' ? HostSession.load() : null));
    const [voice, setVoice] = useState(voiceEnabled);
    const [sound, setSound] = useState(soundEnabled);
    useEffect(() => {
        localStorage.setItem(MODE_KEY, mode);
    }, [mode]);
    const create = (config) => {
        host?.close();
        const gameId = Math.random().toString(36).slice(2, 10);
        setHost(new HostSession(createGame(config, randomSeed(), gameId)));
        setMode('host');
    };
    const resume = () => {
        const session = host ?? HostSession.load();
        if (!session)
            return;
        setHost(session);
        setMode('host');
    };
    const quitHost = () => {
        host?.close();
        HostSession.clearSaved();
        setHost(null);
        setMode('home');
    };
    const toggleVoice = () => {
        setVoiceEnabled(!voice);
        setVoice(!voice);
    };
    return (_jsxs(DialogProvider, { children: [_jsxs("div", { className: "app", children: [_jsxs("header", { className: "topbar", children: [_jsx("button", { className: "brand", onClick: () => setMode('home'), "aria-label": "Accueil", children: "\uD83C\uDF33 Arcanop\u00E9e" }), mode === 'host' && _jsx("span", { className: "role", children: "H\u00F4te" }), mode === 'guest' && _jsx("span", { className: "role", children: "Archer" }), _jsxs("span", { className: "topbar-icons", children: [_jsx("button", { className: `icon${sound ? '' : ' off'}`, onClick: () => {
                                            setSoundEnabled(!sound);
                                            setSound(!sound);
                                        }, "aria-label": sound ? 'Couper les sons' : 'Activer les sons', title: "Sons", children: "\uD83C\uDFB5" }), speechAvailable() && (_jsx("button", { className: `icon${voice ? '' : ' off'}`, onClick: toggleVoice, "aria-label": voice ? 'Couper la voix' : 'Activer la voix', title: "Lecture vocale", children: "\uD83D\uDDE3\uFE0F" }))] })] }), _jsxs("main", { children: [mode === 'home' && (_jsx(Home, { canResume: !!(host || HostSession.saved()), canRejoin: !!guestSession().getSnapshot().state, onHost: () => setMode('setup'), onResume: resume, onJoin: () => setMode('guest'), onRules: () => setMode('rules') })), mode === 'setup' && _jsx(Setup, { onCreate: create, onBack: () => setMode('home') }), mode === 'host' && host && _jsx(HostScreen, { session: host, onQuit: quitHost }), mode === 'guest' && _jsx(GuestScreen, { guest: guestSession(), onLeave: () => setMode('home') }), mode === 'rules' && _jsx(Rules, { onBack: () => setMode('home') })] })] }), _jsx(FxLayer, {})] }));
}
