# ChatGPT — Golipette du 14 novembre 2026

Branche de travail : `chatgpt-golipette-20261114`. PR en brouillon : https://github.com/quentindumont70-bit/chroniques-cendreval/pull/129

## Situation et protection
- Base : `main` au moment de création de la branche ; ne jamais fusionner sans revoir la réconciliation avec `opencode-golipette`.
- OpenCode possède les améliorations documentées du guide Farouche (séquence exacte de 51 points, 20 talents et leurs tooltips) sur sa branche ; `main` contient encore une implémentation plus ancienne de `specs-guide.js`.
- **Ne surtout pas écraser la version OpenCode du guide Farouche par celle de cette PR.** Porter seulement les quatre petits correctifs d'UI Specs de cette PR sur la version finale après comparaison.
- Aucun registre de prix de joueur effacé, migré ni fusionné.

## Livré sur la PR
1. Specs : état du bandeau épinglé mis à jour pour toutes les spécialités ; libellé et `aria-pressed` synchronisés.
2. Specs : sélection active alignée sur le filtre de classe ; niveaux stockés hors plage 10–60 ignorés.
3. Atelier AH : relevés datés dans le futur rejetés, commission invalidement renseignée ramenée à 5 %, recommandation déclassée en comparaison indicative quand les relevés sont anciens.
4. Atelier AH : refus des totaux monétaires au-delà de la précision des entiers sûrs de JavaScript.
5. Pont AH : aucune observation future utilisée par les consommateurs, lecture seule maintenue.
6. Import AH : horodatage obligatoire pour un fichier importé (on n'invente plus une date aujourd'hui), saisie manuelle datée comme auparavant.
7. Import AH : lignes nulles ou types inattendus rejetés sans provoquer d'accès à leurs propriétés.
8. Tests Node versionnés : `public/binch/test-ah-craft.cjs` (11 assertions) et `public/binch/test-ah-market-import.cjs` (7).
9. Test existant `public/binch/test-market-bridge.cjs` étendu à 11 assertions, y compris dates futures.

## Contrôles accomplis
- Syntaxe JavaScript compilée dans un isolat pour les modules/scripts relus.
- 10 tests fonctionnels d'atelier AH et 7 tests fonctionnels d'import exécutés avec stockage simulé ; contrôle ciblé du pont AH réussi.
- GitHub compare `main...chatgpt-golipette-20261114` : 11 commits, 7 fichiers modifiés au contrôle.
- **Non exécutés :** vrai Node local sur les fichiers téléchargés, navigateur end-to-end, addon dans WoW Forever, déploiement GitHub Pages.

## Roadmap des dix chantiers
1. Design premium par classe — en attente de refonte concertée.
2. Cockpit et commandement personnel — préserver les modules déjà livrés.
3. Cartes Azeroth — vérifier données et interactions réelles avant enrichissement.
4. Talents et builds des neuf classes — priorité à la réconciliation OpenCode, sans talents inventés.
5. Quêtes incontournables et alertes — raccordement au journal importé.
6. Métiers et équipement — chantier AH et artisanat sécurisé dans cette PR.
7. Faith contextuel — consommer seulement le catalogue sourcé et les relevés datés.
8. GrimoireSync et Windows — tests Windows / client réels requis.
9. Bourse AH — provenance, calculs et imports durcis dans cette PR.
10. GM Hub collaboratif — prototype local à distinguer du multi-utilisateur déployé.

## Suite pratique
- Exécuter `node public/binch/test-ah-craft.cjs`, `node public/binch/test-ah-market-import.cjs`, `node public/binch/test-market-bridge.cjs` et `node scripts/check-binch.mjs`.
- Tester les onglets Bourse, Atelier et Specs dans le navigateur (dont niveau, filtre, épinglage), puis préserver les deux répertoires de stockage utilisateur.
- Réconcilier `specs-guide.js` avec OpenCode à l'aide d'un vrai diff, sans remplacer l'ordre de leveling vérifié par l'ancien `DRUID_ROUTE`.
- Tester l'addon et l'installateur sur le client réel avant de déclarer une bêta complète.

## Mise à jour : réconciliation OpenCode effectuée sur la branche (14 novembre)
- Source réelle rechargée : `public/binch/specs-guide.js` depuis `opencode-golipette` blob `2ab8054ef2c580d2ac40aafc6cdfcfa3a139358d`; CSS blob `d637d74212c1d46fa8334b6e258579a66208a2ac`.
- Contenu OpenCode recopié dans notre branche sans modifier sa branche : `SEQ` officielle 51 points, dictionnaire `T` de 20 talents, `stepsAt`, `PHASES`, tooltips et liens conservés. Correctifs ergonomiques ChatGPT réappliqués chirurgicalement sur cette version.
- Filtre sauvegardé hors liste corrigé au montage ; synchronisation entre onglets remet le filtre visuel et la sélection en cohérence.
- 10 assertions exécutées en JavaScript isolé sur `SEQ` : 51 talents-niveaux, somme 25 points au niveau 34, 51 au niveau 60, talent non contigu Frappes de prédateur, bornes de rangs, prochain talent et build complet.
- Nouveau script à exécuter en Node réel : `public/binch/test-specs-route.cjs` (10 assertions).
- `index.html` : cache ciblé mis à jour pour Specs JS/CSS, ah-craft, ah-market, market-bridge ; aucun autre changement volontaire.
- **Attention à la publication :** cette branche protège déjà la séquence officielle OpenCode snapshot, mais si OpenCode publie de nouveaux changements entre-temps, re-comparer avant fusion ; garder les changements futurs des deux côtés.
- Environnement Node local disponible mais accès réseau GitHub depuis le conteneur bloqué (résolution DNS) ; les fichiers GitHub n'ont pas pu y être clonés. Les scripts Node versionnés restent à exécuter sur un clone local accessible.

