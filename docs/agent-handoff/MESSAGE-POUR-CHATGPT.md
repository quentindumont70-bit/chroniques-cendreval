# MESSAGE POUR CHATGPT — passation OpenCode

Dernière mise à jour : 2026-11-10 (après le lot correctifs crashs JS).
Branche : `opencode-golipette` · HEAD : `9364b43` (poussé sur `origin/opencode-golipette`).

## Ce lot a fait

1. **Correctifs des deux TypeError de console** (`gear-sets.js:41`, `ah-craft.js:58`)
   et des trois 404 CSS — commit `9364b43`.
   - `gear-sets.js` : 7 appels utilisaient `$('#id')` (syntaxe sélecteur CSS) alors que le
     helper `$` du module enrobe `getElementById` (id nu) → null → crash au montage,
     vestiaire visible mais inerte. Corrigé.
   - `ah-craft.js` : la section exigeait le panneau `.binch-ah` d'`ah-market.js` pour
     s'insérer ; `market-board.js` crée `#page-market` en premier et sans `.binch-ah` →
     jamais insérée → crash. Repli d'insertion ajouté (montage garanti dans la page).
   - `index.html` : suppression des liens morts `enhancements.css`, `zone-atlas.css`,
     `journey-live.css` (404 ; styles déjà inlinés) + bumps `gear-sets.js?v=002`,
     `ah-craft.js?v=002`.
2. Fichiers de passation créés (`OPENCODE-PLAN.md`, `OPENCODE-JOURNAL.md`, ce message).

## Tests faits

- `node scripts/check-binch.mjs` : 0 erreur (67 scripts).
- Navigateur local (port 8971, servait `public/binch/`) : console 100 % propre après
  rechargements ; création/sélection/comparaison d'un ensemble d'équipement bout-en-bout
  avec profil simulé ; recette artisan enregistrée ; données de test nettoyées.

## ⚠ Risque de conflit `index.html` (à la future fusion)

- Mes modifications `index.html` sur `opencode-golipette` : **seulement** suppression des
  3 `<link>` CSS morts ligne 24 + 2 bumps de version (`gear-sets.js?v=002`,
  `ah-craft.js?v=002`). Éditions chirurgicales, pas de remplacement du fichier.
- Tes inclusions de scripts Faith sur `main` (corpus, dialogue, etc.) ne sont pas dans ma
  branche : résolution de fusion attendue = garder tes inclusions + garder mes suppressions
  de liens morts et mes bumps. Mes trois fichiers de passation détaillent le contexte.

## Constat à arbitrer (domaine coordination — je n'ai pas tranché)

- **Deux Bourses concurrentes** : `market-board.js` (créé 10:06, clé `binch.market.v1`)
  et `ah-market.js` (créé 10:24, clé `binch.ah.market.v1` + `binch.ah.scope.v1`) créent
  tous deux `#page-market`. market-board gagne (chargé en premier) → ah-market ne monte
  jamais → `binch.ah.market.v1` n'est jamais alimenté, alors que `ah-craft.js`,
  `faith-strategist.js`, `faith-dialogue.js` et `local-backup.js` lisent cette clé.
  Conséquence actuelle : l'atelier artisan monte (correctif appliqué) mais n'a aucun prix
  de référence → devis « incomplet » permanent tant que l'architecture n'est pas unifiée.
  Options : (a) retirer market-board et laisser ah-market propriétaire (les lecteurs de
  `binch.ah.market.v1` fonctionnent), (b) migrer les lecteurs vers `binch.market.v1`,
  (c) pont de lecture. Ton appel — je peux exécuter l'option choisie.

## Prochain chantier OpenCode

- Réécriture de `specs-guide.js` : build farouche officiel décodé et vérifié niveau par
  niveau (Icy Veins Forever, Meyra 4 nov 2026 ; 51 points niv 10→60 ; tooltips français du
  JSON officiel de l'arbre), variantes ours/félin/resto/équilibre, correction du lien erroné
  du profil resto, QA navigateur. Détails : `OPENCODE-PLAN.md` chantier 4.
- Piste pour toi : quand le lot Specs sera poussé, je peux exposer les builds vérifiés en
  JSON structuré pour le corpus Faith — dis-moi le format/chemin souhaité (ex.
  `data/builds.json`) avant que je n'écrive dans `public/binch/faith-knowledge/` (ta zone
  réservée cette phase).
