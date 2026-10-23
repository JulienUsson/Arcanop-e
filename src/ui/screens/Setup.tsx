import { useState } from 'react';
import { CLASS_IDS, CLASSES, LEVELS } from '../../game/classes';
import { DIFFICULTIES } from '../../game/difficulty';
import { MORDELUNE, NEMESES } from '../../game/nemesis';
import type { ClassId, Difficulty, GameConfig, PlayerConfig } from '../../game/types';

const SETUP_KEY = 'arcanopee.setup';
const MAX_PLAYERS = 8;

function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function defaultConfig(): GameConfig {
  return {
    nemesisId: MORDELUNE.id,
    difficulty: 'normal',
    arrowsPerVolley: 3,
    players: CLASS_IDS.map((classId, i) => ({ id: newId(), name: `Archer ${i + 1}`, classId, coef: 1 })),
  };
}

function loadConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameConfig;
      if (parsed.players?.length) return { ...defaultConfig(), ...parsed };
    }
  } catch {}
  return defaultConfig();
}

export function Setup({ onCreate, onBack }: { onCreate: (config: GameConfig) => void; onBack: () => void }) {
  const [config, setConfig] = useState<GameConfig>(loadConfig);

  const updatePlayer = (id: string, patch: Partial<PlayerConfig>) =>
    setConfig((c) => ({ ...c, players: c.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const addPlayer = () =>
    setConfig((c) => {
      const used = new Set(c.players.map((p) => p.classId));
      const classId: ClassId = CLASS_IDS.find((id) => !used.has(id)) ?? CLASS_IDS[c.players.length % 4];
      return { ...c, players: [...c.players, { id: newId(), name: `Archer ${c.players.length + 1}`, classId, coef: 1 }] };
    });

  const removePlayer = (id: string) => setConfig((c) => ({ ...c, players: c.players.filter((p) => p.id !== id) }));

  const valid = config.players.length > 0 && config.players.every((p) => p.name.trim() && p.coef > 0);

  const create = () => {
    const clean: GameConfig = {
      ...config,
      players: config.players.map((p) => ({ ...p, name: p.name.trim().slice(0, 24), coef: Math.round(p.coef * 100) / 100 })),
    };
    localStorage.setItem(SETUP_KEY, JSON.stringify(clean));
    onCreate(clean);
  };

  return (
    <div className="screen setup">
      <h1>Mise en place</h1>

      <section className="panel">
        <div className="panel-title">🏹 Gardiens</div>
        {config.players.map((p) => {
          const level = LEVELS.find((l) => l.coef === p.coef);
          return (
            <div key={p.id} className="player-row">
              <div className="row">
                <input
                  className="name"
                  value={p.name}
                  maxLength={24}
                  onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
                  aria-label="Nom"
                />
                <button className="ghost" onClick={() => removePlayer(p.id)} aria-label="Retirer" disabled={config.players.length <= 1}>
                  ✕
                </button>
              </div>
              <div className="class-picker">
                {CLASS_IDS.map((id) => (
                  <button
                    key={id}
                    className={`class-chip${p.classId === id ? ' selected' : ''}`}
                    style={{ ['--class-color' as string]: CLASSES[id].color }}
                    onClick={() => updatePlayer(p.id, { classId: id })}
                  >
                    <span>{CLASSES[id].emoji}</span>
                    {CLASSES[id].name}
                  </button>
                ))}
              </div>
              <div className="row level-row">
                <select
                  value={level ? String(level.coef) : 'custom'}
                  onChange={(e) => e.target.value !== 'custom' && updatePlayer(p.id, { coef: Number(e.target.value) })}
                  aria-label="Niveau"
                >
                  {LEVELS.map((l) => (
                    <option key={l.label} value={l.coef}>
                      {l.label} (×{l.coef})
                    </option>
                  ))}
                  {!level && <option value="custom">Personnalisé</option>}
                </select>
                <label className="coef">
                  ×
                  <input
                    type="number"
                    min={0.1}
                    max={3}
                    step={0.1}
                    value={p.coef}
                    onChange={(e) => updatePlayer(p.id, { coef: Number(e.target.value) })}
                    aria-label="Coefficient"
                  />
                </label>
              </div>
            </div>
          );
        })}
        <button className="secondary" onClick={addPlayer} disabled={config.players.length >= MAX_PLAYERS}>
          + Ajouter un archer
        </button>
      </section>

      <section className="panel">
        <div className="panel-title">💀 Némésis</div>
        {Object.values(NEMESES).map((n) => (
          <label key={n.id} className={`choice${config.nemesisId === n.id ? ' selected' : ''}`}>
            <input type="radio" name="nemesis" checked={config.nemesisId === n.id} onChange={() => setConfig({ ...config, nemesisId: n.id })} />
            <strong>
              {n.name}, {n.title}
            </strong>
          </label>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title">⚖️ Difficulté</div>
        {Object.values(DIFFICULTIES).map((d) => (
          <label key={d.id} className={`choice${config.difficulty === d.id ? ' selected' : ''}`}>
            <input
              type="radio"
              name="difficulty"
              checked={config.difficulty === d.id}
              onChange={() => setConfig({ ...config, difficulty: d.id as Difficulty })}
            />
            <strong>{d.label}</strong>
            <small>{d.description}</small>
          </label>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title">🎯 Flèches par volée</div>
        <div className="segmented">
          {[3, 4, 5, 6].map((n) => (
            <button key={n} className={config.arrowsPerVolley === n ? 'selected' : ''} onClick={() => setConfig({ ...config, arrowsPerVolley: n })}>
              {n}
            </button>
          ))}
        </div>
      </section>

      <div className="footer-actions">
        <button className="ghost" onClick={onBack}>
          Retour
        </button>
        <button className="primary big" disabled={!valid} onClick={create}>
          Créer la partie
        </button>
      </div>
    </div>
  );
}
