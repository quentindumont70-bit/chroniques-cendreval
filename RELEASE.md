# Chronique I · Le Serment brisé

Version 0.3.1 — premier niveau et Gardien des ruines.

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

- 15 tests de règles, de cartes, de sauvegarde et de contenu du paquet : réussis.
- 36 contrôles d’interaction : réussis, dont parade au signal, deux pouces, ressources vides, copie de secours, pause et commandes PC. La capture PC est vérifiée avec les deltas relatifs du pointeur.
- Parcours complet avec Lame, Rôdeur et Arcanes : réussis. Un dernier parcours de la version finale vérifie en plus la relique et l’achat au marchand.
- Typage du jeu : réussi. Aucune erreur JavaScript observée pendant ces parcours.

La passe 0.3.1 affine le poids des impacts, la continuité caméra–garde et les transitions de pose du Gardien. Les défenses engagées en récupération ne sont plus perdues, et une attaque pendant la transformation du Gardien ne dépense plus les ressources du joueur.

La qualité visuelle propose maintenant Auto, Rétro, HD 1080p et Ultra 4K. Le rendu Ultra utilise réellement une surface 3840 × 2160 ; les atlas principaux doublent leur définition sur chaque axe, le sol et les murs sont échantillonnés plus finement. Le choix est persistant et Auto ajuste la charge. Les dimensions des quatre modes et des nouvelles images, ainsi que la persistance du choix, sont contrôlées dans le navigateur. Les performances Ultra sur appareil physique restent à mesurer.

## Extension 0.4.0 · Grimoire des voies

Six classes et dix-huit compétences, statistiques effectives et fiche de personnage détaillée. Les trois voies supplémentaires possèdent leurs propres profils et combinaisons de compétences ; leurs armes utilisent encore les trois familles visuelles existantes. Première passe d’équilibrage, à confronter au ressenti en jeu.

Correctifs PC : reprise après Échap, capture souris refusée sans blocage et interception des boutons latéraux du navigateur, y compris lors d’une association. Tests dédiés : six identités sauvegardées, dix-huit compétences, gestes directionnels, coûts, recharges suspendues, fiche de personnage et régressions de souris. Les contrôles natifs d’un pilote Windows hors navigateur ne sont pas accessibles à l’application web.

Validation 0.4.0 : 19 tests de règles et de contenu réussis ; 36 contrôles existants réussis ; test navigateur dédié réussi pour les six classes, dix-huit compétences, reprise, boutons latéraux et gestes directionnels, sans erreur JavaScript. Parcours complet Arcanes jusqu’à la récompense, relique et marchand réussi. Tests effectués dans Chromium, avec émulation tactile pour le mobile.

## Finition 0.4.1 · Monde vivant

Nouveaux accessoires peints, texture de pierre des ruines, effets et armes de classe distincts, recharge et exposition lisibles. Optimisation du découpage des sprites contre les murs et cache du terrain/sol à caméra fixe. Objectifs Auto 60/120/240 et compteur mesuré, sans garantie de fréquence matérielle. Les données de progression et les raccourcis sont conservés.

Validation 0.4.1 : 23 tests de règles et de contenu, 40 contrôles navigateur (dont options de fréquence, nouveaux assets et compteur FPS réel), essais des six classes/dix-huit compétences, et parcours complet Lame jusqu’à Valbrume : réussis, sans erreur JavaScript observée. Vérification visuelle des captures de la vallée, du boss et des fiches. Les performances physiques à 120/240 Hz restent à mesurer sur la machine du joueur.

## Finition 0.4.2 · Les histoires de la vallée

Trois points d’exploration récompensés, journal enrichi et boussole discrète, détails animés du camp et des lanternes, ambiance sonore locale avec mises à jour audio réduites. Récompenses uniques sauvegardées ; fouille bloquée par une menace proche. Reprise après la mort nettoyant compétences et exposition sans effacer les découvertes.

Validation : 26 tests de règles/contenu et 40 contrôles existants réussis. Nouveau parcours navigateur : découverte des trois lieux par interaction tactile, absence de récompenses répétées, conservation après rechargement, journal, menace empêchant la fouille, mort et réinitialisation des compétences : réussi, sans erreur JavaScript. Émulation mobile Chromium ; écoute et ressenti sur appareils physiques restent à confirmer.

Parcours complet supplémentaire avec le Rôdeur jusqu’à la récompense, la relique et l’achat au marchand : réussi.
