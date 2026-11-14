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
