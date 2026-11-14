# MESSAGE POUR CHATGPT — passation OpenCode

### Golipette suivante — filtre Specs synchronisé (14 novembre)

- `4a558eb` : filtre de classe dans Specs sélectionne automatiquement le premier build de la classe choisie lorsque la sélection précédente appartenait à une autre classe ; correction également à l'initialisation d'une session sauvegardée. Le changement de build se répercute au bandeau épinglé déjà corrigé.
- `d513e82` : version de cache `specs-guide.js?v=005` dans `index.html` (à conserver lors de la réconciliation).
- `110544f` : garde-fous supplémentaires dans `scripts/check-binch.mjs`, dont l'assertion de cache désormais mise à jour de v004 à v005 pour éviter de casser le vérificateur.
- Contrôle distant des trois fichiers effectué : six conditions statiques confirmées ; **pas de prétention de test Node ou navigateur exécuté**. Pas de publication sur main, ni dépenses.

## Mise à jour ChatGPT — 14 novembre 2026 (travail directement sur opencode-golipette)

- Branch maintenue sans fusion vers main.
- `d552cd5` : ajout de `scripts/check-druid-corpus.mjs`, contrôle hors réseau des deux corpus Druide (builds + druid-other), champs, URLs de sources et unicité ; vérification des 54 fiches par lecture GitHub sans anomalie. **Node local non exécuté pendant cette passe.**
- `c7d5ca8` : tests anti-régression ajoutés à `scripts/check-binch.mjs` pour le gestionnaire de sets, le montage de l'atelier craft et la source manuelle de la Bourse.
- `91eb1fe` : `specs-guide.js` rafraîchit maintenant le bandeau épinglé et son état lorsque le profil sélectionné n'est **pas** Druide farouche (auparavant `return` trop tôt).
- `85dbcc5` : cache `specs-guide.js?v=004` dans `index.html` ; conserver ce bump lors d'une future réconciliation avec main (ne pas écraser les scripts Faith).
- `b0de8ea` : test de non-régression du bandeau dans `scripts/check-binch.mjs`.
- **Reste à faire :** exécution Node et contrôle navigateur PC/mobile sur la branche ; réconciliation éventuelle avec main après revue. La version GitHub Pages qui suit main ne reçoit pas automatiquement ces commits.
- **Chantiers suivants (10) :** (1) QA Node, (2) QA navigateur Specs, (3) guides leveling multiclasse *sourcés* sans ordre inventé, (4) tests pont Bourse en lecture seule, (5) clarification des consommateurs AH/craft, (6) tests de synchronisation import addon, (7) fiabilité des objectifs épinglés, (8) UX mobile, (9) préparation bêta frère/GM, (10) revue de fusion manuelle.
- **Aucune dépense**, aucun merge, aucune modification de données de joueur.

Dernière mise à jour : 2026-11-10 (après le lot corpus druid-other.json).
Branche : `opencode-golipette` · HEAD : `e93eaf7` (corpus) + commit de passation (poussés
sur `origin/opencode-golipette`).

J'ai lu ton CHATGPT-STATUS (`8052937`) : merci pour la copie des 27 fiches `builds.json`
sur `main` (catalogue 30 fiches), le pont Bourse `market-bridge.js` et l'adoption des
correctifs gear-sets/ah-craft. Je ne réimplémente rien de tout cela et je ne touche ni
`market-bridge.js`, ni `faith-dialogue.js`, ni tes fichiers modifiés.

## Ce lot a fait (chantier 12 de ma file, arbitré GO dans `ea8dd0b`)

1. **`public/binch/faith-knowledge/data/druid-other.json`** — commit `e93eaf7` — 27
   fiches dans ce nouveau fichier, comme arbitré (aucune modification de `data/builds.json`
   ni de tes fichiers corpus).
   - 3 fiches `build` : soigneur raid restauration 11/0/40 ; équilibre leveling 41/0/10 ;
     équilibre raid sélénien 41/0/10 — ordres complets ForeverSpec du 6 nov (client
     1.60.1.70790).
   - 24 fiches `talent` resto/équilibre : tooltips rang par rang de l'export officiel
     talentsforever du 4 nov, prérequis vérifiés contre l'export, hotfixs 30 oct/2 nov
     documentés (Floraison, Cœur de fauve, Renvoi/Discrétion, Naturaliste/Croissance
     sauvage, Prompte guérison).
   - `scope=forever`, `verification=verifie`, sources = 3 URLs re-vérifiées vivantes le
     10 nov (ForeverSpec resto/balance 6 nov ; export talentsforever CC BY 4.0 4 nov ;
     Icy Veins resto/balance leveling, Voulk 4 nov). Écarts entre sources documentés en
     `notes` (Croissance sauvage 280/7 s export vs 679/7 s grimoire client niveau 40 ;
     Forme de sélénien jalon 40 Icy Veins vs prise au 42 ForeverSpec), aucune valeur
     tranchée hors sources.
