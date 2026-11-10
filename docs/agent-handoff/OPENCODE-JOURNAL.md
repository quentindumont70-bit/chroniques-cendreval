# OPENCODE-JOURNAL — La Binch (branche `opencode-golipette`)

Journal des réalisations d'OpenCode. Une entrée par lot de travail : contenu, commits, tests,
difficultés, décisions.

## 2026-11-10 — Lot 2 : correctifs des crashs JS + fichiers de passation

### Réalisé
- Diagnostic complet des deux `TypeError: Cannot set properties of null` signalés en console
  (`gear-sets.js:41` onsubmit, `ah-craft.js:58` onsubmit) et des trois 404 CSS
  (`enhancements.css`, `zone-atlas.css`, `journey-live.css` référencés dans `index.html`).
- Méthode de diagnostic : reproduction en navigateur (serveur statique local port 8971),
  instrumentation progressive (sonde DOM patchant `innerHTML`/`append`/`insertBefore`/…,
  copie instrumentée de `gear-sets.js` avec journal d'exécution ligne par ligne, capture
  `window.onerror`), puis audit statique croisé de tous les modules (`scan-invisible.mjs`
  sur les caractères invisibles — négatif ; `audit-dollar.mjs` sur les conventions du helper
  `$` — concluant).
- Cause racine 1 (gear-sets) : le module définit `$ = id => document.getElementById(id)` mais
  7 appels utilisaient la syntaxe sélecteur CSS `$('#binch-gear-set-form')`. `getElementById`
  ne comprend pas le `#` → null → TypeError. La boîte était insérée avant le crash donc visible
  mais totalement inerte (formulaire, sélection, suppression, copie non câblés). Détail du
  diagnostic : les chaînes tapées neuves sans `#` trouvaient l'élément, celles copiées de
  l'original avec `#` échouaient — d'où l'instrumentation de `$` lui-même qui a capturé
  l'argument exact reçu (`'#binch-gear-set-selected'`, codes UTF-16 à l'appui).
- Cause racine 2 (ah-craft) : `mount()` exige `.binch-ah > footer` ou `.binch-ah` dans
  `#page-market` pour insérer sa section. `market-board.js` (chargé avant `ah-market.js`)
  crée `#page-market` sans `.binch-ah` → section jamais insérée → lookup du formulaire null
  → TypeError.
- Correctifs : retrait des 7 préfixes `#` dans `gear-sets.js` ; repli d'insertion dans
  `ah-craft.js` (`footer.before` → `.binch-ah.append` → `page.append`) ; suppression des
  3 liens CSS morts ; bumps de cache `gear-sets.js`/`ah-craft.js` v001→v002.
- Constat architecture (non tranché, transmis à ChatGPT) : duplication `market-board.js` /
  `ah-market.js` de la page Bourse ; `binch.ah.market.v1` n'est jamais alimenté alors que
  `ah-craft.js`, `faith-strategist.js`, `faith-dialogue.js`, `local-backup.js` le lisent.
- Création des trois fichiers de passation (PLAN, JOURNAL, MESSAGE).

### Commits
- `9364b43` fix(binch): revive gear locker bindings and craft workbench mount (poussé
  sur `origin/opencode-golipette`).

### Tests
- `node scripts/check-binch.mjs` : 67 scripts, 0 erreur, 1 avertissement (LFG Supabase
  non configuré — préexistant, hors périmètre).
- Navigateur (charge + 3 rechargements) : console sans aucune erreur (plus de TypeError,
  plus de 404).
- Fonctionnel gear-sets : profil simulé (`grimoire.hub.v3` + `grimoire.bridge.last`),
  statut « Équipement observé chez Testdruide · 3 emplacements importés », création d'un
  ensemble via le formulaire (sauvegarde localStorage clé par personnage, sélection peuplée,
  comparaison rendue « 3 identique(s) · 0 différent(s) »), suppression possible.
- Fonctionnel ah-craft : recette enregistrée (objet, métier, rendement, ingrédient),
  compteur mis à jour, section présente dans `#page-market`.
- Données de test supprimées après vérification (clés localStorage retirées, rechargement
  de contrôle propre).

### Difficultés
- Le paradoxe apparent « élément trouvé à la ligne N, null à la ligne N+1 » n'était pas une
  course asynchrone : les deux appels utilisaient des chaînes différentes (avec/sans `#`),
  invisibles à l'œil dans le code minifié. Résolu en journalisant l'argument exact reçu par
  le helper `$` au moment de l'échec.

### Décisions
- Pas de refonte de la page Bourse (domaine ChatGPT/coordination) : correctif minimal robuste
  + documentation factuelle pour arbitrage.
- Suppression des liens CSS morts plutôt que création des fichiers : les styles de ces
  modules sont déjà inlinés dans `index.html` (vérifié), les `.js` autonomes existants ne
  sont pas référencés comme scripts.

## 2026-11-10 — Lot 1 (session précédente) : audit + montage Specs + build farouche vérifié

- Montage de l'onglet Specs dans le portail public (`0311770` et commits associés
  `6927e35`, `b495880`) : hub de spécialisations WoW Forever, bandeau épinglé du build
  farouche leveling.
- Décodage du build farouche officiel Icy Veins (Meyra, 4 nov 2026) depuis le hash du
  calculateur de talents officiel : 51 points, ordre niveau par niveau 10→60, vérifié
  talent par talent contre le JSON de l'arbre (deux versions, diff tooltips uniquement).
- URLs des guides vérifiées vivantes (nov 2026) : resto/équilibre/farouche leveling ×2
  classes, farouche PvP/PvE, hub classe, wowhead forever feral, armorywowforever ×9,
  foreverspec druide feral.
- Constat transmis : le profil restauration du module pointe à tort vers le guide farouche.

### À venir (prochain lot)
- Réécriture complète de `specs-guide.js` avec le build décodé (voir OPENCODE-PLAN.md
  chantier 4), puis QA navigateur, puis mise à jour de la To Do officielle.
