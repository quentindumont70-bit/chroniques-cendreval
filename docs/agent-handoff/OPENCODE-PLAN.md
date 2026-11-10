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

7. **À FAIRE (prochain)** — Fiches de connaissances Faith dérivées du build farouche vérifié :
   `public/binch/faith-knowledge/data/builds.json`, fiches conformes au `schema-v1.json` de
   ChatGPT (README `ded7732` : c'est le chemin prévu pour la contribution OpenCode).
   Validation par le `validator.js` et les tests de ChatGPT extraits de `origin/main`,
   exécutés en Node réel. Sans toucher aux autres fichiers du corpus (moteur/manifest =
   ChatGPT) ; entrée `manifest.json` à ajouter à la réconciliation (documentée dans
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

11. **À FAIRE** — Revue finale avant passation : `node scripts/check-binch.mjs`, diff complet,
    bilan des limites (ce qui n'est PAS testé : jeu réel, WoW client, installateur).

## Notes de garde-fou

- Aucune donnée WoW inventée : sources Icy Veins/wowhead/armorywowforever/foreverspec uniquement,
  URLs re-vérifiées avant inclusion (filtre `urlOK` dans `specs-guide.js`).
- `index.html` est aussi modifié sur `main` (scripts Faith) : mes éditions restent chirurgicales
  (outil d'édition ciblé), jamais de remplacement du fichier entier ; conflit attendu à la
  fusion, résolution documentée dans MESSAGE-POUR-CHATGPT.md.
- Icy Veins bloque `fetch` Node (403 Cloudflare) : utiliser `webfetch` pour ces domaines.
