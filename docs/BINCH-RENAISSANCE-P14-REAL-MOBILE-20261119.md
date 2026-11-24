# La Binch Renaissance — Golipette P14 : vrai accueil premium et iPhone

19 novembre 2026 · Dépôt `quentindumont70-bit/chroniques-cendreval` · Branche `feature/binch-visual-renaissance-20261118` · PR #234 **DRAFT**

## Résultat produit : on travaille enfin sur l'écran effectivement visible

La revue du code a révélé trois générations d'accueil empilées : le hero ancien, `#binch-front`, puis `#binch-adventure-home` (créé par `player-home.js`). La feuille `player-home.css` masque les deux premiers ; la P14 doit cibler **`#binch-adventure-home`**. Les tests de régression sont adaptés à cette réalité, et non à une maquette déconnectée.

Deux artworks originaux restent utilisés sans conversion en recoloring : Shaaby Tauren/Druide (Mulgore, lierre, bois et bronze) et Mort-vivant/Démoniste (nécropole, acier, cuivre et sceau d'engrenage). Le moteur `visual-identity-compositor.js` réserve ces flagships aux combinaisons réellement choisies. Les neuf décors des autres classes ne sont pas transformés en faux flagships.

## Dix chantiers de la passe, état

1. **Diagnostic de l'accueil réel — fait.** Identifié l'écran `#binch-adventure-home` et les anciens héros cachés : aucun relooking de l'accueil masqué n'est présenté comme un progrès.
2. **Panneaux réels — fait.** `premium-front-p14.css` applique des matières différentes à `.binch-character-card`, `.binch-priority-guard` et `.binch-route`, avec informations et boutons d'objectifs inchangés.
3. **Modules métiers / progression / GM / talents — fait pour la présentation.** Les styles héritent des matières de la combinaison sans toucher aux données ni aux actions.
4. **Navigation mobile — fait.** `premium-mobile-sections-p14.js` et CSS replient les nombreux onglets dans « Toutes les rubriques » (aria-controls / aria-expanded, fermeture Échap, fermeture à la sélection). Les onglets originaux et leurs handlers restent disponibles ; sur desktop, la navigation reste intacte.
5. **Raccourcis du bas — fait.** Le dock Renaissance existant est conservé. L'ancien dock dupliqué n'est plus affiché en parallèle et Faith est repositionnée au-dessus des raccourcis.
6. **Visibilité immédiate du portrait — fait.** En repliant les onglets, le grand artwork devient visible dès la première fenêtre iPhone au lieu d'être repoussé par une longue navigation.
7. **Nom de personnage / médaillon — fait.** Abandon de la vieille grille mobile 91 px + colonne étroite au profit d'un empilement pleine largeur ; les noms longs ne se cassent plus lettre par lettre. Médaillon de niveau et anneau XP sont préservés.
8. **Reforge selon le brouillon — fait.** Le dialogue suit `data-binch-preview=shaaby|forsaken|other` et adapte sa matière avant validation ; aucune écriture au stockage lors de l'aperçu.
9. **Captures de l'application réelle — fait.** `tests/helpers/binch-p14-screenshot-fixtures.mjs` crée seulement pendant GitHub Actions des copies éphémères de l'application avec profils **synthétiques** pour capturer Shaaby et le Nécromancien sur desktop et 430×860, ainsi qu'une capture iPhone de reforge. Aucun de ces profils n'est mis dans le code distribué et aucune donnée réelle n'est modifiée.
10. **Non-régression — fait.** `tests/binch-p14-real-front.test.mjs` vérifie les bons éléments actifs, les deux ressources artistiques, la navigation mobile et son comportement en simulation, le mode reforge et l'absence de faux stockage. Exécution GitHub Actions **#44485540072 : succès** (types, compilation, tests et captures).

### Fichiers pertinents

- `public/binch/premium-front-p14.css` — vrai accueil, panneaux, nom et médaillon, reforge.
- `public/binch/premium-mobile-sections-p14.js` et `.css` — rubriques mobiles, nav conservée, dock et Faith.
- `public/binch/visual-identity-compositor.js` — identité enregistrée et aperçu de reforge.
- `public/binch/index.html` — inclusion versionnée des styles/scripts de la passe.
- `tests/binch-p14-real-front.test.mjs` et `tests/helpers/binch-p14-screenshot-fixtures.mjs` — vérification et captures de l'interface réelle.
- `.github/workflows/verify.yml` — captures PNG en artefacts de revue, pas sur GitHub Pages.

### Limitations

Les captures 430×860 attestent la composition en navigateur automatisé, **pas** le confort sur le vrai Safari iPhone. La performance et LCP n'ont pas encore été mesurés sur un hébergement de bêta stable ; la latence raw.githack n'en est pas un substitut. Les sept classes restantes possèdent des paysages originaux mais pas encore des artworks premium du niveau des deux flagships.

### Golipette P15 — les 10 prochains chantiers

1. Tester sur le vrai iPhone la page de la PR et le basculement Tauren Druide / Mort-vivant Démoniste.
2. Vérifier sur appareil que la pastille Faith et le dock Renaissance n'occultent ni les actions ni le bas du portrait.
3. Comparer les noms très longs et le médaillon à 320, 375, 390 et 430 px, puis en paysage.
4. Rehausser les véritables panneaux de métiers avec des signatures spécifiques et leurs données inchangées.
5. Harmoniser les six portails et les chapitres progression, talents, GM et synchronisation.
6. Raffiner le grand hero PC tout en gardant les données de progression utiles au premier coup d'œil.
7. Mesurer poids, LCP, CLS et comportement sur réseau mobile depuis un hébergement de test représentatif.
8. Élaborer une bible d'art ambitieuse pour les sept autres classes et les six autres races sans recoloring.
9. Valider annulation, sauvegarde et retour du focus de « Profil actif » dans Safari iPhone.
10. Préparer la bêta pour le frère, réaliser une recette fonctionnelle, puis demander accord explicite avant fusion.

**Garde-fous permanents :** PR #234 DRAFT, pas de fusion `main`, pas d'achat, pas de faux personnages importés, pas de duplication de la clé `grimoire.hub.v3`.
