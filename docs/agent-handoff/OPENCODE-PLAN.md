# OPENCODE-PLAN — La Binch (branche `opencode-golipette`)

File de chantiers priorisée d'OpenCode. Domaines réservés : Builds/Specs, leveling druide,
affichage des talents, QA associée. Ne jamais fusionner vers `main` sans validation explicite
de l'utilisateur. Avant chaque chantier : `git fetch origin` puis lire
`git show origin/main:docs/agent-handoff/CHATGPT-STATUS.md`.

États : À FAIRE · EN COURS · BLOQUÉ · TESTS À FAIRE · TERMINÉ

## Chantiers

1. **TERMINÉ** — Audit initial : `specs-guide.js`/`specs-guide.css`, montage dans `index.html`,
   To Do officielle (`quentindumont70-bit/WoW-Forever-Grimoire`), `check-binch.mjs`, clés localStorage.
   Commits antérieurs de la branche (montage onglet Specs : `0311770`).

2. **TERMINÉ** — Build farouche officiel décodé et vérifié : guide Icy Veins Forever (Meyra,
   4 nov 2026), 51 points niveau par niveau (10→60), tooltips français extraits du JSON officiel
   de l'arbre (`70755-f7fd84eb` → `70862-e74d4f16`, diff tooltips uniquement). Scripts d'audit dans
   `C:\Users\thore\AppData\Local\Temp\opencode\binch-audit\` (`decode-build.mjs`, JSON des arbres).

3. **TERMINÉ** — Correctifs JS diagnostiqués (commit `9364b43`, poussé) :
   - `gear-sets.js` : 7 appels `$('#id')` passés au helper `$` = wrapper `getElementById` →
     null → TypeError au montage, vestiaire visible mais inerte. Retrait des préfixes `#`.
   - `ah-craft.js` : insertion exigeait le panneau `.binch-ah` d'`ah-market.js` ; or
     `market-board.js` crée `#page-market` en premier et sans `.binch-ah` → section jamais
     insérée → TypeError. Repli : ajout direct dans la page.
   - `index.html` : suppression des 3 liens CSS morts (enhancements/zone-atlas/journey-live,
     404) + bump des versions de cache `gear-sets.js` et `ah-craft.js` (v001→v002).
   - Tests navigateur bout-en-bout : console sans erreur, création/sélection/comparaison
     d'un ensemble d'équipement, enregistrement d'une recette artisan, liens morts absents.

4. **TERMINÉ** — Réécriture de `specs-guide.js` (commit `40a8419`, poussé) : dict `T` (20 talents :
   nom FR du client Forever 1.60.1.70790 via ForeverSpec, arbre, max, tooltip traduit du
   calculateur officiel), `SEQ` (51 entrées, ordre exact du build Icy Veins Forever Meyra 4 nov
   2026 — Frappes de prédateur au 29 puis 33–34, fusion des runs non contigus dans `stepsAt()`),
   `PHASES` (10–19 ours / 20–28 félin / 29–41 cœur farouche / 42–60 arbres voisins, 9/32/10 final),
   `nextPoint()`/`points()`, variantes druide ours/félin/resto/équilibre avec liens vérifiés vivants,
   filtre `urlOK`, note ForeverSpec en variante communautaire. `specs-guide.css` : phases,
   infobulles, état `is-next`. Bumps `specs-guide.js?v=002` / `specs-guide.css?v=002`.

5. **TERMINÉ** — QA navigateur de la page Specs (serveur local port 8971) : console 100 % propre
   au chargement et rechargement ; 20 talents × 20 tooltips rendus ; vérifié niv 10 (1/51,
   prochain 11 : Férocité 2/5), niv 30 (21 pts, Frappes 1/3, phase 29–41 active), niv 34
   (Frappes 3/3, 25 pts), niv 60 (51/51 complet) ; niveau importé du profil simulé
   (`grimoire.hub.v3` + `grimoire.bridge.last`, niv 47 → « prochain 48 : Naturaliste 2/5 ») ;
   bandeau épinglé fonctionnel ; filtre Druide = 5 cartes ; lien resto corrigé vérifié ; données
   de test supprimées (dont clé résiduelle `binch.zone.plan.v1.testdruide..`).
   Limite : capture visuelle impossible (ce modèle ne lit pas les images de `browser.screenshot`)
   — rendu visuel à vérifier par l'utilisateur.

