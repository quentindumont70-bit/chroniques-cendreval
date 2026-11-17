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

## 11. Protection contre le mélange entre marchés externes (17 novembre 2026)

- Le carnet La Binch conserve maintenant, pour les **nouveaux** relevés externes, `region` et `market` dans chaque entrée d'historique, sans changer la clé de base locale ni les données existantes.
- Si une fiche contient des prix explicitement étiquetés pour un autre marché ou une autre région, un nouvel import incompatible est **rejeté pour cet objet** et le compteur de refus est affiché.
- Cela évite de mélanger automatiquement, pour un même objet du même carnet, les prix **US/EU** ou **Normal/JcJ**. Les relevés déjà présents sans ces étiquettes ne sont pas réinterprétés ni effacés.
- Les relevés manuels non étiquetés ne prouvent toujours pas leur origine exacte. Avant toute spéculation, vérifier le marché déclaré et le contexte du personnage. Il reste nécessaire d'améliorer à terme l'identité des marchés personnels GrimoireSync.


## 10. Du sac à la cotation EU/US (17 novembre 2026)

Depuis « Assistant Trading → Mes sacs », chaque objet importé avec un identifiant valide propose « Vérifier le prix EU/US ». Ce bouton ouvre « En direct » et préremplit le formulaire AHledger avec l'identifiant **sans requête, sans import automatique ni écriture dans le carnet**. L'utilisateur vérifie volontairement région, ruleset et faction puis déclenche la consultation. La cotation tierce reste informative ; le fallback vers AHledger est affiché si CORS ou réseau échoue. La banque n'est toujours pas synchronisée.

