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

Les taps simples attendent 180 ms pour distinguer un double tap sans déclencher une attaque parasite. Le maintien engage la garde après 140 ms ; la fenêtre parfaite tactile dure 260 ms. Une caméra légèrement ajustable reste disponible pendant la garde. Le déplacement ne déclenche jamais d’esquive sur un simple relâchement. Une boucle brève du pouce permet d’esquiver même après un déplacement prolongé.

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

## Finition du ressenti 0.3.1

En présence d’un ennemi proche, immobiliser le pouce droit après avoir dirigé la caméra lève la garde ; un glissement ample la relâche et reprend la caméra, sans relever le pouce. Ce comportement ne s’active pas en exploration sans menace. Le maintien initial reste disponible partout. Une garde demandée pendant la récupération d’une frappe est conservée jusqu’à son ouverture ; une esquive demandée en fin de frappe conserve sa direction. Relâcher la garde ou déplacer largement la caméra annule la défense en attente.

Les coups du joueur possèdent maintenant un départ, un impact matériel court et une impulsion verticale discrète. Les textures sonores d’impact restent sous le signal de timing. Les anticipations lourdes du Gardien passent par deux poses, suivies d’une pose de récupération ; la transformation garde Sulfuras visible avant l’apparition des Thunderfury.

## Rendu HD et Ultra

Dans Pause → Commandes → Qualité visuelle, choisir Auto, Rétro (426 × 240), HD (1920 × 1080) ou Ultra (3840 × 2160). Le choix est conservé après rechargement. Auto tient compte de la taille d’écran et réduit progressivement la résolution si le temps moyen des images dépasse 28 ms. Les modes manuels restent fixes.

Les atlas du Gardien et des accessoires utilisent des poses de 384 × 384 au lieu de 192 × 192, à partir des sources originales plus détaillées. Le panorama conserve davantage de sa définition source ; le sol et les murs possèdent davantage d’échantillons en HD/Ultra. Le format 4K décrit la surface de rendu : les sprites conservent volontairement leurs pixels visibles et leur définition propre. Ultra consomme davantage de ressources ; Auto est recommandé sur téléphone.

## Fondations RPG 0.4.0

Six classes : Lame, Rôdeur, Arcanes, Occultiste, Chantre des os et Chevalier du sang. Chaque classe possède trois compétences distinctes avec coûts, portées et recharges indépendants. F/G/H sur PC (réassignables, boutons latéraux compris). Sur mobile : double tap droit pour I ; second tap suivi d’un glissement vertical haut/bas pour II/III. Le geste directionnel ne déplace pas la caméra. La fiche SAC décrit les compétences et affiche leurs coûts et recharges.

Dix statistiques effectives : armure, pénétration physique, résistance magique, pénétration magique, chance critique, dégâts critiques supplémentaires, puissance, régénération de mana, vol de vie et réduction de recharge. Les attaques de base, tirs, sorts et compétences offensives utilisent le même calcul. Les ennemis lourds ont davantage d’armure, les tireurs davantage de résistance magique ; le Gardien possède les deux. Son onde inflige des dégâts magiques, ses armes des dégâts physiques. La pénétration est soustraite avant réduction ; une résistance effective de 100 divise les dégâts par deux. Les critiques et l’exposition sont multiplicatifs ; la pénétration ne peut pas faire passer les résistances sous zéro. Exposition dure cinq secondes et augmente les dégâts reçus de 25 %. Les critiques portent une mention distincte.

La puissance et les défenses progressent avec le niveau. Toutes les classes régénèrent leur mana ; les attaques de base restent disponibles sans mana. Les sauvegardes anciennes conservent leur voie, les nouvelles identités sont validées. Les effets temporaires et les recharges sont suspendus en pause et réinitialisés au chargement. Les identités visuelles des armes restent partagées par famille (lame, arc, bâton) ; l’équilibrage des nouvelles classes reste une première passe.

La reprise ne reboucle plus en pause si le navigateur refuse la capture du pointeur : la caméra reste utilisable en glissant avec le clic gauche dans la scène. Les boutons latéraux sont interceptés dans le jeu et pendant leur association, y compris les événements souris natifs qui déclenchent Précédent/Suivant.

## Monde vivant et haute fréquence 0.4.1

Huit nouveaux types d’accessoires peints sur atlas transparent, répartis en trente placements décoratifs : arches, chêne à lanterne, sanctuaires, campement, fleurs, champignons lumineux, mémoriaux et puits. Lucioles, détails de bannière et vol d’oiseaux sont animés selon le temps, indépendamment du nombre d’images. Les ruines disposent d’une texture de pierre moussue. Ces décors ne changent ni les collisions ni les interactions des bornes.

Les occultistes portent un foyer lunaire, les chantres un diapason, les arcanistes un cristal ; le chevalier du sang possède une lame marquée. Les six classes ont leur palette et leurs effets de compétence. La recharge s’affiche sous chaque compétence ; le manque de mana est distingué d’une recharge. L’exposition ennemie affiche sa durée. Le vol de vie ne soigne plus à partir des dégâts excédant la vie restante de la cible.

