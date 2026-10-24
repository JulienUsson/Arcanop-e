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
2. **L'hôte** choisit « Créer une partie » : archers, classes, niveau (coefficient), Némésis, difficulté, flèches par volée.
3. **Connexion des téléphones** (onglet *Archers*) : l'hôte crée une invitation (QR code), l'archer la scanne depuis « Rejoindre », affiche sa réponse, que l'hôte scanne à son tour. L'archer choisit ensuite son Gardien et découvre sa fiche de classe. Un code texte copiable remplace le QR si une caméra manque.
4. **Partie** : un guide de phase indique à chacun ce qu'il faut faire (🃏 Carte → 🗣️ Conseil → 🏹 Tir → 🎯 Saisie → ⚔️ Résolution). L'hôte tire les cartes d'ordre de tour et fait avancer les étapes ; chaque carte, chaque résolution et chaque pouvoir s'affiche en plein écran sur tous les téléphones.
5. **Fin de partie** : résumé, distinctions et statistiques par archer.

Les archers sans téléphone sont saisis par l'hôte (onglet *Saisie*). L'hôte peut aussi corriger la saisie d'un archer connecté et annuler la dernière action.

## Règles

### Le blason
Chaque archer tire sur un blason partagé en quatre quadrants par deux traits perpendiculaires.
- Le **score** (anneaux standard de 1 à 10) fixe la puissance : `score × coefficient`, arrondi.
- Le **quadrant** fixe l'action, selon la classe.
- **Cordon** défavorable : la zone inférieure compte. À la saisie, on touche directement la zone inférieure, le tap donne toujours le score de la zone touchée.
- **Trait** favorable : on touche le trait, l'application propose les actions des deux quadrants voisins (les quatre au centre).
- Chaque flèche dans le jaune (9 ou 10) ajoute un point de jauge. À 3 points, le pouvoir de l'esprit est activable.

### Les esprits
La spécialité occupe deux quadrants opposés (haut-gauche et bas-droit), de sorte que chaque trait sépare toujours la spécialité d'une autre action.

| Classe | Haut-gauche | Haut-droit | Bas-gauche | Bas-droit | Pouvoir |
|---|---|---|---|---|---|
| 🐺 Loup | Némésis | Créatures | Racines | Némésis | Dégâts de toute l'équipe doublés à la prochaine volée |
| 🐻 Ours | Créatures | Némésis | Soin | Créatures | Retarde une racine d'une manche |
| 🦉 Hibou | Racines | Némésis | Créatures | Racines | Révèle la prochaine carte de la Corruption |
| 🦌 Cerf | Soin | Némésis | Racines | Soin | Soigne l'Arbre-Cœur de 15 PV |

