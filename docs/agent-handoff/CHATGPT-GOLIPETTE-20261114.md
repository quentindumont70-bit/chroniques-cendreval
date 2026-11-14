# ChatGPT — Golipette du 14 novembre 2026

Branche de travail : `chatgpt-golipette-20261114`. PR en brouillon : https://github.com/quentindumont70-bit/chroniques-cendreval/pull/129

## Situation et protection
- Base : `main` au moment de création de la branche ; ne jamais fusionner sans revoir la réconciliation avec `opencode-golipette`.
- OpenCode possède les améliorations documentées du guide Farouche (séquence exacte de 51 points, 20 talents et leurs tooltips) sur sa branche ; `main` contient encore une implémentation plus ancienne de `specs-guide.js`.
- **Ne surtout pas écraser la version OpenCode du guide Farouche par celle de cette PR.** Porter seulement les quatre petits correctifs d'UI Specs de cette PR sur la version finale après comparaison.
- Aucun registre de prix de joueur effacé, migré ni fusionné.

## Livré sur la PR
1. Specs : état du bandeau épinglé mis à jour pour toutes les spécialités ; libellé et `aria-pressed` synchronisés.
2. Specs : sélection active alignée sur le filtre de classe ; niveaux stockés hors plage 10–60 ignorés.
3. Atelier AH : relevés datés dans le futur rejetés, commission invalidement renseignée ramenée à 5 %, recommandation déclassée en comparaison indicative quand les relevés sont anciens.
4. Atelier AH : refus des totaux monétaires au-delà de la précision des entiers sûrs de JavaScript.
5. Pont AH : aucune observation future utilisée par les consommateurs, lecture seule maintenue.
6. Import AH : horodatage obligatoire pour un fichier importé (on n'invente plus une date aujourd'hui), saisie manuelle datée comme auparavant.
7. Import AH : lignes nulles ou types inattendus rejetés sans provoquer d'accès à leurs propriétés.
8. Tests Node versionnés : `public/binch/test-ah-craft.cjs` (11 assertions) et `public/binch/test-ah-market-import.cjs` (7).
9. Test existant `public/binch/test-market-bridge.cjs` étendu à 11 assertions, y compris dates futures.

## Contrôles accomplis
- Syntaxe JavaScript compilée dans un isolat pour les modules/scripts relus.
- 10 tests fonctionnels d'atelier AH et 7 tests fonctionnels d'import exécutés avec stockage simulé ; contrôle ciblé du pont AH réussi.
- GitHub compare `main...chatgpt-golipette-20261114` : 11 commits, 7 fichiers modifiés au contrôle.
- **Non exécutés :** vrai Node local sur les fichiers téléchargés, navigateur end-to-end, addon dans WoW Forever, déploiement GitHub Pages.

## Roadmap des dix chantiers
1. Design premium par classe — en attente de refonte concertée.
2. Cockpit et commandement personnel — préserver les modules déjà livrés.
3. Cartes Azeroth — vérifier données et interactions réelles avant enrichissement.
4. Talents et builds des neuf classes — priorité à la réconciliation OpenCode, sans talents inventés.
5. Quêtes incontournables et alertes — raccordement au journal importé.
6. Métiers et équipement — chantier AH et artisanat sécurisé dans cette PR.
7. Faith contextuel — consommer seulement le catalogue sourcé et les relevés datés.
8. GrimoireSync et Windows — tests Windows / client réels requis.
9. Bourse AH — provenance, calculs et imports durcis dans cette PR.
10. GM Hub collaboratif — prototype local à distinguer du multi-utilisateur déployé.

## Suite pratique
- Exécuter `node public/binch/test-ah-craft.cjs`, `node public/binch/test-ah-market-import.cjs`, `node public/binch/test-market-bridge.cjs` et `node scripts/check-binch.mjs`.
- Tester les onglets Bourse, Atelier et Specs dans le navigateur (dont niveau, filtre, épinglage), puis préserver les deux répertoires de stockage utilisateur.
- Réconcilier `specs-guide.js` avec OpenCode à l'aide d'un vrai diff, sans remplacer l'ordre de leveling vérifié par l'ancien `DRUID_ROUTE`.
- Tester l'addon et l'installateur sur le client réel avant de déclarer une bêta complète.

## Mise à jour : réconciliation OpenCode effectuée sur la branche (14 novembre)
- Source réelle rechargée : `public/binch/specs-guide.js` depuis `opencode-golipette` blob `2ab8054ef2c580d2ac40aafc6cdfcfa3a139358d`; CSS blob `d637d74212c1d46fa8334b6e258579a66208a2ac`.
- Contenu OpenCode recopié dans notre branche sans modifier sa branche : `SEQ` officielle 51 points, dictionnaire `T` de 20 talents, `stepsAt`, `PHASES`, tooltips et liens conservés. Correctifs ergonomiques ChatGPT réappliqués chirurgicalement sur cette version.
- Filtre sauvegardé hors liste corrigé au montage ; synchronisation entre onglets remet le filtre visuel et la sélection en cohérence.
- 10 assertions exécutées en JavaScript isolé sur `SEQ` : 51 talents-niveaux, somme 25 points au niveau 34, 51 au niveau 60, talent non contigu Frappes de prédateur, bornes de rangs, prochain talent et build complet.
- Nouveau script à exécuter en Node réel : `public/binch/test-specs-route.cjs` (10 assertions).
- `index.html` : cache ciblé mis à jour pour Specs JS/CSS, ah-craft, ah-market, market-bridge ; aucun autre changement volontaire.
- **Attention à la publication :** cette branche protège déjà la séquence officielle OpenCode snapshot, mais si OpenCode publie de nouveaux changements entre-temps, re-comparer avant fusion ; garder les changements futurs des deux côtés.
- Environnement Node local disponible mais accès réseau GitHub depuis le conteneur bloqué (résolution DNS) ; les fichiers GitHub n'ont pas pu y être clonés. Les scripts Node versionnés restent à exécuter sur un clone local accessible.
