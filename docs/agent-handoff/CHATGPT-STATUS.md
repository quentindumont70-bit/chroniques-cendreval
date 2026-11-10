## Lot d'intégration OpenCode — 2026-11-10 11:48 UTC

- Branche OpenCode : `545d511` et fichiers de passation lus ; 27 fiches sourcées extraites de `public/binch/faith-knowledge/data/builds.json`.
- Commits ChatGPT `4a5a7de2` et `891fad33` : ces 27 fiches ont été **copiées** dans `main` et ajoutées au manifest Faith, sans fusion générale de la branche OpenCode. Le catalogue charge désormais 30 fiches (3 techniques + 27 druides).
- Tests ciblés du catalogue, validateur et recherche exécutés dans un environnement JS isolé : 30/30 fiches valides, build farouche retrouvé, exemple hors corpus rejeté. `0f5c26d5` met à jour les tests Node versionnés, mais leur exécution Node locale reste à confirmer.
- **Bourse :** prise en charge partielle de l'option C validée. `e8034c72` introduit `market-bridge.js` **en lecture seule**, respectant royaume/faction, dates, sources et prix observés ; `6b35a28a` donne à Faith un repli vers le registre historique `binch.market.v1` quand `binch.ah.market.v1` ne présente pas de relevé ; `5ff58169` charge ce pont dans `index.html`. Aucun ancien registre n'est effacé ou modifié, aucune nouvelle valeur n'est inventée. Tests JS ciblés : relevés exacts, filtrage faction, refus de portée indéfinie et recherche par objet.
- **Limites :** le reste des consommateurs AH (craft, stratège) ne lit pas encore ce pont. Priorité à la correction de montage AH, mais sans conversion destructive ni prix sans provenance.
- **OpenCode :** poursuivez les chantiers 12/13 (spécialisations druide restauration/équilibre puis autres classes), sans toucher à `market-bridge.js`, `faith-dialogue.js` ni aux fichiers déjà modifiés par ChatGPT. Gardez une résolution chirurgicale du conflit `index.html` à la future fusion.

## Arbitrages pour relancer OpenCode — 2026-11-10 11:26 UTC

**La passation OpenCode est reçue et lue.** Les commits `9364b43`, `40a8419`, `545d511` et les tests Specs/Node rapportés sont reconnus. Ne pas les refaire.

### Décision 1 — Specs / corpus druide
- **GO AUTONOME** pour continuer les fiches druide restauration et équilibre dans un **nouveau fichier** `public/binch/faith-knowledge/data/druid-other.json`, sans écraser `data/builds.json`.
- Ensuite prendre les itinéraires multi-classes sourcés ; aucune recommandation de rang non confirmée.
- L'intégration du corpus OpenCode `data/builds.json` dans le manifest et dans `main` reste à la charge de ChatGPT au moment de réconciliation, car le fichier n'existe pas encore sur `main`. Aucun commit sur `main` ni fusion de branche par OpenCode.

### Décision 2 — Deux Bourses concurrentes
- **Ne jamais supprimer un stockage local.** Préférence : conserver `market-board.js` tant que les données existantes ne sont pas auditées, et préparer un **pont de lecture explicite** (option c) sans fabriquer `realm`, `faction`, `observedAt` ni faux prix.
- OpenCode peut auditer le schéma des deux Bourses et proposer un patch indépendant de toute suppression ; produire des cas de tests, mais éviter de modifier les fichiers `faith-dialogue.js`, `faith-strategist.js` et `index.html` simultanément avec ChatGPT. Si le pont requiert l'un de ces fichiers, documenter une proposition et passer aux fiches de specs.
- Pas de suppression de données ni de migration destructrice.

### Décision 3 — Reprise des travaux
- Ne t'arrête pas à la rédaction d'un rapport de passation. Enchaîne tes chantiers 12 puis 13 puis le test automatisé de la Bourse si ton quota et ta session le permettent.
- Rafraîchis `OPENCODE-PLAN.md`, `OPENCODE-JOURNAL.md` et `MESSAGE-POUR-CHATGPT.md` à chaque lot et pousse uniquement `opencode-golipette`.
- `index.html` est un fichier partagé : préserver les ajouts Faith ET les corrections Specs lors de la future résolution. Ne pas fusionner vers `main` sans autorisation.

# Coordination ChatGPT ↔ OpenCode — La Binch

## Règle de lecture
Ce document est maintenu par ChatGPT exclusivement sur `main`. Ne pas le modifier dans `opencode-golipette`; OpenCode peut le consulter avec `git show origin/main:docs/agent-handoff/CHATGPT-STATUS.md` après `git fetch origin`.

OpenCode publie ses informations sur sa branche exclusivement :
- `docs/agent-handoff/OPENCODE-PLAN.md` — file de projets
- `docs/agent-handoff/OPENCODE-JOURNAL.md` — réalisations, tests, commits
- `docs/agent-handoff/MESSAGE-POUR-CHATGPT.md` — synthèse de passation courte

ChatGPT consulte les documents via la branche distante `opencode-golipette` à chaque reprise utile ou contrôle explicite. Aucune conversation automatique/temps réel et aucun suivi permanent ne sont promis.

## Domaines réservés

| Agent | Domaine prioritaire | Branche |
| --- | --- | --- |
| OpenCode | Builds / Specs, leveling druide, affichage de talents, QA associée | `opencode-golipette` |
| ChatGPT | Faith compagnon jeu, GrimoireSync addon/installation Windows, Faith dialogue, Choc Nébulaire, coordination | `main` |

Les autres modules peuvent faire l'objet d'un chantier après consultation de ces fichiers. Éviter toute modification simultanée de `public/binch/index.html`; toute modification doit être intégrée via Git et vérifiée avant fusion.

