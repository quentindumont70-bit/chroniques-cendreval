# Cendreval — gestes et Gardien

## Essayer la version

`npm ci` puis `npm run build:pages`. Servir `pages-dist` avec un serveur HTTP.
Le déploiement GitHub Pages est déclenché par un push sur `main`.

Sur mobile : paysage recommandé. Le menu **Gestes** reste accessible pour retrouver les commandes.

| Zone | Geste | Action |
|---|---|---|
| Gauche | Glisser et maintenir | Déplacement analogique |
| Gauche | Aller-retour bref (42 px minimum) | Esquive dans la direction du départ |
| Gauche | Tap | Interaction contextuelle |
| Gauche | Double tap | Potion |
| Droite | Glisser | Caméra |
| Droite | Tap | Attaque de la voie équipée |
| Droite | Double tap | Capacité de la voie |
| Droite | Maintenir sans glisser | Parade puis garde maintenue |

Les taps simples attendent 180 ms pour distinguer un double tap sans déclencher une attaque parasite. Le maintien engage la garde après 140 ms ; la fenêtre parfaite tactile dure 200 ms. Une caméra légèrement ajustable reste disponible pendant la garde. Le déplacement ne déclenche jamais d’esquive sur un simple relâchement. Une boucle brève du pouce permet d’esquiver même après un déplacement prolongé.

## Le signal de défense

Un cercle discret se referme devant l’ennemi. Le tintement et la couleur dorée précèdent l’impact réel et prennent en compte le délai du maintien tactile. Une croix cuivrée indique une attaque à esquiver. Le signal suit aussi le retard des feintes. Pas d’éclair plein écran pour annoncer la parade.

## Gardien et vallée

- 220 PV ; phase II à 110 PV. Les anciennes sauvegardes convertissent proportionnellement les PV du premier Gardien.
- Phase I : Sulfuras, frappes lourdes. Phase II : deux Thunderfury, rythme plus rapide et estocades enchaînées. Transition de 2,2 secondes et pause offensive.
- Huit poses par phase : repos, deux pas, anticipation, attaque haute, frappe, blessure et chute.
- Clairière accessible depuis le sud et le nord ; trois bornes reliées par les chemins. Bosquets, lanternes, arches, chariot, stèles et végétation sont disposés à des positions fixes.
- Décor lointain séparé des accessoires proches. Atlas d’environnement trié en profondeur et découpé contre les murs. Traversée de grille pour les rayons, en remplacement de la marche par petits pas.
- La vue reste subjective. Une vraie caméra troisième personne avec un personnage visible n’est pas implémentée dans ce moteur 2,5D.

## Vérifications

- `node --test tests/world.test.mjs` (Node 22.18+ / 24) : accès aux objectifs, cartes du château, intersections de rayons, timing.
- Vérification TypeScript du jeu : `npx tsc --noEmit --strict --jsx react-jsx --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --lib DOM,ES2022 app/page.tsx app/valley.ts app/world-art.ts app/world-map.ts app/raycast.ts app/parry-cue.ts app/touch-controls.tsx`
- `tests/game-smoke.cjs` utilise Playwright (à fournir dans NODE_PATH ou installer localement) et Chromium. `CHROMIUM_PATH` permet de choisir l’exécutable ; `CENDREVAL_SCREENSHOTS` choisit le dossier des captures. Le test sert lui-même `pages-dist` sur le port 4173 et contrôle les deux doigts simultanés, les gestes, la perte de focus, la sauvegarde, les phases et la pause.

Les essais tactiles automatisés utilisent Chromium émulé ; le ressenti et l’audio doivent encore être évalués sur un véritable iPhone/Safari.

## Assets

Images créées avec l’outil imagegen intégré puis préparées en WebP pour le jeu :

- `public/warden-sulfuras-atlas.webp` : même chevalier en huit poses, Sulfuras, transparence.
- `public/warden-thunderfury-atlas.webp` : même atlas, deux Thunderfury, reflets cyan limités.
- `public/valley-props-atlas.webp` : atlas 4 × 2, pin, bouleau, rochers, arche, chariot, lanterne, fougères et stèle.
- `public/cendreval-horizon-v3.webp` : château, montagnes et ciel doré ; arbres de premier plan retirés pour laisser la parallaxe aux accessoires du monde.

Les sprites sont dessinés sans lissage. Les bornes et la lame du joueur sont du pixel art rendu par Canvas.

## Fluidité et ressources du mage

Le tap du mage lance désormais une étincelle gratuite (12 dégâts de base), qui rend 3 mana lorsqu’elle touche. La mana se régénère naturellement à 5 points par seconde pendant le jeu ; la pause suspend cette récupération. Le pouvoir consomme toujours 25 mana, et la flamme secondaire au clavier 15. Les bornes restaurent toute la réserve. La barre de mana et le menu Gestes expliquent cette récupération. Les attaques rapprochées peuvent être mises en attente, y compris celles du mage.

Les taps attendent 180 ms, et le second contact annule immédiatement le tap simple en attente afin d’éviter une frappe parasite pendant un double tap légèrement plus lent. La caméra répond dès 8 pixels de glissement. Le sol et le ciel couvrent maintenant les 48 pixels supplémentaires nécessaires à l’inclinaison maximale, sans exposer la couleur de fond sous la carte.

## Chronique I — passe de finition 0.3

Le premier chapitre forme une boucle complète : choix de voie, arrivée dans la vallée, sacoche du chariot en option, trois bornes, duel à deux phases, écran de victoire, accueil de Valbrume et récompense persistante.

- Les attaques et les pouvoirs respectent les murs ; les ennemis cherchent un passage lorsque la poursuite directe est obstruée.
- L’esquive parcourt 1,08 unité en 180 ms, avec déplacement balayé et glissement contre les murs. La fenêtre de riposte après parade parfaite est adaptée au délai des gestes tactiles.
- Rôdeur sans munitions : attaque de proximité et récupération d’une flèche toutes les 2,8 secondes jusqu’à un minimum de six. Mage : attaque de base gratuite, récupération passive et par impact.
- Ambiance procédurale discrète (vent, nappes, pas), réglable avec le volume du jeu. Les signaux de combat restent prioritaires. Les réglages absents conservent leur vraie valeur par défaut.
- Pause automatique et sauvegarde lors de la perte de focus. Sauvegarde périodique toutes les 12 secondes, aux bornes et aux événements de progression importants.
- Sauvegarde validée au chargement : ressources bornées, classes connues, position replacée hors des murs et récupération de la copie de secours si le fichier principal est illisible. Le stockage bloqué signale clairement que la partie ne peut pas être enregistrée.
- Interface du duel épurée ; pouvoir prêt visible sans bouton supplémentaire. L’outil Test est déplacé dans le menu de pause. L’écran de victoire prend la priorité sur tous les messages de combat.

Commandes de vérification : `npm test`, `npm run typecheck:game`, puis `tests/game-smoke.cjs` pour les interactions tactiles. `tests/full-level.cjs` joue le chapitre par les commandes normales ; `CENDREVAL_CLASS=LAME`, `RÔDEUR` ou `ARCANES` choisit la voie, et `CENDREVAL_PORT` permet d’isoler les parcours. La lecture du progrès sauvegardé sert uniquement à observer les positions et les résultats ; aucun raccourci de combat ni modification des statistiques n’est utilisé dans ce parcours complet.

La publication GitHub Pages lance maintenant le typage et les tests avant de déployer.
