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

4. **EN COURS** — Réécriture de `specs-guide.js` : DRUID_ROUTE avec le build farouche décodé
   point par point, explications par phases (10–20 ours, 20+ félin, 40+ pics de puissance),
   tooltips français officiels, variantes (ours tank / félin DPS / restauration / équilibre
   avec liens Icy Veins vérifiés vivants nov 2026), prochain talent recommandé selon le niveau,
   correction du lien erroné du profil restauration (pointe vers le guide farouche).

5. **À FAIRE** — QA navigateur complète de la page Specs après réécriture : mobile + desktop,
   bandeau épinglé toujours visible, niveau manuel vs niveau importé du profil
   (`grimoire.hub.v3` / `grimoire.bridge.last`), filtre de classe, console propre.

6. **À FAIRE** — Vérifier la cohérence des guides de leveling druide resto/équilibre référencés
   (URLs vérifiées vivantes le 10 nov 2026 ; le profil resto pointe actuellement vers le guide
   farouche).

7. **À FAIRE** — Exposer les builds vérifiés en JSON structuré (piste `data/builds.json`
   mentionnée par ChatGPT pour le corpus Faith) : format à convenir dans
   MESSAGE-POUR-CHATGPT.md avant toute écriture dans `public/binch/faith-knowledge/`
   (domaine réservé ChatGPT pour cette phase).

8. **À FAIRE** — Audit console des autres pages (QA associée) : parcours de tous les onglets,
   capture des erreurs résiduelles éventuelles.

9. **À FAIRE (décision ChatGPT)** — Constat architecture bourse : `market-board.js` (10:06)
   et `ah-market.js` (10:24) sont deux implémentations concurrentes de `#page-market`;
   market-board gagne (chargé en premier), ah-market ne monte jamais, donc `binch.ah.market.v1`
   n'est jamais alimenté alors que `ah-craft.js`, `faith-strategist.js`, `faith-dialogue.js`
   et `local-backup.js` le lisent. Voir MESSAGE-POUR-CHATGPT.md. OpenCode n'a pas tranché :
   correction minimale appliquée (montage robuste d'ah-craft, sans perte de données).

10. **À FAIRE** — Mise à jour de la To Do officielle (`quentindumont70-bit/WoW-Forever-Grimoire`,
    `TO-DO-LA-BINCH.md`) après le lot Specs : cocher les items couverts, ajouter les constats QA.

11. **À FAIRE** — Revue finale avant passation : `node scripts/check-binch.mjs`, diff complet,
    bilan des limites (ce qui n'est PAS testé : jeu réel, WoW client, installateur).

## Notes de garde-fou

- Aucune donnée WoW inventée : sources Icy Veins/wowhead/armorywowforever/foreverspec uniquement,
  URLs re-vérifiées avant inclusion (filtre `urlOK` dans `specs-guide.js`).
- `index.html` est aussi modifié sur `main` (scripts Faith) : mes éditions restent chirurgicales
  (outil d'édition ciblé), jamais de remplacement du fichier entier ; conflit attendu à la
  fusion, résolution documentée dans MESSAGE-POUR-CHATGPT.md.
- Icy Veins bloque `fetch` Node (403 Cloudflare) : utiliser `webfetch` pour ces domaines.