Test de non-régression : `tests/binch-ah-mobile.test.mjs` (raccourci, validité d'ID, préremplissage, absence de lecture réseau au clic). Cache public `ah-trading.js?v=008`.

## 11. Liquidité indicative pour une cotation AHledger (17 novembre 2026)

Le panneau ponctuel « En direct → AHledger » affiche, lorsque la réponse de la source le fournit, `sales.estimatedPerDay` et `sales.windowDays` : estimation d'unités écoulées par jour et fenêtre d'observation. Ce n'est **pas** un journal de ventes réellement conclues par le joueur et ce n'est pas une garantie de revente. Si le champ est absent ou non valide, afficher « Rotation non estimable » ; `0` observé reste distinct de « inconnu ». Données jamais réinjectées automatiquement dans le carnet ou dans le moteur d'opportunités.

Source : https://ahledger.com/developers (endpoint `GET /v1/prices/{market}/{itemId}?range=7d`, volume estimé lorsque l'historique suffit). L'attribution AHledger reste requise à l'affichage. Contrôle : `tests/binch-ahledger.test.mjs` ; JS `ahledger-reader.js?v=002`, `ah-trading.js?v=009`.

## 12. Discipline d'achat — capital, liquidité et tendance (17 novembre 2026)

Le radar distingue désormais deux niveaux sans inventer de ventes ni de prix :

- **Achat à étudier** : capital renseigné, au moins une unité finançable après la réserve, quantité au plancher constatée, historique de 3 jours distincts au minimum, pas de baisse antérieure supérieure ou égale à 10 %, confiance statistique non faible. Il s'agit d'une étude, **pas** d'un ordre automatique ni d'une garantie de revente.
- **Surveillance** : décote significative mais sans preuve suffisante de quantité disponible, budget non renseigné, historique trop court ou tendance déjà baissière. Le bouton « noter un achat » n'est pas proposé ; seule la simulation demeure.
- **Exclusion** : quand le plafond de capital ou la réserve rend impossible l'achat d'une seule unité, la décote n'est plus affichée comme opportunité d'achat.
- **Stress de revente** : marge par unité si le prix de revente est 10 % sous la médiane historique, après commission, **hors dépôts et invendus** ; le simulateur complet traite ces hypothèses séparément.
- Le tableau de bord et Faith emploient le même statut, sans appeler les simples surveillances des achats.

Tests : `tests/binch-ah-trading.test.mjs` vérifie profondeur, historique, tendance, réserve, budget, quantité et statut. Cache `ah-trading-core.js?v=006`, `ah-trading.js?v=010`. Les prix restent des **observations attribuées**, pas des cours de négociation garantis.

### Les dix chantiers suivants

1. Faire confirmer en navigateur réel la présentation du radar sur iPhone.
2. Tester l'appel ponctuel de prix européens avec API et CORS réels.
3. Valider un premier `/grimoire scan` complet depuis un vrai client Forever.
4. Ajouter un bilan mensuel des opérations personnelles réellement conclues.
5. Relier les sacs importés à la banque sans mélanger les emplacements.
6. Fiabiliser l'identité région / ruleset / faction du personnage.
7. Enrichir les recettes Forever sourcées et la rentabilité de fabrication.
8. Ajouter un signal prudent de profondeur d'AH entre scans, sans confondre disparitions et ventes.
9. Améliorer les recommandations de leveling / spécialisations / métiers pour le Druide.
10. Préparer la bêta pour le frère et le tableau de bord GM.

## 13. Outils de marché par ruleset / faction / région (17 novembre 2026)

L'onglet **En direct → AHledger** propose désormais quatre liens **en lecture seule et attribués** qui suivent le marché effectivement choisi dans le formulaire : **Bonnes affaires**, **Craft rentable**, **Liquidité AH** (structure) et **Signaux de prix**. Ces liens ouvrent les pages publiques AHledger dans un nouvel onglet ; aucun résultat externe n'est enregistré ou représenté comme un scan personnel. Les régions EU et US, règlesets Normal/JcJ/RP/RP JcJ et factions Horde/Alliance sont validés par une liste blanche et le marché complet figure dans chaque URL. La banque, les actions de jeu et le carnet local ne sont pas modifiés.

Source documentée : https://ahledger.com/developers — vues `deals`, `crafting`, `structure` et `signals`, toutes filtrées par `market=forever/<ruleset>/<faction>/<region>`. Une donnée externe n'est jamais un ordre d'achat ni une preuve de liquidité garantie.

Version navigateur : `ahledger-reader.js?v=003`, `ah-trading.js?v=011`, `ah-trading.css?v=002`. Tests des marchés acceptés/refusés dans `tests/binch-ahledger.test.mjs`. Les liens s'ouvrent sur action explicite, sans poll ni API key.

## 14. Historique des ventes déclarées et bénéfices FIFO sur 30 jours (17 novembre 2026)

**Assistant Trading → Journal** affiche désormais un bilan calculé localement à partir des achats/ventes que le joueur a saisis dans le carnet commun de la Bourse : unités vendues, unités rapprochées d’un coût d'achat FIFO, unités sans coût connu, bénéfice net après commission et ROI uniquement lorsque le coût est connu. Le tableau détaille ces valeurs **par objet**, avec dernière date de vente déclarée. Le tableau de bord montre le nombre d'unités consignées durant les 30 derniers jours.

**Attention :** il s’agit uniquement de ventes **saisies par le joueur** et non d'un relevé automatique de l'AH ou de la vitesse de vente de l'ensemble du marché. Les ventes sans achat correspondant sont indiquées séparément et ne comptent **jamais** comme un profit à coût zéro. Les dates absentes, futures ou invalides sont exclues. Le ROI ne comprend ni dépôts, ni frais non enregistrés. Aucune modification des opérations originales, aucune synchronisation avec un compte ou un serveur externe.

Module : `BinchAHPortfolio.tradePerformance()` dans `ah-portfolio-core.js?v=003` ; interface `ah-trading.js?v=012`. Cas FIFO, ventes orphelines, dates et séparation des factions couverts par `tests/binch-ah-portfolio.test.mjs`.

### Dix prochaines priorités

1. Confirmation du rapport de ventes en conditions réelles sur iPhone.
2. Importation d'un vrai scan GrimoireSync sur le client Forever.
3. Étiquetage de la banque séparément des sacs.
4. Contrôle du fonctionnement CORS des cours AH européens sur navigateur réel.
5. Analyse prudente de l’offre entre deux scans, sans assimiler disparition d’annonce à vente.
6. Amélioration du classement des achats selon les dépôts et le risque d'invendus.
7. Enrichissement des recettes Forever vérifiées.
8. Alertes de prix sur les relevés connus, sans promesse de surveillance hors navigateur.
9. Fiches de leveling, quêtes et métiers Druide farouche.
10. Parcours bêta GM et partage avec le frère.

## 15. Comparaison de l'offre entre deux scans GrimoireSync (17 novembre 2026)

Dans **Assistant Trading → Historique**, chaque objet doté de deux vrais scans GrimoireSync récents du même marché affiche maintenant :

- **Quantité d'objets encore listés** : valeurs initiale/finale et variation absolue/relative ;
- **Nombre d'annonces** : différence de profondeur visible ;
- **Prix plancher** : écart entre scans, exprimé en pièces de cuivre et en pourcentage ;
- **Horodatages et intervalle** exacts des deux observations.

**Conditions :** source strictement `Scan GrimoireSync (/grimoire scan)`, annonces/quantités/valeurs positives et cohérentes, deux instants distincts, identité de marché et région identiques lorsque présentes, au maximum sept jours entre scans et dernier scan âgé de moins de 72 heures. Les simples saisies et le flux communautaire ne sont pas convertis en fausses observations complètes.

**Interprétation :** une annonce disparue peut avoir été vendue, annulée, expirée ou déplacée ; cet indicateur **ne permet pas de conclure à des ventes ni d'estimer un débit de vente**. Aucun conseil d'achat ni ordre en jeu n'est automatisé à partir de ce chiffre.

Module : `BinchTrading.supplyChange()`, version `ah-trading-core.js?v=007` et `ah-trading.js?v=013`. Tests : `tests/binch-ah-trading.test.mjs`, partie comparaison d'offre, plus tests de cache de l'interface.

### Golipette : 10 prochains chantiers

1. Contrôler la comparaison d'offre sur un vrai export GrimoireSync.
2. Vérifier le rendu mobile de l'historique et des tableaux.
3. Vérifier l'accès à l'API de prix EU sur navigateur, sans service payant.
4. Intégrer séparément le contenu de banque si l'API addon l'autorise.
5. Affiner les limites du capital en or, dépôts et invendus.
6. Ajouter des filtres de qualité d'historique et de sources au radar.
7. Enrichir les recettes d'artisanat avec références spécifiques Forever.
8. Ajouter des alertes sur les données observées, sans promesse de surveillance active.
9. Développer Faith et les conseils de leveling du Druide farouche.
10. Préparer le parcours de validation pour le frère et les outils de GM.

## 16. Stress-test d'une spéculation AH (17 novembre 2026)

**Assistant Trading → Simulateur** accepte désormais, en plus du prix d’achat, du prix de revente, de la quantité, de la commission et des dépôts initiaux :

- une proportion d'**invendus** (0–100 %) ;
- une **baisse hypothétique du prix de revente** (0–95 %, valeur initiale 10 %) ;
- des **dépôts supplémentaires perdus** à cause des remises en vente.

Le moteur `BinchTrading.simulate()` conserve les champs historiques et fournit un objet `stress` :

- `cashflow` : **solde de trésorerie** après tous les achats, produits réellement simulés, commission et dépôts, y compris le coût des objets **encore en stock** ;
- `matchedMargin` : **marge sur les seules unités supposées vendues**, déduction faite du coût d'achat de ces unités et des dépôts perdus. Elle **n'enregistre pas la perte du coût d'achat des invendus** ;
- `heldCost` : coût des unités invendues, **non assimilé à une valeur de marché ni à un encaissement** ;
- `breakEvenSold` : prix de vente unitaire minimum pour récupérer **toute la mise** sur les seules unités écoulées ; pas de seuil affiché si aucune unité n'est vendue.

Exemple reproductible (montants en cuivre) : achat de 10 × 1 000, revente envisagée à 2 000, cinq invendus, baisse du prix de 10 %, commission de 5 %, dépôts perdus de 300 puis 200. Le modèle donne **–1 950 cuivre de trésorerie**, **+3 050 cuivre de marge sur unités supposées vendues** et **5 000 cuivre de stock toujours immobilisé**. Les trois résultats mesurent des choses différentes et ne doivent pas être additionnés.

**Limitations :** il s'agit de scénarios, jamais de prévisions de demande, de chances de vente ou de profits garantis. L’interface n'ouvre aucune enchère et ne déclenche aucune action en jeu. Les dépôts se saisissent d'après le client WoW Forever et ne sont pas estimés arbitrairement.

Tests : `tests/binch-ah-trading.test.mjs`. Fichiers navigateur : `ah-trading-core.js?v=008`, `ah-trading.js?v=014`.

### Golipette suivante — dix chantiers

1. Vérifier ce simulateur avec des montants et dépôts lus réellement dans Forever.
2. Tester le rendu du stress-test sur iPhone.
3. Vérifier le parcours de lecture ponctuelle des cours EU et les limitations CORS.
4. Valider la capture de deux vrais scans GrimoireSync AH.
5. Évaluer la synchronisation banque et inventaire séparément.
6. Ajouter les filtres de provenance et fraîcheur des cotations au Radar.
7. Recettes et rentabilité métier sourcées Forever, pas extrapolées.
8. Alertes de prix adaptées aux données réellement disponibles.
9. Faith, Druide farouche, suivi quêtes et expérience de leveling.
10. Bêta complète et configuration GM pour le frère.