Options : objectif Auto de 60, 120 ou 240 FPS et compteur réel, conservés au rechargement. Aucun plafond logiciel à 60 FPS : requestAnimationFrame suit ce que le navigateur et l’écran permettent. Un objectif n’est pas une garantie de débit ; HD/Ultra sont fixes, Auto réduit sa définition si le budget d’images est dépassé. Les effets ne changent pas de vitesse selon le taux de rafraîchissement. Les décors sont dessinés par plages visibles plutôt que par colonnes de deux pixels ; terrain et sol sont réutilisés tant que la caméra ne change pas. Les mesures headless ne certifient pas 240 FPS sur un écran physique.

## Les histoires de la vallée · 0.4.2

Trois découvertes facultatives donnent vie aux accessoires : feu du dernier pèlerin près du départ, puits aux lucioles à l’est, bannière sans nom près des ruines. Le tap gauche / l’interaction habituelle examine le lieu. Les récompenses (petite quantité d’or, expérience, potion au camp et mana au puits) sont uniques et enregistrées. Revenir sur un lieu permet de relire son histoire. Un ennemi actif à moins de trois unités empêche de fouiller ; le Gardien scellé ne bloque pas l’exploration. Ces découvertes restent disponibles jusqu’au départ de l’expédition des Veilleurs.

Le journal affiche les lieux retrouvés et des indices pour les autres. Une boussole indique la direction pendant l’exploration et s’efface durant le duel. Fumées discrètes, braises et lanternes complètent les détails animés. Le vent varie doucement, le bois reçoit de rares notes d’oiseaux et le puits un léger son d’eau, coupés en présence d’une menace proche. Les commandes audio stables ne sont plus renvoyées au moteur sonore à chaque image.

Se relever remet à zéro les trois recharges et l’exposition ; les découvertes déjà acquises restent enregistrées. Les anciennes sauvegardes démarrent avec zéro découverte sans changer leur progression.

## Prêt pour la première session · 0.4.3

Les options regroupent volume, secousses, fréquence visée, définition et commandes dans un panneau défilant ; le bouton de fermeture reste accessible après défilement. L’aide affiche les gestes sur mobile et les raccourcis réellement configurés sur PC. Les boutons latéraux sont nommés 4 et 5. Réassigner une touche utilisée libère son ancienne action, affichée « Non assignée » ; les paramètres de commandes endommagés sont filtrés au chargement.

Une barre de vie discrète identifie les ennemis ordinaires visés ou récemment touchés. Un arc cuivré bref indique la direction d’un coup reçu, sans flash supplémentaire ni modification de la parade.

## Volumes pixel-art · 0.5.0

Le décor proche et les combattants ne regardent plus toujours la caméra comme des cartes peintes. Le moteur projette des assemblages de boîtes orientées, choisit les faces visibles, applique une lumière par face et les coupe derrière les murs. Tourner autour d’un arbre, d’une arche, d’une borne ou d’un ennemi révèle donc ses côtés et son dessus. La taille des volumes est raccordée à l’échelle historique du raycaster pour garder les distances de combat et le cadrage du niveau.

Les silhouettes de combat restent lisibles par leur géométrie : arc transversal pour les tireurs, masse lourde pour les brutes, Sulfuras en phase I et paire d’armes bleutées en phase II. Les mouvements de charge et de frappe déplacent les segments d’arme. Le mode Auto affiche les modèles les plus proches en priorité ; les modes plus détaillés élargissent ce budget.

### Cohérence de la caméra · 0.5.1

Les armes tenues sont maintenant construites par faces en espace caméra. La lame montre son épaisseur et son reflet supérieur ; l’arc est composé de branches distinctes ; chaque foyer magique conserve un volume propre à la classe. La parade lève une coque épaisse avec nervures séparées. Ces pièces suivent exactement le balancement, les combos, le recul et les animations déjà utilisés par le combat.

Les mémoires, l’ancrage et la porte du château partagent l’occlusion des murs. Les corps vaincus s’affaissent en géométrie sombre avant dissipation. Les anciens atlas restent disponibles comme archives artistiques mais ne sont plus demandés au chargement, réduisant le transfert initial d’environ 2,4 Mo.

Options → Votre chronique : export JSON de la progression et import avec aperçu, annulation et vérification. Les fichiers anciens sans enveloppe restent acceptés ; format inconnu, données incompatibles ou fichier illisible sont refusés sans modifier la partie. L’import conserve une copie de la partie actuelle dans un emplacement distinct des sauvegardes automatiques, exportable depuis les options jusqu’au prochain import. Après validation, le jeu revient à l’accueil : Continuer charge la progression importée. Les commandes, le volume et la qualité graphique restent locaux à l’appareil. Les données importées sont normalisées comme toute sauvegarde, notamment les ressources et la position.

### Rythme des combats · 0.4.4

Les attaques de base partagent une récupération de 0,28 à 0,40 seconde selon la classe et le type de frappe. Dans les 0,18 dernières secondes, une seule attaque peut être préparée ; elle est annulée par une défense préparée ou une pause. L’arc bénéficie du même mécanisme. L’esquive prend la direction clavier/pouce au moment de la commande ; sans direction elle part en arrière. Une esquive ne peut être renouvelée pendant ses 0,34 seconde d’activité, et aucune attaque ou compétence ne part pendant ce geste.

Les frappes rapprochées réussies sur la même cible forment un cycle 1–2–3–1. Changer de cible, manquer sa frappe, subir un coup direct ou laisser passer la fenêtre relance la série au premier coup. Les temps du combat utilisent des secondes, indépendamment de la fréquence de rendu.
