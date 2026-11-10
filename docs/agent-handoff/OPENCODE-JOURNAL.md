# OPENCODE-JOURNAL — La Binch (branche `opencode-golipette`)

Journal des réalisations d'OpenCode. Une entrée par lot de travail : contenu, commits, tests,
difficultés, décisions.

## 2026-11-10 — Lot 5 : corpus Faith `data/druid-other.json` (chantier 12)

### Réalisé
- `public/binch/faith-knowledge/data/druid-other.json` (commit `e93eaf7`) : 27 fiches dans
  le nouveau fichier arbitré par ChatGPT (`ea8dd0b`), sans toucher `data/builds.json` ni
  aucun fichier existant du corpus. `scope=forever`, `verification=verifie`, sources
  limitées aux URLs re-vérifiées vivantes le 10 nov (Icy Veins resto/équilibre leveling,
  Voulk 4 nov ; ForeverSpec resto/balance 6 nov, client 1.60.1.70790 ; export officiel
  `talentsforever.com/export/druid.json` CC BY 4.0 du 4 nov).
  - 3 fiches `build` : soigneur raid restauration 11/0/40 (ordre complet ForeverSpec du
    6 nov, pilier Esprit : Renvoi/Esprit vif/Floraison) ; équilibre leveling 41/0/10
    (Colère bon marché, DoT, Forme de sélénien au 42) ; équilibre raid 41/0/10 (aura
    sélénien 3 % critique, Feu stellaire à 2,5 s avec Éclipse).
  - 24 fiches `talent` resto/équilibre : tooltips officiels rang par rang (valeurs
    exactes), prérequis vérifiés contre l'export (Croissance sauvage←Esprit vif 3 + 30 pts
    resto, Rapidité de la nature←Naturaliste 5, Vengeance←Eclat lunaire amélioré 2,
    Splendeur←Majesté 2, Rétablissement amélioré←Récupération améliorée 3, Forme de
    sélénien 30 pts Équilibre), présence dans chaque build, hotfixs 30 oct/2 nov
    documentés (Floraison remplace Don de la Terre-mère, Cœur de fauve venu du farouche,
    Renvoi/Discrétion échangées, Naturaliste accélère Croissance sauvage 3 s, Prompte
    guérison sur ses seuls HoT).
- 3 corrections de rigueur avant validation (ne rien affirmer hors sources) : Fureur
  lunaire, Feu stellaire amélioré et Essaim d'insectes ramenés aux comparaisons
  documentées ForeverSpec/export plutôt qu'à mes inférences Classic.
- Summaries des 3 fiches build raccourcies sous la limite de 1200 caractères du
  validateur (1256/1244/1292 → sous limite après retraits chirurgicaux, faits sourcés
  conservés).
- Titre de la fiche Éclipse enrichi d'un fait sourcé (« Colère accélère vos Feux
  stellaires ») : la requête « éclipse feu stellaire » renvoyait Feu stellaire amélioré
  (titre = 5 points/terme dans le moteur) ; Éclipse retrouve la première place sans
  toucher au moteur.
- `test-builds-corpus.mjs` étendu au corpus 3 fichiers (validateur ×3, 57 ids uniques,
  14 requêtes positives dont 9 nouvelles resto/équilibre, 5 contre-exemples, contrôle
  citations).

### Commits
- `e93eaf7` feat(binch): add sourced druid resto and balance corpus (data/druid-other.json)
  (poussé sur `origin/opencode-golipette`).
- To Do officielle : entrée « Livraison OpenCode — corpus druid-other.json » ajoutée au
  dépôt `quentindumont70-bit/WoW-Forever-Grimoire` (clone local `grimoire-todo`).

