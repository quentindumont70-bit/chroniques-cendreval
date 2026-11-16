# La Binch — Assistant Trading (Hôtel des ventes WoW Forever)

Branche : `feature/claude-ah-trading-advisor` · base `main` 70221a3 · 16 novembre 2026.

## 1. Où sont les vraies données ? (vérifié le 16/11/2026)

| Source | Statut | Utilisation |
|---|---|---|
| API officielle AH | **Inexistante** pour WoW Forever (auctionhouse.fyi le déclare dans sa doc ; aucune API Blizzard équivalente). | Aucune. |
| Addon GrimoireSync (`/grimoire scan`) | **Déjà codé** dans `Core.lua` : `C_AuctionHouse.ReplicateItems` + `REPLICATE_ITEM_LIST_UPDATE`, écrit en section `AH:`/`A:` du payload GF6. Les addons Forever publiés (Hammerprice, AHDB) décrivent le même scan complet, environ un toutes les 15 minutes. **Le site ignorait jusqu'ici ces sections.** | Source principale de l'Assistant. Lecture seule, déclenchée par le joueur. |
| auctionhouse.fyi (relevés communautaires) | API publique sans clé, prix horaires + 7 jours (`row`, `days`). **Pas d'en-tête CORS** (vérifié par requête avec `Origin`) : un `fetch` depuis GitHub Pages est bloqué. Conséquence : le visualiseur `ah-public-snapshots.js` existant ne peut pas fonctionner dans le navigateur. | Import par copier-coller de la réponse JSON, étiqueté « relevé communautaire ». |
| Exports d'addons tiers (Auctionator, etc.) | Non traités dans ce lot : formats propres à chaque addon. | Piste future. |
| Saisie manuelle / CSV | Existant (`ah-market.js`). | Inchangé. |

Ce qui reste **non démontré** : le comportement réel de `ReplicateItems` sur le client Forever installé chez l'utilisateur (le code de l'addon existe, mais aucun fichier `GrimoireSync.lua` réel contenant un scan n'a été examiné). Le premier essai en jeu est la validation clé.

## 2. Architecture

