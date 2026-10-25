import { ACTION_ICONS, ACTION_LABELS, CLASS_IDS, SPECIALTY_MULTIPLIER } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { CRIT_MULTIPLIER } from '../../game/target';
import { MORDELUNE } from '../../game/nemesis';
import { ClassSheet } from '../components/ClassSheet';
import { NemesisSheet } from '../components/NemesisSheet';

export function Rules({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen rules">
      <h1>Règles</h1>
      <section className="panel">
        <div className="panel-title">La volée</div>
        <ol>
          <li>Chaque archer tire ses flèches sur un blason classique.</li>
          <li>
            Il saisit le score de chaque flèche : X, 10 à 1, ou M pour une flèche hors cible.
          </li>
          <li>
            L’appli additionne la volée et applique le coefficient de niveau : c’est la réserve de points.
          </li>
          <li>L’archer répartit librement ses points entre les actions de son esprit.</li>
        </ol>
        <ul>
          <li>
            <strong>Cordon défavorable</strong> : une flèche qui touche la ligne entre deux zones compte pour la zone inférieure (sur le
            cordon du 9 → 8).
          </li>
          <li>
            <strong>X = coup critique</strong> : la flèche compte ×{CRIT_MULTIPLIER}, soit 20 points.
          </li>
          <li>
            Points placés sur la <strong>spécialité</strong> de l’esprit : ×{String(SPECIALTY_MULTIPLIER).replace('.', ',')}. Chaque esprit
            a aussi une action absente.
          </li>
          <li>Chaque flèche dans le jaune (9, 10 ou X) remplit la jauge. À {GAUGE_MAX}, le pouvoir de l’esprit s’active.</li>
        </ul>
      </section>
      <section className="panel">
        <div className="panel-title">Les actions</div>
        <ul>
          <li>
            {ACTION_ICONS.nemesis} {ACTION_LABELS.nemesis} : dégâts directs à la Némésis.
          </li>
          <li>
            {ACTION_ICONS.creatures} {ACTION_LABELS.creatures} : dégâts à la créature ciblée (🎯), le surplus passe à la suivante.
          </li>
          <li>
            {ACTION_ICONS.roots} {ACTION_LABELS.roots} : dégâts à la racine ciblée, avant qu’elle n’éclose.
          </li>
          <li>
            {ACTION_ICONS.heal} {ACTION_LABELS.heal} : soigne l’Arbre-Cœur (la moitié des points placés).
          </li>
        </ul>
        <p className="hint">Sans créature ou racine en jeu, ces points frappent la Némésis.</p>
      </section>
      <section className="panel">
        <div className="panel-title">Les esprits</div>
        {CLASS_IDS.map((id) => (
          <div key={id} className="rule-class">
            <ClassSheet classId={id} />
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="panel-title">La Némésis</div>
        <NemesisSheet nemesisId={MORDELUNE.id} />
      </section>
      <section className="panel">
        <div className="panel-title">Une manche</div>
        <ol>
          <li>Un paquet d’ordre de tour est mélangé : des cartes Volée 🏹 et des cartes Némésis 💀.</li>
          <li>Carte Volée : 🗣️ conseil autour du tableau de combat, 🏹 tir réel, 🎯 saisie des scores et répartition des points, ⚔️ résolution par l’hôte.</li>
          <li>Carte Némésis : elle joue une carte de son paquet de colère (attaque, créature ou racine).</li>
          <li>Fin de manche : chaque créature agit et le compte à rebours des racines diminue.</li>
        </ol>
        <p>
          Victoire si la Némésis tombe à 0 PV. Défaite si l’Arbre-Cœur tombe à 0 PV ou si la Némésis doit jouer alors que son paquet de
          colère est vide.
        </p>
      </section>
      <button className="primary big wide" onClick={onBack}>
        Retour
      </button>
    </div>
  );
}
