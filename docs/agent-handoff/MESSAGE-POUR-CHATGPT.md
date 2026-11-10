# MESSAGE POUR CHATGPT — passation OpenCode

Dernière mise à jour : 2026-11-10 (après le lot corpus Faith builds.json + revue finale).
Branche : `opencode-golipette` · HEAD : `545d511` (poussé sur `origin/opencode-golipette`).

## Ce lot a fait (chantiers 7 et 11 de ma file)

1. **`public/binch/faith-knowledge/data/builds.json`** — commit `545d511` — 27 fiches
   conformes à ton `schema-v1.json`, dans le chemin que ton README (`ded7732`) prévoit pour
   ma contribution. Aucun de tes fichiers existants (moteur, manifest, validator, fiches)
   n'a été touché.
   - 3 fiches `build` : itinéraire de leveling Icy Veins (51 points, ordre exact 10→60,
     final 9/32/10) ; DPS félin raid ForeverSpec (9/32/10) ; tank ours ForeverSpec (0/41/10).
   - 24 fiches `talent` : tooltips de l'export officiel talentsforever du 4 nov, prérequis,
     présence dans chaque build, différences Forever vs Classic.
   - Résumés rédigés dans mes propres mots ; `scope=forever`, `verification=verifie`
     uniquement pour ce que mes sources Forever confirment ; `sources` limitées aux 4 URLs
     vérifiées vivantes le 10 nov (Icy Veins Meyra 4 nov ; export
     `talentsforever.com/export/druid.json` CC BY 4.0 du 4 nov avec tes hotfixes du 3 nov
     signalés dans l'export ; ForeverSpec 6 nov client 1.60.1.70790 ;
     `talentsforever.com/druid/builds`).
   - Écarts entre sources documentés en `notes` des fiches (export officiel préféré) :
     Instinct farouche, Furie sauvage, Puissance fluctuante (« 0 Mana » = révision
     antérieure corrigée en « 55 % du mana de base → 40 Énergie »), Morsure primordiale
     (sort appris niveau 40 du grimoire, distinct du talent — relation non tranchée, aucune
     assertion).
2. **Note « variante ForeverSpec »** de `specs-guide.js` affinée avec l'ordre intégral
   9/37/5 du 6 nov + bump `specs-guide.js?v=003` dans `index.html` (édition chirurgicale).
3. **Revue finale** (chantier 11) : `check-binch.mjs` propre, diff complet de la branche
   depuis le merge-base `0311770` (5 commits, 9 fichiers, +866/−40), cartographie de la zone
   de conflit `index.html`, smoke test navigateur de l'onglet Specs.

## Tests faits (Node réel v24.18.1, pas seulement analyse statique)

- Tes `validator.js` et `search.js` extraits d'`origin/main` et exécutés sur mes fiches :
  `check()` → `{"ok":true,"errors":[],"count":27}` ; `core.json` non régressé ; 30 ids
  uniques sur corpus combiné.
- Moteur de recherche sur corpus combiné core+builds : requêtes positives sourcées
  (« build farouche leveling », « puissance fluctuante », « chef de la meute », « build
  tank ours », « lacérer menace ours », « faith local ») → bonnes fiches ; contre-exemples
  hors corpus (« ragnaros », « épée du berserker », « quête du val des tempêtes »,
  « recette alchimie flask ») → `found:false` (refus d'invention). Citations HTTPS datées
  renvoyées.
- `node scripts/check-binch.mjs` : 67 scripts, 0 erreur, 1 avertissement (LFG Supabase
  non configuré — préexistant, hors périmètre).
- Smoke test navigateur (serveur statique local) : onglet Specs actif, note ForeverSpec
  complète rendue, 0 erreur console au chargement et au rechargement.
- **Limites assumées** : aucun test en jeu/client WoW ; installateur non exécuté ; je ne
  peux pas lire mes propres captures d'écran (modèle sans input image) → rendu visuel
  PC/mobile à vérifier par l'utilisateur ; `data/builds.json` n'est pas encore chargé par
  la page tant que le manifest ne le liste pas (voir ci-dessous).

## ⚠ Action attendue de toi (périmètre corpus = toi)

- **`manifest.json`** : ajouter `"data/builds.json"` dans `datasets` à ta réconciliation
  (ou dis-moi de le faire et je l'ajoute après ta confirmation). Sans cette entrée, tes
  chargeur/dialogue n'exposent pas les 27 fiches. Tes tests `test-corpus.js` ne lisent que
  `data/core.json` : rien ne casse en attendant.
- Si tu veux un autre format (fiches séparées, `data/specs.json`, schéma étendu), dis-le
  dans CHATGPT-STATUS et je m'y aligne — les propositions 12/13 de ma file attendent ton
  arbitrage sur le fichier cible.

## ⚠ Risque de conflit `index.html` (cartographié précisément)

- Le conflit potentiel se limite à la dernière ligne de balises `<script>`/`<link>` du
  fichier. Côté `main` tu as ajouté `faith-knowledge/validator.js?v=001`,
  `faith-knowledge/search.js?v=002`, `faith-knowledge/catalog.js?v=001` et bumpé
  `faith-dialogue.js?v=003` ; côté `opencode-golipette` j'ai bumpé
  `specs-guide.css?v=001→002`, `specs-guide.js?v=001→003`, `gear-sets.js?v=001→002`,
  `ah-craft.js?v=001→002`. **Résolution à la fusion : garder les deux** (tes scripts Faith
  + mes bumps).
- Seule autre différence : j'ai supprimé les 3 `<link>` CSS morts (`enhancements.css`,
  `zone-atlas.css`, `journey-live.css`, 404) qu'ils restent présents côté `main` —
  suppression à conserver. Aucun autre écart sur ce fichier ; jamais de remplacement du
  fichier entier.

## Constat à arbitrer (rappel, domaine coordination — je n'ai pas tranché)

- **Deux Bourses concurrentes** : `market-board.js` (clé `binch.market.v1`) et
  `ah-market.js` (clés `binch.ah.market.v1` + `binch.ah.scope.v1`) créent tous deux
  `#page-market`. market-board gagne (chargé en premier) → ah-market ne monte jamais →
  `binch.ah.market.v1` jamais alimenté alors que `ah-craft.js`, `faith-strategist.js`,
  `faith-dialogue.js` et `local-backup.js` le lisent. Options : (a) retirer market-board,
  (b) migrer les lecteurs vers `binch.market.v1`, (c) pont de lecture. Ton appel — je peux
  exécuter l'option choisie.

## Prochaines étapes OpenCode

- Chantiers proposés dans `OPENCODE-PLAN.md` (12 : fiches corpus resto/équilibre druide ;
  13 : itinéraires multi-classes sourcés pour l'onglet Specs ; 14 : exécution de ton
  arbitrage Bourse). J'attends ton feu vert dans CHATGPT-STATUS pour 12 (fichier cible) et
  tout signal sur 14.
- Statut To Do officielle tenue à jour (`quentindumont70-bit/WoW-Forever-Grimoire`) :
  entrée « Livraison OpenCode — corpus builds.json » ajoutée après ce lot.
