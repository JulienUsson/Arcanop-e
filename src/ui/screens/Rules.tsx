import { ACTION_ICONS, ACTION_LABELS, CLASS_IDS, SPECIALTY_MULTIPLIER } from '../../game/classes';
import { GAUGE_MAX } from '../../game/difficulty';
import { CRIT_POINTS } from '../../game/target';
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
          <li>Il assigne chaque flèche à une action de son esprit : par exemple le 9 sur la Némésis, le 8 et le 6 sur les racines.</li>
          <li>Pour chaque action, l’appli additionne ses flèches et applique le multiplicateur de niveau.</li>
        </ol>
        <ul>
          <li>
            <strong>Niveau de l’archer</strong> : Facile (cordon favorable, ×1,2, jauge dès le 9), Normal (cordon défavorable, ×1, jauge
            dès le 10) ou Difficile (cordon défavorable, ×0,8, jauge dès le 10). Cordon favorable : une flèche sur la ligne entre deux zones compte pour la zone supérieure ; défavorable :
            pour la zone inférieure (sur le cordon du 9 → 8).
          </li>
          <li>
            <strong>X = coup critique</strong> : la flèche vaut {CRIT_POINTS} points au lieu de 10.
          </li>
          <li>
            Flèches assignées à la <strong>spécialité</strong> de l’esprit : ×{String(SPECIALTY_MULTIPLIER).replace('.', ',')}. Chaque esprit
            a aussi une action absente.
          </li>
          <li>
            La jauge se charge de 1 sur un 10 et de 2 sur un X ; au niveau Facile, un 9 la charge aussi de 1. À {GAUGE_MAX}, le pouvoir de l’esprit
            s’active.
          </li>
        </ul>
      </section>
      <section className="panel">
        <div className="panel-title">Les actions</div>
        <ul>
          <li>
            {ACTION_ICONS.nemesis} {ACTION_LABELS.nemesis} : dégâts directs à la Némésis.
          </li>
          <li>
            {ACTION_ICONS.creatures} {ACTION_LABELS.creatures} : dégâts à la créature choisie pour la flèche, le surplus passe à la suivante.
          </li>
          <li>
            {ACTION_ICONS.roots} {ACTION_LABELS.roots} : dégâts à la racine choisie pour la flèche, avant qu’elle n’éclose.
          </li>
          <li>
            {ACTION_ICONS.heal} {ACTION_LABELS.heal} : soigne l’Arbre-Cœur (la moitié des points des flèches assignées).
          </li>
        </ul>
        <p className="hint">
          La cible se choisit au moment d’assigner la flèche ; par défaut, la créature la plus faible ou la racine la plus proche d’éclore.
          Sans créature ou racine en jeu, la flèche frappe la Némésis.
        </p>
      </section>
      <section className="panel">
        <div className="panel-title">Les Gardiens ont des PV</div>
        <ul>
          <li>Chaque archer a des PV (20, 15 ou 12 selon la difficulté).</li>
          <li>
            Certaines attaques et créatures frappent <strong>un Gardien au hasard</strong> (parmi ceux encore debout), d’autres
            <strong> tous les Gardiens</strong>.
          </li>
          <li>
            À 0 PV, l’archer est <strong>à terre</strong> : il continue de tirer, mais ses flèches et son pouvoir ne comptent plus que
            moitié.
          </li>
          <li>
            Une flèche de {ACTION_ICONS.heal} Soin peut viser un Gardien plutôt que l’Arbre-Cœur ; un archer à terre soigné se relève avec
            toute sa force. Le pouvoir du Cerf soigne aussi chaque Gardien.
          </li>
        </ul>
      </section>
      <section className="panel">
        <div className="panel-title">Créatures ou racines ?</div>
        <ul>
          <li>
            {ACTION_ICONS.creatures} <strong>Créatures</strong> : une menace <em>continue</em>. Elles restent en jeu et agissent à chaque fin
            de manche (blesser l’Arbre-Cœur, soigner la Némésis, vider les jauges) tant qu’on ne les abat pas. Plus tôt elles tombent,
            moins elles coûtent. Spécialité de l’Ours.
          </li>
          <li>
            {ACTION_ICONS.roots} <strong>Racines</strong> : une menace <em>à retardement</em>. Elles ne font rien pendant leur compte à
            rebours ⏳, puis éclosent d’un coup en fin de manche (gros dégâts, gros soin pour la Némésis, invocation) et disparaissent. Il faut
            les détruire avant la fin du compte. Spécialité du Hibou ; l’Ours peut en retarder une.
          </li>
        </ul>
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
          <li>Carte Volée : 🏹 conseil autour du tableau de combat puis tir réel, 🎯 saisie des scores et assignation des flèches, ⚔️ résolution par l’hôte.</li>
          <li>Carte Némésis : elle joue une carte de son paquet de colère (attaque, créature ou racine).</li>
          <li>Fin de manche : chaque créature agit et le compte à rebours des racines diminue.</li>
        </ol>
        <p>
          Victoire si la Némésis tombe à 0 PV. Défaite si l’Arbre-Cœur tombe à 0 PV.
        </p>
        <p>
          🔥 <strong>Furie finale</strong> : quand le paquet de colère est vide, chaque carte Némésis déclenche un Déchaînement qui frappe
          l’Arbre-Cœur et tous les Gardiens, plus fort à chaque fois. Il faut l’achever avant que l’Arbre ne cède.
        </p>
        <p className="hint">Tous les multiplicateurs (niveau, spécialité, soin, à terre, Meute) sont arrondis à l’entier inférieur.</p>
      </section>
      <button className="primary big wide" onClick={onBack}>
        Retour
      </button>
    </div>
  );
}
