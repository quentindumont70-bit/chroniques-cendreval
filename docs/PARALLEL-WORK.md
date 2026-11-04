# Outbinched — travail partagé Codex / Claude

État de passation : 4 novembre 2026. Toujours comparer ces notes aux branches distantes avant de commencer.

## Identité et accès

- Nom public : Outbinched. Dépôt : quentindumont70-bit/chroniques-cendreval.
- Jeu : https://quentindumont70-bit.github.io/chroniques-cendreval/
- Conserver le nom du dépôt, les URLs et les clés `cendreval-*` pour la compatibilité.
- Le dépôt GitHub est la source commune. Les conversations et les fichiers non poussés de chaque assistant ne sont pas partagés.
- Chaque assistant doit pouvoir lire le dépôt et pousser sa propre branche. Ne jamais demander de token dans un prompt ou un fichier suivi.

## Vision et exigences utilisateur

FPS-RPG solo gothique, vallée belle et lumineuse puis château sombre. Références : Secret of Mana réinventé avec les moyens actuels, Octopath Traveler pour la richesse visuelle, Skyrim / Elden Ring / Heretic pour l'exploration et le combat. L'ambition AAA est une direction, pas une qualification du prototype actuel.

Priorités : relief lisible, monde vivant, personnages et arbres volumétriques soignés, animations lisibles, coups et butin perceptibles, musique sans bruit blanc, interface oldschool modernisée. Le moteur actuel est un raycaster Canvas 2D avec rendu voxel/facettes projetées ; ne pas le décrire comme un moteur WebGL complet. Pas de migration moteur sans décision explicite.

Mobile : deux pouces indépendants, gestes pour attaque/parade/esquive/compétences ; préserver ce schéma. Le joueur trouve le 1080p agréable sur iPhone 17 Pro Max et la 4K trop lente. PC : clavier/souris, capture/reprise fiable, boutons latéraux sans navigation navigateur. Ne pas annoncer 60/120/240 FPS garantis sans mesure.

Six classes, trois compétences chacune ; stats physiques et magiques, critiques, talents, inventaire, forge, progression, boss Sulfuras puis deux Thunderfury, châteaux et Échos existent déjà. Consulter le code pour les limites réelles.

L'utilisateur demande de vrais gros chantiers distincts, jouables, enchaînés sans validation répétée. Tests, correctifs, sauvegardes et livraison font partie du chantier, pas des blocs supplémentaires. Ne jamais annoncer un travail terminé seulement parce qu'un plan a été écrit.

## Référence principale : Queen’s Domain

Le 4 novembre, l’utilisateur précise que Queen’s Domain est le jeu correspondant à ce qu’il veut atteindre avec Outbinched. Cette référence devient prioritaire pour calibrer la direction. Source officielle : https://press.futurefriendsgames.com/queens-domain . Piliers documentés : fantasy rétro, exploration interconnectée riche en secrets, déplacements verticaux, combat à endurance, attaques chargées et spéciales, armes secondaires.

Traduction proposée pour Outbinched : construire une petite zone dense et cohérente, avec relief réel, raccourcis, secrets, silhouettes lisibles et impacts convaincants avant de multiplier les systèmes. Garder l’identité, les classes et les sauvegardes propres à Outbinched. Ne pas copier les assets, le monde ou l’histoire de la référence. Le raycaster actuel limite les espaces superposés et les déplacements 3D ; proposer une tranche jouable en vraie 3D pour évaluer une migration, sans annoncer qu’elle existe déjà ni supprimer le prototype publié.

## Architecture

- `app/page.tsx` : état, sauvegarde, combat, IA, boucle de rendu, écrans. Très gros fichier partagé : éviter les éditions concurrentes.
- `app/globals.css` : styles globaux, autre point de conflit.
- `app/voxel-world.ts`, `actor-rig.ts`, `actor-pose.ts`, `scene-models.ts`, `valley.ts`, `world-art.ts`, `view-weapon.ts` : rendu et modèles.
- `app/rpg.ts`, `world-rules.ts`, `inventory.ts`, `loot.ts`, `encounter-save.ts` : règles et persistance.
- `github-pages/` : entrée React/Vite pour la publication statique.
- `.github/workflows/pages.yml` : push sur main → installation, typecheck, tests/build puis GitHub Pages.
- Le squelette Vinext/Sites existe également ; ne pas remplacer le déploiement GitHub Pages par un nouveau site.

Node >=22.18. Installation : `npm ci`. Vérifications : `npm run typecheck:game`, `npm test`. `npm test` construit déjà GitHub Pages. `npm run build:pages` permet une compilation seule. Les scripts navigateur `tests/*browser.cjs` ne sont pas tous inclus dans npm test ; distinguer validation unitaire, parcours navigateur et essais sur appareil réel.