### Les actions
- **Némésis** : dégâts directs.
- **Créatures / Racines** : dégâts à la cible désignée 🎯 (touchée sur le tableau de combat par n'importe quel joueur pendant le conseil), le surplus passe aux suivantes. Sans cible en jeu, la flèche frappe la Némésis : aucune flèche n'est perdue.
- **Soin** : rend la moitié de la puissance en PV à l'Arbre-Cœur.

### Une manche
1. Le paquet d'ordre de tour est mélangé (Normal : 3 Volée, 2 Némésis).
2. Volée : conseil, tir réel, saisie, résolution.
3. Némésis : une carte du paquet de colère — **Attaque** (effet immédiat), **Créature** (reste en jeu et agit à chaque fin de manche), **Racine** (compte à rebours, éclot en fin de manche si elle n'est pas détruite).
4. Une fois le paquet d'ordre épuisé, l'hôte termine la manche : les créatures agissent, les racines décomptent.

Victoire quand la Némésis tombe à 0 PV. Défaite quand l'Arbre-Cœur tombe à 0 PV, ou quand la Némésis doit jouer alors que son paquet de colère est vide.

### Difficultés

| | Facile | Normal | Difficile |
|---|---|---|---|
| Ordre de tour par manche | 3 Volée, 1 Némésis | 3 Volée, 2 Némésis | 2 Volée, 2 Némésis |
| PV Némésis par flèche de volée | 50 | 70 | 70 |
| PV Arbre-Cœur | 60 | 45 | 40 |
| Cartes de colère (niveaux 1/2/3) | 4/4/3 | 4/5/4 | 4/5/5 |
| Multiplicateur des dégâts à l'Arbre | ×1,2 | ×1,8 | ×1,9 |

### Mise à l'échelle
Les PV de la Némésis sont proportionnels au nombre de flèches tirées par volée (archers × flèches). Les PV des créatures et racines, et les soins de la Corruption, suivent le facteur `flèches / 12` (minimum 0,4). Les dégâts à l'Arbre-Cœur suivent `0,5 + 0,5 × facteur`, borné entre 0,6 et 1,5, pour qu'une petite équipe, qui soigne moins, ne soit pas écrasée.

Le coefficient de niveau sert de handicap : un débutant (×1,3 ou ×1,5) pèse autant qu'un tireur confirmé, l'équipe reste mixte.

### Équilibrage
`BALANCE=1 npx vitest run src/game/balance.test.ts` simule des centaines de parties avec des archers virtuels (score moyen 5, 6,5 ou 8, 75 % de flèches dans le quadrant visé). Repères actuels pour quatre archers, une par classe, 3 flèches : Facile gagné presque toujours ; Normal ~99 % à 6,5 de moyenne et ~55 % à 5 en 12 à 18 volées ; Difficile ~25 % à 6,5 et ~95 % à 8. Les archers virtuels jouent de façon optimale ; une vraie équipe fait moins bien.

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
- **STUN** publics Google et Cloudflare pour traverser les NAT quand un réseau mobile est disponible. **Secours hors ligne** : l'hôte active le partage de connexion, les archers s'y connectent, et les candidats locaux (adresses ou mDNS) suffisent ; aucun accès Internet n'est requis.
- **Reconnexion** : chaque téléphone archer conserve un jeton aléatoire. L'hôte mémorise l'association jeton → archer (sauvegardée avec la partie). Un archer déconnecté demande une nouvelle invitation, et son `hello` le réattribue automatiquement à son personnage, ancienne connexion fermée. L'archer garde le dernier état reçu affiché pendant la coupure. Si un téléphone est perdu, l'hôte peut « libérer » l'archer, qu'un autre téléphone reprend.

### PWA
`vite-plugin-pwa` (Workbox, `generateSW`) précache toute l'application ; le manifeste déclare un affichage `standalone` en portrait. L'écran reste allumé pendant la partie (Wake Lock API) et la narration peut être lue à voix haute (Web Speech API, voix française si disponible), réglage propre à chaque appareil.

### Saisie
Le blason est un SVG en coordonnées normalisées : le score vaut `10 − ⌊r × 10⌋`, ce qui place naturellement le cordon dans la zone inférieure. Chaque zone (anneau × quadrant) se comporte comme un bouton : un tap l'illumine entièrement et ajoute la flèche. Pas de liste d'impacts à gérer : le carquois se vide, un total par action s'affiche sous le blason, et ↶ retire la dernière flèche. La tolérance des traits est d'au moins 8 pixels écran de part et d'autre, pour qu'un doigt les atteigne sans viser au pixel près. Le brouillon de chaque volée survit aux changements d'onglet ; une volée envoyée reste corrigeable jusqu'à la résolution.

### Guidage et mise en scène
- **Étapes de volée** : l'état de jeu porte l'étape (`council`, `shoot`, `input`) ; l'hôte la fait avancer (« Au pas de tir ! », « Flèches tirées : saisie ») et les téléphones des archers basculent d'eux-mêmes sur le tableau de combat pendant le conseil, puis sur leur cible.
- **Conseil** : `src/game/advice.ts` liste les menaces (racine sur le point d'éclore, créatures, Arbre-Cœur affaibli, pouvoirs prêts, cartes restantes) et propose à chaque archer une cible parmi ses quadrants. Ce ne sont que des suggestions : l'équipe décide.
- **Scène plein écran** : chaque événement du moteur porte un type (`intro`, `volley`, `nemesis`, `resolve`, `round`, `power`, `victory`, `defeat`) et ses données (carte jouée, détail flèche par flèche). La scène retourne la carte, égrène les flèches une à une avec leurs dégâts, puis attend un tap ; « Passer » accélère.
- **Retours visuels** : chiffres de dégâts et de soins flottants, portraits qui tremblent sous les coups, barres de vie avec traînée, créatures qui apparaissent, racines urgentes qui clignotent. Les animations respectent `prefers-reduced-motion`.
- **Sons** : effets synthétisés en direct (Web Audio, aucun fichier), désactivables par 🎵 ; la lecture vocale de la narration se règle par 🗣️.
- **Fiche de classe** : rôle, blason annoté, spécialité, action absente, pouvoir et conseils. Accessible depuis la mise en place, le choix du Gardien, l'onglet *Fiche* de l'archer, la saisie de l'hôte et les règles.

## Feuille de route
- Mode campagne.
- Némésis supplémentaires (ajouter une entrée dans `src/game/nemesis.ts`).
