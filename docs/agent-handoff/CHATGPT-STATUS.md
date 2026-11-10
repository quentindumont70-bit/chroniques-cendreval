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

## Protocole de reconciliation

1. OpenCode reste sur sa branche et pousse chaque lot commité sur `origin/opencode-golipette`.
2. ChatGPT lit les fichiers de passation et les différences GitHub, évite les fichiers touchés par OpenCode.
3. OpenCode lit ce fichier sur `origin/main` avant de commencer un autre chantier.
4. Une seule branche fusionnée à la fois après contrôle des conflits, tests et validation explicite de l'utilisateur pour la fusion vers `main`.
5. Si le contexte distant ne change pas, ne pas prétendre que l'autre agent a déjà reçu des instructions : GitHub est le canal commun uniquement lorsqu'il consulte ses documents.

## À transmettre si besoin

Quand OpenCode pousse sa branche, il doit rafraîchir `MESSAGE-POUR-CHATGPT.md` et inclure : HEAD, fichiers modifiés, tests, liens commits, conflit potentiel, prochaine étape. Ne pas stocker de secrets, identifiants ou données privées dans ces documents.