## État exact au départ

`main` constaté : `6f39f233756fc0da9a68c06cee4b7c5f431d0302` — renommage public Outbinched. Les commits précédents incluent sol/sous-bois, camps, tactiques ennemies, phases des commandants, Échos et sauvegarde des rencontres.

Cette livraison ajoute sur main les cinq systèmes ci-dessous. La publication GitHub Pages est déclenchée par le push ; vérifier le résultat du workflow associé au commit avant de la déclarer en ligne :

1. `combat-effects.ts` : effets ancrés aux impacts dans le monde, traceurs cosmétiques, chiffres de dégâts, budget de 32 effets. Les dégâts restent instantanés selon les règles existantes ; il ne s'agit pas de projectiles physiques avec collisions différées.
2. `atlas.ts`, `atlas-panel.tsx` : carte, points d'intérêt, choix de destination, route BFS contournant les murs et guide dans la scène. La destination est temporaire et retirée au changement d'étape.
3. `contracts.ts`, `contracts-panel.tsx` : cinq contrats à plusieurs objectifs, acceptation, suivi et récompense unique. Ils complètent les primes déjà présentes dans `bounties.ts` ; ne pas confondre les deux.
4. `alchemy.ts`, `alchemy-panel.tsx` : douze récoltes uniques, trois ingrédients, trois recettes, achat de ravitaillement avec l'or, fiole équipée, buffs temporisés. Accessible depuis le sac et Valbrume.
5. `afflictions.ts` : six effets liés aux classes, dégâts périodiques, consommation de marque par attaque de base, ralentissement du rôdeur, sauvegarde des effets dans les rencontres.

Compatibilité des nouvelles données dans `world-rules.ts` et `encounter-save.ts`. Tests ajoutés : `tests/journey-systems.test.mjs`. Chargeur de `tests/expedition-systems.test.mjs` ajusté pour les imports avec extension .ts.

Vérifications déjà effectuées : TypeScript et suite npm test réussis avant cette passation, parcours navigateur partiel accueil → classe → atlas avec route → journal → acceptation de contrat → sac → alchimie. Corrections apportées aux boutons de destinations qui se comprimaient. Limites de validation navigateur : vraie recette et utilisation de fiole, récolte en jeu, effets/afflictions en combat et contrôle mobile 844×390 restent à parcourir ; les règles correspondantes sont couvertes par les tests unitaires. Typecheck et 128 tests passent, build Pages inclus. Les performances réelles sur iPhone ne sont pas mesurées.

## Protocole de travail parallèle

1. `git fetch origin`, lire main, les branches de travail et les PR ouvertes. Rapporter les SHA lus.
2. Un assistant = une branche et un checkout/worktree distincts. Codex : `codex/*`. Claude : `claude/*` (ou nom imposé par son environnement). Aucun force-push ni écrasement du travail d'autrui.
3. Lire la passation et les fichiers de réservation avant de modifier. Écrire son périmètre dans `docs/work-claims/claude.md` ou `codex.md`, avec base SHA, fichiers, résultat attendu et statut. Pousser ce fichier dès le début. Ces réservations sont une convention, pas un verrou automatique : comparer les branches avant de toucher un fichier partagé.
4. Codex conserve la responsabilité de l’intégration et des correctifs des cinq systèmes ci-dessus dans `page.tsx`, `globals.css`, sauvegardes et pipeline. Claude peut travailler indépendamment sur modèles/animations d'acteurs dans `actor-rig.ts`, `actor-pose.ts` et leurs tests, ou sur un autre périmètre explicitement réservé.
5. Claude part du dernier main publié. Avant de compléter ou corriger les cinq systèmes, signaler le périmètre et suspendre les éditions Codex sur les mêmes fichiers.
6. Ne pas réécrire `page.tsx`, `globals.css`, les clés de sauvegarde ou les dépendances dans les deux branches en même temps. Fournir des modules séparés ou une proposition de raccordement à l'intégrateur.
7. Pousser le travail et ouvrir une PR détaillant changement jouable, fichiers, tests réellement exécutés et limites. À défaut de capacité PR, fournir branche et SHA. Ne pas prétendre avoir poussé si l'accès est en lecture seule.
8. Codex est l'intégrateur proposé : revue, résolution des conflits, nouvelle validation sur résultat fusionné, puis une fusion à la fois vers main. Claude ne publie pas directement sur main. L'utilisateur peut changer ce partage des rôles.
9. Après une fusion, les autres branches récupèrent main avant leur prochaine intégration. Mettre à jour les notes de passation et libérer les réservations.
10. Les assistants ne lisent pas automatiquement les nouvelles PR en arrière-plan : au début de chaque session et avant une intégration, relire GitHub. L'utilisateur peut transmettre le lien d'une branche/PR pour déclencher une reprise.