6. **TERMINÉ** — Cohérence guides resto/équilibre : lien resto corrigé vers
   `restoration-druid-leveling`, carte équilibre ajoutée (`balance-druid-leveling` + ForeverSpec
   fr), pages ForeverSpec resto/balance vérifiées vivantes et sourcées (resto : monter en
   farouche puis respé 11/0/40 au 60 ; équilibre : 41/0/10, Forme de sélénien au 42).

7. **TERMINÉ** — Fiches de connaissances Faith dérivées du build farouche vérifié (commit
   `545d511`, poussé) : `public/binch/faith-knowledge/data/builds.json`, 27 fiches conformes
   au `schema-v1.json` de ChatGPT (README `ded7732` : c'est le chemin prévu pour la
   contribution OpenCode) — 3 builds (itinéraire Icy Veins 51 points 10→60, final 9/32/10 ;
   DPS félin raid ForeverSpec 9/32/10 ; tank ours ForeverSpec 0/41/10) + 24 talents
   (tooltips de l'export officiel talentsforever du 4 nov, prérequis, présence dans chaque
   build, écarts entre sources documentés en `notes`). Sources vérifiées vivantes le 10 nov
   (Icy Veins Meyra 4 nov ; export `talentsforever.com/export/druid.json` CC BY 4.0 + page
   `/druid/builds` ; ForeverSpec 6 nov, client 1.60.1.70790). Validation en Node réel par le
   `validator.js` de ChatGPT : `ok:true, count:27` ; moteur `search.js` : 6 requêtes
   positives correctes sur corpus combiné core+builds (30 ids uniques) et 4 contre-exemples
   hors corpus → `found:false`. Note « variante ForeverSpec » de `specs-guide.js` affinée
   (ordre complet 9/37/5 du 6 nov) + bump `?v=003`. Aucun autre fichier du corpus touché ;
   entrée `manifest.json` à ajouter par ChatGPT à la réconciliation (documentée dans
   MESSAGE-POUR-CHATGPT.md).

8. **TERMINÉ** — Audit console des autres pages (QA associée) : parcours des 18 onglets de la
   nav (`command, hub, progression, discoveries, metiers, equipment, lfg, todo, bibliotheque,
   crafting, gm, sync, macros, coffre, market, evenements, tresors, specs`), zéro erreur,
   zéro avertissement.

9. **À FAIRE (décision ChatGPT)** — Constat architecture bourse : `market-board.js` (10:06)
   et `ah-market.js` (10:24) sont deux implémentations concurrentes de `#page-market`;
   market-board gagne (chargé en premier), ah-market ne monte jamais, donc `binch.ah.market.v1`
   n'est jamais alimenté alors que `ah-craft.js`, `faith-strategist.js`, `faith-dialogue.js`
   et `local-backup.js` le lisent. Voir MESSAGE-POUR-CHATGPT.md. OpenCode n'a pas tranché :
   correction minimale appliquée (montage robuste d'ah-craft, sans perte de données).

10. **TERMINÉ** — To Do officielle (`quentindumont70-bit/WoW-Forever-Grimoire`) : entrée
    « Livraison OpenCode — onglet Specs » ajoutée en fin de `TO-DO-LIST-LA-BINCH.md` (clone
    local `grimoire-todo`), statuts honnêtes ([CODE COMMITÉ SUR BRANCHE][TEST NAVIGATEUR],
    limites explicites, non-fusion dans `main` rappelée). Commit du dépôt Grimoire à pousser.

11. **TERMINÉ** — Revue finale avant passation : `node scripts/check-binch.mjs` (67 scripts,
    0 erreur, 1 avertissement LFG Supabase préexistant) ; diff complet de la branche depuis
    le merge-base `0311770` (5 commits, 9 fichiers, +866/−40) ; zone de conflit `index.html`
    cartographiée (mes 4 bumps de cache + suppression des 3 liens CSS morts, contre le
    chargeur Faith `faith-knowledge/*` ajouté par `main` sur la même ligne de scripts) ;
    smoke test navigateur de l'onglet Specs après `v003` (chargement + rechargement : 0
    erreur, 0 avertissement console ; note ForeverSpec complète rendue avec son lien) ;
    bilan des limites dans MESSAGE-POUR-CHATGPT.md.

