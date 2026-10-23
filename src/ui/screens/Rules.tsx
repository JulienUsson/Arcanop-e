import { ACTION_ICONS, ACTION_LABELS, CLASS_IDS, CLASSES } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { QuadrantMap } from '../components/QuadrantMap';

export function Rules({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen rules">
      <h1>Règles</h1>
      <section className="panel">
        <div className="panel-title">Le blason</div>
        <p>
          Chaque archer tire sur son propre blason, partagé en quatre quadrants par deux traits. Le <strong>score</strong> de la flèche
          fixe la puissance de l’effet (multipliée par le coefficient de niveau), le <strong>quadrant</strong> fixe l’action.
        </p>
        <ul>
          <li>Cordon entre deux zones : la zone inférieure compte. Touchez directement la zone inférieure.</li>
          <li>Flèche sur un trait : touchez le trait, puis choisissez l’une des deux actions voisines.</li>
          <li>Chaque flèche dans le jaune (9 ou 10) remplit la jauge. À {GAUGE_MAX}, le pouvoir de l’esprit s’active.</li>
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
            {ACTION_ICONS.heal} {ACTION_LABELS.heal} : soigne l’Arbre-Cœur (la moitié de la puissance).
          </li>
        </ul>
        <p className="hint">Sans créature ou racine en jeu, la flèche file droit vers la Némésis.</p>
      </section>
      <section className="panel">
        <div className="panel-title">Les esprits</div>
        {CLASS_IDS.map((id) => (
          <div key={id} className="rule-class">
            <h3>
              {CLASSES[id].emoji} {CLASSES[id].name} — {CLASSES[id].spirit}
            </h3>
            <QuadrantMap classId={id} />
            <p>
              <strong>{CLASSES[id].powerName}</strong> : {CLASSES[id].powerText}
            </p>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="panel-title">Une manche</div>
        <ol>
          <li>Un paquet d’ordre de tour est mélangé : des cartes Volée 🏹 et des cartes Némésis 💀.</li>
          <li>Carte Volée : l’équipe tient conseil, tire une volée réelle, puis chacun saisit ses impacts. L’hôte résout.</li>
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
