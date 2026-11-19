# La Binch Renaissance — Golipette P13 : double flagship artistique

19 novembre 2026 · Branche `feature/binch-visual-renaissance-20261118` · PR #234 **DRAFT**

## Objectif

Mettre en application le principe « ni template ni recoloring » sur un deuxième personnage, sans altérer la base du compagnon ou fusionner le travail vers `main`.

## Réalisé dans la passe

1. **Création de l’artwork Mort-vivant Démoniste**, illustration originale de nécromancien dans un atelier de nécropole, avec runes vertes, métaux anciens, engrenages, verrerie et lueurs violettes, composition gauche disponible pour les textes.
2. **Optimisation et dépôt** : `public/binch/forsaken-warlock-premium.webp` est une ressource WebP originale 167 034 octets (1672×941) ; ce n’est ni un filtre de couleur ni une copie de Shaaby.
3. **Sceau de métal et runes** : `public/binch/forsaken-occult-gear.svg` est un ornement spécifique avec engrenage, crâne, cuivre et glyphes, séparé du lierre druidique.
4. **Accueil réel** : `forsaken-warlock-premium-live.css` adapte la vraie carte personnage et son art de fond, pas une maquette substitutive.
5. **Identité hors du hero** : formes anguleuses, matière sombre, contours métal/cuivre, panneaux, navigation et vrais portails héritent de cette identité et restent fonctionnels.
6. **Reforge transactionnelle** : `visual-identity-compositor.js` active le drapeau uniquement pour le profil **enregistré** `onboarded:true`, `race:MortVivant`, `classe:Démoniste`, et une prévisualisation distincte pour les brouillons. La prévisualisation n’enregistre rien.
7. **Métiers réels** : la classe conserve ses propres mécaniques, et les ornements affichent les deux métiers réellement choisis ; aucune modification des jeux de données, talents ou progression.
8. **Responsive et sobriété** : recadrage à 760/390 px, mode léger, respect de `prefers-reduced-motion`, sans dépendance externe.
9. **Galerie comparative** : `premium-sanctuaries-review.html` présente Shaaby et le Nécromancien, avec deux scènes originales, bascule visuelle instantanée, aucun stockage, boutons d’accès à l’œuvre et au vrai compagnon.
10. **Tests & CI** : `tests/binch-forsaken-premium-live.test.mjs` valide l’originalité des fichiers, les gardes d’identité, les ornements choisis, le mode léger et la non-modification des données. Captures automatiques P13 en formats 1440×960 et 430×860 ajoutées aux artifacts GitHub (non déployés sur Pages).

## Ce qui n’est pas prouvé

La CI vérifie du code, les données et des captures de prévisualisation, mais ne remplace pas une validation visuelle réelle sur le téléphone et le PC de l’utilisateur. Le temps de chargement sur raw.githack ne représente pas la performance d’un site de bêta dédié. Les tests automatiques ne prouvent pas que chaque pixel de l’interface a la finition artistique finale.

L’ambiance Mort-vivant Démoniste peut être appliquée avec d’autres métiers : ce sont les ornements UI qui sont liés aux choix réels, l’illustration principale représente une combinaison phare Ingénierie/Enchantement.

## Golipette P14 — 10 prochains chantiers

1. Examiner les quatre captures P13 (Shaaby et Nécromancien, desktop/iPhone) après la CI.
2. Ajuster les recadrages pour que visage, accessoires et textes ne se recouvrent pas sur 320/375/390/430 px.
3. Vérifier en vrai le passage de « Profil actif » entre Druide/Tauren et Démoniste/Mort-vivant, sans perdre le nom, niveau ni les données de progression.
4. Raffiner la surcouche de lierre Shaaby en matière mieux sculptée, sans couvrir les boutons.
5. Affiner l’ornement métal/runes Forsaken et la cohérence des portails existants.
6. Ajouter des détails illustrés aux vrais métiers (Herboristerie/Alchimie, Ingénierie/Enchantement) sans changer leurs données.
7. Contrôler les cinq portails de navigation principale et le sixième parcours recensé, ainsi que les onglets talents, métiers, GM, synchro.
8. Mesurer LCP, CLS, transfert des images et impact de l’animation sur un hébergement de bêta stable.
9. Définir une bible d’art haut de gamme pour les autres 7 classes et 6 races sans rendre les décors interchangeables.
10. Préparer la recette GM avec le frère testeur ; ne fusionner qu’après accord explicite et vérification des fonctions.

**Garde-fous :** aucun achat, aucune fusion, aucune modification de `main`, aucune donnée WoW ou AH inventée, aucune duplication de la base `grimoire.hub.v3`.
