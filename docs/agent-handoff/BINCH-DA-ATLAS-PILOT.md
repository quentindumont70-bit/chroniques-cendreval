# La Binch — Atlas artistique pilote (v0.2)

**État : six concepts visuels implémentés, aucun couple considéré comme officiellement jouable sans vérification sur WoW Forever.** Ce document est un atlas de direction artistique, non une matrice de compatibilité du jeu.

## Les six signatures

| Concept de travail | Matériau | Grammaire géométrique | Mouvement / motif | Emblème original | Identité |
| --- | --- | --- | --- | --- | --- |
| Tauren × Druide | Bois, cuir, jade | courbes organiques et racines | stries obliques naturelles | feuille et nervure | Cœur du Vivant |
| Troll × Chaman | Totems, fibres, turquoise | axes rituels asymétriques | lignes élémentaires verticales | éclair découpé | Totem des Trois Orages |
| Orc × Guerrier | Fer noir, rivets, braises | angles coupés, impacts | diagonal d'armurerie | lames croisées | Marque du Siège |
| Elfe × Druide | Argent, verre, feuillage nocturne | cercles lunaires et verrières | ondes concentriques | croissant | Croissant des Sentinelles |
| Mort-vivant × Démoniste | Encre, cuivre terni, violet | reliquaires et cadres carrés | strates de sceaux | reliquaire polygonal | Sceau du Pacte Voilé |
| Gnome × Mage | Cuivre, cristal, verre | instruments de précision | graduations d'atelier | boussole/cristal | Compas du Nexus |

## Contrats techniques

Le prototype isolé `public/binch/da-lab.html` expose un identifiant sûr via `data-pair`, liste blanche dans l'objet `concepts`, et une interface identique pour les six thèmes. Chaque thème change le motif, la forme, les matériaux, l'emblème, la signature narrative et le contenu de progression fictif. **Aucune donnée de vrai personnage, compte WoW ou serveur** n'est lue. Les boutons de jeu de la maquette sont volontairement inertes et annoncent clairement le mode aperçu.

Avant intégration à la vraie Binch, construire **une matrice de compatibilité Forever avec preuves** (client, sources vérifiables et éventuelles règles custom), en séparant trois états : `verified-playable`, `verified-unavailable` et `unverified`. Ne jamais déduire la jouabilité des 72 paires mathématiques ni du simple fait qu'une maquette existe.

## Plan des dix prochains chantiers

1. Obtenir les preuves de compatibilité des races et classes sur Forever, garder `unverified` tant que nécessaire.
2. Mesurer contrastes et zones tactiles des six concepts sur 390 px et 1440 px.
3. Extraire tokens communs et schémas de paire vers un manifeste versionné.
4. Créer le moteur de sélection d'identité `race + classe + pairArtDirection` avec repli neutre.
5. Produire des emblèmes, textures et décors originaux sans reprendre d'assets sous droits.
6. Adapter l'accueil vivant en préservant la synchronisation en haut de page.
7. Harmoniser le Poste de commandement, les talents, les métiers et le guild hub.
8. Ajouter mouvements sobres et choix « effets réduits » persistant, sans impact sur le jeu.
9. Exécuter la validation navigateur et les essais sur téléphones physiques.
10. Préparer la démonstration au frère/GM, puis intégrer par PR distincte uniquement après validation.

## État du chantier