12. **TERMINÉ** — Fiches corpus druide restauration/équilibre (commit `e93eaf7`, poussé) :
    `public/binch/faith-knowledge/data/druid-other.json`, nouveau fichier comme arbitré par
    ChatGPT (`ea8dd0b`, sans écraser `data/builds.json`), 27 fiches conformes au
    `schema-v1.json` — 3 builds (soigneur raid resto 11/0/40, équilibre leveling 41/0/10,
    équilibre raid sélénien 41/0/10, ordres complets ForeverSpec du 6 nov 2026) + 24 talents
    resto/équilibre (tooltips de l'export officiel `talentsforever.com/export/druid.json` du
    4 nov, prérequis vérifiés contre l'export : Croissance sauvage←Esprit vif 3 + 30 pts,
    Rapidité de la nature←Naturaliste 5, Vengeance←Eclat lunaire amélioré 2,
    Splendeur←Majesté 2, Rétablissement amélioré←Récupération améliorée 3, Forme de
    sélénien 30 pts Équilibre). Hotfixs 30 oct/2 nov documentés (Floraison remplace Don de
    la Terre-mère, Cœur de fauve venu du farouche, Renvoi/Discrétion échangées, Naturaliste
    accélère Croissance sauvage 3 s, Prompte guérison sur ses seuls HoT). Écarts entre
    sources en `notes` (Croissance sauvage 280/7 s export vs 679/7 s grimoire client niveau 40 ;
    Forme de sélénien jalon 40 Icy Veins vs prise au 42 ForeverSpec). Sources re-vérifiées
    vivantes le 10 nov (Icy Veins Voulk 4 nov resto/balance leveling ; ForeverSpec 6 nov,
    client 1.60.1.70790). Validation Node réelle : `validator.js` ok (27/27/3 sur
    druid-other/builds/core), 57 ids uniques sur le corpus combiné, 14 requêtes positives
    correctes via `search.js` (dont restauration/équilibre), 5 contre-exemples hors corpus
    → `found:false`, citations HTTPS datées. Titre de la fiche Éclipse enrichi d'un fait
    sourcé (« Colère accélère vos Feux stellaires ») pour la retrouver devant Feu stellaire
    amélioré sur cette requête. Entrée `manifest.json` à ajouter par ChatGPT à la
    réconciliation (documentée dans MESSAGE-POUR-CHATGPT.md).

13. **À FAIRE (proposition)** — Itinéraires de leveling multi-classes sourcés (hub leveling
    Icy Veins Forever) pour les cartes non druides de l'onglet Specs, aujourd'hui sans ordre
    certifié.

14. **À FAIRE (redéfini)** — Bourse : ChatGPT a livré le pont de lecture `market-bridge.js`
    sur `main` (statut du 10 nov : `e8034c72` pont en lecture seule, `6b35a28a` repli de
    Faith vers `binch.market.v1`, `5ff58169` chargement dans `index.html`) — OpenCode ne le
    réimplémente pas et ne touche ni `market-bridge.js`, ni `faith-dialogue.js`, ni les
    fichiers modifiés par ChatGPT. Reste possible pour OpenCode si la session le permet :
    cas de tests Node en lecture seule du pont (relevés exacts, filtrage faction, refus de
    portée indéfinie, recherche par objet) et documentation des consommateurs restants
    (craft, stratège).

## Notes de garde-fou

- Aucune donnée WoW inventée : sources Icy Veins/wowhead/armorywowforever/foreverspec uniquement,
  URLs re-vérifiées avant inclusion (filtre `urlOK` dans `specs-guide.js`).
- `index.html` est aussi modifié sur `main` (scripts Faith) : mes éditions restent chirurgicales
  (outil d'édition ciblé), jamais de remplacement du fichier entier ; conflit attendu à la
  fusion, résolution documentée dans MESSAGE-POUR-CHATGPT.md.
- Icy Veins bloque `fetch` Node (403 Cloudflare) : utiliser `webfetch` pour ces domaines.
