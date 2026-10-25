import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useSyncExternalStore } from 'react';
import { suggestion } from '../../game/advice';
import { ARCHER_LEVELS, CLASSES, levelText } from '../../game/classes';
import { healOptions, nextCardLabel, targetOptions } from '../../game/engine';
import { Board } from '../components/Board';
import { ClassSheet } from '../components/ClassSheet';
import { CopyCode } from '../components/CopyCode';
import { useConfirm } from '../components/Dialog';
import { EventStage, useStage } from '../components/EventStage';
import { Modal } from '../components/Modal';
import { Chronicle, useNarrationVoice } from '../components/Narration';
import { PhaseGuide } from '../components/PhaseGuide';
import { PowerPanel } from '../components/PowerPanel';
import { QrCode } from '../components/QrCode';
import { QrScanner } from '../components/QrScanner';
import { VolleyInput } from '../components/VolleyInput';
import { useWakeLock } from '../wakeLock';
import { EndSummary } from './EndSummary';
export function HostScreen({ session, onQuit }) {
    const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
    const { state, roster } = snap;
    const [tab, setTab] = useState(state.phase.kind === 'lobby' ? 'archers' : 'combat');
    const [selected, setSelected] = useState(null);
    const [sheet, setSheet] = useState(false);
    const confirm = useConfirm();
    const stage = useStage(state);
    useWakeLock(true);
    useNarrationVoice(state.lastEvent);
    const phase = state.phase;
    const submittedCount = phase.kind === 'volley' ? Object.keys(phase.submissions).length : 0;
    const freePlayers = state.players.filter((p) => roster.find((r) => r.playerId === p.id)?.status === 'free');
    const selectedId = selected && state.players.some((p) => p.id === selected) ? selected : (freePlayers[0]?.id ?? state.players[0]?.id);
    const selectedPlayer = state.players.find((p) => p.id === selectedId);
    const resolve = async () => {
        const missing = state.players.filter((p) => phase.kind === 'volley' && !phase.submissions[p.id]);
        if (missing.length > 0 &&
            !(await confirm({
                icon: '⚔️',
                title: 'Résoudre la volée ?',
                message: (_jsxs(_Fragment, { children: [missing.map((p) => p.name).join(', '), " ", missing.length > 1 ? 'n’ont' : 'n’a', " pas encore saisi ", missing.length > 1 ? 'leur' : 'sa', " vol\u00E9e. Leurs fl\u00E8ches ne compteront pas."] })),
                confirmLabel: 'Résoudre quand même',
                cancelLabel: 'Attendre',
            })))
            return;
        session.dispatch({ type: 'resolve' });
        setTab('combat');
    };
    const advance = () => {
        session.dispatch({ type: 'advance' });
        if (phase.kind === 'volley' && phase.step === 'council' && freePlayers.length > 0)
            setTab('saisie');
    };
    const undo = snap.canUndo && (_jsx("button", { className: "ghost small", onClick: () => session.undo(), children: "\u21B6 Annuler la derni\u00E8re action" }));
    return (_jsxs("div", { className: "screen host", children: [_jsx(EventStage, { state: state, event: stage.event, onClose: stage.close }), phase.kind === 'over' ? (_jsx(EndSummary, { state: state, actions: _jsxs(_Fragment, { children: [snap.canUndo && (_jsx("button", { className: "ghost", onClick: () => session.undo(), children: "Annuler la derni\u00E8re action" })), _jsx("button", { className: "primary big", onClick: onQuit, children: "Nouvelle partie" })] }) })) : (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "tabs", children: [_jsx("button", { className: tab === 'combat' ? 'active' : '', onClick: () => setTab('combat'), children: "\u2694\uFE0F Combat" }), _jsxs("button", { className: tab === 'saisie' ? 'active' : '', onClick: () => setTab('saisie'), children: ["\uD83C\uDFAF Saisie", phase.kind === 'volley' ? ` ${submittedCount}/${state.players.length}` : ''] }), _jsxs("button", { className: tab === 'archers' ? 'active' : '', onClick: () => setTab('archers'), children: ["\uD83C\uDFF9 Archers ", _jsxs("span", { className: "count", children: [snap.phones, "\uD83D\uDCF1"] })] })] }), tab === 'combat' && (_jsxs(_Fragment, { children: [_jsxs(PhaseGuide, { state: state, role: "host", children: [phase.kind === 'lobby' && (_jsx("button", { className: "primary big", onClick: () => session.dispatch({ type: 'start' }), children: "Commencer la partie" })), phase.kind === 'turn' && (_jsxs("button", { className: "primary big glow", onClick: () => session.dispatch({ type: 'draw' }), children: ["\uD83C\uDCCF ", nextCardLabel(state)] })), phase.kind === 'volley' && phase.step === 'council' && (_jsx("button", { className: "primary big glow", onClick: advance, children: "\uD83C\uDFAF Fl\u00E8ches tir\u00E9es : saisie" })), phase.kind === 'volley' && phase.step === 'input' && (_jsxs("div", { className: "row", children: [_jsx("button", { className: "secondary big", onClick: () => setTab('saisie'), children: "\uD83C\uDFAF Saisir" }), _jsx("button", { className: `primary big${submittedCount === state.players.length ? ' glow' : ''}`, onClick: () => void resolve(), children: "\u2694\uFE0F R\u00E9soudre" })] })), undo] }), _jsx(Board, { state: stage.boardState ?? state, roster: roster }), _jsx(Chronicle, { log: state.log })] })), tab === 'saisie' && selectedPlayer && (_jsxs(_Fragment, { children: [_jsx("div", { className: "player-tabs", children: state.players.map((p) => {
                                    const entry = roster.find((r) => r.playerId === p.id);
                                    const done = phase.kind === 'volley' && !!phase.submissions[p.id];
                                    return (_jsxs("button", { className: `chip${p.id === selectedId ? ' selected' : ''}`, onClick: () => setSelected(p.id), children: [CLASSES[p.classId].emoji, " ", p.name, entry?.status === 'online' && ' 📱', done && ' ✓'] }, p.id));
                                }) }), _jsxs("div", { className: "saisie-head", children: [roster.find((r) => r.playerId === selectedId)?.status === 'online' ? (_jsx("p", { className: "hint", children: "Cet archer saisit sur son t\u00E9l\u00E9phone. Une saisie ici remplace la sienne." })) : (_jsx("span", {})), _jsxs("button", { className: "ghost small", onClick: () => setSheet(true), children: ["\uD83D\uDCDC Fiche ", CLASSES[selectedPlayer.classId].name] })] }), _jsx(VolleyInput, { draftKey: `host:${phase.kind === 'volley' ? phase.volley : 'next'}:${selectedPlayer.id}`, classId: selectedPlayer.classId, coef: selectedPlayer.coef, favorableCordon: ARCHER_LEVELS[selectedPlayer.level].favorableCordon, arrowsPerVolley: state.config.arrowsPerVolley, boost: state.wolfBoost > 0 ? 2 : 1, targets: { creatures: targetOptions(state, 'creatures'), roots: targetOptions(state, 'roots'), heal: healOptions(state) }, suggestedTarget: suggestion(state, selectedPlayer.id)?.target, weakened: selectedPlayer.hp <= 0, suggested: suggestion(state, selectedPlayer.id)?.action, submitted: phase.kind === 'volley' ? phase.submissions[selectedPlayer.id] : undefined, canSubmit: phase.kind === 'volley', blockedReason: "La saisie s\u2019ouvre quand une carte Vol\u00E9e est tir\u00E9e.", onSubmit: (submission) => {
                                    session.dispatch({ type: 'submit', playerId: selectedPlayer.id, submission });
                                    const next = freePlayers.find((p) => p.id !== selectedPlayer.id && phase.kind === 'volley' && !phase.submissions[p.id]);
                                    if (next)
                                        setTimeout(() => setSelected(next.id), 600);
                                } }), _jsx(PowerPanel, { state: state, playerId: selectedPlayer.id, onActivate: (targetUid) => session.dispatch({ type: 'power', playerId: selectedPlayer.id, targetUid }) }), sheet && (_jsx(Modal, { label: "Fiche de classe", onClose: () => setSheet(false), children: _jsx(ClassSheet, { classId: selectedPlayer.classId }) }))] })), tab === 'archers' && _jsx(ArchersTab, { session: session, onQuit: onQuit })] }))] }));
}
function ArchersTab({ session, onQuit }) {
    const confirm = useConfirm();
    const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
    const { state, roster } = snap;
    const [showLink, setShowLink] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx(InvitePanel, { session: session }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\uD83C\uDFF9 Gardiens" }), _jsx("ul", { className: "roster detailed", children: state.players.map((p) => {
                            const entry = roster.find((r) => r.playerId === p.id);
                            return (_jsxs("li", { children: [_jsxs("span", { className: "who", children: [CLASSES[p.classId].emoji, " ", p.name, " ", _jsx("small", { children: levelText(p) })] }), _jsxs("span", { className: "right", children: [entry?.status === 'online' && _jsx("span", { className: "status online", children: "\uD83D\uDCF1 connect\u00E9" }), entry?.status === 'offline' && _jsx("span", { className: "status offline", children: "\uD83D\uDCF5 d\u00E9connect\u00E9" }), entry?.status === 'free' && _jsx("span", { className: "status free", children: "saisie sur l\u2019h\u00F4te" }), entry && entry.status !== 'free' && (_jsx("button", { className: "ghost small", onClick: async () => {
                                                    const ok = await confirm({
                                                        icon: CLASSES[p.classId].emoji,
                                                        title: `Libérer ${p.name} ?`,
                                                        message: 'Son téléphone ne le contrôlera plus. Un autre téléphone pourra le reprendre, ou l’hôte saisira pour lui.',
                                                        confirmLabel: 'Libérer',
                                                    });
                                                    if (ok)
                                                        session.release(p.id);
                                                }, children: "Lib\u00E9rer" }))] })] }, p.id));
                        }) }), _jsx("p", { className: "hint", children: "Un archer d\u00E9connect\u00E9 se reconnecte avec une nouvelle invitation : il retrouve automatiquement sa place." })] }), state.phase.kind === 'lobby' && (_jsx("button", { className: "primary big wide", onClick: () => session.dispatch({ type: 'start' }), children: "Commencer la partie" })), _jsxs("section", { className: "panel", children: [_jsxs("button", { className: "link", onClick: () => setShowLink(!showLink), children: [showLink ? 'Masquer' : 'Afficher', " le lien de l\u2019application"] }), showLink && (_jsxs(_Fragment, { children: [_jsx(QrCode, { value: location.href.split('#')[0], label: "Lien de l\u2019application" }), _jsx("p", { className: "hint", children: "\u00C0 scanner pour ouvrir et installer Arcanop\u00E9e. Installez-la avant d\u2019aller sur le pas de tir : elle fonctionne ensuite hors ligne." })] }))] }), _jsx("button", { className: "danger wide", onClick: async () => {
                    const ok = await confirm({
                        tone: 'danger',
                        icon: '🥀',
                        title: 'Abandonner la partie ?',
                        message: 'La Corruption gagnera cette fois. La partie sera effacée de ce téléphone et les archers seront déconnectés.',
                        confirmLabel: 'Abandonner',
                        cancelLabel: 'Continuer le combat',
                    });
                    if (ok)
                        onQuit();
                }, children: "Abandonner la partie" })] }));
}
function InvitePanel({ session }) {
    const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const scanned = async (code) => {
        setScanning(false);
        setError(null);
        try {
            await session.acceptAnswer(code);
            setSuccess(true);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };
    const status = snap.inviteStatus;
    return (_jsxs("section", { className: "panel invite", children: [_jsx("div", { className: "panel-title", children: "\uD83D\uDCF1 Connecter un t\u00E9l\u00E9phone" }), status === 'idle' && (_jsxs(_Fragment, { children: [success && _jsx("p", { className: "ok", children: "T\u00E9l\u00E9phone connect\u00E9 ! L\u2019archer choisit maintenant son personnage." }), error && _jsx("p", { className: "error", children: error }), _jsx("button", { className: "primary big", onClick: () => {
                            setSuccess(false);
                            setError(null);
                            void session.openInvite();
                        }, children: success ? 'Connecter un autre téléphone' : 'Créer une invitation' }), _jsx("p", { className: "hint", children: "Sert aussi \u00E0 reconnecter un archer qui a perdu la connexion." })] })), status === 'preparing' && _jsx("p", { className: "waiting", children: "Pr\u00E9paration de l\u2019invitation\u2026" }), status === 'error' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "error", children: snap.inviteError }), _jsx("button", { className: "secondary", onClick: () => void session.openInvite(), children: "R\u00E9essayer" })] })), status === 'ready' && snap.invite && (_jsx(_Fragment, { children: !scanning ? (_jsxs(_Fragment, { children: [_jsx("ol", { className: "steps", children: _jsx("li", { children: "L\u2019archer ouvre Arcanop\u00E9e, touche \u00AB Rejoindre \u00BB et scanne ce code." }) }), _jsx(QrCode, { value: snap.invite.qr, alphanumeric: true, label: "Invitation" }), _jsx(CopyCode, { code: snap.invite.text }), _jsx("ol", { className: "steps", start: 2, children: _jsx("li", { children: "Il affiche alors sa r\u00E9ponse : scannez-la." }) }), error && _jsx("p", { className: "error", children: error }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "ghost", onClick: () => session.cancelInvite(), children: "Annuler" }), _jsx("button", { className: "primary big", onClick: () => setScanning(true), children: "Scanner la r\u00E9ponse" })] })] })) : (_jsxs(_Fragment, { children: [_jsx(QrScanner, { title: "Visez le QR code affich\u00E9 par l\u2019archer", onResult: (code) => void scanned(code) }), _jsx("button", { className: "ghost", onClick: () => setScanning(false), children: "Revoir l\u2019invitation" })] })) })), status === 'connecting' && _jsx("p", { className: "waiting", children: "Connexion en cours\u2026" })] }));
}
