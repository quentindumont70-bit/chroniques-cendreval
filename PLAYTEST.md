# Plan de playtest — Chroniques de Cendreval

## Avant de commencer
- Sur iPhone, tester Safari, puis l'icône sur l'écran d'accueil si installée.
- Noter le modèle, la version iOS et l'orientation.
- Ne pas effacer les données Safari : elles contiennent la progression locale.
- Exporter une sauvegarde avant tout import.

## Priorité P0 — blocages
- [ ] La page s'ouvre sans écran blanc ni rechargements répétés.
- [ ] Les commandes tactiles restent réactives après 10 minutes.
- [ ] Déplacements, caméra, esquive et parade restent accessibles.
- [ ] Le combat ne se fige pas lorsqu'un ennemi meurt.
- [ ] L'inventaire s'ouvre, se ferme et permet d'équiper puis retirer un objet.
- [ ] Le jeu garde les objets après un rechargement.
- [ ] L'export produit un fichier JSON; l'import restaure progression et inventaire.
- [ ] Une ancienne sauvegarde v1 peut être importée sans objets d'une autre partie.

## Priorité P1 — qualité du gameplay
- [ ] Vérifier qu'une arme augmente effectivement les dégâts infligés.
- [ ] Vérifier que l'armure réduit les dégâts reçus.
- [ ] Vérifier qu'un bijou apporte un bonus cohérent.
- [ ] Les notifications de butin restent lisibles et ne cachent pas les contrôles.
- [ ] Les couleurs de rareté sont distinguables, y compris en extérieur lumineux.
- [ ] Les comparaisons d'objets indiquent correctement les améliorations.
- [ ] La barre d'actions est utilisable sur petit écran.
- [ ] Aucun appui tactile sur l'interface ne déclenche une attaque involontaire.

## Priorité P2 — sensation AAA rétro
- [ ] La vallée donne une impression de profondeur.
- [ ] Château et silhouettes restent lisibles à distance.
- [ ] Les ennemis se détachent du décor.
- [ ] Parade, impact et esquive donnent un retour immédiat.
- [ ] Les animations ne saturent pas l'écran pendant un combat chargé.
- [ ] Les contrastes restent confortables sur téléphone.

## Procédure de rapport
Pour chaque problème, relever : zone, action précise, résultat attendu, résultat observé, fréquence (toujours / parfois), capture d'écran si possible.

## Politique de mise en ligne
Cette branche ne doit être fusionnée dans `main` qu'après une compilation CI réussie et un playtest iPhone concluant. Le workflow GitHub Pages publie `main`.
