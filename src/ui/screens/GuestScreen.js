import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { suggestion } from '../../game/advice';
import { ARCHER_LEVELS, CLASSES, levelText } from '../../game/classes';
import { healOptions, targetOptions } from '../../game/engine';
import { getNemesis } from '../../game/nemesis';
import { Board, HpBar } from '../components/Board';
import { ClassSheet } from '../components/ClassSheet';
import { CopyCode } from '../components/CopyCode';
import { useConfirm } from '../components/Dialog';
import { EventStage, useStage } from '../components/EventStage';
import { Modal } from '../components/Modal';
import { NemesisSheet } from '../components/NemesisSheet';
import { Chronicle, useNarrationVoice } from '../components/Narration';
import { PhaseGuide } from '../components/PhaseGuide';
import { PowerPanel } from '../components/PowerPanel';
import { QrCode } from '../components/QrCode';
import { QrScanner } from '../components/QrScanner';
import { VolleyInput } from '../components/VolleyInput';
import { useWakeLock } from '../wakeLock';
import { EndSummary } from './EndSummary';
export function GuestScreen({ guest, onLeave }) {
    const snap = useSyncExternalStore(guest.subscribe, guest.getSnapshot);
    const [tab, setTab] = useState('combat');
    const [scanning, setScanning] = useState(false);
    const [notice, setNotice] = useState(null);
    const [preview, setPreview] = useState(null);
    const [welcome, setWelcome] = useState(false);
    const [sheetView, setSheetView] = useState('me');
    const previousYou = useRef(snap.you);
    const confirm = useConfirm();
    const stage = useStage(snap.state);
    useWakeLock(snap.status === 'connected');
    useNarrationVoice(snap.state?.lastEvent ?? null);
    useEffect(() => {
        if (!snap.notice)
            return;
        setNotice(snap.notice.message);
        const timer = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(timer);
    }, [snap.notice]);
    useEffect(() => {
        if (snap.status === 'connected')
            setScanning(false);
    }, [snap.status]);
    useEffect(() => {
        if (snap.you && snap.you !== previousYou.current)
            setWelcome(true);
        previousYou.current = snap.you;
    }, [snap.you]);
    const phase = snap.state?.phase;
    const stepKey = phase?.kind === 'volley' ? `${phase.volley}-${phase.step}` : (phase?.kind ?? '');
    useEffect(() => {
        if (phase?.kind === 'volley' && phase.step !== 'council')
            setTab('cible');
        else if (phase)
            setTab((t) => (t === 'fiche' ? t : 'combat'));
    }, [stepKey]);
    const { state, you, roster, status } = snap;
    const connected = status === 'connected';
    const joinPanel = (_jsxs("section", { className: "panel join", children: [status === 'answering' && _jsx("p", { className: "waiting", children: "Pr\u00E9paration de la r\u00E9ponse\u2026" }), status === 'answer' && snap.answer && (_jsxs(_Fragment, { children: [_jsx("p", { className: "big-text", children: "Montrez ce code \u00E0 l\u2019h\u00F4te pour qu\u2019il le scanne." }), _jsx(QrCode, { value: snap.answer.qr, alphanumeric: true, label: "R\u00E9ponse" }), _jsx(CopyCode, { code: snap.answer.text }), _jsx("p", { className: "waiting", children: "En attente de l\u2019h\u00F4te\u2026" }), _jsx("button", { className: "ghost", onClick: () => guest.cancel(), children: "Annuler" })] })), (status === 'idle' || status === 'lost') &&
                (scanning ? (_jsxs(_Fragment, { children: [_jsx(QrScanner, { title: "Visez le QR code d\u2019invitation affich\u00E9 par l\u2019h\u00F4te", onResult: (code) => {
                                setScanning(false);
                                void guest.join(code);
                            } }), _jsx("button", { className: "ghost", onClick: () => setScanning(false), children: "Annuler" })] })) : (_jsxs(_Fragment, { children: [status === 'lost' ? (_jsx("p", { className: "error", children: "Connexion perdue. Demandez une nouvelle invitation \u00E0 l\u2019h\u00F4te pour reprendre votre place." })) : (_jsxs("ol", { className: "steps", children: [_jsx("li", { children: "L\u2019h\u00F4te cr\u00E9e une invitation (onglet Archers)." }), _jsx("li", { children: "Scannez-la, puis montrez votre r\u00E9ponse \u00E0 l\u2019h\u00F4te." })] })), snap.error && _jsx("p", { className: "error", children: snap.error }), _jsx("button", { className: "primary big glow", onClick: () => setScanning(true), children: status === 'lost' ? 'Se reconnecter' : 'Scanner l’invitation' })] })))] }));
    if (!state || (status !== 'connected' && status !== 'lost')) {
        return (_jsxs("div", { className: "screen guest", children: [_jsx("h1", { children: "Rejoindre la partie" }), joinPanel, _jsx("button", { className: "ghost wide", onClick: onLeave, children: "Retour \u00E0 l\u2019accueil" })] }));
    }
    const me = state.players.find((p) => p.id === you);
    const toast = notice && _jsx("div", { className: "toast", children: notice });
    if (state.phase.kind === 'over') {
        return (_jsxs("div", { className: "screen guest", children: [_jsx(EventStage, { state: state, event: stage.event, onClose: stage.close }), _jsx(EndSummary, { state: state, actions: _jsx("button", { className: "primary big", onClick: () => {
                            guest.forget();
                            onLeave();
                        }, children: "Retour \u00E0 l\u2019accueil" }) })] }));
    }
    if (!me) {
        return (_jsxs("div", { className: "screen guest", children: [!connected && joinPanel, _jsx("h1", { children: "Choisissez votre Gardien" }), _jsx("section", { className: "panel", children: _jsx("ul", { className: "claim-list", children: state.players.map((p) => {
                            const cls = CLASSES[p.classId];
                            const taken = roster.find((r) => r.playerId === p.id)?.status === 'online';
                            return (_jsxs("li", { className: "claim-row", children: [_jsxs("button", { className: "claim", style: { ['--class-color']: cls.color }, disabled: !connected || taken, onClick: () => guest.claim(p.id), children: [_jsx("span", { className: "avatar big", children: cls.emoji }), _jsxs("span", { children: [_jsx("strong", { children: p.name }), _jsxs("small", { children: [cls.name, " \u00B7 ", cls.role, " \u00B7 ", levelText(p), taken && ' · déjà connecté'] })] })] }), _jsx("button", { className: "ghost small", onClick: () => setPreview(p.classId), "aria-label": `Fiche du ${cls.name}`, children: "\uD83D\uDCDC" })] }, p.id));
                        }) }) }), preview && (_jsx(Modal, { label: "Fiche de classe", onClose: () => setPreview(null), children: _jsx(ClassSheet, { classId: preview }) })), toast] }));
    }
    const cls = CLASSES[me.classId];
    const volley = state.phase.kind === 'volley' ? state.phase : null;
    const submitted = volley ? volley.submissions[me.id] : undefined;
    return (_jsxs("div", { className: "screen guest", children: [_jsx(EventStage, { state: state, event: stage.event, onClose: stage.close }), !connected && joinPanel, _jsxs("header", { className: `me${me.hp <= 0 ? ' down' : ''}`, style: { ['--class-color']: cls.color }, children: [_jsx("span", { className: "avatar big", children: me.hp <= 0 ? '💤' : cls.emoji }), _jsxs("div", { className: "me-info", children: [_jsx("strong", { children: me.name }), _jsxs("small", { children: [cls.spirit, " \u00B7 ", levelText(me)] }), _jsx(HpBar, { hp: me.hp, max: me.maxHp, tone: "archer" })] }), _jsx("span", { className: `conn ${connected ? 'on' : 'off'}`, children: connected ? '● en ligne' : '● hors ligne' })] }), me.hp <= 0 && _jsx("p", { className: "weakened-banner", children: "\uD83E\uDE79 Vous \u00EAtes \u00E0 terre : vos fl\u00E8ches et votre pouvoir comptent moiti\u00E9. Un soin vous rel\u00E8vera." }), _jsxs("nav", { className: "tabs", children: [_jsxs("button", { className: tab === 'cible' ? 'active' : '', onClick: () => setTab('cible'), children: ["\uD83C\uDFAF Cible", volley && !submitted ? ' •' : ''] }), _jsx("button", { className: tab === 'combat' ? 'active' : '', onClick: () => setTab('combat'), children: "\u2694\uFE0F Combat" }), _jsx("button", { className: tab === 'fiche' ? 'active' : '', onClick: () => setTab('fiche'), children: "\uD83D\uDCDC Fiche" })] }), tab === 'cible' && (_jsxs(_Fragment, { children: [_jsx(PhaseGuide, { state: state, role: "guest", playerId: me.id, compact: true }), _jsx(VolleyInput, { draftKey: `guest:${volley ? volley.volley : 'next'}:${me.id}`, classId: me.classId, coef: me.coef, favorableCordon: ARCHER_LEVELS[me.level].favorableCordon, arrowsPerVolley: state.config.arrowsPerVolley, boost: state.wolfBoost > 0 ? 2 : 1, targets: { creatures: targetOptions(state, 'creatures'), roots: targetOptions(state, 'roots'), heal: healOptions(state) }, suggestedTarget: suggestion(state, me.id)?.target, weakened: me.hp <= 0, suggested: suggestion(state, me.id)?.action, submitted: submitted, canSubmit: connected && !!volley, blockedReason: connected ? 'La saisie s’ouvre quand l’hôte tire une carte Volée.' : 'Hors ligne : reconnectez-vous pour envoyer.', onSubmit: (submission) => guest.submit(submission) }), _jsx(PowerPanel, { state: state, playerId: me.id, disabled: !connected, onActivate: (uid) => guest.power(uid) })] })), tab === 'combat' && (_jsxs(_Fragment, { children: [_jsx(PhaseGuide, { state: state, role: "guest", playerId: me.id, children: volley && volley.step !== 'council' && !submitted && (_jsx("button", { className: "primary big glow", onClick: () => setTab('cible'), children: "\uD83C\uDFAF Saisir ma vol\u00E9e" })) }), _jsx(Board, { state: stage.boardState ?? state, roster: roster, you: you }), _jsx(Chronicle, { log: state.log })] })), tab === 'fiche' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "segmented sheet-switch", children: [_jsxs("button", { className: sheetView === 'me' ? 'selected' : '', onClick: () => setSheetView('me'), children: [cls.emoji, " Mon esprit"] }), _jsxs("button", { className: sheetView === 'nemesis' ? 'selected' : '', onClick: () => setSheetView('nemesis'), children: [getNemesis(state.config.nemesisId).portrait, " La N\u00E9m\u00E9sis"] })] }), sheetView === 'me' ? _jsx(ClassSheet, { classId: me.classId }) : _jsx(NemesisSheet, { nemesisId: state.config.nemesisId, state: state }), _jsx("button", { className: "ghost wide", disabled: !connected, onClick: async () => {
                            const ok = await confirm({
                                icon: '🔄',
                                title: 'Changer de Gardien ?',
                                message: `Vous quitterez ${me.name}. Vous pourrez choisir un autre archer libre.`,
                                confirmLabel: 'Changer',
                            });
                            if (ok)
                                guest.release();
                        }, children: "Changer de Gardien" })] })), welcome && (_jsxs(Modal, { label: "Votre esprit", onClose: () => setWelcome(false), children: [_jsx(ClassSheet, { classId: me.classId }), _jsx("button", { className: "primary big wide", onClick: () => setWelcome(false), children: "Je suis pr\u00EAt" })] })), toast] }));
}
