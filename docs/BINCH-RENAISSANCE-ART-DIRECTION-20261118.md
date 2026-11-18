# La Binch Renaissance — Direction artistique & recette P1
18 novembre 2026 · Branche `feature/binch-visual-renaissance-20261118` · PR #234 (brouillon)

## L'intention

Faire de **La Binch** un vrai tableau de bord d'aventurier fantastique, riche et original, plutôt qu'une accumulation de tuiles techniques. Ambiance : **citadelle dans les brumes, métal forgé, bronze, clair de lune et végétation**, avec les accents propres à chacune des neuf classes. La lisibilité et la réactivité priment sur les animations lourdes.

Ce chantier est une **refonte du rendu**, pas une réécriture du compagnon : aucune modification du carnet AH, du profil WoW, des classes, des prix ou des décisions. Chaque portail doit ouvrir un onglet qui existe déjà. Aucun stockage externe.

## Livrable P1 actuellement codé

| Surface | Travail présent sur la PR |
|---|---|
| Identité du monde | `renaissance-citadel.svg` original, local et vectoriel (pas de banque d'images ni ressource payante) |
| Quartier général | Scène panoramique, gravures, lumière, portrait, identité et niveau valorisés |
| Neuf classes | Auras décoratives spécifiques raccordées à l'identité existante |
| Races | Motif de rune sur la scène dérivé de l'ascendance sélectionnée |
| Ambiances | Crépuscule, nuit lunaire et braises ; préférence conservée dans ce navigateur |
| Portails | Navigation réelle vers progression, talents, métiers et guilde |
| Parcours initial | Onboarding refondu, sélection de classe/race plus lisible |
| Chapitres | Même grammaire de panneaux gravés pour atlas, métiers, GM, équipement, Specs |
| iPhone | Grilles 4→2 colonnes, navigation tactile, marges et titres réadaptés aux petits écrans |
| Accessibilité | Focus clavier contrasté, cible tactile, `prefers-reduced-motion`, `forced-colors` |

## Structure

- `public/binch/visual-renaissance.css` : système de surface, couleurs, scène d'accueil, portails, responsive, classes/races.
- `public/binch/visual-renaissance-worlds.css` : onboarding et écrans secondaires.
- `public/binch/visual-renaissance.js` : création non destructive des éléments décoratifs et navigation via les onglets existants.
- `public/binch/renaissance-citadel.svg` : dessin vectoriel original local.
- `tests/binch-visual-renaissance.test.mjs` : test des trois ambiances, de la navigation, du montage unique, du chargement CSS et des thèmes.
- `.github/workflows/verify.yml` : tests automatisés et analyse XML du SVG.

Les styles sont chargés **après** les thèmes préexistants. Les modules et les données restent intacts. Les anciennes images externes ne sont ni remplacées arbitrairement ni utilisées pour prouver des éléments du jeu.

## Critères de recette — dix chantiers graphiques

1. **Accueil** : le nouveau panorama et le médaillon restent lisibles pour un Druide Farouche.
2. **Classe** : comparer Druide, Mage, Guerrier, Chaman et les cinq autres ; les auras changent sans toucher au profil.
3. **Race** : vérifier les runes Tauren/Orc/Troll/Mort-vivant et celles de l'Alliance, sans contenu inventé.
4. **Ambiance** : passer de crépuscule à lune et braises ; recharger et retrouver la préférence.
5. **Navigation** : essayer les quatre portails ; aucun clic n'ouvre de mauvais onglet ou de lien mort.
6. **Onboarding** : choisir une race, une classe et des métiers avec clavier et écran tactile.
7. **Expédition** : carte, timeline, objectifs épinglés et boutons restent opérants.
8. **Métiers/GM/Specs** : consulter un écran de chaque module, contrôler les fonds et les formulaires.
9. **Mobile** : vérifier iPhone en portrait/paysage et un écran Windows à 1080p ; pas de débordement ni de texte masqué.
10. **Qualité** : tests GitHub verts, pas de blocage du scroll, préférence de mouvement réduit respectée ; revue puis déploiement contrôlé.

## Phases suivantes, après validation visuelle

- **P2 — livré sur cette branche** : neuf scènes vectorielles de classes, distinctes dans leur architecture et leur palette. Fallback générique pour le profil inconnu, plus la galerie `public/binch/renaissance-atelier.html` pour la revue des neuf scènes.
- **P3 — livré côté CSS** : salle de guerre GM, cartes Faith et trésors mis en scène dans `visual-renaissance-chambers.css`, sans accès supplémentaire au jeu ni modification des récompenses.
- **P4 — livré sur cette branche** : neuf sceaux de classe forgés, deux emblèmes de métiers (Minage/Ingénierie), portails Accueil supplémentaires vers Faith et Trésors lorsque ces modules existent, carte d'expédition et talents plus immersifs, objectifs épinglés plus lisibles.
- **P5 — livré sur cette branche** : transitions d'entrée courtes sur les pages et les trésors réellement possédés, jamais de boucle permanente ; mode graphique léger volontaire, stocké localement, et respect de `prefers-reduced-motion`.
- **P6 — à valider** : vérification visuelle sur iPhone et Windows, revue du conflit éventuel entre styles puis fusion/déploiement uniquement autorisés.

## Limites et responsabilité

**Code présent sur branche ≠ déploiement sur GitHub Pages.** Une CI verte ne valide pas le rendu sur un véritable iPhone. La PR reste **DRAFT** ; aucune fusion avant revue, aucune dépense, aucun changement des données métier ni de la Bourse AH.

## Galerie de validation des neuf classes (livrée dans la PR)

La page `public/binch/renaissance-atelier.html` est une **prévisualisation autonome** de la direction artistique : elle contient les neuf scènes réellement utilisées sur l'accueil, avec des vignettes et un clic pour agrandir le paysage de la classe. Ce n'est ni une nouvelle app, ni une démonstration de progression WoW, et aucune donnée de jeu n'est lue.

Les nouveaux fichiers sont :
`renaissance-world-druid.svg`, `renaissance-world-warrior.svg`, `renaissance-world-mage.svg`, `renaissance-world-priest.svg`, `renaissance-world-paladin.svg`, `renaissance-world-rogue.svg`, `renaissance-world-hunter.svg`, `renaissance-world-shaman.svg`, `renaissance-world-warlock.svg`.

**Contrôles CI :** 21 SVG analysables (10 paysages, 9 emblèmes de classe, 2 métiers), raccordement aux styles, responsive, six vrais portails, sauvegarde des trois ambiances et du mode léger, mouvement réduit, galerie complète et absence de modifications économiques. Les CI ne remplacent pas la recette graphique réelle.

## Golipette P3 — refonte graphique complémentaire, 18 novembre 2026

Dix chantiers de création ont été traités sur la PR #234 (en attente de revue) :

1. Neuf blasons de classes originaux en SVG et raccord à l'emblème du personnage.
2. Sceaux de **Minage** et d'**Ingénierie** sur les fiches réelles de métiers ; aucune recette ni statistique inventée.
3. Carte d'expédition plus cinématique, noeuds et tracé de parcours conservés.
4. Arbres de talents et route Druide farouche retravaillés visuellement ; aucun point ou rang calculé fictivement.
5. Objectifs épinglés, chronologie et boutons de quêtes enrichis par catégorie.
6. Six portails d'accueil vers des écrans qui existent déjà, dont Faith et le Reliquaire quand leurs onglets sont présents.
7. Animations ponctuelles de révélation des trésors **déjà débloqués**, pas de génération de loot.
8. Transition courte entre pages, sans boucle d'animation et désactivable.
9. **Mode léger** manuel pour anciens téléphones : réduit filtres, ombres et transitions sans cacher le contenu ou changer les données.
10. Galerie de comparaison réunissant neuf décors, neuf sceaux et les deux métiers, pour vérifier la direction artistique sans jouer à WoW.

Les fichiers utilisés sont `renaissance-sigil-*.svg`, `renaissance-profession-*.svg`, `visual-renaissance-details.css` et `visual-renaissance.js`. Les tests d'interaction et d'accessibilité sont exécutés par GitHub Actions.

### Dix prochains chantiers pour une bêta visuelle digne de ce nom

1. Relecture et résolution **ciblée** des éventuels conflits PR #234 avec la branche principale.
2. Vérification réelle du rendu du blason Farouche sur iPhone.
3. Inspection des deux cartes Minage/Ingénierie sur le terrain.
4. Contrôle du défilement et de l'affichage des légendes sur la carte d'expédition.
5. Vérification des cartes de talents niveaux 20, 40, 60 et de leur source Forever.
6. Navigation des six portails sans écrans vides ni onglet trompeur.
7. Test du Reliquaire avec zéro puis plusieurs trésors effectivement débloqués.
8. Test du mode léger et de la réduction du mouvement sur téléphone.
9. Contrôle visuel de toutes les classes sur iPhone portrait/paysage et Windows 1080p.
10. Revue humaine, fusion autorisée et déploiement bêta limité à la version validée.

**Aucune fusion, aucun déploiement ni intervention utilisateur demandée pendant la réalisation de ce lot.** Les tests CI vérifient des propriétés techniques, pas la beauté du résultat sur de vrais appareils.