Le premier contrôle statique CI de la branche graphique et les six concepts passent. Cette branche est **séparée** du développement fonctionnel (#129) et ne doit ni le bloquer ni modifier `main` sans revue.

PR artistique : https://github.com/quentindumont70-bit/chroniques-cendreval/pull/154

## Golipette v0.3 — registre de thèmes réutilisable

- Les six concepts, jusque-là définis directement dans la page HTML, sont extraits dans `public/binch/da-themes.js` (registre **versionné 0.3.0**, chargé localement). La maquette `da-lab.html` utilise dorénavant cette unique source de vérité.
- API d'étude : `BinchDaThemes.pairs`, `resolve(id)`, `findPair(race,classe)`, `compatibility: 'unverified'`. Normalisation d'alias français/anglais, y compris les accents (« Mort-vivant », « Démoniste »). Les identifiants non approuvés renvoient **null**, sans inventer de compatibilité ou manipuler le profil.
- Aucune dépendance réseau, aucun accès aux données du joueur. Les objets sont utilisés uniquement dans le laboratoire, pas dans la Binch publique ni dans la PR fonctionnelle.
- Tests de registre mis à jour : liste blanche des six thèmes, identifiants, alias accentués, refus des prototypes JS / paires inconnues, absence de lecture du stockage ou de trafic, et syntaxe du contrôleur HTML. **GitHub Actions run 43631810093 : SUCCESS.**
- Prochains chantiers : tokens CSS externalisés, moteur de repli neutre, essais visuels mobiles et preuves de compatibilité Forever.

## Golipette v0.4 — thème neutre et tokens isolés

- `public/binch/da-themes.js` v0.4.0 fournit maintenant `neutral` et `resolveOrNeutral(id)`. `resolve(id)` conserve volontairement sa sémantique stricte (retour `null` pour toute identité inconnue), afin de ne jamais confondre **fallback graphique** et **preuve de jouabilité**.
- Le laboratoire graphique dispose d'un bouton « Thème neutre » contrôlable et accessible (`aria-pressed`). Les six univers originaux restent sélectionnables, sans écraser le profil de jeu.
- Les six styles explicites (cinq paires et un neutre, Tauren Druide conservant les tokens de base) sont extraits dans `public/binch/da-tokens.css`. La page HTML le charge par un lien local. Plus besoin de dupliquer les variations de palettes, géométries et textures dans l'HTML.
- `scripts/test-binch-da-lab.mjs` vérifie les résolutions et rejets des identifiants, les alias, l'apparence neutre, la feuille de tokens et l'absence de lecture des données de joueur. Le workflow `binch-da-lab.yml` se déclenche sur les modifications du registre **et** des tokens.
- **GitHub Actions 43632330104 : SUCCESS** (vérification statique du laboratoire). Pas encore de test visuel sur appareil réel, ni d'intégration à la page publique.

## Golipette v0.5 — décors procéduraux originaux

- Nouveau fichier `public/binch/da-scenes.css` : environnement CSS sans images externes, composé de cinq couches décoratives (ciel, astre, horizon géométrique, premier plan et brume) à `aria-hidden="true"`. La scénographie change selon chacune des six identités et le thème neutre ; les silhouettes reflètent notamment totems, fortifications, architectures obscures ou instruments d'atelier.
- La maquette `da-lab.html` charge cette feuille et place les décors derrière les éléments interactifs. Aucun changement dans `main` ni dans la page publique.
- Le style mobile atténue et réduit les fonds, afin de maintenir une bonne lisibilité des cartes et boutons. Les préférences de mouvement réduit sont prises en compte (aucune animation ajoutée).
- Validation statique : `scripts/test-binch-da-lab.mjs` vérifie les cinq couches, les variantes, les règles mobile et mouvement réduit et l'absence d'assets externes. **CI graphique GitHub Actions 43632773097 : SUCCESS.** Des captures visuelles et essais sur téléphones réels restent nécessaires.
- Prochains travaux : éclairage sculpté, composants et matériaux premium, galerie responsive, tests de contrastes et véritables essais de performance.

## Golipette v0.6 — cartes et cadres premium

- Ajout de `public/binch/da-components.css` : composants graphiques originaux pour le héros, les signatures et emblèmes, la carte de progression et les trois cartes de modules. Encadrements gravés, rails lumineux discrets, coins taillés, reliefs et ornementations CSS sans images distantes.
- Chaque univers adapte également la géométrie des coins, l'éclairage et la matière au-delà de la palette, avec repli neutre.
- Le laboratoire `da-lab.html` charge cette feuille en dernier ; les données de jeu et les boutons de la maquette restent inchangés. Les styles intègrent les contraintes mobile 820/430 px et la réduction de mouvement.
- Le workflow de l'atelier graphique et les tests contrôlent la présence de chaque thème, les principaux composants, le responsive, la réduction des animations et l'absence d'assets téléchargés. **GitHub Actions run 43633231415 : SUCCESS**.
- Reste à valider le rendu en Chromium visuel et sur appareils physiques ; ce passage confirme les contrats statiques seulement.

## Golipette v0.7 — galerie de captures Chromium

- Script `scripts/test-binch-da-visual.mjs` : serveur HTTP local à port éphémère, profil Playwright vierge, Chromium réduit en mouvement, pour **7 thèmes × 3 vues (360×780, 390×844, 1440×900)**. La maquette n'utilise aucune donnée joueur.
- Après sélection de chaque thème : vérification du bouton actif, de l'interface, de l'absence de débordement horizontal, de la largeur/hauteur des contrôles principaux (au moins 44 px), de la présence de décors et de tokens de thème. Capture plein écran dans `artifacts/binch-da-visual/` + `manifest.json` avec vue/thème/couleur/diagnostics.
- Le workflow `.github/workflows/binch-da-lab.yml` lance à présent **deux jobs**, avec Playwright Chromium isolé et archivage des captures pendant 14 jours, y compris si une vérification échoue.
- **GitHub Actions run 43633776347 : SUCCESS 2/2 jobs, 21 captures, zéro débordement et zéro erreur de page**. Les images sont disponibles dans les artefacts du run : https://github.com/quentindumont70-bit/chroniques-cendreval/actions/runs/43633776347.
- Limites : ce passage confirme les dimensions, la navigation et l'absence de crash dans Chromium. Il ne certifie ni contraste WCAG, ni qualité esthétique manuellement revue, ni comportement exact sur appareils physiques. Les scènes restent de simples originaux procéduraux.

## Golipette v0.8 — contraste mesuré dans Chromium

- La recette `scripts/test-binch-da-visual.mjs` mesure maintenant les couleurs CSS réellement calculées des boutons opaques : action principale, sélection de thème active et sélection inactive, pour chacun des sept thèmes et trois dimensions de navigateur.
- Le rapport enregistre `contrastMeasurements` dans `artifacts/binch-da-visual/manifest.json` avec la couleur du texte, le fond et le ratio calculé (luminance WCAG relative), et bloque la CI si le contraste descend sous **4,5:1**. Contrôles d'overflow, taille tactile minimale et capture 21 fois conservés.
- **Run 43634282157 : SUCCESS 2/2 jobs** après correction du parsing CSS dans le script de test. Aucun contraste inférieur à 4,5:1 détecté dans les boutons testés.
- La recette vérifie également les interactions clavier `Entrée` et `Espace` dans la galerie, à confirmer lors du prochain run.
- **Périmètre honnête** : seuls les boutons opaques sont mesurés. Les textes sur fonds transparents, images et dégradés nécessitent une inspection visuelle/contraste plus approfondie ; ce travail ne prétend pas à une conformité WCAG globale ni à un test téléphone réel.