- `public/binch/ah-trading-core.js` — moteur pur (`window.BinchTrading`), sans DOM ni réseau.
- `public/binch/ah-trading.js` + `.css` — onglet « ⚖ Assistant Trading », placé après « Bourse d’Azeroth ».
- Données réutilisées, pas de base concurrente :
  - `binch.ah.market.v1` (carnet AH) : les scans y sont **fusionnés** au même format ; champs ajoutés par relevé, ignorés par les anciens modules : `itemId`, `listings`, `ask10`, `medianAsk`, `qtyAtFloor`. Après écriture, un `StorageEvent` synthétique prévient les modules déjà chargés pour qu'ils ne réécrasent pas le carnet avec leur copie en mémoire.
  - `binch.ah.scope.v1` (royaume/faction), `grimoire.bridge.last` (sacs), `grimoire.craft.v1` (métiers), `binch.ah.craft.v1` (recettes de l'atelier), registre `trades` + `ah-portfolio-core.js` (FIFO).
  - Réglages propres : `binch.ah.trading.v1` (réserve, plafond, décisions, alertes, journal d'imports, dernier personnage importé).

Chaque relevé conserve : source, horodatage, royaume, faction, prix unitaire en cuivre, quantité, et pour un scan : nombre d'annonces, prix à 10 % de profondeur, quantité au plancher.

## 3. Moteur d'analyse (déterministe)

- Médiane, moyenne pondérée par quantité, volatilité (écart absolu médian / médiane), tendance (tiers récents vs anciens, et tendance *avant* le dernier relevé).
- Prix de référence d'un scan = prix atteint à 10 % de la quantité listée (`ask10`), pour ne pas se laisser piéger par une annonce isolée.
- Confiance 0–100 : nombre de relevés, jours distincts, fraîcheur, profondeur connue. Moins de 3 relevés ou plus de 72 h → « Données insuffisantes ».
- Sacs : marchand / AH / garder (cours ≥ 15 % sous la médiane sans baisse antérieure) / transformer / données insuffisantes, avec raisons.
- Opportunités : décote ≥ 15 %, relevé < 24 h, volatilité < 40 %, quantité bornée par le plancher du scan et le plafond d'exposition.
- Métiers : conversions de cuir Classic (3/4/5/6/6) si Travail du cuir est importé, plus les recettes de l'atelier. **Ratios Classic à confirmer sur Forever.**
- Simulateur : commission, dépôt saisi, seuil de rentabilité, scénario d'invendus. Aucune estimation de vitesse de vente.
- Journal : décisions notées vs ventes réelles déclarées ensuite.
- Faith marchande : reformulation des résultats avec références datées, aucune donnée nouvelle.

## 4. Garde-fous

Aucun appel réseau, aucune automatisation en jeu, aucun prix fictif, relevés futurs ou sans marché refusés, fusion non destructive (500 objets max, 120 relevés par objet), aucun fichier Big Cthu / Tournée modifié.

## 5. Tests

- `tests/binch-ah-trading.test.mjs` (10 tests) : lecture du payload Lua, agrégation, refus futur/vide, fusion sans doublon, relevés communautaires, statistiques, simulation, sacs, opportunités, revente FIFO, journal, alertes, Faith.
- Parcours navigateur headless (Chrome, 1366×900 et 430×932) avec un `GrimoireSync.lua` **synthétique de test** : import du scan, 11 vues, aucune erreur JS, pas de débordement horizontal mobile. Non versionné.
- Non fait : essai sur iPhone réel, essai en jeu du `/grimoire scan`.

## 6. Prochains chantiers

1. Valider un vrai scan Forever (volume du payload, noms d'objets, durée) ; si le payload devient trop gros, agréger côté addon.
2. Lire la banque (`BANKFRAME_OPENED`) dans GrimoireSync — à coordonner avec la PR #129 qui modifie `Core.lua`.
3. Import des exports Auctionator / TSM-like si l'utilisateur en utilise.
4. Ratios et recettes Forever (source metabot.gg / jeu) à la place des références Classic.
5. Rotation des scans (vitesse d'écoulement mesurée par variation de profondeur entre scans).

## 7. Lot « En direct » (16/11/2026, après-midi)

- `scripts/collect-ah-feed.mjs` + `.github/workflows/binch-ah-feed.yml` : toutes les 3 h, lecture anonyme d'auctionhouse.fyi (`/api/v1/ah`, puis 39 objets suivis × chaque marché Forever, puis noms via `/items`), 400 ms entre requêtes, `Retry-After` respecté, `robots.txt` autorise ces chemins. Résultat publié sur la branche `binch-ah-data` (un seul commit écrasé) ; La Binch le lit via `raw.githubusercontent.com` (CORS `*` vérifié). **Actif seulement après fusion sur main** (contrainte GitHub des tâches programmées), ou lancement manuel du workflow.
- Essai réel depuis la session : 2 marchés publiés (Normal Horde, scan de 7 h ; JcJ Horde, 10 jours), 78 cotations, 0 erreur, 2 minutes, fichier de 11 Ko. Aucun marché Alliance ni RP n'avait de données.
- Vue « En direct » : fraîcheur par marché, choix de mon marché, intégration automatique au carnet (désactivable), conseils personnalisés, comparaison des hôtels des ventes, rafraîchissement toutes les 10 min onglet visible.
- Progression : plan de dépeçage selon niveau et compétence (seuil Classic `(niv-10)×10` puis `niv×5`, tranches de monstres Vanilla), cuir accessible le mieux coté.
- Limites : pas de temps réel (scans communautaires horaires au mieux), dépendance à un service tiers gratuit sans contrat, noms anglais du flux (rapprochement par identifiant d'objet).
