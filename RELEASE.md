# Chronique I · Le Serment brisé

Version 0.3.0 — premier niveau et Gardien des ruines.

## Périmètre livré

Une tranche jouable en vue subjective : exploration des plaines, trois voies de combat, objectif des trois bornes, découverte facultative au chariot, Gardien Sulfuras / doubles Thunderfury, victoire et récompense à Valbrume. Les chapitres ultérieurs déjà présents dans le dépôt restent hors de cette passe de finition.

La direction artistique conserve le rendu pixel art 16 bits, le panorama distant et les accessoires en profondeur. Le soin porte sur la lisibilité, la continuité de la progression et les sensations de contrôle ; ce moteur 2,5D n’est pas une reproduction technique d’un jeu AAA moderne.

## Critères d’acceptation

- Parcours complet des trois voies sans outil de test, jusqu’à la récompense ; rechargement du chapitre accompli.
- Gestes simultanés, déplacement, caméra, attaque, pouvoir, parade au signal, esquive, ressources et pause.
- Murs bloquant les dégâts et les déplacements ; objectifs accessibles et trajectoires de poursuite valides.
- Profil ancien migré, données invalides bornées, sauvegarde endommagée récupérée depuis sa copie de secours.
- Build statique portable sous le sous-dossier GitHub Pages, assets disponibles et typage du code du jeu.

## Limites de validation

Les tests tactiles utilisent Chromium en émulation mobile. Le ressenti et le mixage audio sur un iPhone physique/Safari, la latence réelle de l’écran et la chauffe sur une longue session ne peuvent pas être certifiés depuis cet environnement. Le paysage reste le format recommandé ; les menus et gestes restent utilisables en portrait.

La troisième personne et une refonte en vrai moteur 3D ne font pas partie de cette livraison.

## Vérifications réalisées pour cette livraison

- 14 tests de règles, de cartes, de sauvegarde et de contenu du paquet : réussis.
- 25 contrôles d’interaction : réussis, dont parade au signal, deux pouces, ressources vides, copie de secours, pause et commandes PC. La capture PC est vérifiée avec les deltas relatifs du pointeur.
- Parcours complet avec Lame, Rôdeur et Arcanes : réussis. Un dernier parcours de la version finale vérifie en plus la relique et l’achat au marchand.
- Typage du jeu : réussi. Aucune erreur JavaScript observée pendant ces parcours.
