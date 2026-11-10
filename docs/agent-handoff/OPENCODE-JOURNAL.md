# OPENCODE-JOURNAL — La Binch (branche `opencode-golipette`)

Journal des réalisations d'OpenCode. Une entrée par lot de travail : contenu, commits, tests,
difficultés, décisions.

## 2026-11-10 — Lot 3 : Specs farouche officiel (réécriture + QA + audit console)

### Réalisé
- Réécriture complète de `specs-guide.js` (commit `40a8419`, poussé) autour de trois
  structures : `T` (20 talents : nom FR, arbre, max, infobulle), `SEQ` (51 entrées = l'ordre
  exact du build de leveling Icy Veins Forever « Feral Druid Leveling », Meyra, 4 nov 2026,
  décodé depuis le hash de son calculateur officiel), `PHASES` (4 phases narratives).
- `stepsAt()` fusionne les runs non contigus : Frappes de prédateur prise au niveau 29 puis
  33–34 est affichée « 29, 33–34 » avec le total possédé calculé sur les deux runs — c'est le
  build officiel, pas une interpolation. `nextPoint()`/`points()` pour l'état « prochain
  talent » selon le niveau.
- Noms français du client Forever 1.60.1.70790 relevés via ForeverSpec (6 nov 2026) :
  Griffes aiguisées, Morsure primordiale (Primal Bite), Puissance fluctuante (Shifting Power) ;
  « Predatory Discipline » laissé en anglais (non traduit dans le client FR — constat conservé).
- Infobulles : traduction fidèle des tooltips du calculateur officiel (valeurs identiques),
  sources archivées dans `binch-audit` (`druid-f7fd84eb.json` → `druid-e74d4f16.json`).
- Variantes druide : ours tank 0/41/10, félin DPS 9/32/10 (ForeverSpec), resto (lien corrigé
  vers `restoration-druid-leveling`), équilibre ajouté (`balance-druid-leveling`) ; lien
  ForeverSpec étiqueté « (fr) » ; les autres classes affichent explicitement l'absence
  d'ordre certifié (aucun rang fictif).
- `specs-guide.css` : styles phases / infobulles / état `is-next` (talent du prochain point).
- Bumps de cache `specs-guide.js?v=002` / `specs-guide.css?v=002` dans `index.html`
  (éditions chirurgicales uniquement).
- Audit console transversal : 18 onglets parcourus, 0 erreur, 0 avertissement.

### Commits
- `40a8419` feat(binch): rewrite Specs route with official decoded feral build (poussé sur
  `origin/opencode-golipette`).
- To Do officielle : entrée « Livraison OpenCode — onglet Specs » ajoutée au dépôt
  `quentindumont70-bit/WoW-Forever-Grimoire` (clone local `grimoire-todo`).

### Tests
- `node scripts/check-binch.mjs` (depuis la racine) : 67 scripts, 0 erreur, 1 avertissement
  (LFG Supabase non configuré — préexistant).
- QA navigateur (serveur statique port 8971) : console propre au chargement et rechargement ;
  20 talents / 20 infobulles rendus ; niv 10 (1/51, prochain 11 : Férocité 2/5), niv 30
  (21 pts, Frappes 1/3, phase 29–41 active, prochain 31 : Instinct naturel), niv 34
  (Frappes 3/3, 25 pts), niv 60 (51/51, « Build complet ») ; niveau importé du profil simulé
  (niv 47 → bandeau « prochain 48 : Naturaliste 2/5 ») ; bandeau épinglé ; filtre Druide =
  5 cartes ; données de test supprimées (rechargement de contrôle propre, clé résiduelle
  `binch.zone.plan.v1.testdruide..` retirée).

### Difficultés
- QA visuelle impossible : `browser.screenshot` renvoie une image que ce modèle ne peut pas
  lire (« this model does not support image input ») — vérification du rendu visuel
  (PC/mobile) laissée à l'utilisateur, documentée dans la To Do et MESSAGE.
- Frappes de prédateur non contiguë dans le build officiel : un parcours linéaire simple
  afficherait « 29–34 » (faux). Résolu par fusion des runs par talent dans `stepsAt()`.

### Décisions
- La source de vérité affichée = build Icy Veins Forever décodé du calculateur officiel ;
  ForeverSpec (6 nov) cité en « variante communautaire » avec ses différences documentées
  (Peau épaisse, Fureur, Attaques lacérantes), jamais mélangé dans la séquence principale.
- Aucune écriture dans `public/binch/faith-knowledge/` (domaine ChatGPT) à ce stade ;
  contribution prévue par `data/builds.json` conforme à son schéma (chantier 7).

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