## Commande de contrôle unique
Depuis la racine du dépôt, exécuter `node scripts/test-binch-golipette.mjs` : lance successivement 4 scripts de régression ciblés et `scripts/check-binch.mjs`, avec code de sortie non nul au moindre échec. Script créé sur cette branche mais pas exécuté sur un clone local (GitHub inaccessible en DNS depuis le conteneur).

## CI réelle GitHub Actions — 14 novembre
- Workflow ajoutée : `.github/workflows/binch-golipette-qa.yml` sur pull_request (branches fichiers Binch) ; Node.js 22, pas d'installation npm nécessaire, aucun déploiement.
- Premier passage GitHub Actions `43613414239` : échec **détecté** dans l'ancien test market-bridge, car le package racine `type:module` faisait retourner un objet vide au `require('./market-bridge.js')` d'un module UMD. **Code applicatif intact** ; réparation du harnais dans `test-market-bridge.cjs` par lecture du JS via vm.
- Deuxième passage `43613528632` : **SUCCESS**, 4 scripts de régression (10 + 11 + 7 + 11 = 39 assertions) et contrôle statique du portail (83 scripts, 0 erreur, 1 avertissement LFG Supabase non configuré).
- Vérifications en vrai Node, sur un checkout GitHub PR, désormais **confirmées**. Ce passage ne remplace toujours pas la QA navigateur ni l'essai en jeu.

## QA Chromium réelle — 14 novembre, second lot
- Script `scripts/test-binch-browser.mjs` ajouté : serveur HTTP éphémère en loopback, contexte vierge, profil *synthétique* `Golipette-QA` chargé dans localStorage. Aucun profil joueur ou service distant touché.
- Workflow PR étendue avec job Chromium **Ubuntu 24.04** (Ubuntu 26.04 non supporté par Playwright 1.58.2). Dépendance Playwright installée uniquement sur runner, sans changement package.json/lockfile ni coût API.
- Parcours desktop et mobile : sélection Mage puis Chasseur, épinglage, retour Druide farouche, niveau 34 (25/51 points et prochain point au 35), niveau 60 complet, conservation des choix après rechargement, désépinglage. Pas d'exception JS détectée pendant le parcours.
- CI GitHub Actions **43615022569 : 2 jobs SUCCESS**, navigateur **24 vérifications sur 24**, Node **41 assertions** + contrôle statique 83 scripts et avertissement LFG connu.
- **Limite UX** : sous viewport mobile, une partie des clics Playwright natifs a été interceptée par la navigation fixe/animation. Le test mobile emploie donc `el.click()` DOM pour quelques boutons, tout en vérifiant l'état fonctionnel. À tester manuellement sur téléphone avant une déclaration de validation tactile intégrale. Sur desktop les clics sont réels via Playwright.
- Versions publiques intactes ; PR brouillon, aucun merge.

## Extension du smoke navigateur : atelier AH
- Job GitHub Actions **43615305690** : **SUCCESS sur les deux jobs**.
- Chromium desktop **14/14** et mobile **14/14** = **28 vérifications**.
- En complément de Specs : navigation vers la Bourse, présence réelle du formulaire de recette, création d'une recette synthétique et affichage explicite d'une estimation incomplète en absence de prix. Aucune cotation fabriquée.
- Node : 41 assertions, contrôle statique : 83 scripts / 0 erreur / 1 avertissement LFG connu.
- Restriction inchangée : bouton mobile testés en partie par activation DOM en raison du chevauchement de navigation sticky ; garder une QA tactile réelle avant publication.

## QA Windows sans installation (14 novembre)
- Job Windows `windows-2025` ajouté à la workflow PR : parseur PowerShell Windows 5.1 sur `Installer-La-Binch.ps1` et `Compagnon-La-Binch.ps1`, **sans exécution des scripts** et sans WoW installé.
- GitHub Actions **43615472935 : SUCCESS sur les trois jobs** : Node 41 assertions + 83 scripts statiques ; Chromium desktop/mobile 28 vérifications ; syntaxe PowerShell 5.1 des deux fichiers OK.
- Il reste expressément à valider le comportement de l'installateur sur un vrai PC Windows, ainsi que la compatibilité du Lua en jeu ; l'analyse syntaxique ne constitue pas ces validations.