## État ChatGPT — 2026-11-10

- `public/binch/addon/GrimoireSync/Faith.lua` : prototype de dialogue local et réactions à la mort/niveau. Commit `e7b4e39d` ; non testé dans le jeu.
- `GrimoireSync.toc` : v0.9.0 inclut `Faith.lua` (commit `3ce91dd4`).
- Installateur `Installer-La-Binch.ps1` : liste `Faith.lua`, vérification de manifest et version 0.9.0, correction d'une erreur de génération (dernier commit `f2b875e2`). Non exécuté sur Windows.
- Faith V7, dialogue HTML, overlay et scène Choc Nébulaire : commits antérieurs sur `main`, contrôle syntaxique JS partiel.
- Contrôler le script actuel du dépôt avant toute affirmation de publication ou compatibilité WoW.

### Actualisation 2026-11-10, Faith (nouveau lot)

- Commit `720f7c53` : Faith démarre désactivé par défaut (activation volontaire par `/faith on`), réponses XP temps réel via API du jeu, rotation des remarques après mort.
- L'installateur 0.9.0 contient bien les quatre fichiers : TOC, Core, Minimap et Faith (commit `f2b875e2`). Les vérifications statiques et le paquet ne sont pas un test en jeu ; compatibilité avec le client WoW Forever non encore confirmée.
- OpenCode : ses trois fichiers de passation ne sont pas encore présents sur la branche distante lors du dernier contrôle ; continuer à protéger le chantier Specs, ne pas lui attribuer une inactivité PC sans preuve.

## Avancement Faith Knowledge — 2026-11-10

**Propriété ChatGPT exclusivement pour cette phase :** `public/binch/faith-knowledge/**` et `public/binch/faith-dialogue.js`.

- Corpus v1 et 3 fiches **sur notre code**, sans information de gameplay prétendue vérifiée : commits `d3bc4925`, `b5696439`.
- Validation et recherche sourcée locale, anti-hallucinations : `abde81ff`, `89e6ba4b`, correctif de pertinence `8cd20fbc`.
- Dialogue HTML branché sur le corpus et scripts chargés dans `index.html` : `99cf2428`, `bea4787c`.
- Tests de régression versionnés et documentation : `47fcb88e`, `911af513`.
- Tests élémentaires du moteur effectués en environnement JS isolé : fiche sourcée retrouvée, question druid farouche sans fiche rejetée, doublons/obsolete rejetés ; **script Node versionné mais pas encore exécuté dans un véritable environnement Node**. Aucun test navigateur ou WoW en jeu.
- **Risque de conflit** : `public/binch/index.html` a été modifié une fois sur `main` pour inclure les scripts de Faith. OpenCode devra conserver cette inclusion au moment de réconcilier sa branche Specs ; ne jamais remplacer le fichier entier par une ancienne version.
- Branche OpenCode au dernier contrôle : `0311770` ; fichiers de passation pas encore poussés. Ne conclure ni à un arrêt de son agent ni à une absence de travail local.

## Lot « Cerveau de Faith » — 2026-11-10

- `d81d3020` : stratégie du corpus sourcé et règles de preuve.
- `d3bc4925`, `b5696439` : schéma des fiches et trois fiches vérifiées portant uniquement sur les fonctionnalités du projet.
- `abde81ff`, `89e6ba4b`, `8cd20fbc` : validation et recherche locale avec refus des rapprochements trop faibles.
- `14f04369`, `a78a769c` : tests reproductibles Node pour validation, recherche, manifeste, chemins et doublons.
- `121882cf`, `16285595`, `3a186a32`, `a9ec0ba7` : manifeste multi-fichiers, chargeur hors-ligne borné et intégration dans dialogue/index.
- `ded77320` : guide pour enrichir le corpus avec les travaux sourcés d'OpenCode.
- Vérifications réellement faites : syntaxe JS, validation des trois fiches, cas positifs sourcés, réponses inconnues, rejet de manifeste malveillant via exécution JS isolée. Les commandes Node et QA navigateur final n'ont pas été lancées.
- Périmètre réservé : OpenCode garde la section Specs; il pourra alimenter le futur `data/builds.json` après validation de ses sources. Aucune connaissance de build farouche n'a été inventée.
- Consultation `opencode-golipette` : pas encore de fichiers `OPENCODE-PLAN.md`, `OPENCODE-JOURNAL.md`, `MESSAGE-POUR-CHATGPT.md` publiés sur GitHub au dernier contrôle. HEAD distant `03117700` à ce stade ; ce n'est pas une preuve d'arrêt de l'agent local.

## Protocole de reconciliation

1. OpenCode reste sur sa branche et pousse chaque lot commité sur `origin/opencode-golipette`.
2. ChatGPT lit les fichiers de passation et les différences GitHub, évite les fichiers touchés par OpenCode.
3. OpenCode lit ce fichier sur `origin/main` avant de commencer un autre chantier.
4. Une seule branche fusionnée à la fois après contrôle des conflits, tests et validation explicite de l'utilisateur pour la fusion vers `main`.
5. Si le contexte distant ne change pas, ne pas prétendre que l'autre agent a déjà reçu des instructions : GitHub est le canal commun uniquement lorsqu'il consulte ses documents.

## À transmettre si besoin

Quand OpenCode pousse sa branche, il doit rafraîchir `MESSAGE-POUR-CHATGPT.md` et inclure : HEAD, fichiers modifiés, tests, liens commits, conflit potentiel, prochaine étape. Ne pas stocker de secrets, identifiants ou données privées dans ces documents.
