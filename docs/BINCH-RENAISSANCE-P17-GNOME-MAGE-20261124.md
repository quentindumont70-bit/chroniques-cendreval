# La Binch Renaissance — Golipette P17, Gnome Mage

**Date :** 24 novembre 2026 · **Branche isolée :** `feature/binch-visual-renaissance-20261118` · **PR #234 : DRAFT**  
**Aucun merge dans `main`, aucun coût API, aucune modification des données WoW.**

## Cap artistique

P17 ajoute le quatrième sanctuaire premium : **Gnome Mage — La Bibliothèque des Équations**. C'est une scène cinématique originale de bibliothèque-observatoire suspendue au-dessus d'un canyon, avec astrolabes de laiton, grimoire ouvert, ouvrages flottants et magie céleste turquoise. Une zone sombre à gauche garde les noms et actions lisibles ; un mage gnome compose le point focal à droite.

Ce n'est pas une variante colorimétrique de Shaaby (Tauren Druide), de la nécropole du Démoniste Mort-vivant, ni du Chaman Tauren. L'architecture des cadres évoque des instruments de mesure, les angles de la structure sont des arches de cuivre asymétriques et les cartes de progression empruntent aux catalogues et aux plaques gravées.

## Dix chantiers P17 — état

1. **Art premium original : réalisé.** `public/binch/gnome-mage-library-p17.webp`, 1672 × 941, **275 778 octets**, illustration distincte optimisée WebP, non inline.
2. **Gravure de race/classe : réalisée.** `gnome-mage-astrolabe-p17.svg` : véritable dessin original de sphère armillaire, compas, orbites, engrenages et glyphes, sans ressources externes.
3. **Identité combinatoire : réalisée.** `visual-identity-compositor.js` applique `data-binch-mage-library=true` **uniquement si** `onboarded=true`, `race=Gnome`, `classe=Mage` dans le profil enregistré. Les autres personnages conservent leurs univers.
4. **Vrai accueil : réalisé.** `gnome-mage-library-p17.css` intervient dans l'interface active `#binch-adventure-home`, et non dans une maquette cachée. Illustration, façade gravée, lumière et portrait restent indépendants du nom, du niveau, de l'XP et de la progression réelle.
5. **Modules fonctionnels : réalisé pour le traitement visuel.** Panneaux d'objectifs, routes, navigation, GM, métiers et talents conservent leurs actions ; bordures, métal et motifs deviennent ceux de l'identité Mage.
6. **Deux métiers en couches : réalisé.** `--br-job-glyph` et `--br-second-glyph` utilisent exclusivement les métiers sélectionnés, pas des recettes/objets fictifs.
7. **Reforge et créateur : réalisés.** Aperçu non enregistré `data-binch-mage-library-preview=true`, matériaux du dialogue `data-binch-preview=mage-library`, carte du créateur illustrée uniquement quand Gnome + Mage sont sélectionnés. L'annulation ne modifie pas le profil.
8. **Chargement et iPhone : réalisés pour les styles, mesures terrain restant à faire.** Préchargement d'un seul artwork selon le profil, tailles 760 / 390 px, maintien des valeurs de personnage, focus et absence d'animation en mode léger ou reduced motion.
9. **Galerie sans compte : réalisée.** `premium-sanctuaries-review.html?identity=mage` est le quatrième monde de la comparaison, navigation accessible et aucune lecture/écriture de profil dans la galerie.
10. **Régression et captures : intégrés au workflow.** `tests/binch-p17-gnome-mage-flagship.test.mjs` et six captures CI (desktop, iPhone 430px, iPhone 320px, reforge, galerie, métiers). **Le succès dépend du dernier statut GitHub Actions** ; ne pas annoncer validé avant conclusion verte.

## P17 — fichiers modifiés

- `public/binch/gnome-mage-library-p17.webp` (art original)
- `public/binch/gnome-mage-astrolabe-p17.svg` (ornement original)
- `public/binch/gnome-mage-library-p17.css` (vrai compagnon et reforge)
- `public/binch/visual-identity-compositor.js` (activation exacte et vignette galerie)
- `public/binch/index.html` (CSS versionnée, preload ciblé)
- `public/binch/premium-sanctuaries-review.html` (4 sanctuaires)
- `tests/helpers/binch-p14-screenshot-fixtures.mjs` (profil Gnome Mage synthétique temporaire)
- `tests/binch-p17-gnome-mage-flagship.test.mjs`
- `tests/binch-{shaaby-live,forsaken-premium-live,p16-storm-flagship}.test.mjs` (assertions multi-sanctuaires à jour)
- `.github/workflows/verify.yml` (captures de la vraie interface)

## Limites explicites

- Les screenshots Chromium 320/430px contrôlent la composition ; la vérification sur Safari iPhone physique et la mesure LCP/CLS sur hébergement de bêta ne sont pas encore effectuées.
- Le contenu visuel de l'artwork est **narratif**, et ne doit pas être présenté comme une quête, un équipement, un niveau ou des récompenses extraits de WoW.
- La prévisualisation GitHack n'est pas destinée à stocker les identifiants ni les données personnelles du jeu ; les captures CI emploient des profils fictifs sur des fichiers temporaires.
- Aucun changement de la sauvegarde `grimoire.hub.v3` en dehors des actions déjà existantes du produit.

## Golipette P18 — 10 prochains chantiers

1. Examen visuel des six screenshots P17 : vrai profil, texte, visage, métiers et reforge sans recouvrement.
2. Vérifier sur un vrai Safari iPhone en portrait/paysage, 320 à 430 px et avec tailles de texte système agrandies.
3. Tester « Profil actif » : annulation, application, clavier, Échap, focus et retour à la même vue.
4. Mesurer le LCP, le CLS et les requêtes réseau sur hébergement stable ; ne pas sur-précharger les classes non utilisées.
5. Affiner l'intégration du Mage dans les talents, quêtes et professions du vrai compagnon sans inventer de données.
6. Rendre les six portails plus vivants avec un feedback tactile discret, focus AA et signatures d'identité.
7. Ajouter des matériaux métiers supplémentaires sans augmenter sensiblement le nombre de téléchargements.
8. Créer le cinquième vrai flagship : **Mort-vivant Voleur — Les Toits du Silence**, une scène de fuite nocturne distincte de la nécropole du Démoniste.
9. Planifier ensuite Orc Guerrier, Humain Paladin, Troll Chasseur et Elfe Prêtre selon des compositions séparées, pas des recolorings.
10. Faire le parcours de test de cinq minutes avec le frère, revoir les critiques et demander validation humaine avant une éventuelle fusion.

**Règle durable :** aucune publication ni fusion sans revue ; priorité à l'art de qualité et aux fonctionnalités véritablement actives, pas à la multiplication de démonstrations.
