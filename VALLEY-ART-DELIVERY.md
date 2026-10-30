# Vallée : cohérence des premiers plans

La capture iPhone montrait un sol uniforme, une borne composée de deux blocs disproportionnés et des collines arrière très hautes et sombres. Cette passe porte sur les abords de la route et leur raccord avec le paysage.

- Carte de pigments du sol calculée une fois : chemin usé, ornières, accotements, pierres près du sanctuaire, nuances de prairie et ombres sous les arbres. Échantillonnage interpolé pendant le déplacement.
- Petits groupes de végétation, fleurs et pierres en volumes facettés. Placement déterministe sur le terrain praticable, hors du chemin et du cercle de duel. Limite de 16 groupes proches en qualité mobile, 28 en qualité supérieure, rejet hors champ et au-delà de 5,5 unités.
- Pierres de mémoire redessinées : socle irrégulier, fût effilé, sommet incliné, rune intégrée, fragments et mousse. Les zones d’interaction et les sauvegardes sont conservées.
- Collines périphériques plus basses et palette moins sombre ; réduction de la hauteur des silhouettes lointaines pour limiter les grandes bandes grises.

## Validation

TypeScript, suite complète de tests, contrôles du cache de pigments et du budget de végétation. Neuf captures et parcours navigateur : approche, sanctuaire et vue opposée, en 844 × 390, 390 × 844 et 1440 × 900. Les contrôles de combat et de continuité tactile sont également rejoués.

Un microbenchmark local de 40 positions, après préparation du cache, donne 6,67 ms de médiane pour l’ancien calcul CPU du sol et 0,82 ms pour le nouveau en qualité classique. Le contexte canvas est simulé pour isoler le calcul des pixels : ces chiffres ne mesurent ni le jeu complet ni les performances sur iPhone. L’effet sur la fluidité réelle reste à confirmer sur appareil.
