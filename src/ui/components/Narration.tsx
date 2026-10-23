import { useEffect, useRef, useState } from 'react';
import type { GameEvent } from '../../game/types';
import { speak } from '../speech';

export function useNarrationVoice(event: GameEvent | null) {
  const lastSpoken = useRef<number | null>(null);
  useEffect(() => {
    if (!event) return;
    if (lastSpoken.current !== null && event.id !== lastSpoken.current) speak(`${event.title}. ${event.narration}`);
    lastSpoken.current = event.id;
  }, [event]);
}

export function Narration({ event }: { event: GameEvent | null }) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (!event) return null;
  const open = openId === event.id;
  return (
    <section className={`narration tone-${event.tone}`}>
      <h2>{event.title}</h2>
      <p className="story">{event.narration}</p>
      {event.lines.length > 0 && (
        <>
          <button className="link" onClick={() => setOpenId(open ? null : event.id)}>
            {open ? 'Masquer le détail' : `Détail (${event.lines.length})`}
          </button>
          {open && (
            <ul className="event-lines">
              {event.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
