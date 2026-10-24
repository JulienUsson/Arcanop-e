import { useEffect, useState } from 'react';
import { createGame } from '../game/engine';
import { randomSeed } from '../game/rng';
import type { GameConfig } from '../game/types';
import { GuestSession } from '../net/guest';
import { HostSession } from '../net/host';
import { setSoundEnabled, soundEnabled } from './sfx';
import { setVoiceEnabled, speechAvailable, voiceEnabled } from './speech';
import { GuestScreen } from './screens/GuestScreen';
import { Home } from './screens/Home';
import { HostScreen } from './screens/HostScreen';
import { Rules } from './screens/Rules';
import { Setup } from './screens/Setup';

type Mode = 'home' | 'setup' | 'host' | 'guest' | 'rules';
const MODE_KEY = 'arcanopee.mode';

function initialMode(): Mode {
  const saved = localStorage.getItem(MODE_KEY) as Mode | null;
  if (saved === 'host' && HostSession.saved()) return 'host';
  if (saved === 'guest') return 'guest';
  return 'home';
}

let guestSingleton: GuestSession | null = null;
function guestSession(): GuestSession {
  guestSingleton ??= new GuestSession();
  return guestSingleton;
}

export function App() {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [host, setHost] = useState<HostSession | null>(() => (mode === 'host' ? HostSession.load() : null));
  const [voice, setVoice] = useState(voiceEnabled);
  const [sound, setSound] = useState(soundEnabled);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const create = (config: GameConfig) => {
    host?.close();
    const gameId = Math.random().toString(36).slice(2, 10);
    setHost(new HostSession(createGame(config, randomSeed(), gameId)));
    setMode('host');
  };

  const resume = () => {
    const session = host ?? HostSession.load();
    if (!session) return;
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

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setMode('home')} aria-label="Accueil">
          🌳 Arcanopée
        </button>
        {mode === 'host' && <span className="role">Hôte</span>}
        {mode === 'guest' && <span className="role">Archer</span>}
        <span className="topbar-icons">
          <button
            className={`icon${sound ? '' : ' off'}`}
            onClick={() => {
              setSoundEnabled(!sound);
              setSound(!sound);
            }}
            aria-label={sound ? 'Couper les sons' : 'Activer les sons'}
            title="Sons"
          >
            🎵
          </button>
          {speechAvailable() && (
            <button className={`icon${voice ? '' : ' off'}`} onClick={toggleVoice} aria-label={voice ? 'Couper la voix' : 'Activer la voix'} title="Lecture vocale">
              🗣️
            </button>
          )}
        </span>
      </header>
      <main>
        {mode === 'home' && (
          <Home
            canResume={!!(host || HostSession.saved())}
            canRejoin={!!guestSession().getSnapshot().state}
            onHost={() => setMode('setup')}
            onResume={resume}
            onJoin={() => setMode('guest')}
            onRules={() => setMode('rules')}
          />
        )}
        {mode === 'setup' && <Setup onCreate={create} onBack={() => setMode('home')} />}
        {mode === 'host' && host && <HostScreen session={host} onQuit={quitHost} />}
        {mode === 'guest' && <GuestScreen guest={guestSession()} onLeave={() => setMode('home')} />}
        {mode === 'rules' && <Rules onBack={() => setMode('home')} />}
      </main>
    </div>
  );
}
