# Arcanopée — Les Gardiens de la Lisière

Jeu coopératif pour séances de tir à l'arc loisir. Les archers tirent sur de vraies cibles, l'application sert de maître du jeu et gère le combat contre une Némésis, dans l'esprit d'Aeon's End.

> Une forêt sacrée est envahie par la Corruption. Les archers sont les Gardiens de la Lisière, liés à des esprits animaux, et doivent protéger l'Arbre-Cœur.

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests du moteur de jeu et de la signalisation
npm run build      # vérification des types + build PWA dans dist/
npm run preview    # sert le build (service worker actif)
```

La caméra (scan des QR codes) exige un contexte sécurisé : `localhost` en développement, HTTPS en production.

Le workflow `.github/workflows/deploy.yml` publie le build sur GitHub Pages à chaque push sur `main` (activer Pages avec la source « GitHub Actions » dans les réglages du dépôt). Le chemin de base est fourni par la variable `BASE_PATH`.

## Déroulé d'une séance

1. **Avant d'aller au pas de tir**, chaque archer ouvre l'application et l'installe (« Ajouter à l'écran d'accueil »). Elle fonctionne ensuite entièrement hors ligne.
2. **L'hôte** choisit « Créer une partie » : archers, classes, niveau de chaque archer, Némésis, difficulté, volées de 3 ou 6 flèches. À moins de quatre archers, des compagnons complètent l'équipe.
3. **Connexion des téléphones** (onglet *Archers*) : l'hôte crée une invitation (QR code), l'archer la scanne depuis « Rejoindre », affiche sa réponse, que l'hôte scanne à son tour. L'archer choisit ensuite son Gardien et découvre sa fiche de classe. Un code texte copiable remplace le QR si une caméra manque.
4. **Partie** : un guide de phase indique à chacun ce qu'il faut faire (🏹 Conseil & tir → 🎯 Saisie → ⚔️ Résolution → 💀 Riposte). L'hôte fait avancer les étapes et révèle les cartes de la Némésis ; chaque carte, chaque résolution et chaque pouvoir s'affiche en plein écran sur tous les téléphones.
5. **Fin de partie** : résumé, distinctions et statistiques par archer.

Les archers sans téléphone et les compagnons sont saisis par l'hôte (onglet *Saisie*). L'hôte peut aussi corriger la saisie d'un archer connecté et annuler la dernière action.

## Règles

### La volée
Chaque archer tire ses flèches (3 par défaut) sur un blason classique, puis saisit leurs scores sur son téléphone.
- **Niveau de l'archer** : trois niveaux seulement.

  | Niveau | Cordon | Multiplicateur | Jauge |
  |---|---|---|---|
  | Facile | favorable : la zone supérieure compte | ×1,2 | 9, 10 et X |
  | Normal | défavorable : la zone inférieure compte (cordon du 9 → 8) | ×1 | 10 et X |
  | Difficile | défavorable | ×0,8 | 10 et X |

  L'écran de saisie rappelle la règle du cordon propre à l'archer.
- **X = coup critique** : la flèche vaut 15 points au lieu de 10.
- **Répartition des flèches** : chaque flèche est assignée à une action de l'esprit. Par exemple, sur une volée 6, 8, 9, le Loup peut envoyer le 9 sur la Némésis et le 8 et le 6 sur les racines.
- **Puissance** : pour chaque action, somme des flèches assignées × multiplicateur de niveau. Les flèches assignées à la **spécialité** comptent ×1,5. Chaque esprit a une action absente.
- **Arrondis** : tous les multiplicateurs (niveau, spécialité, soin, archer à terre, Meute) sont arrondis à l'entier inférieur.
- **Jauge** : un 10 ajoute un point de jauge, un X en ajoute deux ; au niveau Facile, un 9 en ajoute aussi un. À 3 points, le pouvoir de l'esprit est activable. Le 9 est réservé aux débutants pour que les pouvoirs restent rares chez les archers confirmés : à 8 de moyenne, un archer Normal charge son pouvoir toutes les trois volées environ.

### Les esprits

| Classe | Spécialité ×1,5 | Actions ×1 | Absente | Pouvoir |
|---|---|---|---|---|
| 🐺 Loup | Némésis | Créatures, Racines | Soin | Dégâts de toute l'équipe doublés à la prochaine volée |
| 🐻 Ours | Créatures | Némésis, Soin | Racines | Retarde une racine d'un tour de la Némésis |
| 🦉 Hibou | Racines | Némésis, Créatures | Soin | Révèle la prochaine carte de la Corruption |
| 🦌 Cerf | Soin | Némésis, Racines | Créatures | Soigne l'Arbre-Cœur de 15 PV |

### Les actions
- **Némésis** : dégâts directs.
- **Créatures / Racines** : dégâts à la créature ou à la racine choisie pour la flèche au moment de l'assignation (par défaut la créature la plus faible, la racine la plus proche d'éclore) ; le surplus passe aux suivantes. Sans cible en jeu, la flèche frappe la Némésis : rien n'est perdu.
  - **Créatures** : menace continue. Elles restent en jeu et agissent à chaque tour de la Némésis tant qu'elles ne sont pas abattues.
  - **Racines** : menace à retardement. Inactives pendant leur compte à rebours, elles éclosent d'un coup quand il atteint zéro (gros effet) puis disparaissent.
- **Soin** : rend la moitié des points des flèches assignées, à l'Arbre-Cœur (par défaut) ou à un Gardien choisi.

### Les Gardiens
- Chaque archer a des PV : 20, 15 ou 12 selon la difficulté.
- Certaines attaques et créatures frappent **un Gardien au hasard** (parmi ceux encore debout), d'autres **tous les Gardiens** (Pluie d'épines, Souffle de cendre, Ronces jaillissantes, Hurlement de Mordelune, Loup-Ronce, Cerf Corrompu).
- À 0 PV, l'archer est **à terre** : il continue de tirer, mais ses flèches et son pouvoir ne comptent que moitié (la Meute passe de ×2 à ×1,5, le Bramement du Cerf soigne moitié moins).
- Une flèche de Soin assignée à un Gardien le soigne ; à terre, il se relève avec toute sa force. Le Bramement de la Sève soigne aussi 5 PV à chaque Gardien.
- Un Gardien à terre ne fait pas perdre la partie.

### Volée et riposte
La partie alterne simplement : les archers tirent, la Némésis riposte. Il n'y a plus de paquet d'ordre de tour ni de carte Volée à tirer.
1. **Volée** : conseil et tir réel (une seule étape), saisie, résolution.
2. **Riposte** : l'hôte révèle une carte du paquet de colère — **Attaque** (effet immédiat), **Créature** (reste en jeu), **Racine** (compte à rebours). Puis chaque créature agit et le compte à rebours de chaque racine diminue ; une racine à zéro éclot. Carte et réactions forment un **tour de la Némésis**.
3. Une créature ou une racine qui vient d'arriver n'agit qu'au tour suivant : l'équipe a toujours une volée pour réagir.

**Volées de 3 ou 6 flèches** : une volée de 6 flèches vaut deux volées de 3, la riposte compte donc deux tours de la Némésis (deux cartes, les créatures agissent deux fois). Les PV des adversaires ne dépendent pas du format.

**Compagnons** : la partie est équilibrée pour quatre Gardiens. À moins de quatre archers, des compagnons 🤖 complètent l'équipe, en prenant par défaut les esprits encore libres (modifiables à la mise en place). Chaque compagnon a un niveau, choisi à la mise en place : Novice (7 de moyenne par flèche), Aguerri (8, par défaut) ou Vétéran (9). L'appli n'affiche jamais ces moyennes aux joueurs, seulement le nom du niveau. Au début de chaque volée, elle tire leurs flèches selon leur niveau (un 10 sur trois est un X) ; l'hôte les répartit entre leurs actions comme pour un archer, en choisissant les cibles. Ils ont des PV, une jauge et un pouvoir comme les autres. Un téléphone ne peut pas prendre le contrôle d'un compagnon.

Victoire quand la Némésis tombe à 0 PV. Défaite quand l'Arbre-Cœur tombe à 0 PV.

### Furie finale
Quand la Némésis doit jouer alors que son paquet de colère est vide, elle entre en **Furie finale** : chaque tour de la Némésis commence par un Déchaînement au lieu d'une carte qui inflige 10 dégâts à l'Arbre-Cœur et 3 à chaque Gardien, puis +6 et +1 à chaque Déchaînement suivant, avant les multiplicateurs de difficulté et de mise à l'échelle. Les créatures et racines en jeu continuent d'agir. La partie n'est plus perdue d'office à l'épuisement du paquet : l'équipe garde une dernière chance d'abattre la Némésis, mais la Furie s'emballe vite et finit par abattre l'Arbre-Cœur. Le paquet reste donc un chronomètre, avec une fin dramatique plutôt qu'un couperet. Le tableau de combat annonce « Furie imminente » quand le paquet est vide, la fiche de la Némésis affiche le prochain Déchaînement et le conseil le signale en priorité.

### Difficultés

| | Facile | Normal | Difficile |
|---|---|---|---|
| PV Némésis (quatre Gardiens) | 1300 | 1600 | 1780 |
| PV Arbre-Cœur | 60 | 45 | 40 |
| Cartes de colère (niveaux 1/2/3) | 5/5/4 | 4/5/5 | 4/5/5 |
| Multiplicateur des dégâts à l'Arbre | ×1,2 | ×2,4 | ×2,2 |
| PV de chaque Gardien | 20 | 15 | 12 |
| Multiplicateur des dégâts aux Gardiens | ×0,75 | ×1 | ×1,25 |

### Mise à l'échelle
Tout est réglé pour quatre Gardiens en volées de 3 flèches ; les compagnons ramènent toute équipe plus petite à quatre.
- **Volées de 6 flèches** : PV de la Némésis ×0,9. Ses deux cartes tombent d'affilée, sans volée entre les deux pour soigner, ce qui rend le format un peu plus dur à PV égaux.
- **Plus de quatre archers** : les PV de la Némésis, des créatures et des racines, et les soins de la Corruption, suivent `archers / 4` ; les PV de l'Arbre-Cœur, ses dégâts et le Bramement de la Sève suivent `0,5 + 0,5 × archers / 4` (au plus ×1,5). Les PV de la Némésis reçoivent en plus une correction mesurée par simulation, car une grande équipe profite d'un Hurlement de la Meute qui double les dégâts de tout le monde et de plus de pouvoirs par volée :

  | Archers | 5 | 6 | 7 | 8 |
  |---|---|---|---|---|
  | 3 flèches | ×1,08 | ×1,14 | ×1,28 | ×1,37 |
  | 6 flèches | ×1,2 | ×1,32 | ×1,45 | ×1,65 |

Le niveau de l'archer sert de handicap : un débutant en Facile (cordon favorable, ×1,2) pèse autant qu'un tireur confirmé en Difficile (×0,8), l'équipe reste mixte.

### Équilibrage
`BALANCE=1 npx vitest run src/game/balance.test.ts --silent=false` simule des centaines de parties avec des archers virtuels (score moyen 6,5, 8 ou 9, un 10 sur trois est un X) qui envoient toutes leurs flèches sur l'action la plus utile. La référence est un archer à **8 de moyenne par flèche** : le jeu doit rester un défi pour lui. Repères actuels pour quatre archers, une par classe, 3 flèches, niveau Normal :

| Moyenne | Facile | Normal | Difficile |
|---|---|---|---|
| 6,5 | ~75 % | ~0 % | ~0 % |
| 8 | ~100 % | ~60 % | ~25 % |
| 9 | ~100 % | ~90 % | ~90 % |

À 8 de moyenne, la simulation fait aussi varier la taille de l'équipe (de 1 à 8 archers complétés par des compagnons, chaque classe représentée avant d'en doubler une, moyenne sur toutes les compositions) en 3 et 6 flèches : Normal reste entre 55 et 70 % de victoires, Difficile entre 20 et 40 % (~10 % à huit archers en 3 flèches), Facile toujours gagné.

Les parties durent 12 à 16 volées de 3 flèches, ou 6 à 8 volées de 6 flèches. En Normal à 8 de moyenne, une partie sur trois se joue pendant la Furie finale : le paquet de colère sert de chronomètre. Une équipe plus faible joue en Facile, ou ses archers prennent le niveau Facile (×1,2, cordon favorable, jauge dès le 9). La simulation compte aussi les archers mis à terre : rarement en Normal, 1 à 2 par partie en Difficile. Les archers virtuels jouent de façon optimale ; une vraie équipe fait moins bien.

## Architecture

```
src/
  game/        moteur pur : types, classes, blason, Némésis, réducteur, tests
  net/         signalisation (SDP compressé, base45), WebRTC, sessions hôte et archer
  ui/          React : écrans, blason cliquable, tableau de combat, QR, voix
