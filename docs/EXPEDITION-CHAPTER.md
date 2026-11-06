# Outbinched — composition du premier chapitre

Livraison du 6 novembre 2026. Base : `7c1f444afb50a90b1a227692102202d348193d1c`.
Autorisation : enchaîner cinq gros chantiers sans validation, avec correction prioritaire du premier contact du pouce droit. Accès : `?expedition=1`. La version classique reste le défaut.

## 1. Composition visuelle et coût des décors

Palette continue dans l’espace, chemin central chaud, sous-bois plus froid au nord ; suppression du bruit aléatoire par sommet. Prairie, fleurs et roseaux instanciés, avenue de bornes vers le château, aqueduc lointain, panneaux à pictogrammes, colombages et cheminées, pavement et statues du donjon. Les archers, traqueurs et le gardien ont des poses différenciées ; les préparations d’attaque affichent un cercle au sol.

La fusion des géométries statiques préserve les transformations, matériaux, marqueurs, grilles, oiseaux et éléments conditionnels du village. Mesure structurelle hors navigateur : 290 objets fusionnés en moins dans la vallée, 102 dans la crypte, 69 dans la citerne. Ce ne sont pas des gains FPS mesurés. Les personnages restent des modèles procéduraux stylisés, sans nouvelle bibliothèque d’assets ni animation capturée.

## 2. Rencontres et gardien

Quatre attaques ordonnées en deux phases : onde de marteau (saut possible), balayage frontal (contournement/parade), trois cercles de foudre à délai (sortir de la zone), croix de lames. Le gardien fixe son orientation pendant la préparation ; les impacts vérifient la distance, hauteur et visibilité. Les avertissements de foudre sont limités à neuf et supprimés au changement de zone. Les ennemis quittant leur périmètre rentrent chez eux ; ceux de la vallée ne poursuivent plus dans le village.

Trajectoires de vue subjective propres aux familles : estoc, taillade, frappe lourde, tension de l’arc et lancement magique. Indicateurs distincts à l’impact, critique et parade ; vignette de dommage. Le timing des dégâts ordinaires reste celui du système précédent : l’animation ne constitue pas une simulation physique du contact de lame.

## 3. Progression du chapitre

Six jalons contextuels affichés une seule fois et conservés dans le journal : village, passage du pont, citerne, crypte, gardien, retour. Les trois zones restent librement explorables ; ces jalons ne sont pas des portes artificielles.

Énigme des trois cloches sur la rive profonde de la citerne : la stèle fournit l’ordre Lune → Source → Soleil. Une mauvaise note réinitialise la séquence ; une réussite donne la Perle des marées et 35 or une seule fois. Une stèle près du sanctuaire rassemble les trois mémoires et donne la Braise qui ne meurt pas. Les chemins physiques et la capacité aérienne conservent leurs tests précédents. Les six classes peuvent conclure les états de quête dans les simulations ; aucun parcours complet en navigateur n’est revendiqué.

## 4. Builds et économie

Six nouvelles reliques, un emplacement équipé : bonus après esquive, mana à la consommation de marque, endurance sur parade, puissance/armure à faible vie, souffle avec récupération d’endurance, soins sur compétence offensive. Tables de butin garanties par famille : or, minerais, XP, ingrédient et reliques de certains adversaires. Historique des douze dernières trouvailles dans le sac. Les anciennes parties reçoivent les reliques correspondant aux adversaires déjà vaincus, sans nouveau versement de monnaie.

Douze maîtrises de niveau 5 (deux par classe), après trois rangs de spécialisation, coût de deux points. Effets : tempo, garde économique, tir patient, esquive économique, puissance contre armure, régénération/coût de mana, vol de vie contre résistance, riposte sur marque, retour de mana sur soin, posture offensive, dégâts à faible vie, endurance/vie au meurtre. Une maîtrise active ; réorientation remboursant ses deux points.

Comparaison des dégâts de base dans l’arsenal. Recyclage d’armes/tenues en réserve : deux minerais et 8/6 or. Équipement porté, tenue initiale et armes uniques protégés. Les renforts d’une arme recyclée sont perdus ; les règles rejettent les transactions répétées ou sans propriété.

## 5. Commandes, interface et robustesse

Les gestes sont reçus sur le conteneur stable du jeu, au lieu du seul canvas ; les contrôles interactifs et dialogues sont exclus. Les éléments décoratifs laissent passer les contacts. Capture de pointeur, annulation et perte de capture par doigt : perdre le doigt droit n’arrête plus le gauche. Reprise réinitialisant les contacts ; déplacer franchement la vue quitte la garde automatique. Le partage gauche/droite utilise les dimensions du canvas.

Réglages persistants : sensibilité, inversion verticale, raccourcis gestuels, mouvements de caméra, adaptation graphique. La résolution est plafonnée à 2 073 600 pixels ; après quatre mesures consécutives sous 42 FPS en jeu, le mode automatique baisse d’un cran. Choisir manuellement une qualité désactive l’adaptation jusqu’à sa réactivation. Mesures FPS/ms/appels disponibles dans Pause même sur mobile. Marges tenant compte des zones sûres d’écran.

Sauvegarde principale inchangée, copie de secours du dernier état valide. Lecture de la copie si la principale est corrompue ; un échec d’écriture de la copie n’empêche pas l’écriture principale. Validation des nouvelles maîtrises, reliques et états d’énigme.

## Vérification et limites

- `npm run typecheck:game` : réussi.
- `npm test` : 197 tests réussis, build Pages inclus ; 29 nouveaux tests dans `expedition-chapter.test.mjs`.
- Couverture : premier glissement à travers les éléments décoratifs, boutons exclus, annulation d’un doigt, sensibilité, compteurs/contre-jeu du boss, foudre différée, orientation, limites de poursuite, profils d’armes, reliques, transactions, maîtrises, énigmes, migration, secours et fusion de géométrie.
- Nouvel essai navigateur le 6 novembre : échec avant le rendu de scène, `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `Error creating WebGL context`. L’écran d’erreur prévu s’affiche correctement. Aucun FPS réel, test Safari iPhone ou jugement visuel du monde n’est validé.
- Le problème tactile signalé dispose d’un correctif causal plausible et d’un test de gestion d’événements ; sa disparition sur l’appareil de l’utilisateur reste à confirmer.

## Reprise

Modules nouveaux : `controls.ts`, `combat.ts`, `chapter.ts`, `relics.ts`, `mastery.ts`, `landscape.ts`, `batching.ts`. Leur intégration touche `game.ts`, `scene.ts`, `progress.ts`, `world.ts` et les panneaux. Consulter les branches distantes avant une édition parallèle. Priorité suivante : essai visuel avec WebGL disponible et retour iPhone, puis ajustements de composition et d’équilibrage basés sur ce qui est observé.