## Golipette mobile + pré-vol addon, 14 novembre
- CSS Specs mobile : `scroll-margin-top/bottom` sur commandes, `scroll-margin-top` sur page et dégagement inférieur du panneau, pour limiter le masquage sous la navigation fixe. Cache CSS actualisé `specs-guide.css?v=005`. **Ergonomie tactile physique non certifiée** : le smoke utilise toujours des activations DOM pour quelques actions mobiles.
- Nouveau job CI `binch-addon` sur Ubuntu 24.04 : `luac5.1 -p` sur les trois fichiers de `GrimoireSync.toc`, vérification des noms et de l'existence, **sans exécuter d'addon**.
- Workflow GitHub Actions `43616735174` : **SUCCESS 4/4 jobs** — Node (41 assertions, 83 scripts contrôlés), Chromium (28 vérifications desktop/mobile), PowerShell 5.1 (2 scripts syntaxiquement valides) et Lua 5.1 (3 fichiers syntaxiquement valides).
- Prochaine étape bloquante : installation sur Windows, test addon in-game et validation tactile sur téléphone ; ne pas déclarer ces validations accomplies.

## Golipette tactile — vérification renforcée, 14 novembre
- Le premier essai de clic Playwright mobile sur le bouton d'épinglage **a réussi** après le dégagement scroll CSS.
- Les essais de pointeur sur la carte Farouche et la fermeture du bandeau ont ensuite révélé que `#binch-editor-toggle` (z-index 2147483000) interceptait le bouton `#binch-specs-pin-close` (bandeau anciennement z-index 8888).
- Correctif ciblé mobile dans `specs-guide.css` : un bandeau épinglé visible reçoit `z-index:2147483002`, sans modifier les autres panneaux. CSS cache porté à `v=006`.
- CI GitHub Actions `43617409191` : **SUCCESS 4/4**, dont 28 tests Chromium (14 desktop, 14 mobile) avec clics de pointeur natifs sur l'épinglage, la carte Farouche et la fermeture du bandeau.
- Test mobile renforcé avec des appels Playwright `.tap()` (émulation tactile, non `DOM.click()`) sur ces trois interactions ; **run 43617514503 : SUCCESS 4/4**, 28/28 vérifications navigateur dont les `.tap()` mobiles ; 41 assertions Node, vérification Windows PowerShell et Lua 5.1 vertes.
- **Limite** : Chromium sur viewport mobile avec événements tactiles simulés n'est pas un véritable iPhone/Android physique. Vérifier le scroll réel et les superpositions sur l'appareil avant diffusion.

## Golipette GrimoireSync : tests d'interop réels + nouveau chantier Discord (14 novembre)
- Nouveau `public/binch/test-grimoiresync-import.cjs` : 19 assertions sur **le vrai parseur** `index.html` (GF3 à GF6, personnages, quêtes, métiers, sacs, équipements, fichiers .lua, entrées invalides).
- Nouveau test navigateur Playwright : import d'un fichier `GrimoireSync.lua` **fictif** dans l'onglet Synchronisation, contrôle des états `grimoire.bridge.last` et `grimoire.hub.v3`. Run `43618095706` : 4 jobs SUCCESS, navigateur **32/32 vérifications** desktop/mobile ; Node **60 assertions**.
- Nouveau `scripts/test-grimoiresync-mock.lua` : API WoW simulée avec Lua 5.1 qui charge `Core.lua` et génère le vrai `GrimoireSyncDB.payload`. Pipe vers `public/binch/test-grimoiresync-interop.cjs` qui appelle le parseur réel du navigateur. Run `43618359682` : 4 jobs SUCCESS, **14 assertions interop Lua → JS**, plus les 60 assertions Node et 32 contrôles Chromium.
- Aucun fichier personnel ni instance WoW utilisée. Cela valide une simulation de compatibilité, **pas une validation du fonctionnement dans WoW Forever lui-même**.
- Nouvelle étude **future** `docs/agent-handoff/BINCH-DISCORD-ROADMAP.md` : 10 chantiers pour relier recherches LFG, coffre de souhaits, coffre de guilde déclaré, artisans et événements GM à Discord. Toujours priorité aux fonctionnalités et à la QA actuelles ; **aucun bot Discord créé, aucune source payante activée**.

## Contrôle incrémental XP (suite GrimoireSync)
- `scripts/test-grimoiresync-mock.lua` a maintenant un simulateur d'XP mutable : login niveau 34, gain d'XP 2000→2500, XP de repos 500→600 ; simulation de l'événement `PLAYER_XP_UPDATE`.
- Le script vérifie que le GF6 est réémis avec les valeurs actualisées, que le statut XP est `ok` et surtout que le journal de quêtes ne subit **aucun rescannage** pendant l'actualisation XP.
- Le test `test-grimoiresync-interop.cjs` valide ensuite les nouvelles valeurs sur le vrai parseur navigateur (désormais 15 assertions interop).
- GitHub Actions run `43619031657` : **SUCCESS 4/4** (Node 60 assertions ; Chromium 32 vérifications desktop/mobile ; GrimoireSync Lua 5.1 ; PowerShell Windows).
- Réserve inchangée : simulation d'API WoW, pas de client WoW Forever réel ; test physique mobile/Windows à faire.
- Demande permanente : chaque fin de lot doit proposer le lien direct de La Binch `https://quentindumont70-bit.github.io/chroniques-cendreval/binch/` (site public, ne montrant pas cette PR tant qu'elle n'est pas fusionnée).

