# Chronique I · Le Serment brisé

Version 0.3.1 — premier niveau et Gardien des ruines.

## Périmètre livré

Une tranche jouable en vue subjective : exploration des plaines, trois voies de combat, objectif des trois bornes, découverte facultative au chariot, Gardien Sulfuras / doubles Thunderfury, victoire et récompense à Valbrume. Les chapitres ultérieurs déjà présents dans le dépôt restent hors de cette passe de finition.

La direction artistique conserve le rendu pixel art, le panorama distant et une scène logicielle en perspective. Depuis la 0.5.0, les personnages, bornes et accessoires proches sont construits en volumes plutôt qu’en panneaux plats. Le sol, les murs et ces modèles partagent la même caméra ; le panorama reste une toile distante.

## Critères d’acceptation

- Parcours complet des trois voies sans outil de test, jusqu’à la récompense ; rechargement du chapitre accompli.
- Gestes simultanés, déplacement, caméra, attaque, pouvoir, parade au signal, esquive, ressources et pause.
- Murs bloquant les dégâts et les déplacements ; objectifs accessibles et trajectoires de poursuite valides.
- Profil ancien migré, données invalides bornées, sauvegarde endommagée récupérée depuis sa copie de secours.
- Build statique portable sous le sous-dossier GitHub Pages, assets disponibles et typage du code du jeu.

## Limites de validation

Les tests tactiles utilisent Chromium en émulation mobile. Le ressenti et le mixage audio sur un iPhone physique/Safari, la latence réelle de l’écran et la chauffe sur une longue session ne peuvent pas être certifiés depuis cet environnement. Le paysage reste le format recommandé ; les menus et gestes restent utilisables en portrait.

La troisième personne ne fait pas partie de cette livraison. La conversion volumétrique est engagée, mais les effets, l’arme tenue et quelques transitions de mort emploient encore des éléments 2D.

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

## Finition 0.4.3 · Prêt à jouer

Options réunies avec fermeture accessible après défilement, aide PC/mobile adaptée, attribution de commandes sans doublons et filtrage des réglages abîmés. Vie des ennemis ordinaires et direction des dégâts mieux lisibles. Export/import de progression avec aperçu, annulation, normalisation et copie avant import séparée des sauvegardes automatiques.

Validation : 28 tests de règles/contenu réussis, 40 contrôles existants réussis, essais des six classes/dix-huit compétences, découvertes et reprise après mort réussis. Nouveau test navigateur dédié à l’aide PC, l’export réel, l’import et son annulation, le refus d’un fichier invalide, la copie de secours et les options mobiles. Parcours complet Arcanes jusqu’à la récompense, relique et marchand réussi. Aucune erreur JavaScript observée. Chromium et émulation tactile ; les appareils physiques restent à éprouver pendant l’essai utilisateur.

## Finition 0.4.4 · Rythme et esquive

Esquive au clavier prenant en compte avant/arrière et les commandes réassignées, diagonales normalisées et direction conservée pendant la préparation. Une esquive déjà active ne peut être relancée. Les attaques et compétences attendent sa fin.

Récupération partagée entre lame, arc et magie : alterner les armes ne permet plus de frapper instantanément. Une commande tardive prépare une seule attaque, y compris à l’arc ; parade et esquive préparées passent avant cette attaque. La pause annule les commandes en attente. Six cadences d’attaque de classe, avec un coût d’endurance supérieur pour le Chevalier du sang et des étincelles adaptées aux lanceurs.

Enchaînements de trois frappes qui reviennent au premier coup, recommencent sur une nouvelle cible et se rompent après un coup reçu. Troisième frappe plus marquée visuellement, traînée carmin du Chevalier du sang et couleur d’étincelle propre à chaque classe. Manuel de combat utilisant les raccourcis configurés.

Validation : typecheck et 31 tests de règles/contenu réussis ; 40 contrôles navigateur existants, six classes/dix-huit compétences, export/import et options mobiles réussis. Tests navigateur dédiés aux directions clavier, esquives répétées, récupération commune, commandes précoces/tardives, direction mémorisée et pause. Parcours complet Arcanes jusqu’à Valbrume, relique et marchand réussi. Aucune erreur JavaScript observée. Chromium et émulation tactile ; ressenti et performances physiques à confirmer sur les appareils du joueur.

## Passage volumétrique 0.5.0 · Première tranche 3D

Les arbres, rochers, arches, chariots, lanternes, stèles, petits sanctuaires et bornes de la vallée sont maintenant assemblés en volumes à faces distinctes. Leur silhouette et leurs faces visibles changent quand la caméra tourne autour ; ils partagent le tampon de profondeur des murs. Les ombres de combat et le Gardien sont également segmentés en volumes articulés. Sulfuras possède un manche et une tête séparés ; la phase II porte deux armes lumineuses indépendantes.

Le rendu reste un moteur logiciel dans Canvas, sans dépendance WebGL. Il conserve les pixels nets et la compatibilité du jeu publié. Auto limite le nombre de modèles visibles et leur complexité ; HD et Ultra augmentent la densité. Les modèles statiques sont mis en cache et les objets hors champ ou trop lointains sont écartés avant projection. Cette tranche ne convertit pas encore le panorama, l’arme en vue subjective ni tous les effets en géométrie.

