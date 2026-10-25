import { useEffect } from 'react';
import { CLASSES } from '../../game/classes';
import { getNemesis } from '../../game/nemesis';
import type { GameState, Player } from '../../game/types';

function average(p: Player): string {
  const shots = p.stats.arrows;
  return shots ? (p.stats.totalScore / shots).toFixed(1) : '—';
}

function damage(p: Player): number {
  return p.stats.damageNemesis + p.stats.damageCreatures + p.stats.damageRoots;
}

function best<T>(items: T[], score: (item: T) => number): T | null {
  const sorted = [...items].sort((a, b) => score(b) - score(a));
  return sorted[0] && score(sorted[0]) > 0 ? sorted[0] : null;
}

export function EndSummary({ state, actions }: { state: GameState; actions: React.ReactNode }) {
  useEffect(() => window.scrollTo(0, 0), []);
  if (state.phase.kind !== 'over') return null;
  const nemesis = getNemesis(state.config.nemesisId);
  const victory = state.phase.result === 'victory';
  const players = state.players;
  const awards = [
    { label: 'Plus gros dégâts', player: best(players, damage), value: (p: Player) => `${damage(p)} dégâts` },
    { label: 'Meilleure moyenne', player: best(players, (p) => (p.stats.arrows ? p.stats.totalScore / p.stats.arrows : 0)), value: (p: Player) => `${average(p)} pts` },
    { label: 'Gardien de l’Arbre', player: best(players, (p) => p.stats.healing), value: (p: Player) => `${p.stats.healing} PV soignés` },
    { label: 'Rempart vivant', player: best(players, (p) => p.stats.damageTaken), value: (p: Player) => `${p.stats.damageTaken} dégâts encaissés` },
    { label: 'Œil d’or', player: best(players, (p) => p.stats.yellows), value: (p: Player) => `${p.stats.yellows} flèches jaunes` },
  ];

  return (
    <div className={`end-summary ${victory ? 'victory' : 'defeat'}`}>
      <h1>{victory ? 'Victoire !' : 'Défaite…'}</h1>
      <p className="reason">{state.phase.reason}</p>
      <p className="story">{victory ? nemesis.victory : nemesis.defeat}</p>

      <section className="panel">
        <div className="panel-title">Bilan de la partie</div>
        <ul className="facts">
          <li>
            {state.volleyCount} volée{state.volleyCount > 1 ? 's' : ''}{state.fury > 0 ? `, ${state.fury} Déchaînement${state.fury > 1 ? 's' : ''}` : ''}
          </li>
          <li>
            {nemesis.name} : {state.nemesis.hp} / {state.nemesis.maxHp} PV
          </li>
          <li>
            Arbre-Cœur : {state.tree.hp} / {state.tree.maxHp} PV
          </li>
          <li>Cartes de colère restantes : {state.wrathDeck.length}</li>
        </ul>
      </section>

      <section className="panel awards">
        {awards.map(
          (a) =>
            a.player && (
              <div key={a.label} className="award">
                <small>{a.label}</small>
                <strong>
                  {CLASSES[a.player.classId].emoji} {a.player.name}
                </strong>
                <span>{a.value(a.player)}</span>
              </div>
            ),
        )}
      </section>

      <section className="panel stats">
        <div className="panel-title">Statistiques par archer</div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Archer</th>
                <th>Flèches</th>
                <th>Points</th>
                <th>Moy.</th>
                <th>Jaunes</th>
                <th>10</th>
                <th>Ratés</th>
                <th>Némésis</th>
                <th>Créat.</th>
                <th>Racines</th>
                <th>Soin</th>
                <th>Pouvoirs</th>
                <th>PV</th>
                <th>Encaissés</th>
                <th>À terre</th>
                <th>Meill. volée</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <th>
                    {CLASSES[p.classId].emoji} {p.name}
                  </th>
                  <td>{p.stats.arrows}</td>
                  <td>{p.stats.totalScore}</td>
                  <td>{average(p)}</td>
                  <td>{p.stats.yellows}</td>
                  <td>{p.stats.tens}</td>
                  <td>{p.stats.misses}</td>
                  <td>{p.stats.damageNemesis}</td>
                  <td>{p.stats.damageCreatures}</td>
                  <td>{p.stats.damageRoots}</td>
                  <td>{p.stats.healing}</td>
                  <td>{p.stats.powersUsed}</td>
                  <td>
                    {p.hp}/{p.maxHp}
                  </td>
                  <td>{p.stats.damageTaken}</td>
                  <td>{p.stats.knockouts}</td>
                  <td>{p.stats.bestVolley}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="footer-actions">{actions}</div>
    </div>
  );
}
