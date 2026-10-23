import { useEffect, useState, useSyncExternalStore } from 'react';
import { CLASSES } from '../../game/classes';
import type { GuestSession } from '../../net/guest';
import { Board } from '../components/Board';
import { CopyCode } from '../components/CopyCode';
import { Narration, useNarrationVoice } from '../components/Narration';
import { PowerPanel } from '../components/PowerPanel';
import { QrCode } from '../components/QrCode';
import { QrScanner } from '../components/QrScanner';
import { QuadrantMap } from '../components/QuadrantMap';
import { VolleyInput } from '../components/VolleyInput';
import { useWakeLock } from '../wakeLock';
import { EndSummary } from './EndSummary';

type Tab = 'cible' | 'combat';

export function GuestScreen({ guest, onLeave }: { guest: GuestSession; onLeave: () => void }) {
  const snap = useSyncExternalStore(guest.subscribe, guest.getSnapshot);
  const [tab, setTab] = useState<Tab>('cible');
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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
              <p>Demandez à l’hôte de créer une invitation, puis scannez-la.</p>
            )}
            {snap.error && <p className="error">{snap.error}</p>}
            <button className="primary big" onClick={() => setScanning(true)}>
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
  const phase = state.phase;

  if (phase.kind === 'over') {
    return (
      <div className="screen guest">
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
        <h1>Qui êtes-vous ?</h1>
        <section className="panel">
          <ul className="claim-list">
            {state.players.map((p) => {
              const entry = roster.find((r) => r.playerId === p.id);
              const taken = entry?.status === 'online';
              return (
                <li key={p.id}>
                  <button className="claim" disabled={!connected || taken} onClick={() => guest.claim(p.id)}>
                    <span className="emoji">{CLASSES[p.classId].emoji}</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {CLASSES[p.classId].name} · ×{p.coef}
                        {taken && ' · déjà connecté'}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        {notice && <div className="toast">{notice}</div>}
      </div>
    );
  }

  const cls = CLASSES[me.classId];
  const submitted = phase.kind === 'volley' ? phase.submissions[me.id] : undefined;

  return (
    <div className="screen guest">
      {!connected && joinPanel}
      <header className="me" style={{ ['--class-color' as string]: cls.color }}>
        <span className="emoji">{cls.emoji}</span>
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
          Ma cible
        </button>
        <button className={tab === 'combat' ? 'active' : ''} onClick={() => setTab('combat')}>
          Combat
        </button>
      </nav>

      {tab === 'cible' && (
        <>
          <p className={`phase-hint${phase.kind === 'volley' ? ' open' : ''}`}>
            {phase.kind === 'lobby' && 'La partie va commencer…'}
            {phase.kind === 'turn' && 'Attendez la prochaine carte Volée.'}
            {phase.kind === 'volley' &&
              (submitted ? `Volée ${phase.volley} envoyée. Vous pouvez la corriger jusqu’à la résolution.` : `Volée ${phase.volley} : tirez puis saisissez vos impacts.`)}
          </p>
          <VolleyInput
            draftKey={`guest:${phase.kind === 'volley' ? phase.volley : 'next'}:${me.id}`}
            classId={me.classId}
            coef={me.coef}
            arrowsPerVolley={state.config.arrowsPerVolley}
            submitted={submitted}
            canSubmit={connected && phase.kind === 'volley'}
            blockedReason={connected ? 'La saisie s’ouvre quand l’hôte tire une carte Volée.' : 'Hors ligne : reconnectez-vous pour envoyer.'}
            onSubmit={(arrows) => guest.submit(arrows)}
          />
          <PowerPanel state={state} playerId={me.id} disabled={!connected} onActivate={(uid) => guest.power(uid)} />
        </>
      )}

      {tab === 'combat' && (
        <>
          <Narration event={state.lastEvent} />
          <Board state={state} roster={roster} you={you} onFocus={connected ? (kind, uid) => guest.focus(kind, uid) : undefined} />
          <section className="panel">
            <div className="panel-title">Mes quadrants</div>
            <QuadrantMap classId={me.classId} />
          </section>
          <button className="ghost wide" onClick={() => guest.release()} disabled={!connected}>
            Changer d’archer
          </button>
        </>
      )}
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
