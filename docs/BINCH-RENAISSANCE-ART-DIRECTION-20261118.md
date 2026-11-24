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

## Passe P5 — HUD mobile, gardien félin, carnet vivant et captures (18 novembre)

Cette passe ajoute du code à l'application existante ; elle ne concerne pas la Bourse AH.

### Livrés dans la branche de refonte (revue et intégration encore nécessaires)

1. **HUD mobile** : barre compacte Quartier / Carte / Talents / Guilde, fondée uniquement sur les vrais boutons d'onglets. Les rubriques indisponibles restent masquées et la navigation complète continue d'exister.
2. **Écran iPhone** : barre au-dessus de la zone de geste, boutons tactiles de 44 pixels minimum, contenu doté d'un espace inférieur pour éviter le recouvrement.
3. **Suivi de talents épinglé** : repositionné au-dessus du HUD sur les téléphones portrait.
4. **Palette Ctrl+K** : apparence de table de guerre en métal forgé et teintes de classe. L'ancien moteur de recherche et ses favoris ne changent pas.
5. **Gardien du Druide** : nouveau `renaissance-feral-spirit.svg` original, posé dans la scène des Druides et recadré pour 720/420 px. Décor seulement, pas une représentation de talents ou d'équipement lu dans le jeu.
6. **Carnet de route** : notification courte après une case cochée manuellement, avec l'avertissement explicite « non confirmé dans WoW ». Aucune nouvelle récompense ni sauvegarde de progression.
7. **Accessibilité** : respect de `prefers-reduced-motion`, mode léger, focus visible et couleurs forcées, y compris pour le HUD et la notification.
8. **Tests ciblés** : `tests/binch-visual-renaissance-dock.test.mjs` couvre les vrais boutons, les onglets retardés, les zones sûres iPhone et la palette ; les tests Renaissance couvrent aussi l'illustration féline et la notification.
9. **Prévisualisations** : captures de galerie, plus deux captures de l'écran de création de personnage réel en format desktop et téléphone, conservées trois jours en artefacts CI. Ce n'est pas un déploiement ni un test sur un vrai iPhone.
10. **Gouvernance** : aucune fusion ou transaction, branche et PR #234 conservées en brouillon jusqu'à revue.

### Prochaines priorités, dans cet ordre

1. Obtenir les deux contrôles CI verts sur le dernier commit de cette passe.
2. Ouvrir les captures GitHub et éliminer uniquement les défauts visuels réellement constatés.
3. Tester le HUD sur un vrai iPhone en portrait avec les safe areas.
4. Contrôler le rendu du gardien félin derrière le portrait, le niveau et les actions.
5. Comparer les neuf paysages de classe, y compris en mode léger.
6. Vérifier l'absence de double navigation dans les pages Specs et GM.
7. Tester un objet de route marqué terminé puis réactivé, sans inventer d'achèvement en jeu.
8. Vérifier la lisibilité du panneau Ctrl+K et de ses favoris sur mobile.
9. Recueillir un retour du futur testeur GM sur la cohérence des rubriques et de la carte.
10. Préparer une revue humaine ciblée, puis seulement une fusion et un déploiement autorisés.

**Distinction des preuves :** les tests techniques et captures headless valident la présence et le rendu de certaines interfaces ; ils ne prouvent ni la fluidité tactile iPhone ni la justesse de la synchronisation WoW.

## Passe P6 — approfondissement artistique des modules (18 novembre)

Dix chantiers codés et publiés sur la PR #234 (sans fusion) :

1. Nouvelle illustration originale de constellation farouche : griffes, lune et étoiles. Ne représente pas un arbre de talents officiel.
2. Bandeau visuel du Grimoire retravaillé autour du guide existant, sans points inventés.
3. Douze guides de spécialisations existants habillés de leurs blasons de classe originaux.
4. Fond de chapitre lié à l'identité de classe sélectionnée, sans modifier le profil.
5. Nouveau paysage de forge et minage avec cristaux et engrenages sur les fiches des métiers.
6. Salle du Conseil : carte de campagne, bougies et bannières derrière les données déclarées de guilde.
7. L'Oracle Faith : astrolabe et constellations abstraites, sans modifier ses recommandations.
8. Reliquaire : finitions et contraste des cartes de Trésors, sans attribuer de récompense.
9. Adaptation mobile et désactivation des effets lourds en mode léger et mouvement réduit.
10. Galerie artistique étendue aux quatre nouvelles scènes, avec nouveaux tests et contrôle SVG.

