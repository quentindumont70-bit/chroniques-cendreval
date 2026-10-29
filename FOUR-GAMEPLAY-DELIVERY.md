# Quatre chantiers de jeu — 30 octobre 2026

Ces travaux prolongent la spécialisation de l’équipement. Les correctifs de sauvegarde et d’interface sont inclus dans les systèmes concernés ; ils ne constituent pas des chantiers supplémentaires.

## Rencontres de la vallée

Trois lieux de découverte accueillent désormais des groupes nommés : les pillards du verger, la veille des cendres et le serment des exilés. Examiner le lieu avant l’éveil de la dernière borne engage sa rencontre. Vaincre tous ses défenseurs libère le lieu, accorde 6, 8 ou 10 éclats et 18 expérience, puis permet sa fouille. Des abris, provisions et fanions signalent ces lieux ; leur couleur change après libération. L’Atlas indique leur état. Une seule rencontre peut être engagée à la fois, et il faut la terminer avant d’activer une borne. Les blessures et les défaites sont conservées au rechargement ; la récompense est unique.

## Tactiques des ennemis ordinaires

Les archers reculent à courte portée et se décalent latéralement à moyenne distance. Leurs tirs visent la position du joueur au début de la préparation : un déplacement suffisant permet de les éviter. Les combattants de mêlée ajoutent un déplacement latéral à leur approche. Au plus deux ennemis ordinaires préparent ou exécutent une attaque simultanément. Les murs continuent de bloquer les déplacements et les attaques.

## Commandants du château

Le capitaine, le maître d’armes, le maréchal et le roi ont des séquences distinctes de balayages, frappes lourdes, estocades et, pour les deux derniers, ondes de cendre. À mi-vie, leur séquence change et leurs dégâts augmentent. Les estocades déplacent le commandant ; les ondes sont annoncées comme imblocables. La préparation et la récupération varient avec l’attaque. Armure, crête et épaulières distinguent les commandants ; la seconde phase modifie leur palette. Leur phase et leur progression dans la séquence survivent à la sauvegarde.

## Progression des Échos

Après le roi, cinq paliers sélectionnables ont des règles de vitesse, dégâts et récupération différentes. Chaque premier succès débloque le palier suivant. Les paliers pairs donnent un talent au premier succès seulement ; les éclats de premier succès sont remplacés par deux éclats lors des répétitions. Les paliers déjà terminés restent rejouables. Le combat en cours reprend après rechargement sans afficher l’écran de fin par-dessus. Les choix disposent d’un panneau défilant adapté au portrait et au paysage.

## Validation

- Vérification TypeScript, compilation et suite de tests `npm test`.
- Tests navigateur des quatre commandants sur 390 × 844, 844 × 390 et 1440 × 900 : seconde phase et attaque réelle.
- Tests navigateur de l’activation/libération d’une rencontre, de sa récompense unique, de la sélection et reprise des Échos, et des gains de premier succès/répétition sur les trois formats.
- Régression de la reprise des blessures, morts et délais des sorts.
- Régression des gestes à deux pouces, perte de capture, esquive, récupération des attaques, pause et réorganisation des sorts.
- Inspection des captures de commandant, rencontre et sélection d’Échos ; contrôle de l’absence de débordement horizontal des choix.

Les navigateurs utilisent Chromium avec des dimensions mobiles simulées. Un essai sur iPhone réel reste nécessaire pour apprécier le confort tactile, la fluidité et l’équilibrage. Les scénarios de sauvegarde injectent des états contrôlés ; ils ne remplacent pas une campagne complète jouée depuis le début.
