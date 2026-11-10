# Faith — base de connaissances vérifiable (phase 0)

But : permettre à Faith de retrouver des **faits WoW Forever vérifiés**, sans prétendre être entraînée sur toutes les mécaniques du serveur.

## Stratégie

1. **Corpus sourcé** : enregistrer des fiches courtes de quêtes, talents, builds, rencontres, métiers et objets avec URL, date de consultation et version/royaume pertinents.
2. **Validation** : marquer chaque fiche `verifie`, `a_confirmer` ou `obsolete`. Les informations Classic non confirmées sur Forever restent `a_confirmer`.
3. **Recherche locale** : index textuel construit dans le navigateur ou dans le compagnon Windows ; aucune API payante obligatoire.
4. **Réponses** : le moteur cite les fiches pertinentes et signale explicitement les lacunes. Le dialogue scripté demeure le repli quand aucune preuve fiable n'existe.
5. **Contexte en jeu** : récupérer uniquement des informations permises par l'addon. Les SavedVariables sont généralement persistées au reload/déconnexion, pas une liaison réseau bidirectionnelle en direct.
6. **Voix** : futur compagnon Windows optionnel (push-to-talk, transcription et synthèse vocale). Ne pas utiliser d'injection dans le client et ne pas prétendre qu'un addon Lua lit le micro ou interroge Internet.
7. **Respect des sources** : préférer des résumés factuels attribués et des liens ; ne jamais reproduire de guides tiers entiers ni réutiliser des assets sous licence sans droit.

## Enregistrement d'une fiche

Format conseillé : `data/*.json`, liste d'objets au schéma `schema-v1.json`.

Champs obligatoires :
- `id` : identifiant stable préfixé par thème
- `topic` : `talent`, `build`, `quest`, `boss`, `item`, `profession`, `system`
- `title`, `summary` : texte concis rédigé et non copié
- `scope` : `forever`, `classic`, `unknown`
- `verification` : `verifie`, `a_confirmer`, `obsolete`
- `sources` : objets `{url, label, checkedAt}`, lien réellement consulté
- `updatedAt` : date du dernier contrôle
- `tags` : recherche

Champs recommandés : `class`, `spec`, `levelMin`, `levelMax`, `notes`, `supersedes`, `author`.

**Publication :** ne pas servir une fiche non vérifiée comme vérité Forever. Toute proposition de talent par niveau doit être compatible avec les arbres spécifiques au serveur et ses changements récents.

## Répartition des agents

- **OpenCode**, branche `opencode-golipette` : focus Specs et guide farouche, avec sources et captures d'écarts Forever ; proposer des *fiches de connaissances* dérivées de ses résultats une fois les builds validés.
- **ChatGPT**, branche `main` : structure du corpus, outil de validation, Faith addon et futures surfaces de réponse ; ne pas modifier les fichiers Specs d'OpenCode.
- Chacun documente les commits et la couverture dans son fichier de passation. Fusion vers `main` uniquement après validation explicite du propriétaire.

## Définition de « prêt à l'emploi »

- Minimum un jeu de fiches **vérifiées** avec sources et dates.
- Contrôle automatique du JSON, identifiants uniques et URLs réelles.
- Recherche qui n'invente aucune réponse si le corpus est vide ou incertain.
- Jeux de questions-réponses reproductibles avec réponses attendues et sources.
- Test dans le navigateur puis test client WoW Forever pour l'affichage en jeu, distinct de la validation du moteur.

## État initial

Architecture et méthode définies ; **aucun corpus encyclopédique validé** ni apprentissage de modèle ne sont à déclarer comme achevés. Cette base n'entraîne pas une IA en continu et ne nécessite pas de GPU.

## Implémentation initiale — 10 novembre 2026

- `schema-v1.json` décrit le format normalisé et les contraintes de provenance.
- `validator.js` refuse les fiches mal formées, doublons d'identifiant, dates incorrectes, sources sans HTTPS et promotion automatique de données Classic en vérités Forever.
- `search.js` réalise une recherche textuelle locale déterministe avec normalisation des accents, score de pertinence et références ; une question insuffisamment couverte ne reçoit **pas** de réponse inventée.
- `data/core.json` contient **3 fiches techniques sourcées de notre propre projet** (Faith, GrimoireSync, synchronisation). Ce sont des faits sur l'implémentation, **pas** des guides de gameplay externes.
- `faith-dialogue.js` charge ce corpus et répond en citant ses fiches avant de revenir aux règles locales existantes.
- `test-knowledge.cjs` : `node public/binch/faith-knowledge/test-knowledge.cjs` (test unitaire à faire tourner dans le dépôt local). Des tests interactifs de navigation et du client WoW restent requis.

### Extension du corpus

Quand OpenCode publie un build, vérifier l'arbre de talents WoW Forever et les sources indépendantes **avant** de créer une fiche marquée `verifie`. Éviter les guides copiés en bloc : rédiger des synthèses factuelles originales, datées et attribuées. Ne pas affirmer que le moteur possède une IA générative ou qu'il interroge automatiquement des sites externes.

### Risques et limites

Le chargement fonctionne via HTTPS sur GitHub Pages ; un `file://` direct ne permet pas nécessairement `fetch`. Les fiches sont embarquées dans le site, sans mise à jour automatique en cours de partie. Le score de recherche ne prouve pas la justesse d'un fait : seule la qualification préalable de la fiche le permet. Les modules ne connaissent pas les quotas OpenCode ni ceux de Work.
