interface Props {
  canResume: boolean;
  canRejoin: boolean;
  onHost: () => void;
  onResume: () => void;
  onJoin: () => void;
  onRules: () => void;
}

export function Home({ canResume, canRejoin, onHost, onResume, onJoin, onRules }: Props) {
  return (
    <div className="screen home">
      <div className="hero">
        <div className="hero-emblem">🌳</div>
        <h1>Arcanopée</h1>
        <p className="subtitle">Les Gardiens de la Lisière</p>
        <p className="lore">
          La Corruption ronge la forêt sacrée. Liés aux esprits animaux, les archers protègent l’Arbre-Cœur, une volée après l’autre.
        </p>
      </div>
      <div className="home-actions">
        {canResume && (
          <button className="primary big" onClick={onResume}>
            Reprendre la partie en cours
          </button>
        )}
        <button className={canResume ? 'secondary big' : 'primary big'} onClick={onHost}>
          Créer une partie <small>(téléphone hôte)</small>
        </button>
        <button className="secondary big" onClick={onJoin}>
          {canRejoin ? 'Retourner à ma partie' : 'Rejoindre une partie'} <small>(archer)</small>
        </button>
        <button className="ghost" onClick={onRules}>
          Règles du jeu
        </button>
      </div>
    </div>
  );
}