```

### Moteur
`reduce(state, action)` est une fonction pure : l'état du jeu est un objet sérialisable qui contient aussi la graine du générateur pseudo-aléatoire (mulberry32). Conséquences :
- l'annulation côté hôte consiste à reprendre l'état précédent ;
- l'état se sauvegarde tel quel dans `localStorage` : l'hôte qui recharge l'application retrouve la partie ;
- le même état est diffusé aux archers, qui affichent le tableau avec les mêmes composants ;
- les tests et la simulation d'équilibrage n'ont besoin d'aucun navigateur.

### Réseau
- **Topologie en étoile** : le téléphone hôte détient l'état et fait autorité. Les archers envoient `hello`, `claim`, `submit`, `power`, `focus` ; l'hôte valide (un archer ne peut saisir que pour son personnage, une saisie hors de la volée courante est refusée) puis renvoie l'état complet à chacun. L'état complet tient en quelques kilo-octets : pas de synchronisation différentielle à maintenir.
- **Canal de données négocié** (`negotiated: true, id: 0`) : les deux pairs le créent eux-mêmes, aucun échange supplémentaire n'est nécessaire.
- **Signalisation par QR** sans serveur : l'offre puis la réponse sont transmises après la collecte complète des candidats ICE (pas de trickle), avec un délai maximal de 3,5 s pour ne pas bloquer hors ligne.
- **SDP compressé** : seuls les champs variables sont transmis — ufrag, pwd, empreinte DTLS SHA-256 (32 octets bruts), rôle DTLS, et au plus 8 candidats UDP (IPv4 sur 4 octets, IPv6 sur 16, noms mDNS `uuid.local` sur 16). Le SDP complet d'un canal de données est reconstruit à l'arrivée. Une offre tient en ~80 à 150 octets, contre 600 à 1 000 pour le SDP brut.
- **Base45** pour le QR : son alphabet est exactement le mode alphanumérique des QR codes (5,5 bits par caractère), soit ~8,25 bits par octet, presque aussi dense que le mode binaire, mais sans les problèmes de décodage des octets bruts par l'API `BarcodeDetector`. Le code texte de secours utilise base64url avec le préfixe `arc1.`, plus sûr au copier-coller (base45 contient des espaces).
- **Correspondance offre/réponse** : un identifiant de session aléatoire de 32 bits voyage dans l'offre et revient dans la réponse ; l'hôte rejette une réponse destinée à une autre invitation.
- **Adresses masquées (mDNS)** : sans permission caméra ou micro, Chrome et Safari remplacent l'adresse locale du téléphone par un nom `uuid.local`. Chrome sur Android ne sait pas résoudre ces noms : deux téléphones Android sur le même Wi-Fi ne se trouvent alors pas, et la connexion tourne jusqu'à l'échec. Avant de préparer l'invitation (hôte) et la réponse (archer), l'appli ouvre donc brièvement la caméra : la permission accordée, le navigateur publie la vraie adresse locale. La caméra sert de toute façon à scanner les QR codes. Si elle est refusée, un avertissement s'affiche sous le QR code.
- **Échec rapide et diagnostic** : l'hôte surveille l'état ICE après avoir scanné la réponse ; en cas d'échec (environ 25 s), il affiche les adresses échangées de chaque côté (locales, masquées, internet) et la piste à suivre : autoriser la caméra si une adresse est masquée ; si les deux téléphones ont une adresse sur le même réseau (même préfixe IPv4) sans se joindre, c'est un téléphone qui bloque le trafic local, typiquement un navigateur iOS autre que Safari sans l'autorisation « Réseau local » ; sinon, passer par le partage de connexion de l'hôte (Wi-Fi qui isole les appareils).
- **STUN** publics Google et Cloudflare pour traverser les NAT quand un réseau mobile est disponible. **Secours hors ligne** : l'hôte active le partage de connexion, les archers s'y connectent, et les candidats locaux (adresses ou mDNS) suffisent ; aucun accès Internet n'est requis.
- **Reconnexion** : chaque téléphone archer conserve un jeton aléatoire. L'hôte mémorise l'association jeton → archer (sauvegardée avec la partie). Un archer déconnecté demande une nouvelle invitation, et son `hello` le réattribue automatiquement à son personnage, ancienne connexion fermée. L'archer garde le dernier état reçu affiché pendant la coupure. Si un téléphone est perdu, l'hôte peut « libérer » l'archer, qu'un autre téléphone reprend.

### PWA
`vite-plugin-pwa` (Workbox, `generateSW`) précache toute l'application ; le manifeste déclare un affichage `standalone` en portrait. L'écran reste allumé pendant la partie (Wake Lock API) et la narration peut être lue à voix haute (Web Speech API, voix française si disponible), réglage propre à chaque appareil.

### Saisie
La saisie se fait en deux temps, sans viser de zone sur un dessin de blason :
1. **Scores** : un pavé de gros boutons aux couleurs des anneaux (X, 10 à 1, M). Le rappel de la règle du cordon de l'archer (favorable ou défavorable selon son niveau) reste affiché au-dessus. ↶ retire la dernière flèche.
2. **Assignation** : dès la dernière flèche, chaque flèche apparaît sur une ligne avec les actions de l'esprit ; elles sont toutes assignées d'avance à l'action suggérée (ou à la spécialité). Un toucher change l'action d'une flèche, « Tout sur » les assigne toutes d'un coup. Une flèche sur Créatures ou Racines affiche les cibles en jeu (PV, compte à rebours) pour choisir laquelle viser ; il n'y a plus de ciblage collectif pendant le conseil. Le total de chaque action (dégâts, PV) s'affiche en direct, bonus de spécialité et Hurlement de la Meute compris.

Le moteur revalide toute saisie : scores bornés, X seulement sur un 10, aucune action pour une flèche hors cible, flèche assignée à une action absente renvoyée sur la spécialité, cible inconnue remplacée par la cible par défaut au moment de la résolution. Pour un compagnon, l'écran saute directement à l'assignation et le moteur impose les scores qu'il a tirés lui-même avec la graine de la partie. Le brouillon de chaque volée survit aux changements d'onglet ; une volée envoyée reste corrigeable jusqu'à la résolution.

### Guidage et mise en scène
- **Étapes** : l'état de jeu alterne la phase `volley` (étape `council` pour le conseil et le tir, puis `input`) et la phase `nemesis` (riposte, avec le nombre de cartes déjà révélées). L'hôte fait avancer (« Flèches tirées : saisie », « Résoudre », « Carte de la Némésis ») et les téléphones des archers basculent d'eux-mêmes sur le tableau de combat pendant le conseil, puis sur leur cible.
- **Conseil** : `src/game/advice.ts` liste les menaces (racine sur le point d'éclore, créatures, Gardiens à terre ou blessés, Arbre-Cœur affaibli, pouvoirs prêts, riposte à venir, cartes restantes) et propose à chaque archer une action, qui sert aussi de répartition par défaut. Ce ne sont que des suggestions : l'équipe décide.
- **Scène plein écran** : chaque événement du moteur porte un type (`intro`, `nemesis`, `fury`, `resolve`, `power`, `victory`, `defeat`) et ses données (carte jouée, détail de chaque volée : scores, action de chaque flèche, effets). La scène retourne la carte, égrène les volées une à une avec leurs effets et les coups critiques, puis attend un tap ; « Passer » accélère.
- **Effets** : un calque de particules (`src/ui/fx.ts`, `FxLayer`) projette éclats violets quand la Némésis encaisse, échardes et flash rouge quand l'Arbre-Cœur est touché, feuilles pour les soins, étincelles dorées et tremblement d'écran pour un X, fumée quand une créature tombe, confettis de feuilles à la victoire, pétales noirs à la défaite. Les boutons ondulent sous le doigt, les PV défilent au même rythme que la barre (dont la piste découpe proprement le remplissage et la traînée de dégâts), les chiffres de dégâts jaillissent, les créatures abattues se désagrègent, la Némésis est entourée d'une couronne d'épines tournante (le portrait sépare l'animation de repos et celle d'impact pour qu'elles ne se coupent pas) et l'écran pulse en rouge quand l'Arbre-Cœur faiblit. Les animations respectent `prefers-reduced-motion`.
- **Tableau retenu pendant la scène** : tant qu'une scène plein écran est ouverte, le tableau de combat garde l'état d'avant l'événement ; à la fermeture, il passe au nouvel état et toutes les animations (dégâts, morts, jauges) se jouent sous les yeux des joueurs.
- **Dialogues** : aucune boîte native du navigateur ; les confirmations (résoudre sans toutes les saisies, libérer un archer, changer de Gardien, abandonner) passent par un dialogue aux couleurs du jeu.
- **Sons** : effets synthétisés en direct (Web Audio, aucun fichier), désactivables par 🎵 ; la lecture vocale de la narration se règle par 🗣️.
- **Fiche de la Némésis** : portrait, histoire, PV et cartes de colère restantes, cartes jouées après chaque volée, conseils pour la vaincre et liste complète de son paquet (niveau, PV, effet, carte déjà jouée ou en jeu). Accessible en touchant son portrait sur le tableau de combat, depuis la mise en place, l'onglet *Fiche* de l'archer et les règles.
- **Fiche de l'Arbre-Cœur** : histoire, légende, PV, menaces en jeu, ce qui le blesse et comment le soigner. Accessible en touchant l'arbre sur le tableau de combat.
- **Fiche de classe** : rôle, multiplicateurs par action, spécialité, action absente, pouvoir et conseils. Accessible depuis la mise en place, le choix du Gardien, l'onglet *Fiche* de l'archer, la saisie de l'hôte et les règles.

## Feuille de route
- Mode campagne.
- Némésis supplémentaires (ajouter une entrée dans `src/game/nemesis.ts`).
