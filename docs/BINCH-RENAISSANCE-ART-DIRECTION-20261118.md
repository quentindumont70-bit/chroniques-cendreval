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
- **P4 — à poursuivre** : icônes de métiers originales et réduction du nombre d'onglets visibles, sans sacrifier les fonctionnalités cachées ; navigation testable sur mobile.
- **P5 — à poursuivre** : transitions entre modules et mode ultra-léger pour appareils à faibles ressources, en respectant `prefers-reduced-motion`.
- **P6 — à valider** : vérification visuelle sur iPhone et Windows, revue du conflit éventuel entre styles puis fusion/déploiement uniquement autorisés.

## Limites et responsabilité

**Code présent sur branche ≠ déploiement sur GitHub Pages.** Une CI verte ne valide pas le rendu sur un véritable iPhone. La PR reste **DRAFT** ; aucune fusion avant revue, aucune dépense, aucun changement des données métier ni de la Bourse AH.

## Galerie de validation des neuf classes (livrée dans la PR)

La page `public/binch/renaissance-atelier.html` est une **prévisualisation autonome** de la direction artistique : elle contient les neuf scènes réellement utilisées sur l'accueil, avec des vignettes et un clic pour agrandir le paysage de la classe. Ce n'est ni une nouvelle app, ni une démonstration de progression WoW, et aucune donnée de jeu n'est lue.

Les nouveaux fichiers sont :
`renaissance-world-druid.svg`, `renaissance-world-warrior.svg`, `renaissance-world-mage.svg`, `renaissance-world-priest.svg`, `renaissance-world-paladin.svg`, `renaissance-world-rogue.svg`, `renaissance-world-hunter.svg`, `renaissance-world-shaman.svg`, `renaissance-world-warlock.svg`.

**Contrôles CI :** un fichier SVG distinct par classe, XML analysable pour les 10 scènes (9 classes et paysage générique), les 9 liaisons CSS, responsive, mouvement réduit, galerie complète et absence de modifications économiques. Les CI ne remplacent pas la recette graphique réelle.