## Cohérence volumétrique 0.5.1 · Main, monuments et cendres

L’arme en vue subjective expose maintenant ses faces éclairées : lame et garde épaisses, arc segmenté, flèche en volume, foyers de magie polyédriques. Le bouclier de parade est une coque à plusieurs épaisseurs. Balancement, attaque, garde et secousse déplacent le même assemblage au lieu de substituer une image.

Les pierres de mémoire, le feu d’ancrage et la porte noire rejoignent le tampon de profondeur du monde. Les silhouettes vaincues se tassent en segments de cendre avant de disparaître, y compris le Gardien ; aucun atlas de mort ne revient au dernier instant. Les six anciens atlas de personnages et d’accessoires restent archivés dans le paquet, mais ne sont plus téléchargés par le jeu. Au démarrage, seuls le panorama et la texture de maçonnerie sont encore chargés comme images de décor.

## Arsenal et vallée vivante 0.6.0

Barre d'action à trois sorts, icônes pixel originales, recharges circulaires, compte à rebours et signal de disponibilité. Codex décrivant les compétences de la classe et permettant leur permutation par glisser-déposer ou sélection tactile, avec raccourcis par emplacement. Les recharges suivent les sorts, même après permutation ; les gestes suivent les emplacements. Éditeur de position et d'échelle pour objectif, ressources et barre, avec profils ordinateur/tactile distincts, stockage local et maintien dans le cadre. Le mana du rôdeur est visible en même temps que ses flèches. La garde relève aussi l'arme subjective.

Silhouettes de décor réécrites : pins étagés, bouleaux, chêne à lanterne, arches, chariot, fleurs, champignons, mémorial, puits et campement. Chaque niveau de détail conserve un modèle complet. Feuillage, fanion et flammes animés ; papillons, oiseaux et braises discrets. L'animation du décor s'arrête en pause. Occlusion des faces par portions de mur et correction des lueurs cyan de phase II.

Le rendu reste logiciel Canvas, avec des volumes cubiques et un panorama ; cette livraison n'est ni une certification AAA ni une garantie de 240 FPS. Les arbres de talents et les tables de butin rares ne sont pas encore implémentés. Les tests tactiles automatisés utilisent Chromium, pas Safari sur un iPhone physique.

Validation : compilation Pages, vérification TypeScript et 35 tests unitaires réussis. Tests navigateur du codex (glisser-déposer réel, touches, gestes après permutation, persistance, rotation et pause), six classes/dix-huit compétences, reprise, boutons latéraux et récupération de combat réussis. Parcours tactile complet Arcanes, trois bornes, Gardien, récompense et marchand réussi, sans erreur JavaScript observée.

## Sac de trésors · 26 octobre 2026

Trois améliorations complémentaires : recherche de nom insensible aux accents avec filtre de rareté et remise à zéro ; comparaison des variations réelles de dégâts lame/arc/magie et de protection, arrondis et plafond inclus ; sept icônes pixel originales et cibles tactiles de 44 px avec focus clavier visible. Les probabilités de butin restent inchangées. Compilation, TypeScript et suite de tests existante réussis.

## Trois serments · 26 octobre 2026

Neuf talents communs aux six classes, répartis en trois branches de trois rangs : offensive (puissance, critique, pénétration), défense (armure, résistance), esprit (mana et pénétration magique). Achat séquentiel avec prérequis de niveau 2/3/4, sur les points de niveau existants. Redistribution gratuite des seuls points de ces branches ; les anciens acquis de voie ne sont pas retirés ni remboursés.

Les statistiques alimentent le combat et la régénération réelle, ainsi que la fiche du personnage. Rangs sauvegardés et exportés dans le profil, anciennes parties démarrant à zéro rang, valeurs importées bornées. Interface en colonnes sur ordinateur et verticale sur téléphone, accessible depuis Pause même sans point disponible. Cette première arborescence est commune, pas encore un arbre spécialisé par classe.

## Atlas des trésors · 26 octobre 2026

Cinq ajouts au sac : catalogue des sept objets avec fiches et illustrations ; sources et probabilités issues directement des tables actives ; estimation de la probabilité d'au moins un drop sur 1 à 1 000 victoires indépendantes ; collection des objets actuellement possédés avec filtre des manquants ; objectif de chasse conservé localement et navigation tactile Sac/Codex. Les probabilités de drop et les récompenses de combat ne changent pas. Le suivi local n'est pas inclus dans l'export de personnage. Le compteur décrit le sac actuel, pas un historique de possession.

## Atelier des serments · 26 octobre 2026

Cinq finitions de progression : noms de branches, couleurs et emblème adaptés aux six classes ; sélection d'un rang pour prévisualiser ses gains avant achat ; bilan des bonus actifs calculé avec les statistiques du combat ; aperçu de redistribution avec annulation et remboursement explicite ; écran tactile avec états de sélection, prérequis lisibles et liaisons entre rangs. Les effets des neuf talents restent communs aux classes, sans modification de l'équilibrage ni des sauvegardes. Les acquis de voie restent séparés.

Validation : compilation Pages, TypeScript et suite de tests réussis ; parcours tactile automatisé couvrant aperçu d'un rang verrouillé, trois achats, bilan critique, annulation puis confirmation du remboursement, et persistance des points.
