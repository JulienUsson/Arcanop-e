import { useState } from 'react';
import { ClassSheet } from '../components/ClassSheet';
import { Modal } from '../components/Modal';
import { NemesisSheet } from '../components/NemesisSheet';
import { ARCHER_LEVEL_IDS, ARCHER_LEVELS, CLASS_IDS, CLASSES, levelFromCoef } from '../../game/classes';
import { DIFFICULTIES } from '../../game/difficulty';
import { MORDELUNE, NEMESES } from '../../game/nemesis';
import type { ArcherLevel, ClassId, Difficulty, GameConfig, PlayerConfig } from '../../game/types';

const SETUP_KEY = 'arcanopee.setup';
const MAX_PLAYERS = 8;

function newPlayer(index: number, classId: ClassId): PlayerConfig {
  return { id: newId(), name: `Archer ${index + 1}`, classId, level: 'normal', coef: ARCHER_LEVELS.normal.coef };
}

function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function defaultConfig(): GameConfig {
  return {
    nemesisId: MORDELUNE.id,
    difficulty: 'normal',
    arrowsPerVolley: 3,
    players: CLASS_IDS.map((classId, i) => newPlayer(i, classId)),
  };
}

function loadConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameConfig;
      if (parsed.players?.length) {
        const players = parsed.players.map((p) => {
          const level: ArcherLevel = ARCHER_LEVELS[p.level] ? p.level : levelFromCoef(p.coef);
          return { ...p, level, coef: ARCHER_LEVELS[level].coef };
        });
        return { ...defaultConfig(), ...parsed, players };
      }
    }
  } catch {}
  return defaultConfig();
}

export function Setup({ onCreate, onBack }: { onCreate: (config: GameConfig) => void; onBack: () => void }) {
  const [config, setConfig] = useState<GameConfig>(loadConfig);
  const [sheet, setSheet] = useState<ClassId | null>(null);
  const [nemesisSheet, setNemesisSheet] = useState(false);

  const updatePlayer = (id: string, patch: Partial<PlayerConfig>) =>
    setConfig((c) => ({ ...c, players: c.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const addPlayer = () =>
    setConfig((c) => {
      const used = new Set(c.players.map((p) => p.classId));
      const classId: ClassId = CLASS_IDS.find((id) => !used.has(id)) ?? CLASS_IDS[c.players.length % 4];
      return { ...c, players: [...c.players, newPlayer(c.players.length, classId)] };
    });

  const removePlayer = (id: string) => setConfig((c) => ({ ...c, players: c.players.filter((p) => p.id !== id) }));

  const valid = config.players.length > 0 && config.players.every((p) => p.name.trim());

  const create = () => {
    const clean: GameConfig = {
      ...config,
      players: config.players.map((p) => ({ ...p, name: p.name.trim().slice(0, 24), coef: ARCHER_LEVELS[p.level].coef })),
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
                    onClick={() => (p.classId === id ? setSheet(id) : updatePlayer(p.id, { classId: id }))}
                  >
                    <span>{CLASSES[id].emoji}</span>
                    {CLASSES[id].name}
                  </button>
                ))}
              </div>
              <button className="link small-link" onClick={() => setSheet(p.classId)}>
                📜 Fiche du {CLASSES[p.classId].name} : {CLASSES[p.classId].role.toLowerCase()}, pouvoir « {CLASSES[p.classId].powerName} »
              </button>
              <div className="level-picker" role="radiogroup" aria-label="Niveau">
                {ARCHER_LEVEL_IDS.map((id) => {
                  const level = ARCHER_LEVELS[id];
                  return (
                    <button
                      key={id}
                      role="radio"
                      aria-checked={p.level === id}
                      className={`level-chip level-${id}${p.level === id ? ' selected' : ''}`}
                      onClick={() => updatePlayer(p.id, { level: id, coef: level.coef })}
                    >
                      <strong>{level.label}</strong>
                      <small>
                        ×{String(level.coef).replace('.', ',')} · cordon {level.favorableCordon ? 'favorable' : 'défavorable'}
                      </small>
                      <small className="level-charge">⚡ jauge dès le {level.chargeFrom}</small>
                    </button>
                  );
                })}
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
              {n.portrait} {n.name}, {n.title}
            </strong>
          </label>
        ))}
        <button className="link small-link" onClick={() => setNemesisSheet(true)}>
          📜 Fiche de la Némésis : histoire, PV, paquet de colère
        </button>
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

      {sheet && (
        <Modal label="Fiche de classe" onClose={() => setSheet(null)}>
          <ClassSheet classId={sheet} config={config} />
        </Modal>
      )}
      {nemesisSheet && (
        <Modal label="Fiche de la Némésis" onClose={() => setNemesisSheet(false)}>
          <NemesisSheet nemesisId={config.nemesisId} config={config} />
        </Modal>
      )}

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