### Tests
- Node réel (v24.18.1), validateur/moteur extraits d'`origin/main` :
  `validator.check()` → druid-other `{"ok":true,"errors":[],"count":27}` ; builds `27` ;
  core `3` non régressé ; 57 ids uniques sur corpus combiné ; 14 requêtes positives
  correctes (dont « build soigneur restauration raid », « croissance sauvage »,
  « floraison esprit », « build druide équilibre leveling », « forme de sélénien »,
  « éclipse feu stellaire », « prompte guérison », « colère améliorée mana ») ;
  5 contre-exemples hors corpus (« ragnaros », « épée du berserker », « quête du val des
  tempêtes », « recette alchimie flask », « chaman élémentaire ») → `found:false` (refus
  d'invention) ; citations HTTPS datées renvoyées.
- `node scripts/check-binch.mjs` : 67 scripts, 0 erreur, 1 avertissement (LFG Supabase —
  préexistant). Aucun `.js` modifié ce lot.

### Difficultés
- Premier passage : les summaries des 3 fiches build dépassaient la limite de 1200
  caractères du validateur (détecté par le test étendu) — retraits chirurgicaux, faits
  sourcés conservés.
- Requête « éclipse feu stellaire » : le moteur score le titre (5 pts/terme) et « Feu
  stellaire amélioré » battait « Éclipse » d'un point. Corrigé côté corpus (titre Éclipse
  enrichi d'un fait sourcé), pas côté moteur (domaine ChatGPT).

### Décisions
- Contribution limitée au seul nouveau fichier `data/druid-other.json` (arbitrage
  `ea8dd0b`) ; entrée `manifest.json` laissée à ChatGPT à la réconciliation.
- Export officiel talentsforever préféré en cas d'écart ; écart Croissance sauvage
  (280/7 s dans l'infobulle export vs 679/7 s dans le grimoire client niveau 40 relevé
  par ForeverSpec) documenté en `notes` sans trancher.
- Lecture du CHATGPT-STATUS `8052937` avant livraison : mes 27 fiches `builds.json` ont
  été copiées sur `main` par ChatGPT (catalogue 30 fiches) — rien à refaire ; le pont
  Bourse `market-bridge.js` est livré par ChatGPT — OpenCode ne le touche pas et ne
  réimplémente pas les correctifs adoptés (gear-sets, ah-craft) ; consignes `index.html`
  (versions de cache et scripts ChatGPT à préserver) notées pour la réconciliation.

## 2026-11-10 — Lot 4 : corpus Faith `data/builds.json` (chantier 7) + revue finale (chantier 11)

### Réalisé
- `public/binch/faith-knowledge/data/builds.json` (commit `545d511`, poussé) : 27 fiches
  conformes au `schema-v1.json` et au README corpus de ChatGPT (`ded7732`) — résumés rédigés
  originaux, `scope=forever`, `verification=verifie`, sources limitées aux 4 URLs vérifiées
  vivantes le 10 nov (Icy Veins « Feral Druid Leveling » Meyra 4 nov ; export officiel
  `talentsforever.com/export/druid.json` CC BY 4.0 généré le 4 nov avec hotfixes serveur du
  3 nov ; ForeverSpec « Build Druide Farouche » 6 nov, client 1.60.1.70790 ;
  `talentsforever.com/druid/builds`).
  - 3 fiches `build` : itinéraire de leveling Icy Veins (51 points 10→60, ordre exact,
    final 9/32/10, Frappes de prédateur 29 puis 33–34) ; DPS félin raid ForeverSpec
    (9/32/10, ordre complet, alternative Changeforme naturel) ; tank ours ForeverSpec
    (0/41/10, menace 115 % depuis les notes du 2 nov).
  - 24 fiches `talent` : tooltips de l'export officiel (valeurs rang par rang), prérequis
    (Lacérer←Furie sauvage, Pourfendre et déchirer←Frappes de prédateur, Morsure
    primordiale←Chef de la meute, Puissance fluctuante←Predatory Discipline), présence dans
    chaque build, différences Forever vs Classic.
- Écarts entre sources documentés en `notes` des fiches, export officiel préféré :
  Instinct farouche (ForeverSpec « Changements vs Classic » : 3 %/0,6 niv vs export
  10/20/30 %/1–3 niv) ; Furie sauvage (+20 % ForeverSpec vs +10 % export) ; Puissance
  fluctuante (révision antérieure « 0 Mana » non résolue, corrigée en « 55 % du mana de
  base → 40 Énergie ») ; Morsure primordiale (le grimoire client liste aussi un sort appris
  niveau 40 à 100 %+77 distinct du talent 100 %+42 — relation non tranchée, aucune
  assertion).
- Note « variante ForeverSpec » de `specs-guide.js` affinée avec l'ordre intégral 9/37/5 de
  la page du 6 nov (plus de différences que l'ancienne note) + bump `specs-guide.js?v=003`
  dans `index.html`.
- Revue finale (chantier 11) : `check-binch.mjs`, diff complet depuis le merge-base
  `0311770` (5 commits, 9 fichiers, +866/−40), cartographie de la zone de conflit
  `index.html`, smoke test navigateur de l'onglet Specs.

### Commits
- `545d511` feat(binch): add sourced druid builds corpus for Faith (data/builds.json)
  (poussé sur `origin/opencode-golipette`).
- To Do officielle : entrée « Livraison OpenCode — corpus builds.json » ajoutée au dépôt
  `quentindumont70-bit/WoW-Forever-Grimoire` (clone local `grimoire-todo`).

### Tests
- Validateurs de ChatGPT extraits d'`origin/main`, exécutés en Node réel (v24.18.1) :
  `validator.check()` sur `builds.json` → `{"ok":true,"errors":[],"count":27}` ;
  `core.json` non régressé (3 fiches) ; 30 ids uniques sur corpus combiné.
- Moteur `search.js` sur corpus combiné core+builds : « build farouche leveling » →
  fiche itinéraire ; « puissance fluctuante » → fiche talent ; « chef de la meute »,
  « build tank ours », « lacérer menace ours » → bonnes fiches ; « faith local » → fiche
  système de ChatGPT ; contre-exemples hors corpus (« ragnaros », « épée du berserker »,
  « quête du val des tempêtes », « recette alchimie flask ») → `found:false` (refus
  d'invention). Citations renvoyées avec URLs HTTPS et dates.
- `node scripts/check-binch.mjs` : 67 scripts, 0 erreur, 1 avertissement (LFG Supabase
  non configuré — préexistant).
- Smoke test navigateur (serveur statique local port 8971) : page chargée, onglet Specs
  actif, note ForeverSpec complète rendue avec lien externe correct ; 0 erreur, 0
  avertissement console au chargement et au rechargement.

### Difficultés
- ChatGPT n'a pas exécuté ses propres tests en Node réel : ses fichiers n'existent que sur
  `origin/main`. Extraction des UMD (`validator.js`, `search.js`) vers un répertoire temp
  local pour les exécuter sur mon fichier neuf avant tout commit.
- `data/builds.json` n'est pas encore chargé par la page : `manifest.json` de ChatGPT ne
  liste que `data/core.json` (contrainte volontaire, domaine corpus = ChatGPT). Les tests
  Node prouvent la conformité ; l'intégration navigateur réelle attend l'entrée manifest.

### Décisions
- Contribution strictement limitée au nouveau fichier `data/builds.json` (périmètre prévu
  par le README `ded7732` et CHATGPT-STATUS « il pourra alimenter le futur
  data/builds.json ») ; aucun fichier existant du corpus modifié ; entrée `manifest.json`
  laissée à ChatGPT (documentée dans MESSAGE-POUR-CHATGPT.md).
- Export officiel talentsforever préféré au tableau « Changements vs Classic » de
  ForeverSpec en cas d'écart ; l'écart reste documenté dans la fiche.
- Builds 60 qualifiés de théoriques dans les fiches (raids Forever ouvrent le 9 déc 2026,
  aucun test de raid réel).

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
