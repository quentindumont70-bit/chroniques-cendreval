# MESSAGE POUR CHATGPT — passation OpenCode

Dernière mise à jour : 2026-11-10 (après le lot Specs).
Branche : `opencode-golipette` · HEAD : `40a8419` (poussé sur `origin/opencode-golipette`).

## Ce lot a fait (chantiers 4/5/6/8 de ma file)

1. **Réécriture complète de `specs-guide.js`** — commit `40a8419`.
   - La route druide farouche est désormais l'**ordre exact niveau par niveau** du build de
     leveling Icy Veins Forever (Meyra, 4 nov 2026), décodé depuis le hash du lien de son
     calculateur officiel : 51 points, niveau 10 → 60. Frappes de prédateur est prise au
     niveau 29 **puis** 33–34 (non contigu dans le build officiel — affiché comme tel, pas
     interpolé). Noms français du client Forever 1.60.1.70790 (relevés via ForeverSpec,
     6 nov 2026) ; infobulles traduites fidèlement du calculateur officiel (aucune valeur
     inventée). 4 phases narratives ; état `is-next` sur le talent du prochain point selon
     le niveau (importé du profil ou manuel).
   - Variantes druide sourcées : ours tank 0/41/10, félin DPS 9/32/10, restauration
     (montée farouche puis respé 11/0/40), équilibre 41/0/10 — **lien resto corrigé** (il
     pointait vers le guide farouche), carte équilibre ajoutée, ForeverSpec étiqueté « (fr) ».
   - `specs-guide.css` : styles phases/infobulles/is-next. Bumps `specs-guide.js?v=002`,
     `specs-guide.css?v=002` dans `index.html`.
2. **QA navigateur** : console 100 % propre au chargement/rechargement ; niveaux pivot
   vérifiés (10 : 1/51 ; 30 : 21 pts, Frappes 1/3 ; 34 : Frappes 3/3 ; 60 : 51/51) ; niveau
   importé du profil simulé ; bandeau épinglé ; filtre de classe ; données de test nettoyées.
3. **Audit console transversal** : parcours des 18 onglets du portail, 0 erreur,
   0 avertissement.
4. **To Do officielle** : entrée « Livraison OpenCode — onglet Specs » ajoutée en fin de
   `TO-DO-LIST-LA-BINCH.md` (`quentindumont70-bit/WoW-Forever-Grimoire`), statuts honnêtes
   et rappel explicite que ma branche n'est pas fusionnée dans `main`.

## Tests faits

- `node scripts/check-binch.mjs` : 67 scripts, 0 erreur, 1 avertissement (LFG Supabase non
  configuré — préexistant, hors périmètre).
- QA navigateur fonctionnelle complète (détails dans `OPENCODE-JOURNAL.md` Lot 3).
- **Limite assumée** : je ne peux pas lire les images de mes propres captures d'écran
  (modèle sans input image) → le rendu visuel (PC/mobile) reste à vérifier par l'utilisateur.
  Aucun test en jeu/client WoW.

## ⚠ Risque de conflit `index.html` (à la future fusion)

- Mes modifications cumulées `index.html` sur `opencode-golipette` : suppression des
  3 `<link>` CSS morts (enhancements/zone-atlas/journey-live) + bumps de version
  (`gear-sets.js?v=002`, `ah-craft.js?v=002`, `specs-guide.js?v=002`,
  `specs-guide.css?v=002`). Éditions chirurgicales uniquement, jamais de remplacement
  du fichier — tes inclusions Faith de `main` (corpus, dialogue) sont à conserver telles
  quelles à la fusion.

## Constat à arbitrer (rappel, domaine coordination — je n'ai pas tranché)

- **Deux Bourses concurrentes** : `market-board.js` (clé `binch.market.v1`) et
  `ah-market.js` (clés `binch.ah.market.v1` + `binch.ah.scope.v1`) créent tous deux
  `#page-market`. market-board gagne (chargé en premier) → ah-market ne monte jamais →
  `binch.ah.market.v1` jamais alimenté alors que `ah-craft.js`, `faith-strategist.js`,
  `faith-dialogue.js` et `local-backup.js` le lisent. Options : (a) retirer market-board,
  (b) migrer les lecteurs vers `binch.market.v1`, (c) pont de lecture. Ton appel — je peux
  exécuter l'option choisie.

## Prochain chantier OpenCode (chantier 7)

- **Fiches de connaissances Faith dérivées du build farouche vérifié**, dans le chemin que
  ton README du corpus (`ded7732`) prévoit pour ma contribution : nouveau fichier
  `public/binch/faith-knowledge/data/builds.json`, fiches **conformes à ton
  `schema-v1.json`** (topic `build`/`talent`, `scope=forever`, `verification=verifie`
  seulement pour ce que mes sources Forever confirment, `sources` datées
  {url, label, checkedAt}, résumés rédigés en mes propres mots — pas de recopie des
  guides). Je ne toucherai à **aucun** de tes fichiers existants (moteur, manifest,
  validator, fiches) : l'entrée `manifest.json` (« data/builds.json ») restera à ajouter
  de ton côté à la réconciliation, ou par moi après ta confirmation.
- Validation prévue : exécuter ton `validator.js`/`tests/test-corpus.js` (extraits de
  `origin/main` en local) sur mes fiches comme preuve réelle de conformité.
- Si tu préfères un autre format/chemin (ex. `data/builds.json` hors corpus, ou fiches
  une par talent), dis-le dans CHATGPT-STATUS et je m'y aligne.
- Ensuite : chantier 11 (revue finale : `check-binch.mjs`, diff complet, bilan des limites),
  puis je proposerai les chantiers suivants de ma file dans OPENCODE-PLAN.md.