Les scènes nouvelles sont renaissance-feral-constellation.svg, renaissance-workshop.svg, renaissance-gm-council.svg et renaissance-faith-oracle.svg. Les styles et tests sont dans visual-renaissance-finale.css et tests/binch-visual-renaissance-finale.test.mjs.

### Dix prochains chantiers

1. Obtenir les CI vertes sur le dernier commit et valider les 26 SVG.
2. Examiner uniquement les captures où un défaut de rendu est vérifiable.
3. Vérifier que le décor des talents ne masque aucun texte.
4. Vérifier les douze blasons sur mobile et en 1080p.
5. Tester Forge, Conseil et Faith avec le mode léger.
6. Vérifier le HUD sur iPhone en portrait et paysage.
7. Essayer la galerie d'art au clavier et en tactile.
8. Distinguer les objectifs du carnet local et les quêtes réellement validées en jeu.
9. Revoir les différences avec la branche principale sans forcer une fusion conflictuelle.
10. Organiser les essais réels et obtenir la validation explicite avant intégration et déploiement.

Aucune action utilisateur requise pour cette passe. Branche conservée en brouillon, sans dépense ni déploiement.

## P7 — création de personnage illustrée et revue mobile (18 novembre)

Nouvelle livraison sur la PR #234 sans changement du moteur de personnages :

1. Le choix de classe comporte les **9 panoramas** originaux, un par classe existante.
2. Chaque carte de classe reprend le blason SVG authentiquement créé pour La Binch.
3. Le panorama de fond du parcours suit le choix visuel de la classe grâce au CSS, sans écriture supplémentaire dans le profil.
4. Les huit peuples existants sont groupés visuellement par étiquettes Horde / Alliance d'après leur appartenance déjà déclarée dans le code.
5. Les deux cartes de métiers Minage et Ingénierie gagnent leurs propres emblèmes.
6. Les boutons du créateur annoncent correctement leur état sélectionné via aria-pressed, y compris après régénération de la grille par le moteur original.
7. Flèches gauche/droite et Home/End déplacent le focus dans les trois grilles sans sélectionner involontairement une option.
8. Composition adaptée aux écrans 850, 530 et 350 px ; le texte explique qu'il faut faire défiler les neuf classes sur téléphone.
9. Mode léger, contraste renforcé, couleurs forcées, focus clavier et réduction du mouvement préservés.
10. Création d'un atelier autonome de choix des classes, sans lecture ni écriture du profil, et de captures headless desktop/mobile dans les artefacts CI.

Code : visual-renaissance-onboarding.css, visual-renaissance-onboarding.js et renaissance-onboarding-atelier.html, chargés dans index.html. Le test Node est tests/binch-visual-renaissance-onboarding.test.mjs.

### Dix chantiers suivants

1. Vérifier les CI de la version P7 et le rapport des captures.
2. Vérifier l'ergonomie réelle de la grille 2 colonnes sur iPhone.
3. Vérifier que les sceaux et descriptions restent lisibles sur écran 320 px.
4. Confirmer que l'étape des métiers reste utilisable sans masquer le bouton Continuer.
5. Examiner le panorama Farouche et sa lisibilité par-dessus les widgets.
6. Contrôler les neuf paysages sous différentes ambiances.
7. Valider le fonctionnement des 6 portails depuis le téléphone.
8. Vérifier le mode léger sur iPhone et sans réseau après chargement initial.
9. Préparer les captures de toutes les étapes du parcours personnage pour revue.
10. Faire revoir et autoriser le déploiement bêta, sans fusion prématurée.

La PR reste DRAFT, aucune fusion ni publication publique automatique. Le contrôle CI valide le code et des captures headless, pas le confort réel sur un appareil.
