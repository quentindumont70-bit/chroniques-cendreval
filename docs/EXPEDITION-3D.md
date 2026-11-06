# Outbinched — expédition 3D, avant-première

**Mise à jour du 6 novembre :** lire `EXPEDITION-DEPTH.md` pour les cinq chantiers supplémentaires, la troisième zone, l’arsenal, les spécialisations et les quêtes. Les sections ci-dessous décrivent la première livraison du 5 novembre.

## Accès et statut

Le 5 novembre 2026, l’utilisateur a autorisé les cinq chantiers proposés et leur enchaînement autonome. La référence principale reste Queen’s Domain.

- Accueil et jeu classique : URL habituelle, sans paramètre (ou `?classic=1`).
- Nouvelle expédition : `?expedition=1`, accessible depuis l’accueil classique.
- Statut : première implémentation intégrée des cinq chantiers, proposée en avant-première. Ne pas présenter la direction artistique, la jouabilité complète ou les performances comme validées sur appareil.
- Sauvegarde 3D séparée : `outbinched-expedition3d-v1`. Aucune lecture, migration ou écriture des sauvegardes classiques `cendreval-*`.
- Rendu : Three.js 0.180.0 / WebGL2, géométrie polygonale et acteurs articulés procéduraux. Aucun asset de Queen’s Domain n’est utilisé.
- Le mode classique reste le défaut tant que les essais graphiques ne sont pas terminés.

## Les cinq chantiers livrés dans le code

1. **Socle 3D** : perspective libre, relief, corps avec collisions et déplacements subdivisés, gravité, saut, pont à deux niveaux, pause, reprise, clavier AZERTY/QWERTY, souris avec capture et solution de repli par glissement, gestes tactiles indépendants.
2. **Vallée** : village, rivière, pont surélevé et cache en dessous, bois instancié, ruines, belvédère, château, lumière, brume, oiseaux, feux et mémoires. Ambiance sonore synthétique optionnelle, sans bruit blanc. C’est une zone compacte, pas un monde ouvert de plusieurs heures.
3. **Acteurs et combat** : trois ennemis ordinaires (mêlée, distance, traqueur mobile), membres articulés et télégraphes, six classes et leurs trois compétences réutilisées, coups proches et vrais projectiles interceptés par murs/terrain, garde, parade, esquive, marques, impacts et verrouillage.
4. **Donjon et boss** : vestibule, corridor central, tombeaux ouest, galerie est accessible par une rampe, sceau ouvrant la grille du boss et un raccourci ouest. Gardien à deux phases : marteau puis deux armes. Reliquaire, mémoire et cœur à récupérer après victoire.
5. **Boucle d’aventure** : mission d’Elenn, aller-retour après le gardien et conclusion récompensée. Or, XP, niveaux, talents, quatre équipements à bonus statistiques, récoltes/alchimie, quatre contrats adaptés, atlas, commandes, repos, mort/reprise et sauvegarde. Trois qualités de rendu et compteur FPS/appels de rendu ; aucun objectif FPS n’est garanti.

Les règles de `rpg.ts`, `talents.ts`, `alchemy.ts`, `contracts.ts` et `afflictions.ts` sont réutilisées. Les inventaires détaillés et quêtes du prototype classique ne sont pas intégralement transférés dans cette nouvelle aventure. Les équipements de l’avant-première sont des bonus statistiques ; chaque pièce n’a pas encore son apparence propre.

## Architecture

- `app/expedition3d/world.ts` : hauteur, volumes solides, lieux, spawns, déplacement, occlusion.
- `scene.ts` : géométrie, matériaux, végétation instanciée, acteurs, armes et poses.
- `game.ts` : simulation, combat, commandes, son, cycle de vie et raccordement des règles RPG.
- `progress.ts` : format versionné de sauvegarde, validation, progression et récompenses.
- `Expedition.tsx` / `expedition.css` : accueil, HUD et menus adaptés aux petits écrans.
- `github-pages/main.tsx` : chargement différé des deux versions.
- `tests/expedition3d.test.mjs` : tests de parcours et de simulation sans renderer.

## Validation et limites

Commandes : `npm ci`, `npm run typecheck:game`, `npm test` (construction GitHub Pages incluse).

18 nouveaux tests couvrent le parcours complet jusqu’au château, le dessus/dessous du pont, l’accès réel à la galerie et au reliquaire, la grille et le raccourci, l’occlusion, les déplacements sans traversée de murs, la sauvegarde et ses entrées corrompues, les récompenses uniques, l’XP, les six classes, coups/compétences/marques, parades, projectiles, deux armes du boss, pause et géométrie finie. Ils complètent les 128 tests existants.

Essai navigateur effectué : l’accueil et le message de repli s’affichent, mais WebGL est désactivé dans le navigateur de contrôle (`GL_RENDERER = Disabled`, échec de création du contexte). Le navigateur du bureau présente la même limite. Aucun contournement des protections n’a été tenté. Les tests de simulation ne remplacent pas une session visuelle.

À valider sur un navigateur avec WebGL2 : rendu des deux zones, lisibilité des poses, trajet complet avec les commandes réelles, combat du boss et retour à Elenn, capture/reprise de souris, gestes à deux pouces, portrait/paysage, sauvegarde/rechargement et FPS sur iPhone 17 Pro Max. La livraison reste une avant-première jusqu’à cette passe.
