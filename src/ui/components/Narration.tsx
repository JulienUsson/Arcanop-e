import { useEffect, useRef, useState } from 'react';
import type { GameEvent, LogEntry } from '../../game/types';
import { speak } from '../speech';

export function useNarrationVoice(event: GameEvent | null) {
  const lastSpoken = useRef<number | null>(null);
  useEffect(() => {
    if (!event) return;
    if (lastSpoken.current !== null && event.id !== lastSpoken.current) speak(`${event.title}. ${event.narration}`);
    lastSpoken.current = event.id;
  }, [event]);
}

export function Chronicle({ log }: { log: LogEntry[] }) {
  const [open, setOpen] = useState(false);
  if (log.length === 0) return null;
  const entries = [...log].reverse().slice(0, open ? 40 : 4);
  return (
    <section className="panel chronicle">
      <div className="panel-title">📖 Chronique</div>
      <ul>
        {entries.map((e) => (
          <li key={e.id} className={`tone-${e.tone}`}>
            {e.text}
          </li>
        ))}
      </ul>
      {log.length > 4 && (
        <button className="link" onClick={() => setOpen(!open)}>
          {open ? 'Réduire' : 'Tout afficher'}
        </button>
      )}
    </section>
  );
}
