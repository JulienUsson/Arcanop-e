import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CLASSES } from '../../game/classes';
import type { ClassId } from '../../game/types';
import type { GuestSession } from '../../net/guest';
import { Board } from '../components/Board';
import { ClassSheet } from '../components/ClassSheet';
import { CopyCode } from '../components/CopyCode';
import { EventStage } from '../components/EventStage';
import { Modal } from '../components/Modal';
import { Chronicle, useNarrationVoice } from '../components/Narration';
import { PhaseGuide } from '../components/PhaseGuide';
import { PowerPanel } from '../components/PowerPanel';
import { QrCode } from '../components/QrCode';
import { QrScanner } from '../components/QrScanner';
import { VolleyInput } from '../components/VolleyInput';
import { useWakeLock } from '../wakeLock';
import { EndSummary } from './EndSummary';

type Tab = 'cible' | 'combat' | 'fiche';

export function GuestScreen({ guest, onLeave }: { guest: GuestSession; onLeave: () => void }) {
  const snap = useSyncExternalStore(guest.subscribe, guest.getSnapshot);
  const [tab, setTab] = useState<Tab>('combat');
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<ClassId | null>(null);
  const [welcome, setWelcome] = useState(false);
  const previousYou = useRef(snap.you);
  useWakeLock(snap.status === 'connected');
  useNarrationVoice(snap.state?.lastEvent ?? null);

  useEffect(() => {
    if (!snap.notice) return;
    setNotice(snap.notice.message);
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [snap.notice]);

  useEffect(() => {
    if (snap.status === 'connected') setScanning(false);
  }, [snap.status]);

  useEffect(() => {
    if (snap.you && snap.you !== previousYou.current) setWelcome(true);
    previousYou.current = snap.you;
  }, [snap.you]);

  const phase = snap.state?.phase;
  const stepKey = phase?.kind === 'volley' ? `${phase.volley}-${phase.step}` : (phase?.kind ?? '');
  useEffect(() => {
    if (phase?.kind === 'volley' && phase.step !== 'council') setTab('cible');
    else if (phase) setTab((t) => (t === 'fiche' ? t : 'combat'));
  }, [stepKey]);

  const { state, you, roster, status } = snap;
  const connected = status === 'connected';

  const joinPanel = (
    <section className="panel join">
      {status === 'answering' && <p className="waiting">Préparation de la réponse…</p>}
      {status === 'answer' && snap.answer && (
        <>
          <p className="big-text">Montrez ce code à l’hôte pour qu’il le scanne.</p>
          <QrCode value={snap.answer.qr} alphanumeric label="Réponse" />
          <CopyCode code={snap.answer.text} />
          <p className="waiting">En attente de l’hôte…</p>
          <button className="ghost" onClick={() => guest.cancel()}>
            Annuler
          </button>
        </>
      )}
      {(status === 'idle' || status === 'lost') &&
        (scanning ? (
          <>
            <QrScanner
              title="Visez le QR code d’invitation affiché par l’hôte"
              onResult={(code) => {
                setScanning(false);
                void guest.join(code);
              }}
            />
            <button className="ghost" onClick={() => setScanning(false)}>
              Annuler
            </button>
          </>
        ) : (
          <>
            {status === 'lost' ? (
              <p className="error">Connexion perdue. Demandez une nouvelle invitation à l’hôte pour reprendre votre place.</p>
            ) : (
              <ol className="steps">
                <li>L’hôte crée une invitation (onglet Archers).</li>
                <li>Scannez-la, puis montrez votre réponse à l’hôte.</li>
              </ol>
            )}
            {snap.error && <p className="error">{snap.error}</p>}
            <button className="primary big glow" onClick={() => setScanning(true)}>
              {status === 'lost' ? 'Se reconnecter' : 'Scanner l’invitation'}
            </button>
          </>
        ))}
    </section>
  );

  if (!state || (status !== 'connected' && status !== 'lost')) {
    return (
      <div className="screen guest">
        <h1>Rejoindre la partie</h1>
        {joinPanel}
        <button className="ghost wide" onClick={onLeave}>
          Retour à l’accueil
        </button>
      </div>
    );
  }

  const me = state.players.find((p) => p.id === you);
  const toast = notice && <div className="toast">{notice}</div>;

  if (state.phase.kind === 'over') {
    return (
      <div className="screen guest">
        <EventStage state={state} event={state.lastEvent} />
        <EndSummary
          state={state}
          actions={
            <button
              className="primary big"
              onClick={() => {
                guest.forget();
                onLeave();
              }}
            >
              Retour à l’accueil
            </button>
          }
        />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="screen guest">
        {!connected && joinPanel}
        <h1>Choisissez votre Gardien</h1>
        <section className="panel">
          <ul className="claim-list">
            {state.players.map((p) => {
              const cls = CLASSES[p.classId];
              const taken = roster.find((r) => r.playerId === p.id)?.status === 'online';
              return (
                <li key={p.id} className="claim-row">
                  <button className="claim" style={{ ['--class-color' as string]: cls.color }} disabled={!connected || taken} onClick={() => guest.claim(p.id)}>
                    <span className="avatar big">{cls.emoji}</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {cls.name} · {cls.role} · ×{p.coef}
                        {taken && ' · déjà connecté'}
                      </small>
                    </span>
                  </button>
                  <button className="ghost small" onClick={() => setPreview(p.classId)} aria-label={`Fiche du ${cls.name}`}>
                    📜
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        {preview && (
          <Modal label="Fiche de classe" onClose={() => setPreview(null)}>
            <ClassSheet classId={preview} />
          </Modal>
        )}
        {toast}
      </div>
    );
  }

  const cls = CLASSES[me.classId];
  const volley = state.phase.kind === 'volley' ? state.phase : null;
  const submitted = volley ? volley.submissions[me.id] : undefined;

  return (
    <div className="screen guest">
      <EventStage state={state} event={state.lastEvent} />
      {!connected && joinPanel}
      <header className="me" style={{ ['--class-color' as string]: cls.color }}>
        <span className="avatar big">{cls.emoji}</span>
        <div>
          <strong>{me.name}</strong>
          <small>
            {cls.spirit} · ×{me.coef}
          </small>
        </div>
        <span className={`conn ${connected ? 'on' : 'off'}`}>{connected ? '● en ligne' : '● hors ligne'}</span>
      </header>
      <nav className="tabs">
        <button className={tab === 'cible' ? 'active' : ''} onClick={() => setTab('cible')}>
          🎯 Cible{volley && !submitted ? ' •' : ''}
        </button>
        <button className={tab === 'combat' ? 'active' : ''} onClick={() => setTab('combat')}>
          ⚔️ Combat
        </button>
        <button className={tab === 'fiche' ? 'active' : ''} onClick={() => setTab('fiche')}>
          📜 Fiche
        </button>
      </nav>

      {tab === 'cible' && (
        <>
          <PhaseGuide state={state} role="guest" playerId={me.id} compact />
          <VolleyInput
            draftKey={`guest:${volley ? volley.volley : 'next'}:${me.id}`}
            classId={me.classId}
            coef={me.coef}
            arrowsPerVolley={state.config.arrowsPerVolley}
            submitted={submitted}
            canSubmit={connected && !!volley}
            blockedReason={connected ? 'La saisie s’ouvre quand l’hôte tire une carte Volée.' : 'Hors ligne : reconnectez-vous pour envoyer.'}
            onSubmit={(arrows) => guest.submit(arrows)}
          />
          <PowerPanel state={state} playerId={me.id} disabled={!connected} onActivate={(uid) => guest.power(uid)} />
        </>
      )}

      {tab === 'combat' && (
        <>
          <PhaseGuide state={state} role="guest" playerId={me.id}>
            {volley && volley.step !== 'council' && !submitted && (
              <button className="primary big glow" onClick={() => setTab('cible')}>
                🎯 Saisir ma volée
              </button>
            )}
          </PhaseGuide>
          <Board state={state} roster={roster} you={you} onFocus={connected ? (kind, uid) => guest.focus(kind, uid) : undefined} />
          <Chronicle log={state.log} />
        </>
      )}

      {tab === 'fiche' && (
        <>
          <ClassSheet classId={me.classId} />
          <button className="ghost wide" onClick={() => guest.release()} disabled={!connected}>
            Changer de Gardien
          </button>
        </>
      )}

      {welcome && (
        <Modal label="Votre esprit" onClose={() => setWelcome(false)}>
          <ClassSheet classId={me.classId} />
          <button className="primary big wide" onClick={() => setWelcome(false)}>
            Je suis prêt
          </button>
        </Modal>
      )}
      {toast}
    </div>
  );
}
