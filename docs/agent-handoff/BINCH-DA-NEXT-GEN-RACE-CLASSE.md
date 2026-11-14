# La Binch — Direction artistique next-gen par race × classe

Statut : **roadmap différée**, décidée le 14 novembre 2026 ; **aucune refonte appliquée à la version publique**. Priorité actuelle : fiabilité GrimoireSync, ergonomie et tests terrain, intégration OpenCode puis bêta de guilde. Planifier cette refonte **après** ces prérequis et sans interrompre le chantier Discord également inscrit dans la roadmap.

## Ambition et principe différenciant

La Binch doit ressembler à un véritable **grimoire vivant / cockpit de jeu AAA**, unique à WoW Forever, où chaque combinaison de **race et classe** donne naissance à une direction artistique singulière, reconnaissable d'un coup d'œil, et pas seulement à un changement de couleur. **La race définit la culture et la matière ; la classe définit la magie, les gestes et la structure ; leur combinaison possède un troisième langage visuel propre.** Le rendu doit conserver l'ergonomie, la compatibilité mobile et la lisibilité des données.

Le système actuel contient déjà 8 races d'interface (`Humain`, `Nain`, `Elfe`, `Gnome`, `Orc`, `MortVivant`, `Tauren`, `Troll`) et 9 classes (`Guerrier`, `Paladin`, `Chasseur`, `Voleur`, `Prêtre`, `Chaman`, `Mage`, `Démoniste`, `Druide`) dans `public/binch/index.html`. **Ne pas présumer que les 72 combinaisons mathématiques sont jouables sur Forever**. D'abord établir une matrice de compatibilité issue du client / des sources Forever, avec gestion explicite des combinaisons impossibles, futures ou personnalisées. Ne jamais annoncer d'une combinaison qu'elle est valide sans vérification.

## Les 10 chantiers majeurs de la refonte (après le lot prioritaire)

1. **Benchmark design et charte d'excellence** — analyser les meilleures interfaces de jeu (UI de RPG moderne, codex immersifs, tableaux de bord haut de gamme) et les contraintes réelles des appareils. Fixer un langage propre et ne pas reproduire des assets protégés par défaut.
2. **Atlas race × classe** — établir la matrice réellement jouable sur WoW Forever et une fiche par combinaison : identité narrative, hiérarchie de matières, couleur dominante/secondaire, ambiance, motif, icônes, micro-animation, composition du héros et module signature. Exiger une singularité visible sur chaque combinaison autorisée.
3. **Fondation commune haut de gamme** — design tokens, typographie, grille, reliefs, surfaces, composants, micro-interactions et navigation unifiés. Une même action doit toujours être située et identifiable au même endroit, quelle que soit la race/classe.
4. **Moteur de thèmes combinatoires** — `raceTheme` + `classTheme` + **`pairArtDirection`** en dernière couche (avec overrides artistiques et assets dédiés), sans duplication des pages, avec mise à jour au changement de personnage et gestion de l'import GrimoireSync. Repli neutre si combinaison non reconnue ; aucun crash ou thème incohérent.
5. **Illustrations et assets originaux** — produire des scènes/effets propres par combinaison : arrière-plan narratif, emblème de personnage, texture de cadre, particules discrètes, transitions visuelles, palette des badges et illustrations spécifiques ; centraliser manifeste, versioning, provenance et budget de chargement. Privilégier des ressources autorisées et optimisées.
6. **Page d'accueil et héros** — interface « wow » immédiate : carte de personnage immersive, progression, objectif épinglé, widget de guilde, aperçu d'exploration. Les informations importantes restent lisibles sans animation et sur petit écran.
7. **Modules premium cohérents** — appliquer les thèmes au Poste de commandement, Specs/talents, Atlas, Journal, AH, Métiers, Coffre, Guild Planner, Faith et futur Discord GM Hub. Préserver les contrats et interactions existants ; refonte visuelle sans régression fonctionnelle.
8. **Motion & immersion sobres** — transitions de panels, effet de relief, halos/particules selon classe et race, états de survol, micro-retours ; fournir `prefers-reduced-motion`, choix « effets réduits », respect de l'autonomie et aucune animation bloquante.
9. **Qualité multi-écran et accessibilité** — prioriser iPhone/Android (360–430 px), écran PC 1080p et second écran ; contraste de texte, zones tactiles, navigation clavier et lecteur d'écran, chargement progressif, pas de scroll caché ou superposition, objectif 60 FPS raisonnable sur matériel ciblé.
10. **Contrôle artistique complet et validation** — galerie de tous les couples jouables, captures automatisées en plusieurs formats, contrôle des contrastes, régressions graphiques, assets manquants et performances ; tests terrain, démonstration au frère/GM, publication graduelle via PR séparée, sans fusion autorisée d'avance.

