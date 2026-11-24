# La Binch — Bible d’art Renaissance, sept nouvelles classes

Version de direction artistique P15 · 19 novembre 2026 · Prêt pour des itérations contrôlées, **pas** une promesse d’artworks finalisés.

## Architecture de l'identité

Le résultat final assemble des **layers qui ajoutent un sens, pas un recoloring** :

1. **Race** — architecture, matériaux, culture visuelle, motif de bordure, composition des bannières. Toujours ancrée dans un lieu et un usage crédibles.
2. **Classe** — sujet focal, direction des particules, lumière dominante et récit visuel. Change la composition même si la race ne change pas.
3. **Métiers (0, 1 ou 2)** — petites signatures contextualisées sur les panneaux réels : feuilles/fioles/engrenages/runes; effet très rare facultatif, jamais une animation permanente.
4. **Progression réelle** — niveau, nom, quêtes/XP importés restent du texte dynamique et contrôlable ; le graphisme ne suggère jamais de faux succès.
5. **Support** — cadrage PC 1440×960 et iPhone 320/375/390/430 ; **l'illustration ne doit jamais rivaliser avec le texte ni les boutons**.
6. **Confort** — mode léger sans effets et `prefers-reduced-motion`. Contraste cible WCAG AA, texte devant un voile sombre local.

Les **deux références déjà intégrées** restent Shaaby Tauren Druide (bois, totems, lierre, Mulgore et pipe de feuillerêve) et le Mort-vivant Démoniste (nécropole, machine d’âme, métal découpé et glyphes interdits). Elles ne doivent pas servir de gabarit à recolorer.

## Sept scènes à produire, composition entièrement distincte

| Classe phare | Direction photographique / narrative | Layer de race et artisanat | Interaction légère unique |
| --- | --- | --- | --- |
| **Guerrier Orc** | **Le Serment de la Falaise** : silhouette en armure ébréchée devant une forge de guerre à flanc de canyon, poussière rouge, lames plantées et soleil couchant poussiéreux. Composition angulaire et basse. | Fers martelés, coutures de cuir, bois brut orc, rivets asymétriques, traces de dents sur les enseignes. | Braise solitaire traversant l’arrière-plan de temps à autre; aucun feu sur le texte. |
| **Paladin Humain** | **La Veille du Premier Serment** : cour d’abbaye monumentale, vitraux et rayons rasants à travers une voûte, personnage agenouillé qui répare une bannière plutôt que la pose de héros générique. Composition verticale et aérienne. | Marbre usé, reliquaire d’or, pavés en étoile, bannières cousues, reliefs rayonnants. | Reflet discret du vitrail sur un seul bord de panneau. |
| **Chasseur Troll** | **La Canopée du Dernier Pisteur** : jungle nocturne détrempée, fougères mouillées, carquois de chasse et yeux du familier dans les ombres. Focale longue, profondeur de forêt. | Os sculptés, cordages de végétaux tressés, bambou noir et scarifications rituelles stylisées. | Une goutte rare sur la corniche du cadre, jamais une pluie continue. |
| **Voleur Mort-vivant** | **Les Toits du Silence** : cheminées de pierre mouillées, passerelles abruptes, brume de ruelle, silhouette à contre-jour avec sac de lettres volées. Pas de reprise de la nécropole du Démoniste. | Ardoise, étain, vieilles affiches arrachées, clous oxydés et traces de griffes. | Reflet d’une lanterne dans un seul bouton au survol. |
| **Prêtre Elfe** | **La Source d’Elune** : amphithéâtre blanc en ruines devant un lac lunaire, filaments de brume douce, végétation argentée et bassins de lumière. Composition contemplative, symétrie imparfaite. | Argent vieilli, porcelaine craquelée, drapés, gravures de constellations non géométriques. | Aura diffuse ponctuelle au passage du curseur, sans pulsation permanente. |
| **Chaman Tauren** | **Le Cœur de l’Orage** : totems ancrés sur un plateau immense, ciel électrique et herbes couchées sous le vent, chaman adossé aux pierres, couleurs minérales plutôt que paysage forestier Druide. | Cuir tendu, pierre gravée, tambours de cuivre, foudre prise dans des ligatures de bois. | Éclair de fond très rare, désactivé en mode léger. |
| **Mage Gnome** | **La Bibliothèque des Équations** : atelier d’astrolabe suspendu au-dessus d’un canyon, plaques de cuivre gravées, livres qui défient la pesanteur, halo d’un cadran complexe. Perspective vertigineuse en spirale, pas la teinte bleue habituelle. | Laiton poli, cadrans mathématiques, verres astraux, papiers d’encre et mécaniques miniatures. | Une aiguille d’astrolabe qui pivote au survol, pas de mouvement idle. |

## Contrat de qualité pour chaque nouvelle œuvre

- Illustration **unique**, 16:9, un élément narratif identifiable en 2 secondes, qualité cinématique et vraie profondeur de champ. Pas de silhouettes de cartes ou d’effets uniquement CSS présentés comme « artwork premium ».
- Variante mobile pensée **dans la composition** : sujet à droite/au centre droit, zone calme et sombre pour le nom, pas de simple crop aléatoire.
- Encadrement race issu d’un dessin séparé (SVG/PNG transparent très léger), ornement de classe issu d’un troisième asset, micro-signatures métiers indépendantes.
- WebP optimisé : **cible** ≤350 Ko pour le hero initial de 1600px ; refus si l’optimisation détruit le détail des yeux, du visage ou des objets narratifs. Vérifier le poids réel.
- Pas de surcharge : une seule illustration hero chargée, décor de métier chargé uniquement dans son panneau, aucun chargement des autres sept flagships sur une même page.
- Aucune fusion vers `main` sans recette PC/iPhone et accord explicite.

## Priorisation

1. Valider sur un téléphone réel l’ergonomie P15 avant de multiplier les illustrations.
2. Proposer ensuite Chaman Tauren pour démontrer **qu’une même race + deux classes peut créer deux mondes totalement différents**.
3. Enchaîner Mage Gnome (nouvelle architecture de race), Voleur Mort-vivant (contraste avec Démoniste), puis Guerrier/Paladin/Chasseur/Prêtre.

Les scènes sont des **briefs créatifs**, pas des fichiers créés à cette date. Le périmètre P15 réellement implémenté comprend les quatre gravures métiers, les six portails, le header iPhone et le préchargement ciblé.