## Golipette — protection de profil et provenance des captures (14 novembre)
- Nouveau scénario Chromium sur desktop et mobile : GF7 mal formé refusé, classe WoW non supportée (`DEATHKNIGHT`) refusée, changement vers le personnage fictif `Autre-QA` rejeté par consentement explicite. Pour chaque rejet, `grimoire.hub.v3` reste strictement inchangé et aucun `grimoire.bridge.last` n'est écrit.
- Correctif utilisateur : après annulation d'un changement de personnage, le statut indique « Import annulé : le profil … est conservé » au lieu de laisser l'ancienne erreur affichée.
- Import accepté : `grimoire.bridge.last.capturedAt` conserve désormais le **timestamp réel du fichier WoW** (date Unix issue du payload GF), distinct de `updated` (date de l'import). Dates manifestement absentes, hors plage ou futures signalées comme non datées. La page montre « Capture du jeu » et signale une capture de plus de 24 h.
- Dernière exécution vérifiée : GitHub Actions `43619920699`, **4 jobs SUCCESS**, **40 contrôles Chromium** (20 desktop + 20 mobile), **60 assertions Node**, interop Lua→JS (15 assertions), 83 scripts statiques sans erreur, PowerShell et Lua 5.1 syntaxiquement conformes.
- Les contrôles utilisent seulement des profils et SavedVariables fictifs. Aucune synchronisation temps réel ni installation Windows/jeu réelle revendiquée.
- Chantier Discord conservé dans `docs/agent-handoff/BINCH-DISCORD-ROADMAP.md`, à exécuter après cette stabilisation, pas de connecteur créé.
- **Consigne de livraison permanente : joindre le lien public de La Binch à chaque fin de lot** : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ . Ce site ne contient pas la PR brouillon avant fusion.

## Golipette Faith + Minimap Lua 5.1 (14 novembre, suite)
- Ajout de `scripts/test-grimoiresync-faith.lua`, simulateur local sans WoW, fichier joueur ni réseau ; exécute le véritable addon `Faith.lua` avec objets UI synthétiques. Vérifie activation volontaire, lanceur caché au démarrage, commande `/faith`, réponses niveau et XP, modes sobre et silence, limites de fréquence après un niveau, réaction à une mort et silence dans les instances.
- Ajout de `scripts/test-grimoiresync-minimap.lua` : simule le véritable addon `Minimap.lua`, montage au login unique, clic gauche déclenchant `ReloadUI`, clic droit présentant la boîte de chemin relatif et infobulle cohérente.
- Ces essais sont désormais inclus dans le job `binch-addon` de GitHub Actions ; **run 43620726145 : job Lua SUCCESS**, vérification PowerShell et Node également réussies. Le smoke navigateur du même run est suivi séparément.
- Aucune automatisation du jeu ni communication serveur, aucun test véritable WoW/Windows physique. Compatibilité de gameplay et UI réelle à confirmer dans WoW Forever.
- Lien public permanent demandé pour chaque bilan : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (ne contient pas les modifications de cette PR non fusionnée).

- Recette de terrain mise à disposition : `docs/agent-handoff/BINCH-BETA-TEST-TERRAIN.md`, 10 étapes à réaliser par un vrai joueur sur téléphone, client WoW Forever et PC Windows ; aucune de ces étapes n'est déclarée passée.

## Golipette — cockpit synchronisation, suite du 14 novembre
- `public/binch/command-center.js` utilise désormais `grimoire.bridge.last.capturedAt` pour calculer la fraîcheur réelle de la capture en jeu ; `updated` reste visible séparément comme date d'import. Une capture vieille de plus de 24 heures déclenche une mention d'ancienneté, une capture non datée n'est pas présentée comme fraîche.
- Nouveau test Playwright (ordinateur et mobile émulé) après import GrimoireSync : ouverture du Poste de commandement et vérification que la date source fictive de 2023 et le statut `data-fresh=no` sont affichés. **Run 43621162724 : SUCCESS 4/4**, 42 vérifications navigateur (21 par appareil), 60 assertions Node et les contrôles Lua/Windows existants réussis.
- Pas de connexion au jeu en direct ; données réelles utilisateur non touchées. La branche `main` et OpenCode restent isolées. La roadmap Discord demeure ultérieure.
- **Lien du site à toujours afficher en fin de compte rendu** : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (ne comporte pas ces correctifs tant que la PR n'est pas fusionnée).

## Minicarte GrimoireSync déplaçable (14 novembre)
- `public/binch/addon/GrimoireSync/Minimap.lua` : bouton draggable au clic gauche, placement sur la couronne de la minicarte (rayon ajusté à sa dimension), écriture de `GrimoireSyncDB.minimapPosition` au lâcher, restauration au prochain login. Validation des coordonnées chargées et limitation aux abords de la minicarte.
- Anciennes actions conservées : clic gauche = `/reload`, clic droit = boîte avec chemin relatif de sauvegarde, infobulle enrichie avec geste de glisser.
- `scripts/test-grimoiresync-minimap.lua` mis à jour : début/fin de glissement, bornage, remplacement de la position, persistance et restauration sur nouveau chargement ; test de clics et de boîte existant conservé.
- GitHub Actions **43621549749 : SUCCESS 4/4**, y compris `binch-addon` avec scénario Lua 5.1 minicarte ; autres jobs Chromium 42 tests, Node 60 assertions + 83 scripts statiques, PowerShell syntaxe valides.
- Plan terrain `docs/agent-handoff/BINCH-BETA-TEST-TERRAIN.md` complété pour vérifier absence de `/reload` accidentel pendant le glisser et position persistante sur **vrai client WoW**, encore à réaliser.
- Lien permanent de la Binch publique à fournir au terme des travaux : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ ; la PR brouillon n'est pas encore publiée.

## Refonte next-gen par couple race × classe (14 novembre, priorité ultérieure)
- Exigence utilisateur : après les travaux prioritaires et la bêta, mener une **refonte visuelle next-gen de très haute qualité**, minutieuse dans les détails, avec une **direction artistique unique à chaque combinaison de race et classe** (pas seulement changer la couleur).
- Plan détaillé désormais dans `docs/agent-handoff/BINCH-DA-NEXT-GEN-RACE-CLASSE.md` : 10 chantiers (benchmark, matrice de compatibilité Forever, design system, moteur de thèmes combinatoires avec couche spécifique paire, assets originaux, accueil, modules, motion, UX mobile/accessibilité, QA visuelle/performance), 6 exemples de signatures, critères de qualité.
- Les listes existantes comportent 8 races et 9 classes dans `index.html` ; **ne pas présumer que 72 combinaisons sont légales en jeu** sans vérification sur Forever. La matrice n'est pas encore validée. Réutiliser les thèmes déjà présents dans l'onboarding, sans dégrader les fonctionnalités.
- **Aucune refonte réalisée ni déployée** dans ce lot ; son implémentation attend la stabilisation GrimoireSync/Windows/mobile/QA et l'intégration des autres branches. Le projet bot Discord reste dans sa roadmap distincte.
- Lien public à rappeler : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ ; les changements non fusionnés n'y apparaissent pas.

## Golipette — sécurité du glissement minicarte (14 novembre)
- `Minimap.lua` distingue désormais une fin de glissement de la commande volontaire de rechargement : mémorisation du temps `OnDragStop`, annulation du `OnClick` gauche immédiatement consécutif (fenêtre de 350 ms), rétablissement des clics volontaires ultérieurs.
- `scripts/test-grimoiresync-minimap.lua` simule l'enchaînement `OnDragStart` → `OnDragStop` → `OnClick` immédiat et vérifie **zéro `/reload`**, puis un clic ultérieur et **un seul `/reload`**.
- **GitHub Actions 43622934433 : SUCCESS 4/4** (Lua 5.1, Node, Chromium desktop/mobile, Windows syntaxique). Simulation seulement : comportement exact de WoW Forever à confirmer dans le vrai client.
- Lien de La Binch à chaque conclusion : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (ne contient pas les modifications de notre PR non fusionnée).

## Golipette — commande de secours et intégration sans écrasement (14 novembre)
- Ajout de `/grimoire minimap reset` : remet immédiatement le livre sur la couronne par défaut et efface uniquement `GrimoireSyncDB.minimapPosition`. Le bouton reste déplaçable, le clic gauche /reload et clic droit chemin relatif sont inchangés.
- Help `/grimoire` mis à jour et recette en jeu complétée dans `docs/agent-handoff/BINCH-BETA-TEST-TERRAIN.md`.
- Tests Lua 5.1 enrichis : le reset rend le livre visible à son point par défaut et supprime le champ de position sans recalculer les quêtes/personnages ; le clic après glissement demeure protégé.
- **Run 43623970831 : SUCCESS 4/4 jobs** (Node, Playwright Chromium desktop/mobile, Windows PowerShell syntaxe et Lua 5.1 incluant les mocks).
- Préparation de fusion non destructive : comparaisons exactes sur `main`, `opencode-golipette` et notre branche pour `index.html`, `Minimap.lua`, `specs-guide.js/.css`, `command-center.js`, `ah-craft.js`, `ah-market.js` et `market-bridge.js`. Sur ces fichiers, `main` conserve le contenu de base, nos modifications se limitent aux fichiers ciblés ; l'index des specs d'OpenCode est déjà intégré dans notre branche. Les branches sont divergentes en nombre de commits : ne pas fusionner aveuglément, vérifier la base et les autres fichiers immédiatement avant toute PR de fusion.
- **Pas de merge ni publication sur `main`**. Roadmaps Discord et direction artistique race/classe toujours différées selon priorité.
- Site à fournir en conclusion : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (version publique actuelle).

## Golipette — accueil guidé par la vraie fraîcheur WoW (14 novembre)
- Après correction du Poste de commandement, la **page d'accueil** utilise elle aussi `grimoire.bridge.last.capturedAt` (timestamp de la sauvegarde du jeu) et **non `updated`** (date de chargement sur le navigateur). Affiche clairement « Capture WoW : <date> · à actualiser » si trop vieille (>24 h) et la date de l'import séparément.
- Le bloc des objectifs prioritaires propose désormais **« Rafraîchir les données du jeu »** lorsqu'une sauvegarde est ancienne, future de plus de cinq minutes ou non datée. C'est une suggestion manuelle : `/reload` puis import volontaire, sans accès réseau caché aux données du jeu.
- Nouveau smoke navigateur Chromium qui valide l'alerte d'une capture de 2023 sur l'accueil après import fictif, avec action de resynchronisation. **GitHub Actions run `43624346751` : SUCCESS 4/4**, 44 vérifications Chromium desktop/mobile, Node 60 assertions, Lua et Windows conformes.
- Aucune fusion ni publication sur `main` ; intégration OpenCode et terrain WoW restent prioritaires avant la bêta, puis Discord et refonte graphique race × classe.
- Lien à fournir à chaque livraison : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (version publique antérieure).

## Golipette — garde-fou contre import rétrograde (14 novembre)
- `importCharacter(snap)` dans `public/binch/index.html` compare maintenant les **dates de capture du jeu** lorsque le nom et royaume du fichier coïncident avec l'import déjà enregistré. Si la sauvegarde proposée est plus ancienne de plus de 60 secondes, demande une confirmation **avant toute mutation** de `grimoire.hub.v3`, `grimoire.bridge.last`, l'historique de découvertes et les valeurs métiers.
- En cas de refus, l'interface affiche « Import annulé : sauvegarde plus ancienne refusée. Les données récentes sont conservées. ». Les autres personnages, captures sans horodatage exploitable et écarts de moins de 60 secondes ne reçoivent pas cette alerte particulière. Il reste possible de choisir explicitement un ancien fichier.
- Nouveau scénario Chromium sur desktop et mobile simulé : fichier GF6 du même personnage, royaume et niveau inférieur, capture ancienne ; confirmation rejetée ; aucune modification des clés de profil, import et métiers. **Run 43624867558 : SUCCESS 4/4**, 46 vérifications Chromium (23 par appareil), Node 60 assertions, Lua interop et PowerShell verts.
- Toujours aucune vraie donnée de joueur dans les tests et **aucun merge ni publication de la PR**.
- Lien public en fin de livraison : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/.

## Golipette — préservation des personnages multi-royaumes et provenance (14 novembre)
- `public/binch/index.html` vérifie désormais **avant toute mutation** que le même nom de personnage ne provient pas d'un autre royaume lorsque les royaumes sont connus ; le joueur doit confirmer explicitement la substitution. Refus : profil actuel, dernier import, découvertes et métiers conservés.
- Une nouvelle capture WoW **non datée, invalide ou située dans le futur** ne peut plus écraser silencieusement une capture datée du même personnage et royaume. L'utilisateur peut accepter explicitement cette importation ; le comportement d'une capture ancienne datée (tolérance 60 secondes) est conservé.
- `scripts/test-binch-browser.mjs` ajoute deux cas de refus avec comparaison intégrale des données de profil/import/métiers sur desktop/mobile. Le test attend maintenant le rechargement normal après import, évitant une course entre Playwright et `location.reload()`.
- **GitHub Actions 43625376256 : 4/4 SUCCESS** (50 contrôles navigateur : 25 ordinateur et 25 mobile émulé ; Node 60 assertions, Lua 5.1 interop et PowerShell syntaxe). Tests exclusivement synthétiques, pas de fichiers joueur.
- Les roadmaps Discord et **refonte graphique next-gen avec identité propre à chaque paire race × classe jouable** demeurent enregistrées, mais la priorité reste intégration contrôlée OpenCode / `main`, tests réels de WoW/Windows/mobile et bêta de guilde.
- Lien public obligatoire à la fin de chaque livraison : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (version publique antérieure, PR non fusionnée).

## Golipette — succès des imports frais, anti-régression complète (14 novembre)
- `scripts/test-binch-browser.mjs` vérifie désormais le **chemin positif d'un import WoW plus récent** après les refus d'import plus ancien, non daté et de royaume différent : personnage du bon royaume niveau 35, XP 2900/4000, repos 700, métier Minage 200, horodatage source exact.
- Le nouveau test attend le **rechargement réel** de la page puis vérifie que l'accueil reconnaît le nouveau fichier comme « récent » et **retire** l'objectif de resynchronisation devenu inutile. C'est un contrôle du cycle complet import → sauvegarde locale → rechargement → affichage des priorités, avec données fictives uniquement.
- Résultat vérifié GitHub Actions `43625907818` : **SUCCESS 4/4 jobs**, **54/54 contrôles navigateur** (27 desktop + 27 mobile émulé), Node 60 assertions et vérifications Lua/Windows vertes.
- Prochaines contraintes : aucune fusion `main` sans revue des nouveaux commits divergents ; vrai WoW Forever, Windows et appareils physiques encore non testés. Les chantiers Discord et refonte next-gen race × classe restent planifiés.
- Lien du site actuel à présenter à chaque fin de travaux : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (non mis à jour tant que la PR est brouillon).

## Golipette — garde anti-conflit + packaging cohérent (14 novembre)
- **Comparaison des branches effectuée** : les 23 commits (au moment du contrôle) de `main` postérieurs à notre base touchaient Big Cthu / tests Big Cthu et `package.json`, mais aucun fichier `public/binch/**` modifié dans notre PR. Comparaison explicite également avec `opencode-golipette` : branche historique distincte, des contenus Specs d'OpenCode sont déjà intégrés via `main`, mais **ne pas fusionner son historique en bloc** sans revue.
- CI `.github/workflows/binch-golipette-qa.yml` renforcée : nouveau job `binch-integration-guard`, checkout complet du head de PR, calcul du merge-base, comparaison des fichiers modifiés dans `public/binch/**`, les scripts de tests associés et le workflow QA lui-même avec `main`. Une modification du même fichier sur les deux branches **bloque le contrôle** avant intégration. Une absence de chevauchement de noms de fichiers n'est pas une preuve d'absence de conflit logique.
- **GrimoireSync 0.9.1** préparé : manifeste addon `GrimoireSync.toc` et `Installer-La-Binch.ps1` harmonisés, contrôles de version des regex et du dialogue Windows mis à jour. La suite Lua GitHub refuse désormais une divergence de numéros de version entre manifeste et installateur. L'installateur n'a pas été exécuté sur un poste réel.
- Run CI **43626677021 : SUCCESS 5/5 jobs**, 54/54 tests navigateur (27 desktop, 27 mobile émulé), 60 assertions Node, syntaxe PowerShell, Lua simulé et garde de réconciliation tous réussis.
- **Aucun merge vers `main`, aucun déploiement**, PR #129 maintenue en brouillon. Tester dans WoW Forever et Windows réellement avant distribution à la guilde. Discord et refonte graphique par combinaison race × classe restent inscrits sur leurs roadmaps.
- URL publique obligatoire en fin de lot : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (ancienne version).

## Golipette — synchronisation visible dès l'accueil (14 novembre)
- Demande utilisateur : ne plus chercher l'import WoW dans les onglets. La page d'accueil `public/binch/index.html` affiche maintenant, **immédiatement sous la carte du personnage**, un panneau « Synchronisation WoW » très visible avec **« Importer GrimoireSync.lua »**, rappel `/reload` et bouton « Guide de synchronisation ».
- Le bouton principal ouvre le **sélecteur de fichiers du véritable importeur préexistant** `#grimoire-bridge-file` ; il n'y a pas de second parseur ni de stockage parallèle, et tous les garde-fous (capture plus ancienne, non datée, changement de royaume/personnage) sont conservés. Le guide mène à l'onglet Synchronisation.
- CSS responsive : panneau lisible sur téléphone, boutons de 44 px, styles de focus existants, et `role=status` pour les messages de secours. Aucun accès direct au disque WoW sans sélection explicite du joueur.
- **GitHub Actions `43627334549` : SUCCESS 5/5 jobs**. Tests Chromium **58/58** (29 desktop + 29 mobile émulé), dont ouverture du vrai sélecteur de fichiers depuis l'accueil et navigation vers l'onglet Synchronisation ; Lua, Windows, Node et garde de conflits avec `main` réussis.
- Mise en ligne : **pas encore**. La PR #129 reste en brouillon ; le site public peut encore afficher l'ancienne page tant que le code n'est pas fusionné et publié.
- Lien public demandé en fin de lot : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/.

## Golipette — résultats de synchronisation visibles sur l'accueil (14 novembre)
- Le panneau Synchronisation WoW sur la page d'accueil affiche désormais clairement l'état du dernier import : aucune capture pour le profil, capture ancienne / non datée, ou capture récente à partir du vrai timestamp en jeu `capturedAt`, séparé de la date d'import.
- Le bouton « Importer GrimoireSync.lua » ouvre toujours le vrai importeur déjà protégé. Le panneau relaie, via `MutationObserver`, les résultats de ce même importeur (profil importé, import annulé, import impossible, fichier trop volumineux). Il **ne déclare jamais un succès juste parce qu'un fichier a été sélectionné**.
- L'annonce est un message accessible (`role=status`, `aria-live=polite`), avec retour visuel sur l'état récent ; aucune logique d'import ou base de données supplémentaire.
- Tests Playwright : nouvelle vérification de l'affichage d'ancienneté, de la remontée de refus et du statut « récent » après import puis rechargement. **Run 43627808156 : SUCCESS 5/5 jobs**, **62/62 contrôles navigateur** (31 desktop, 31 mobile émulé), plus Lua, Node, Windows PowerShell et garde anti-chevauchement de fichiers avec `main`.
- Aucun merge ni déploiement. Site public actuel : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/ (les ajouts ne seront visibles qu'après intégration).

## Golipette — bouton Copier chemin WoW sur l'accueil (14 novembre)
- Panneau de synchronisation de la première page enrichi d'un bouton **« Copier le chemin du fichier »**, sans quitter l'accueil. Copie le chemin **relatif** `WTF\Account\NOM_DU_COMPTE\SavedVariables\GrimoireSync.lua` (avec rappel explicite de remplacer NOM_DU_COMPTE) ; repli en fenêtre de copie si le presse-papiers est indisponible. N'essaie pas de retrouver un chemin absolu Windows, auquel le navigateur n'a pas accès.
- Réutilisation du même importeur sécurisé, aucun traitement de données supplémentaire, aucun accès disque automatisé.
- Vérifications Playwright sur Chromium desktop/mobile : copie effective du chemin, placeholder présent et statut d'instruction affiché. **Run GitHub Actions `43628266157` : SUCCESS 5/5**, **64/64 contrôles navigateur** (32 desktop + 32 mobile émulé), autres jobs Node, Lua 5.1, PowerShell et garde de conflits `main` verts.
- PR #129 en brouillon, pas encore de publication sur https://quentindumont70-bit.github.io/chroniques-cendreval/binch/.

## Golipette — glisser-déposer de GrimoireSync.lua sur l'accueil (14 novembre)
- L'accueil accepte maintenant le **glisser-déposer** d'un fichier nommé `GrimoireSync.lua` sur le panneau `#binch-front-sync` et le fait passer par le **seul importeur existant** `#grimoire-bridge-file`, via l'événement `change`. Aucune deuxième logique de décodage, aucun accès réseau ou lecture spontanée du disque.
- Le panneau affiche une mise en évidence pendant le déplacement d'un fichier. Les noms différents ou dépôts multiples sont rejetés avant import ; les erreurs du parseur sont affichées par le système déjà présent, avec conservation de toutes les données en cas d'erreur.
- **GitHub Actions 43628926590 : SUCCESS 5/5 jobs**, **68/68 tests Chromium** (34 desktop + 34 mobile émulé). Deux nouveaux scénarios par appareil : fichier non autorisé rejeté sans mutation du profil ; `GrimoireSync.lua` invalide transmis à l'importeur qui signale son erreur, données utilisateur synthétiques conservées.
- Pas de fusion ni de déploiement ; essai réel dans WoW Forever et Windows toujours requis.
- Site public actuel : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/.

## Golipette — validation du glisser-déposer positif (14 novembre)
- Un test Playwright de bout en bout glisse maintenant un **fichier GrimoireSync.lua GF6 valide et plus récent** sur le panneau d'accueil. Le vrai importeur déclenche le rechargement attendu ; les niveaux, XP et l'horodatage de capture sont ensuite vérifiés après redémarrage de la page.
- Les scénarios précédents de rejet d'un nom de fichier incorrect et d'un payload GF7 non pris en charge restent conservés et prouvent l'absence de mutation dans ces cas.
- **GitHub Actions 43629163302 : SUCCESS 5/5** — **70/70 vérifications Chromium** (35 ordinateur et 35 mobile émulé) ; Node 60 assertions, Lua 5.1, Windows PowerShell et protection d'intégration sur main verts.
- Aucune action sur le vrai dossier de sauvegarde, pas de merge, pas de publication ; bêta réelle WoW Forever/Windows/téléphone à faire.
- Site public actuel : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/.

## Golipette — bouton principal d'accueil relié au vrai importeur (14 novembre)
- Le bouton de tête de l'accueil qui envoyait encore vers un onglet masqué ouvre maintenant **directement** le sélecteur du vrai fichier `GrimoireSync.lua`, en déléguant à `#binch-front-sync-import` puis au seul `#grimoire-bridge-file`. Il est libellé « Importer ma sauvegarde WoW ↻ ».
- Le panneau sous le héros conserve son import direct, son guide, son bouton de copie de chemin et le glisser-déposer. Aucun double parseur, pas de lecture disque sans action utilisateur.
- Nouveau test Chromium desktop/mobile : bouton du héros doit émettre un `filechooser` sur l'entrée `#grimoire-bridge-file`. **Run GitHub Actions 43629994139 : SUCCESS 5/5**, 72 tests navigateur (36 desktop + 36 mobile émulé), Node/Lua/Windows/anti-chevauchement réussis.
- Ne pas fusionner `main` ni publier sans revue. Lien public actuel : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/.
