import { useState, useSyncExternalStore } from 'react';
import { suggestion } from '../../game/advice';
import { CLASSES } from '../../game/classes';
import { healOptions, nextCardLabel, targetOptions } from '../../game/engine';
import type { HostSession } from '../../net/host';
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

type Tab = 'combat' | 'saisie' | 'archers';

export function HostScreen({ session, onQuit }: { session: HostSession; onQuit: () => void }) {
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const { state, roster } = snap;
  const [tab, setTab] = useState<Tab>(state.phase.kind === 'lobby' ? 'archers' : 'combat');
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const confirm = useConfirm();
  const stage = useStage(state);
  useWakeLock(true);
  useNarrationVoice(state.lastEvent);

  const phase = state.phase;
  const submittedCount = phase.kind === 'volley' ? Object.keys(phase.submissions).length : 0;
  const freePlayers = state.players.filter((p) => roster.find((r) => r.playerId === p.id)?.status === 'free');
  const selectedId =
    selected && state.players.some((p) => p.id === selected) ? selected : (freePlayers[0]?.id ?? state.players[0]?.id);
  const selectedPlayer = state.players.find((p) => p.id === selectedId);

  const resolve = async () => {
    const missing = state.players.filter((p) => phase.kind === 'volley' && !phase.submissions[p.id]);
    if (
      missing.length > 0 &&
      !(await confirm({
        icon: '⚔️',
        title: 'Résoudre la volée ?',
        message: (
          <>
            {missing.map((p) => p.name).join(', ')} {missing.length > 1 ? 'n’ont' : 'n’a'} pas encore saisi {missing.length > 1 ? 'leur' : 'sa'} volée.
            Leurs flèches ne compteront pas.
          </>
        ),
        confirmLabel: 'Résoudre quand même',
        cancelLabel: 'Attendre',
      }))
    )
      return;
    session.dispatch({ type: 'resolve' });
    setTab('combat');
  };

  const advance = () => {
    session.dispatch({ type: 'advance' });
    if (phase.kind === 'volley' && phase.step === 'council' && freePlayers.length > 0) setTab('saisie');
  };

  const undo = snap.canUndo && (
    <button className="ghost small" onClick={() => session.undo()}>
      ↶ Annuler la dernière action
    </button>
  );

  return (
    <div className="screen host">
      <EventStage state={state} event={stage.event} onClose={stage.close} />
      {phase.kind === 'over' ? (
        <EndSummary
          state={state}
          actions={
            <>
              {snap.canUndo && (
                <button className="ghost" onClick={() => session.undo()}>
                  Annuler la dernière action
                </button>
              )}
              <button className="primary big" onClick={onQuit}>
                Nouvelle partie
              </button>
            </>
          }
        />
      ) : (
        <>
          <nav className="tabs">
            <button className={tab === 'combat' ? 'active' : ''} onClick={() => setTab('combat')}>
              ⚔️ Combat
            </button>
            <button className={tab === 'saisie' ? 'active' : ''} onClick={() => setTab('saisie')}>
              🎯 Saisie{phase.kind === 'volley' ? ` ${submittedCount}/${state.players.length}` : ''}
            </button>
            <button className={tab === 'archers' ? 'active' : ''} onClick={() => setTab('archers')}>
              🏹 Archers <span className="count">{snap.phones}📱</span>
            </button>
          </nav>

          {tab === 'combat' && (
            <>
              <PhaseGuide state={state} role="host">
                {phase.kind === 'lobby' && (
                  <button className="primary big" onClick={() => session.dispatch({ type: 'start' })}>
                    Commencer la partie
                  </button>
                )}
                {phase.kind === 'turn' && (
                  <button className="primary big glow" onClick={() => session.dispatch({ type: 'draw' })}>
                    🃏 {nextCardLabel(state)}
                  </button>
                )}
                {phase.kind === 'volley' && phase.step === 'council' && (
                  <button className="primary big glow" onClick={advance}>
                    🎯 Flèches tirées : saisie
                  </button>
                )}
                {phase.kind === 'volley' && phase.step === 'input' && (
                  <div className="row">
                    <button className="secondary big" onClick={() => setTab('saisie')}>
                      🎯 Saisir
                    </button>
                    <button className={`primary big${submittedCount === state.players.length ? ' glow' : ''}`} onClick={() => void resolve()}>
                      ⚔️ Résoudre
                    </button>
                  </div>
                )}
                {undo}
              </PhaseGuide>
              <Board state={stage.boardState ?? state} roster={roster} />
              <Chronicle log={state.log} />
            </>
          )}

          {tab === 'saisie' && selectedPlayer && (
            <>
              <div className="player-tabs">
                {state.players.map((p) => {
                  const entry = roster.find((r) => r.playerId === p.id);
                  const done = phase.kind === 'volley' && !!phase.submissions[p.id];
                  return (
                    <button key={p.id} className={`chip${p.id === selectedId ? ' selected' : ''}`} onClick={() => setSelected(p.id)}>
                      {CLASSES[p.classId].emoji} {p.name}
                      {entry?.status === 'online' && ' 📱'}
                      {done && ' ✓'}
                    </button>
                  );
                })}
              </div>
              <div className="saisie-head">
                {roster.find((r) => r.playerId === selectedId)?.status === 'online' ? (
                  <p className="hint">Cet archer saisit sur son téléphone. Une saisie ici remplace la sienne.</p>
                ) : (
                  <span />
                )}
                <button className="ghost small" onClick={() => setSheet(true)}>
                  📜 Fiche {CLASSES[selectedPlayer.classId].name}
                </button>
              </div>
              <VolleyInput
                draftKey={`host:${phase.kind === 'volley' ? phase.volley : 'next'}:${selectedPlayer.id}`}
                classId={selectedPlayer.classId}
                coef={selectedPlayer.coef}
                arrowsPerVolley={state.config.arrowsPerVolley}
                boost={state.wolfBoost > 0 ? 2 : 1}
                targets={{ creatures: targetOptions(state, 'creatures'), roots: targetOptions(state, 'roots'), heal: healOptions(state) }}
                suggestedTarget={suggestion(state, selectedPlayer.id)?.target}
                weakened={selectedPlayer.hp <= 0}
                suggested={suggestion(state, selectedPlayer.id)?.action}
                submitted={phase.kind === 'volley' ? phase.submissions[selectedPlayer.id] : undefined}
                canSubmit={phase.kind === 'volley'}
                blockedReason="La saisie s’ouvre quand une carte Volée est tirée."
                onSubmit={(submission) => {
                  session.dispatch({ type: 'submit', playerId: selectedPlayer.id, submission });
                  const next = freePlayers.find((p) => p.id !== selectedPlayer.id && phase.kind === 'volley' && !phase.submissions[p.id]);
                  if (next) setTimeout(() => setSelected(next.id), 600);
                }}
              />
              <PowerPanel
                state={state}
                playerId={selectedPlayer.id}
                onActivate={(targetUid) => session.dispatch({ type: 'power', playerId: selectedPlayer.id, targetUid })}
              />
              {sheet && (
                <Modal label="Fiche de classe" onClose={() => setSheet(false)}>
                  <ClassSheet classId={selectedPlayer.classId} />
                </Modal>
              )}
            </>
          )}

          {tab === 'archers' && <ArchersTab session={session} onQuit={onQuit} />}
        </>
      )}
    </div>
  );
}

