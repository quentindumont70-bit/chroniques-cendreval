# La Binch Renaissance — Golipette P12 · intégration Shaaby Premium
19 novembre 2026 · PR #234 DRAFT · Branche `feature/binch-visual-renaissance-20261118`

## Objectif et protection du jeu réel

La maquette P11 (Shaaby fumant une pipe de feuillerêve dans les plaines de Mulgore) dispose maintenant d’une **intégration progressive au véritable compagnon**. Il ne s’agit plus uniquement d’un site de démonstration. Cette passe apporte le décor et les matériaux au code de production existant sans remplacer son moteur, ses talents, son journal de quêtes, son interface GM ni son système de sauvegarde.

**Activation :** seulement si le profil déjà enregistré dans `grimoire.hub.v3` est `onboarded:true`, `race:"Tauren"`, `classe:"Druide"`. Les autres combinaisons restent pilotées par le moteur composite neuf classes. La prévisualisation de reforge peut montrer le sanctuaire dès qu’on sélectionne cette identité dans son brouillon, sans aucune écriture avant « Appliquer ». Le créateur affiche aussi le visuel quand les deux choix sont réellement sélectionnés.

## Les dix chantiers de la passe et les livrables

1. **Art partageable :** extraire les 300 Ko de WebP de la démonstration P11 pour créer `public/binch/shaaby-mulgore.webp`, ressource statique unique chargée seulement si nécessaire.
2. **Cadre druidique original :** créer `shaaby-ivy-ornament.svg` (lierre, feuillage, fibres bronze), réutilisable sans insertion de milliers d’éléments DOM.
3. **Vrai hero :** utiliser l’image dans `#page-hub .binch-character-card`, la scène existante, sans duplication du titre, des valeurs ou des comportements de jeu.
4. **Hiérarchie de couches :** fond plein cadre cinématique, lierre décoratif, aura discrète, contenu de navigation devant l’image ; intervention CSS ciblée sur le compositor actuel.
5. **Profil actif :** transformer visuellement la plaque du vrai bouton existant ; laisser le déclencheur transactionnel de reforge fonctionner normalement.
6. **Reforge :** utiliser la scène premium uniquement quand le **brouillon** race/classe correspond ; autres combinaisons restent avec leurs scènes ; annulation n’écrit rien.
7. **Modules réels :** appliquer la matière bronze/bois et détails végétaux aux panneaux, tuiles, portails et navigation sans inventer des fonctions ni simuler des données.
8. **Métiers :** les ornements restent issus des deux métiers sélectionnés (`--br-job-glyph` et `--br-second-glyph`) plutôt que du couple fixe Herboristerie/Alchimie.
9. **Mobile et performances :** cadrage dédié 390/760 px, mode léger et mouvement réduit ; seul le WebP affiché est lourd, pas de data URI géante ni de scripts ou API supplémentaires.
10. **Tests :** `tests/binch-shaaby-live.test.mjs` vérifie l’activation strictement Tauren Druide, le respect des données, la présence d’assets, la reforge et le responsive ; test connecté à `.github/workflows/verify.yml`.

**Fichiers intégrés :** `shaaby-premium-live.css` (CSS isolé), `visual-identity-compositor.js` (deux drapeaux visuels supplémentaires : identité enregistrée et aperçu de reforge), `index.html` (feuille CSS et nouveau cache de script). La source du profil est toujours **la même clé**. Aucun deuxième stockage.

## Limitations explicites

- Les autres races/classes n’ont **pas** été artificiellement redessinées avec le portrait de Shaaby. La qualité artistique du flagship sert d’étalon et ne doit pas être clonée via recoloring.
- Le WebP est un seul artwork; il ne s’agit ni d’un moteur 3D ni de particules temps réel intégrées à l’image. La fumée originale est peinte; les effets rares CSS restent facultatifs.
- L’illustration contient quelques accessoires druidiques/herboristes, quel que soit le choix de deux métiers ; seuls les ornements **UI** correspondent exactement au profil.
- L’intégration a des tests automatiques, mais une recette visuelle tactile sur iPhone et Windows reste nécessaire avant qualification finale.
- La latence éventuelle de raw.githack n’est pas une mesure fiable de LCP ; pas de promesse de temps de chargement non mesuré.

## Golipette P13 — les dix prochains chantiers

1. Vérifier la scène réelle sur iPhone et desktop, non seulement la vitrine.
2. Corriger les collisions visuelles si le nom, les niveaux ou les boutons recouvrent le personnage dans des profils réels.
3. Valider l’ouverture et la fermeture de « Profil actif », l’aperçu et la conservation du niveau, objectifs et guilde.
4. Raffiner le cadrage à 320, 375, 390, 430 px et 1920 px avec captures datées.
5. Donner aux panneaux de métiers de vrais pictogrammes et des matières spécifiques sans écraser les données.
6. Peaufiner les lianes et cadres avec des ornements plus fins, lisibles et non envahissants.
7. Évaluer une navigation plus immersive entre quartier général, talents et expédition, sans changer les destinations.
8. Mesurer les ressources, LCP et impact des animations sur un hébergement de test représentatif.
9. Concevoir le second flagship Mort-vivant Démoniste avec **un nouvel artwork** et une architecture profondément distincte.
10. Revue bêta avec le frère testeur et autorisation explicite avant toute fusion/déploiement public.

**Règles conservées :** PR #234 en brouillon, branche seule `feature/binch-visual-renaissance-20261118`, pas de changement de `main`, pas de dépense, pas de synchronisation WoW inventée, pas de module AH modifié.
