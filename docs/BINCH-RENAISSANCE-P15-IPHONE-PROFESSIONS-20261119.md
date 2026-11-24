# La Binch — Golipette P15 : iPhone lisible et métiers sculptés

19 novembre 2026 · Dépôt `quentindumont70-bit/chroniques-cendreval` · Branche `feature/binch-visual-renaissance-20261118` · PR #234 **DRAFT, pas de merge**

## But

Transformations vérifiables dans le vrai compagnon, pas une nouvelle galerie autonome. L'interface doit combiner les couches **race + classe + métiers** et rester utilisable sur écran étroit. Aucune donnée de jeu changée.

## Les dix chantiers réalisés

1. **Relecture des captures réelles P14** — problème observé : logo « LA BINCH » découpé et anciens boutons d'éditeur flottants par-dessus les portraits. Nous avons recherché les vrais éléments DOM au lieu de masquer le problème.
2. **Header mobile P15** — `premium-iphone-p15.css` utilise deux colonnes flexibles pour le blason/le mot-symbole et « Profil actif » ; le nom long reste tronqué proprement et la marque conserve sa largeur. Règles spécifiques à ≤760, 390 et 350 px.
3. **Éditeur non flottant** — `premium-mobile-sections-p14.js` déplace **le bouton réel existant** `#binch-editor-toggle` dans les onglets repliables sur iPhone et le restaure au desktop. Ses listeners restent attachés ; pas de faux bouton ni de duplication.
4. **Faith préservée** — bouton compact, conversation disponible au clic, repositionnée au-dessus du dock de raccourcis et hors de la partie centrale du nom ; le menu original et les routes conservent leurs actions.
5. **Nouveaux contrôles responsive** — CI génère captures du véritable compagnon aux tailles 320×800, 375×812, 390×844 et 430×860, avec noms synthétiques, portails et reforge.
6. **Quatre dessins métiers originaux** — `profession-herbalism-p15.svg`, `profession-alchemy-p15.svg`, `profession-engineering-p15.svg`, `profession-enchanting-p15.svg`. Gravures locales légères, toutes indépendantes du rendu principal.
7. **Neuf signatures** — `premium-professions-p15.css` stylise les vraies cartes `#page-metiers #jobs-content .tile[data-job]` : herboristerie, alchimie, ingénierie, enchantement, minage, forge, couture, dépeçage, travail du cuir. L'animation rare de feuille ne fonctionne que sur la page active et se coupe en mode léger/réduction de mouvement. **Aucun métier inventé.**
8. **Six portails différents** — `premium-portals-p15.css` distingue les portails actifs progression, talents, métiers, GM, commandement, trésors par des structures visuelles variées (courbes de carte, constellation, plan d'atelier, tableau tactique, grille de navigation, prisme) plutôt qu'une simple recoloration.
9. **Chargement plus intelligent** — le script de lecture seul en tête de `index.html` précharge **uniquement** le WebP du flagship enregistré (Tauren/Druide ou Mort-vivant/Démoniste), et ne précharge rien pour les autres classes ou pendant le wizard. Poids constaté dans GitHub : Shaaby **300 076 octets**, Démoniste **167 034 octets**. **Le LCP mobile réel n'a pas été mesuré** : le gain de temps reste une hypothèse à vérifier sur hébergement stable.
10. **Tests, captures et direction artistique** — `tests/binch-p15-iphone-professions.test.mjs` vérifie UI, assets, 6 portails, préchargement et données non modifiées ; le workflow capture deux pages métiers et le menu complet avec l'éditeur, ainsi que la petite largeur. `docs/BINCH-RENAISSANCE-ART-BIBLE-P15-20261119.md` décrit sept univers uniques à créer ultérieurement.

## Fichiers livrés sur la branche

- `public/binch/premium-iphone-p15.css`
- `public/binch/premium-professions-p15.css` + `profession-*-p15.svg`
- `public/binch/premium-portals-p15.css`
- `public/binch/premium-mobile-sections-p14.js` (placement de la vraie commande d'édition)
- `public/binch/index.html` (liaison des assets et préchargement ciblé)
- `tests/binch-p15-iphone-professions.test.mjs`
- `tests/helpers/binch-p14-screenshot-fixtures.mjs`
- `.github/workflows/verify.yml`
- `docs/BINCH-RENAISSANCE-ART-BIBLE-P15-20261119.md`

## Garde-fous / incertitudes

- Pas de fusion `main`, de dépense API ou de mise en production.
- Pas de modification à la progression, à l'XP, aux talents, au nom ou aux factures/transactions. Les profils employés pour les captures sont **synthétiques et temporaires**.
- Des captures Chrome 320/375/390/430 px permettent la revue des pixels ; elles ne prouvent pas encore l'ergonomie Safari réelle (orientation, dynamic island, gestes et safe areas).
- Les sept autres illustrations de classe sont des **directions artistiques**, pas des artworks déjà rendus.

## Golipette P16 — dix prochains chantiers

1. Inspection manuelle sur iPhone physique : portrait, portrait recadré en paysage, Faith et menu rétractable.
2. Valider l'annulation, l'application et le retour du focus dans « Profil actif » sous Safari.
3. Contrôle contraste AA et tailles tactiles 44 px des modules réellement ouverts.
4. Affiner le positionnement des textes d'objectifs sur une vue longue (niveau 60, nom et zone).
5. Étendre l'illustration des véritables pages de recettes avec la signature du métier choisi sans changer les données.
6. Donner aux six portails des hovers tactiles discrets et accessibilité focus/press.
7. Mesurer temps de chargement et LCP/CLS sur hébergement de bêta stable, puis faire un budget réseau pour iPhone.
8. Créer la troisième scène **Tauren Chaman — Le Cœur de l'Orage**, démontrant la diversité entre deux classes de même race.
9. Préparer Gnome Mage et Mort-vivant Voleur, compositions distinctes des deux flagships actuels.
10. Faire tester au frère (parcours 5 minutes), corriger les retours, puis obtenir accord explicite avant merge.

**Statut GitHub Actions :** consulter la dernière exécution associée au HEAD de la PR #234 ; ne pas appeler « validé » un run encore en cours.
