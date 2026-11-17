# La Binch — Assistant Trading (Hôtel des ventes WoW Forever)

Branche : `feature/claude-ah-trading-advisor` · base `main` 70221a3 · 16 novembre 2026.

## 1. Où sont les vraies données ? (vérifié le 16/11/2026)

| Source | Statut | Utilisation |
|---|---|---|
| API Blizzard Forever (non documentée officiellement) | **Signalée par la communauté depuis le 6/11/2026**, chemins enchères par règleset/maison avec OAuth ; disponibilité et schéma à vérifier sur les comptes réels. Le fournisseur du collecteur reste désactivé sans configuration explicite. Source : https://us.forums.blizzard.com/en/blizzard/t/wow-forever-api-what-works-so-far-plus-a-ts-client/60334 | Option de collecte **lecture seule**, jamais présumée active. |
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

Moteur de calcul sans appel réseau ; seule la vue « En direct » lit le flux GitHub public sur demande et lors des rafraîchissements visibles. Aucune automatisation en jeu, aucun prix fictif, relevés futurs ou sans marché refusés, fusion non destructive (500 objets max, 120 relevés par objet), aucun fichier Big Cthu / Tournée modifié.

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

- `scripts/collect-ah-feed.mjs` + `.github/workflows/binch-ah-feed.yml` : toutes les 3 h, lecture anonyme d'auctionhouse.fyi (`/api/v1/ah`, puis 39 objets suivis × chaque marché Forever, puis noms via `/items`), 400 ms entre requêtes, `Retry-After` respecté, `robots.txt` autorise ces chemins. Résultat publié sur la branche `binch-ah-data` (commits successifs, sans écrasement d'historique) ; La Binch le lit via `raw.githubusercontent.com` (CORS `*` vérifié). **Actif seulement après fusion sur main** (contrainte GitHub des tâches programmées), ou lancement manuel du workflow.
- Essai réel depuis la session : 2 marchés publiés (Normal Horde, scan de 7 h ; JcJ Horde, 10 jours), 78 cotations, 0 erreur, 2 minutes, fichier de 11 Ko. Aucun marché Alliance ni RP n'avait de données.
- Vue « En direct » : fraîcheur par marché, choix de mon marché, intégration automatique au carnet (désactivable), conseils personnalisés, comparaison des hôtels des ventes, rafraîchissement toutes les 10 min onglet visible.
- Progression : plan de dépeçage selon niveau et compétence (seuil Classic `(niv-10)×10` puis `niv×5`, tranches de monstres Vanilla), cuir accessible le mieux coté.
- Limites : pas de temps réel (scans communautaires horaires au mieux), dépendance à un service tiers gratuit sans contrat, noms anglais du flux (rapprochement par identifiant d'objet).

## 8. Corrections après revue ChatGPT (16/11/2026, soir)

- **Aucune fusion externe par défaut.** Intégration au carnet seulement si : région du compte renseignée (EU/US), marché de même région, marché explicitement confirmé par le joueur (règleset + maison), même faction que le carnet ; maison neutre jamais fusionnée dans un carnet Horde/Alliance. Réglages précédents remis à zéro (`binch.ah.trading.v1` version 2).
- **Libellés sans ambiguïté** : `Région · Règleset · Faction (· maison) (fournisseur)` ; auctionhouse.fyi = **US uniquement** ; avertissement si aucun marché de ta région n'existe dans le flux ; collage manuel auctionhouse.fyi refusé hors région US.
- **API Blizzard Forever** : fournisseur optionnel en lecture seule dans le collecteur (`/data/wow/ruleset/{id}/auctions/{houseId}`, namespace `dynamic-forever-{region}`, OAuth client credentials). **Chemins non vérifiés** par La Binch (source : fil communautaire du forum Blizzard). Inactif sans secrets `BLIZZARD_CLIENT_ID/SECRET` et variables `BLIZZARD_REGION`, `FOREVER_RULESET_ID`, `FOREVER_RULESET_NAME`, `FOREVER_HOUSES` (identifiants à relever depuis l'index des maisons Blizzard, typiquement 110–125 ; **ne pas utiliser les anciens IDs 2/6/7** ni deviner leur faction). Les secrets restent côté GitHub Actions, jamais dans la page publique.
- **Publication sans écrasement** : plus de `push --force` ; un commit ajouté sur `binch-ah-data` seulement si le flux change. `contents: write` reste nécessaire pour qu'un workflow pousse une branche ; `main` n'est jamais modifiée et la branche peut être protégée contre la suppression.
- **Sacs seulement** affiché partout (banque non lue). Conversions de cuir et règles de dépeçage : Classic, non certifiées Forever.
- Tests ajoutés : isolation EU/US, confirmation, faction/neutre, région inconnue, fraîcheur > 72 h, fournisseur Blizzard non configuré / maison en erreur 503 / agrégation.

## 9. Golipette du 17 novembre 2026 — reprise autonome

- PR #182 fusionnée sur `main` après deux contrôles CI réussis ; publication GitHub Pages déclenchée.
- L'onglet Trading est ajouté aux **raccourcis mobiles personnalisables** (les quatre raccourcis existants ne sont pas modifiés).
- Tests ciblés reliés aux workflows de revue et de publication ; le collecteur externe se déclenche aussi lors d'une modification de son workflow, de son script ou de sa liste d'objets sur `main` — utile pour le premier relevé sans PC.
- Attention aux marchés : le flux `auctionhouse.fyi` public couvre **six marchés US**, pas les marchés EU. Aucun import automatique vers le carnet joueur sans région et marché explicitement confirmés. Source : https://auctionhouse.fyi/docs/api/markets
- Le fournisseur Blizzard optionnel exige un client OAuth et une validation des vrais identifiants de maisons (110–125) ; **les identifiants 2/6/7 ne correspondent pas à ce schéma**. Tant que les secrets ne sont pas disponibles, les scans personnels restent la source de marché la plus fidèle.
- Le premier vrai scan de GrimoireSync et la lecture de la banque nécessiteront une session de jeu : ne pas présenter ces points comme testés en direct.

### Feuille de route des 10 prochains chantiers

1. Publication et contrôle du pipeline de Pages.
2. Première exécution du flux AH public gratuit, contrôle de fraîcheur / erreurs.
3. Raccourci Trading mobile et vérification de navigation.
4. Ajustement de l'UX des opportunités, signaux insuffisants et risques.
5. Vérification du format d'un vrai scan GrimoireSync dans Forever.
6. Banque et sacs séparés, à synchroniser sans collision avec PR #129.
7. Récupération EU via fournisseur validé et secrets optionnels ; aucun mélange EU/US.
8. Métiers et conversions sourcées exclusivement Forever.
9. Revue qualité mobile et parcours bêta frère/GM.
10. Revue des résultats réellement vendus et amélioration du moteur de confiance.

## 10. Recherche AH EU à la demande (17 novembre 2026)

La vue **En direct** propose désormais une consultation individuelle d'un item Blizzard sur AHledger, en sélectionnant **région, type de serveur, faction et ID d'objet**.

- Source officielle de l'outil tiers : https://ahledger.com/developers (API `GET /v1/prices/{market}/{itemId}?range=7d`). Les marchés EU sont listés sur https://ahledger.com/markets/forever/normal/horde/eu.
- L'API annonce un accès **gratuit pour un outil communautaire**, avec lien d'attribution obligatoire et limites de conservation. La Binch attribue chaque réponse via **Prices from AHledger**, et ne persiste pas la réponse : **une seule consultation HTTP après action utilisateur**, `cache: 'no-store'`, pas de tâche programmée, aucun archivage ou import dans `binch.ah.market.v1`. Cela évite de rééditer les données du fournisseur comme notre propre flux.
- Le résultat précise la source, le marché, l'âge, le minimum, la médiane, la médiane 7 j et les quantités *si elles sont présentes dans la réponse*. L'affichage d'un prix requiert le **lien d'attribution spécifique à l'objet** fourni par l'API ; s'il manque ou pointe ailleurs, la cote est refusée et seul le lien vers le marché externe reste disponible. Au-delà de **72 h**, il est marqué périmé sans suggestion d'achat.
- L'accès direct au navigateur peut être empêché par CORS ou indisponible : **afficher alors un lien vers le marché AHledger**, sans prix inventé.
- Il faut confirmer dans le jeu si le personnage est sur **Normal, PvP, RP ou RP PvP**. Le choix de consultation n'altère **pas** le marché du carnet existant. Une valeur US ne remplace pas une cote EU.
- L'achat, la vente, la récupération de la banque et les scans automatiques en jeu restent désactivés ou non pris en charge. Aucun compte AHledger ni clé n'est demandé.
- Conditions consultées le 17/11/2026 : https://ahledger.com/terms ; une évolution annoncée pour le **10 décembre 2026** impose notamment de respecter le cache et les modalités d'attribution. La Binch ne conserve pas cette donnée tierce. Toute extension future nécessitant un stockage devra être réévaluée avant implémentation.

Cette consultation répond au besoin d'accéder aux **marchés EU** sans PC, en attendant une intégration vérifiée plus large, les scans personnels et les éventuelles autorisations requises.
