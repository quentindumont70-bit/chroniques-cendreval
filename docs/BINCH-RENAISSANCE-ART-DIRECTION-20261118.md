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

- **P2 — illustrations** : scènes véritablement distinctes par classe/zone et pictogrammes originaux de métiers, uniquement avec droits de diffusion clairs.
- **P3 — ergonomie** : hiérarchiser accueil, journal, carte, trésors et classes ; réduire l'impression de mille onglets.
- **P4 — micro-interactions** : transitions contextuelles légères, détails de matière sans baisse de fluidité.
- **P5 — guilde** : donner une identité de salle de guerre au GM Hub, sans prétendre à un backend partagé.
- **P6 — bêta** : retours réels du testeur iPhone/PC et validation finale des parcours.

## Limites et responsabilité

**Code présent sur branche ≠ déploiement sur GitHub Pages.** Une CI verte ne valide pas le rendu sur un véritable iPhone. La PR reste **DRAFT** ; aucune fusion avant revue, aucune dépense, aucun changement des données métier ni de la Bourse AH.
