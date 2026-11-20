# La Binch Renaissance — P16 : Tauren Chaman, Le Cœur de l'Orage

**Date :** 20 novembre 2026  
**Développement isolé :** `feature/binch-visual-renaissance-20261118`, PR #234 **DRAFT**  
**Règle :** aucune fusion de `main`, aucune dépense, aucun changement de données WoW, aucune duplication de stockage.

## Objectif artistique : sortir du recoloring

Une même race doit raconter des récits entièrement différents selon la classe.

- **Shaaby — Tauren Druide :** contemplation de Mulgore, pipe de feuillerêve, lierre, bois vivant, herbes, verts naturels.
- **Tauren Chaman — Le Cœur de l'Orage :** rituel de foudre sur une falaise, totems monumentaux, ciel turbulent, cascade et campement au loin. Matières **pierre / cuivre / bois gravé**, énergie cyan, feu orangé et profondeur tempétueuse.
- **Mort-vivant Démoniste :** laboratoire occulte, nécropole, métal d'engrenages, runes interdites et violet sombre.

Ce ne sont pas trois filtres de couleur. Les sujets, la géographie, la focale, les matériaux et l'architecture des panneaux sont distincts.

## Production réelle P16

1. **Art original** : `public/binch/tauren-shaman-storm-p16.webp`, 1672 × 941, **271 068 octets** à qualité WebP 85 ; sujet tauren à droite, zone calme à gauche pour l'interface.
2. **Parure différente** : `tauren-shaman-storm-totem-p16.svg` — cornes, gravures, plumes, cuivre et éclairs. Gravure originale locale. Ce n'est pas le lierre de Shaaby.
3. **Sélecteur exact** : `visual-identity-compositor.js` active `data-binch-storm=true` uniquement si le **profil enregistré** contient `onboarded:true, race:Tauren, classe:Chaman`. Les autres classes gardent leurs scènes propres.
4. **Accueil visible, pas une maquette cachée** : `tauren-shaman-storm-p16.css` cible le véritable `#binch-adventure-home .binch-character-card` ; hero 16:9 mat-painting, éclairage local, totem en couche secondaire et métriques de personnage toujours réelles.
5. **Données et métiers conservés** : nom, niveau et XP restent alimentés par les scripts originaux ; les deux pictogrammes de métier restent `--br-job-glyph` et `--br-second-glyph`. Aucune récompense ni recette inventée.
6. **Modules dédiés** : panneaux d'objectifs, cartes de route, badges, onglets, boutons, métiers, GM et talents reçoivent des matières et bordures de Chaman, sans remplacer leurs handlers.
7. **Reforge transactionnelle** : nouveau `data-binch-storm-preview` sur le brouillon et cadre `data-binch-preview=storm`, avant toute sauvegarde. « Annuler » reste sans écriture et « Appliquer » utilise la clé existante `grimoire.hub.v3`.
8. **Créateur / onboarding** : la combinaison Tauren + Chaman affiche son artwork et une carte de classe illustrée ; aucun autre choix n'est transformé arbitrairement en Chaman.
9. **Mobile et confort** : cadrages 760 / 390 px, texte pleine largeur, contraste local, micro-éclairage ponctuel de 25 s désactivé par `prefers-reduced-motion` et mode léger.
10. **Revue directe** : `premium-sanctuaries-review.html?identity=storm` présente désormais une galerie **trois œuvres**. Une seule entrée premium dans l'accueil pointe vers l'identité réellement enregistrée. Une nouvelle suite `tests/binch-p16-storm-flagship.test.mjs` vérifie la non-régression et la CI programme cinq captures supplémentaires (bureau, iPhone, petit iPhone, reforge, galerie).

## Risques et limites

- L'illustration et la capture navigateur représentent la direction artistique ; elles ne prouvent pas encore le confort sur un Safari physique ni un score de performance réel.
- Les détails d'une peinture représentent un exemple de Chaman, pas des objets ou quêtes importés du jeu.
- Les captures GitHub Actions utilisent uniquement des **profils synthétiques éphémères**. Aucune identité réelle n'est téléchargée dans les tests.
- Ne pas annoncer « tests validés » sans vérifier la conclusion de la dernière exécution liée au HEAD de la PR.
- La galerie premium est une prévisualisation sans compte. Elle ne modifie pas `grimoire.hub.v3`.

## Golipette P17 : les dix prochains chantiers

1. Revoir **les cinq captures P16** : vrai Chaman 1440 px, 430 px, 320 px, reforge, galerie ; ne corriger que les défauts observables.
2. Mesurer le placement du visage, des totems et du texte sous Safari iPhone en portrait et paysage, en particulier 320/375/390/430 px.
3. Vérifier réellement « Profil actif » : sauvegarder une reforge, annuler, fermer par Échap ou hors du dialogue, restaurer le focus.
4. Contrôler la combinaison Tauren Chaman avec deux métiers différents, et la tenue des pictogrammes dans les panneaux.
5. Vérifier le chargement à froid sur un hébergement bêta stable : LCP, CLS, taille WebP et polices, sans confondre lenteur GitHack avec défaut du site.
6. Raffiner les vraies interactions des **six portails** (tactile, focus, état actif) sans perturber la navigation.
7. Décliner les détails de l'orage dans les **véritables recettes et quêtes pertinentes**, sans inventer de données de gameplay.
8. Créer un quatrième vrai flagship **Gnome Mage — Bibliothèque des Équations**, perspective et matériaux distincts.
9. Préparer le cinquième flagship **Mort-vivant Voleur — Toits du Silence**, sans réutiliser la nécropole du Démoniste.
10. Recette bêta de 5 minutes avec le frère testeur, puis accord explicite seulement avant toute fusion.

**Critère de succès permanent :** chaque combinaison premium doit impressionner par une scène originale, une structure de panneaux identifiable, de vraies fonctions, une ergonomie mobile irréprochable et des performances mesurées.