## Six directions artistiques **illustratives** pour montrer l'ambition

Les exemples décrivent une vision artistique, **pas un visuel produit, ni une confirmation de compatibilité Forever** :

| Couple | Ambiance dominante | Signature spécifique (au-delà de la palette) |
| --- | --- | --- |
| **Tauren + Druide** | Bois ancestral, cuir brun, jade des plaines, souffle des esprits | Cadres gravés de racines, constellation de griffes et de feuilles, transitions de métamorphose naturelles |
| **Troll + Chaman** | Totems sculptés, azur des éclairs, turquoise vaudou | Cordes et glyphes rituels, interface rythmée par les éléments, éclairs subtils autour des actions clés |
| **Orc + Guerrier** | Fer forgé, cuir sombre, braises et cicatrices de bataille | Interfaces de métal riveté, entailles stylisées, jauges qui évoquent des armes de siège |
| **Elfe + Druide** | Clair de lune, forêt ancienne, filigranes vivants | Verrières de feuilles, phases lunaires, halo nocturne et organique, différent du Druide Tauren |
| **MortVivant + Démoniste** | Alchimie noire, cuivre terni, braises violettes | Manuscrit interdit, reliquaires, fumées d'encre, sceaux de pacte, profondeur d'ombre maîtrisée |
| **Gnome + Mage** | Atelier arcanotech, verre, cuivre poli, cristal azur | Instruments de précision, cadrans arcaniques, composants lumineux, style savant sans surcharge |

Ces couples sont des **exemples de rendu** ; le système final doit distinguer également un **Orc + Chaman** d'un **Troll + Chaman**, ou un **Elfe + Chasseur** d'un **Elfe + Druide**. Chaque couple valide mérite son propre `pairArtDirection` (palette, typographie d'accent, composition, motif, icône, transition signature et assets), pas une simple combinaison automatique de deux couleurs.

## Contrat technique proposé (non implémenté)

```text
profil (race, classe)              ┐
   ├─ normalisation des alias      │
   ├─ vérification de compatibilité│
   └─ identifiant stable           ┘
        ↓
Base UI / design tokens
        ↓
Race material & culture
        ↓
Class power & gestures
        ↓
Pair art direction: overrides singuliers + assets dédiés
        ↓
CSS variables / attributs de thèmes documentés
        ↓
Accueil • Poste de commandement • Talents • Coffre • GM Hub
```

- Ne jamais utiliser une chaîne de `className` concaténée depuis une donnée utilisateur non validée ; pas de `innerHTML` à partir du profil.
- Exposer des variables CSS versionnées, préfixées (par exemple `--binch-da-*`) et un attribut `data-binch-race-class` issu d'une liste blanche.
- Conserver une identité visuelle **commune et reconnaissable** à La Binch sur les 8 races et 9 classes ; différencier les univers sans déplacer les boutons ni multiplier les interfaces indépendantes.
- L'option « thème neutre / performance » doit pouvoir forcer l'apparence sobre et réduire les effets, sans toucher au profil de jeu.
- Pas de téléversement automatique de données WoW ni synchronisation Discord induits par un changement de thème.
- Prévoir snapshots et tests du changement de personnage, de la race/classe absentes et du retour à l'apparence précédente.

## Critères de finition

1. Chaque paire jouable possède une fiche artistique et au moins une signature qui la distingue de tous les autres couples observables.
2. La page d'accueil doit sembler exceptionnelle sans sacrifier la compréhension en cinq secondes : prochaine action, personnage, progression, guilde.
3. Données anciennes, captures non datées, imports refusés et indisponibilité réseau restent compréhensibles sous chaque thème.
4. Accessibilité : contraste vérifié, gestes tactiles testés et réduction des mouvements respectée.
5. Performance : assets compressés, chargement différé, pas de saut de page, taux de rafraîchissement raisonnable sur mobile et second écran.
6. La validation finale **visuelle et fonctionnelle** se fait avec des essais réels ; les captures de tests automatisés ne suffisent pas.

## Séquence de coordination

**Priorités actuelles** : 1. stabiliser GrimoireSync ; 2. essais dans le vrai jeu ; 3. terrain Windows ; 4. mobile ; 5. réconcilier OpenCode et `main` ; 6. bêta de guilde. **Futur social** : bot Discord fondé sur `BINCH-DISCORD-ROADMAP.md` sans dépendance bloquante sur la refonte visuelle. **Puis** : ouvrir une PR graphique dédiée, exécuter les dix chantiers, et demander une validation artistique globale seulement pour la publication.

Liens : [La Binch publique](https://quentindumont70-bit.github.io/chroniques-cendreval/binch/) · [Travaux de la branche](https://github.com/quentindumont70-bit/chroniques-cendreval/pull/129).