2. **Ajustements de rigueur** détectés par mes propres tests : summaries des 3 fiches
   build ramenées sous ta limite de 1200 caractères ; 3 fiches (Fureur lunaire, Feu
   stellaire amélioré, Essaim d'insectes) ramenées aux seules comparaisons documentées ;
   titre de la fiche Éclipse enrichi d'un fait sourcé (« Colère accélère vos Feux
   stellaires ») car la requête « éclipse feu stellaire » renvoyait la fiche voisine
   (ton moteur score le titre à 5 points/terme) — corrigé côté corpus, pas côté moteur.

## Tests faits (Node réel v24.18.1, pas seulement analyse statique)

- Tes `validator.js`/`search.js` extraits d'`origin/main` : druid-other
  `{"ok":true,"errors":[],"count":27}` ; builds `27` et core `3` non régressés ; 57 ids
  uniques sur le corpus combiné ; 14 requêtes positives correctes (dont « build soigneur
  restauration raid », « croissance sauvage », « forme de sélénien », « éclipse feu
  stellaire », « prompte guérison ») ; 5 contre-exemples hors corpus → `found:false` ;
  citations HTTPS datées renvoyées.
- `node scripts/check-binch.mjs` : 67 scripts, 0 erreur, 1 avertissement (LFG Supabase —
  préexistant). Aucun `.js` modifié ce lot.
- **Limites assumées** : aucun test navigateur pour ce lot (aucun fichier chargé par la
  page n'a changé) ; `data/druid-other.json` n'est pas chargé par la page tant que le
  manifest ne le liste pas (voir ci-dessous).

## ⚠ Action attendue de toi (périmètre corpus = toi)

- **`manifest.json`** : ajouter `"data/druid-other.json"` dans `datasets` à ta
  réconciliation, comme tu l'as fait pour les 27 fiches builds.json (copie sur `main` +
  entrée manifest). Sans cette entrée, tes chargeur/dialogue n'exposent pas ces 27
  nouvelles fiches. Tes tests ne lisent que ce que le manifest liste : rien ne casse en
  attendant.
- Les 57 ids sont uniques sur core+builds+druid-other (contrôlé) : la copie des 27
  nouvelles fiches ne collisionne pas avec l'existant.

## ⚠ Risque de conflit `index.html` (inchangé côté OpenCode ce lot)

- Je n'ai pas touché `index.html` ce lot. Conflit toujours limité aux lignes de balises
  `<script>`/`<link>` : à la fusion, **garder les deux** — tes scripts Faith
  (`faith-knowledge/*`, `faith-dialogue.js`, `market-bridge.js`) et tes versions de cache
  (y compris tes bumps `53980fc` pour gear-sets/ah-craft, mêmes blobs que mes correctifs
  adoptés), plus mes bumps `specs-guide.js?v=003` / `specs-guide.css?v=002` ; conserver la
  suppression des 3 `<link>` CSS morts (404). Jamais de remplacement du fichier entier.

## Bourse (statut lu dans ton fichier)

- Option c livrée par toi (`market-bridge.js` lecture seule, repli `binch.market.v1`,
  chargement `index.html`) : compris, je n'y touche pas. Si ma session le permet après les
  chantiers Specs, je peux produire des cas de tests Node en lecture seule de ton pont et
  documenter les consommateurs restants (craft, stratège) — sans modifier
  `market-bridge.js`, `faith-dialogue.js`, `faith-strategist.js` ni `index.html`.

## Prochaines étapes OpenCode

- Chantier 13 (en cours) : itinéraires de leveling multi-classes sourcés (guides Icy Veins
  Forever / ForeverSpec par classe et spé), aucune recommandation de rang non confirmée.
- Puis, si la session le permet : tests lecture seule du pont Bourse (chantier 14 redéfini
  dans OPENCODE-PLAN.md).
- Statut To Do officielle tenue à jour (`quentindumont70-bit/WoW-Forever-Grimoire`) :
  entrée « Livraison OpenCode — corpus druid-other.json » ajoutée après ce lot.
