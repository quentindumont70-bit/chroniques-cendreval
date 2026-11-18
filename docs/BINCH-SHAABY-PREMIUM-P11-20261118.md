# LA BINCH RENAISSANCE — Golipette P11 : flagship Shaaby Premium
18 novembre 2026 · PR #234 DRAFT · branche `feature/binch-visual-renaissance-20261118`

## Pourquoi ce prototype remplace la méthode vectorielle P10

Retour terrain : les compositions minimalistes étaient techniquement lisibles mais trop plates pour la promesse de produit premium. Cette passe établit **un rendu héroïque illustré**, davantage comparable à un écran de lancement de jeu qu'à une grille de cartes recolorées.

## Première vitrine réellement créée

**`public/binch/shaaby-mulgore-premium.html`**

- Artwork original Shaaby, Tauren Druide fumant une pipe de feuillerêve à Mulgore, près de son totem.
- Image source créée pour cette passe puis optimisée en WebP (environ 293 Ko); incluse une seule fois en base64 dans le prototype HTML autonome (environ 427 Ko).
- Hero cinématique plein cadre, matière naturelle bronze/cuir, cadres à lierre, fumée sur l'illustration, spores/lucioles CSS très rares.
- Bandeau des identités, navigation fonctionnelle vers les sections, étages expédition/métiers/talents/guilde/Faith.
- Fenêtre native **Reforger mon identité** avec races/classes/métiers. Les combinaisons autres que Tauren Druide ne prétendent pas encore disposer de leur artwork premium : l'action d'application est désactivée.
- Trois ambiances visuelles + mode léger et `prefers-reduced-motion`.
- PC et iPhone : rendus locaux contrôlés à 1440×900 et 390×844, sans débordement horizontal.
- Le prototype n'appelle aucun serveur et ne modifie **aucune** sauvegarde/progression WoW. Ses modules secondaires sont des maquettes d'interface clairement annoncées comme telles.
- Un lien de découverte figure dans le vrai compagnon Renaissance et dans l'atelier P10.
- Régression spécifique : `tests/binch-shaaby-premium.test.mjs`; commande CI ajoutée à `.github/workflows/verify.yml`.

## Ce qui reste séparé

Le **véritable moteur de companion** et sa base `grimoire.hub.v3` demeurent inchangés. La vitrine ne remplace pas encore les composants du quartier général, de la carte ou de l'arbre de talents; elle présente une nouvelle grammaire artistique pour leur refonte future. Aucun merge sur `main`, aucun déploiement sur le site public, aucune dépense.

## Golipette P12 — les 10 chantiers suivants

1. Faire juger l'illustration de Shaaby sur PC et iPhone : composition, caractère et fidélité au personnage.
2. Revoir le crop du hero sur écrans 320/375/430 px pour ne pas masquer le personnage ni les actions.
3. Créer des surcouches d'ornements réalistes détachées (lierre, bois, bronze, cuir, totem) et légères en poids réseau.
4. Remplacer les pictogrammes temporaires des modules par des pièces illustrées de qualité cohérente.
5. Appliquer les nouvelles matières aux véritables contrôles du quartier général sans refaire les fonctions existantes.
6. Porter la reforge premium sur la vraie modale transactionnelle, sans changer les données autres que race/classe/métiers.
7. Mesurer LCP/CLS/TBT sur un hébergement de bêta stable et définir un budget de chargement sans conclure à partir de raw.githack.
8. Étendre les couches de métier avec des détails illustrés / micro-FX peu fréquents et un mode réduit.
9. Produire un second flagship à la même exigence : Mort-vivant Démoniste Ingénierie/Enchantement, sans template recyclé.
10. Revue visuelle et fonctionnelle avec le testeur GM, puis autorisation explicite avant fusion / publication publique.

## Recette

- [x] Artwork original présent et une seule inclusion dans HTML autonome.
- [x] Maquette PC + iPhone rendue localement.
- [x] Reforge et annulation testées en navigateur; aucune mutation du profil.
- [x] Bouton mode léger et aucun débordement mobile au format 390 px.
- [ ] Confirmation esthétique personnelle de l'utilisateur.
- [ ] CI finale verte sur dernier SHA.
- [ ] Intégration des styles premium dans tous les vrais modules du companion.