function ArchersTab({ session, onQuit }: { session: HostSession; onQuit: () => void }) {
  const confirm = useConfirm();
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const { state, roster } = snap;
  const [showLink, setShowLink] = useState(false);

  return (
    <>
      <InvitePanel session={session} />
      <section className="panel">
        <div className="panel-title">🏹 Gardiens</div>
        <ul className="roster detailed">
          {state.players.map((p) => {
            const entry = roster.find((r) => r.playerId === p.id);
            return (
              <li key={p.id}>
                <span className="who">
                  {CLASSES[p.classId].emoji} {p.name} <small>×{p.coef}</small>
                </span>
                <span className="right">
                  {entry?.status === 'online' && <span className="status online">📱 connecté</span>}
                  {entry?.status === 'offline' && <span className="status offline">📵 déconnecté</span>}
                  {entry?.status === 'free' && <span className="status free">saisie sur l’hôte</span>}
                  {entry && entry.status !== 'free' && (
                    <button
                      className="ghost small"
                      onClick={async () => {
                        const ok = await confirm({
                          icon: CLASSES[p.classId].emoji,
                          title: `Libérer ${p.name} ?`,
                          message: 'Son téléphone ne le contrôlera plus. Un autre téléphone pourra le reprendre, ou l’hôte saisira pour lui.',
                          confirmLabel: 'Libérer',
                        });
                        if (ok) session.release(p.id);
                      }}
                    >
                      Libérer
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="hint">Un archer déconnecté se reconnecte avec une nouvelle invitation : il retrouve automatiquement sa place.</p>
      </section>
      {state.phase.kind === 'lobby' && (
        <button className="primary big wide" onClick={() => session.dispatch({ type: 'start' })}>
          Commencer la partie
        </button>
      )}
      <section className="panel">
        <button className="link" onClick={() => setShowLink(!showLink)}>
          {showLink ? 'Masquer' : 'Afficher'} le lien de l’application
        </button>
        {showLink && (
          <>
            <QrCode value={location.href.split('#')[0]} label="Lien de l’application" />
            <p className="hint">À scanner pour ouvrir et installer Arcanopée. Installez-la avant d’aller sur le pas de tir : elle fonctionne ensuite hors ligne.</p>
          </>
        )}
      </section>
      <button
        className="danger wide"
        onClick={async () => {
          const ok = await confirm({
            tone: 'danger',
            icon: '🥀',
            title: 'Abandonner la partie ?',
            message: 'La Corruption gagnera cette fois. La partie sera effacée de ce téléphone et les archers seront déconnectés.',
            confirmLabel: 'Abandonner',
            cancelLabel: 'Continuer le combat',
          });
          if (ok) onQuit();
        }}
      >
        Abandonner la partie
      </button>
    </>
  );
}

function InvitePanel({ session }: { session: HostSession }) {
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scanned = async (code: string) => {
    setScanning(false);
    setError(null);
    try {
      await session.acceptAnswer(code);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const status = snap.inviteStatus;

  return (
    <section className="panel invite">
      <div className="panel-title">📱 Connecter un téléphone</div>
      {status === 'idle' && (
        <>
          {success && <p className="ok">Téléphone connecté ! L’archer choisit maintenant son personnage.</p>}
          {error && <p className="error">{error}</p>}
          <button
            className="primary big"
            onClick={() => {
              setSuccess(false);
              setError(null);
              void session.openInvite();
            }}
          >
            {success ? 'Connecter un autre téléphone' : 'Créer une invitation'}
          </button>
          <p className="hint">Sert aussi à reconnecter un archer qui a perdu la connexion.</p>
        </>
      )}
      {status === 'preparing' && <p className="waiting">Préparation de l’invitation…</p>}
      {status === 'error' && (
        <>
          <p className="error">{snap.inviteError}</p>
          <button className="secondary" onClick={() => void session.openInvite()}>
            Réessayer
          </button>
        </>
      )}
      {status === 'ready' && snap.invite && (
        <>
          {!scanning ? (
            <>
              <ol className="steps">
                <li>L’archer ouvre Arcanopée, touche « Rejoindre » et scanne ce code.</li>
              </ol>
              <QrCode value={snap.invite.qr} alphanumeric label="Invitation" />
              <CopyCode code={snap.invite.text} />
              <ol className="steps" start={2}>
                <li>Il affiche alors sa réponse : scannez-la.</li>
              </ol>
              {error && <p className="error">{error}</p>}
              <div className="row">
                <button className="ghost" onClick={() => session.cancelInvite()}>
                  Annuler
                </button>
                <button className="primary big" onClick={() => setScanning(true)}>
                  Scanner la réponse
                </button>
              </div>
            </>
          ) : (
            <>
              <QrScanner title="Visez le QR code affiché par l’archer" onResult={(code) => void scanned(code)} />
              <button className="ghost" onClick={() => setScanning(false)}>
                Revoir l’invitation
              </button>
            </>
          )}
        </>
      )}
      {status === 'connecting' && <p className="waiting">Connexion en cours…</p>}
    </section>
  );
}
