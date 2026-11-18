# La Binch — Golipette P9 · Identité vivante

18 novembre 2026 · Branche `feature/binch-visual-renaissance-20261118` · PR #234 **DRAFT**

## Objectif produit

L’interface ne doit plus appliquer un simple recoloring. La race sculpte l’architecture et les bordures, la classe apporte une scène et une énergie propres, et les deux métiers choisis ajoutent des ornements discrets. L’ambiance et le mode léger restent indépendants. Les données WoW, quêtes, talents, prix et guilde ne sont pas recréés par l’habillage.

## Réalisation dans cette passe

| Chantier | État / preuve dans le dépôt |
|---|---|
| 1. « Profil actif » cliquable | Le badge est désormais un bouton natif dans `index.html` et ouvre un dialogue. |
| 2. Reconfiguration sans reset | `visual-identity-compositor.js` propose peuple, classe, 0–2 métiers dans le dialogue « Reforger ton identité ». |
| 3. Aperçu avant validation | Décor + scène + architecture et signature sont calculés pour le brouillon local ; l’application réelle n’est pas modifiée avant « Appliquer ». |
| 4. Sauvegarde transactionnelle | `commit` conserve `data`, `checks`, `map` et les champs additionnels du même profil ; seule l’identité est changée. Rechargement contrôlé après sauvegarde. |
| 5. Identité raciale réelle | Huit tracés SVG architecturaux distincts, construits à partir de paths statiques originaux : voûtes humaines, forge naine, bosquet elfe, engrenages gnomes, camp orc, nécropole réprouvée, totems taurens, masque troll. Les contours et la géométrie des cartes changent aussi. |
| 6. Identité de classe | Neuf vrais paysages vectoriels existants réutilisés, plus 9 comportements d’aura / lumière distincts sur la scène. Pas de duplication de scène recolorée. |
| 7. Accents métiers | Neuf métiers reconnus, deux signatures maximum, micro-effets spécifiques et rares (feuille, rouage, étincelles, runes), statiques ou inactifs en mode léger / mouvement réduit. |
| 8. Interface cohérente | Rendu intégré au hero initial, à la scène cinématique si disponible, aux cartes d’accueil, au chapitre et aux onglets actifs. |
| 9. Accessibilité/performance de la passe | Illustrations raciales SVG intégrées sans nouvelle requête réseau ; fonds des classes en cache lorsqu’ils sont identiques. Dialogue natif, état aria-pressed, cibles tactiles, mobile 2 colonnes, retour du focus ; animations désactivables. |
| 10. Régression CI | `tests/binch-visual-identity-compositor.test.mjs` teste 8/9/9 variations, deux identités contrastées, l’aperçu sans écriture, la persistance de données et les garde-fous. Test raccordé à `.github/workflows/verify.yml`. |

### Intégration

- `public/binch/visual-identity-compositor.js` : `RACES`, `CLASSES`, `JOBS`, `compose`, `commit`, dialogue et montage visuel.
- `public/binch/visual-identity-compositor.css` : profondeur, architectures, scènes, signatures, animations rares, responsive.
- `public/binch/index.html` : bouton « Profil actif » et inclusion du moteur.
- La clé existante `grimoire.hub.v3` est la **seule** source du profil. Aucun clone de base ou re-synchronisation distante.
- Aucun achat, aucune transaction, aucune fusion à `main`, aucun déploiement GitHub Pages.

### Ce qui ne doit pas être confondu

La composition P9 améliore la structure et le rendu des assets SVG déjà disponibles. **Elle n’est pas encore la direction artistique finale photoréaliste / peinture matte AAA demandée** : il reste à produire des fonds haute définition, une vraie direction d’illustration et à mesurer les temps de chargement sur un domaine stable. La lenteur du relais raw.githack n’est pas une preuve de lenteur intrinsèque de la nouvelle composition.

La prévisualisation extérieure raw.githack peut afficher un écran d’avertissement et est moins représentative qu’un domaine de bêta dédié. Ne pas y saisir d’informations sensibles.

## Les dix prochains chantiers (P10)

1. Tester depuis l’application réelle sur iPhone la nouvelle commande « Profil actif ».
2. Vérifier la fermeture, l’annulation, le clavier et la conservation des champs du profil.
3. Vérifier l’effet visuel comparé « Tauren · Druide · Herboristerie / Alchimie » / « Mort-vivant · Démoniste · Ingénierie / Enchantement ».
4. Raffiner chaque silhouette architecturale raciale dans une bible graphique ; éviter toute ressemblance trop générique.
5. Produire des décors héroïques **haute qualité**, propres à chacune des neuf classes (asset artistique créé et revu, pas juste SVG plat).
6. Créer des bannières, formes de panneaux, runes et animations *uniques* pour chaque peuple.
7. Étendre la signature métier aux cartes Atelier et au profil sans cacher les données de jeu.
8. Mesurer le chargement à froid du vrai site (réseau, ressources, DOM), puis différer les scripts non essentiels sans casser les modules.
9. Réviser responsive iPhone 320/375/430px et Windows 1080p, mode léger, contrastes et mouvements réduits.
10. Revue fonctionnelle et visuelle de la PR, bêta dédiée et autorisation explicite avant fusion / déploiement.

### Interdits

- Pas de changement du nom, du niveau, des objectifs, du rôle ni des données métiers non visuelles lorsque le profil est reforgé.
- Pas de création automatique de personnage WoW ni de synchronisation fictive.
- Pas de fusion, pas de coût et pas de dépendance réseau supplémentaire pour les couches architecturales.

## Passe P9.1 — premiers panoramas héroïques

Deux scènes vectorielles 1920×1080 originales et plus détaillées remplacent les panoramas plats dans le moteur composite :

- `renaissance-p9-hero-druid.svg` : sanctuaire forestier, clair de lune, arbre ancestral, totem tauren, esprit félin et particules.
- `renaissance-p9-hero-warlock.svg` : nécropole gothique, éclipse, portail runique, brumes et signature occulte.

Elles sont branchées sur les deux surfaces d'accueil (hero initial et carte cinématique) tout en conservant les données et les boutons existants. Le fichier de tests P9 vérifie leur présence et leur raccordement. 28 SVG Renaissance sont désormais contrôlés dans la CI. Il reste à faire valider leur qualité visuelle sur un écran réel et à produire les sept scènes suivantes au même niveau.

## Golipette P10 — neuf mondes visuels reliés au vrai parcours

### Production réalisée sur la branche dédiée

1. **Guerrier** — Bastion des Serments, fortifications, bannières de guerre, épée monumentale : `renaissance-p10-hero-warrior.svg`.
2. **Paladin** — Cathédrale de l’Aube, rosace, vitraux et contreforts : `renaissance-p10-hero-paladin.svg`.
3. **Chasseur** — Poste des Veilleurs, falaises et tour des rangers : `renaissance-p10-hero-hunter.svg`.
4. **Voleur** — Toits de la Nuit, pont suspendu, silhouettes et pluie : `renaissance-p10-hero-rogue.svg`.
5. **Prêtre** — Temple des Sept Lueurs, colonnade ouverte et chandelles : `renaissance-p10-hero-priest.svg`.
6. **Chaman** — Cercle des Éléments, orage, cascade et quatre totems : `renaissance-p10-hero-shaman.svg`.
7. **Mage** — Observatoire des Arcanes, anneaux, orrery flottant et constellations : `renaissance-p10-hero-mage.svg`.
8. **Intégration** — les sept scènes sont branchées au moteur `visual-identity-compositor.js`, rejoignant `renaissance-p9-hero-druid.svg` et `renaissance-p9-hero-warlock.svg`. Le vrai créateur utilise aussi les neuf nouveaux visuels, avec versions CSS/JS actualisées.
9. **Atelier mobile** — `public/binch/renaissance-p10-showcase.html` permet de changer peuple, classe et métiers **sans écrire dans le profil**. Deux préréglages (Tauren Druide Herboristerie/Alchimie ; Mort-vivant Démoniste Ingénierie/Enchantement), mode léger et liens de captures permettent une comparaison immédiate. Un lien vers l’atelier apparaît dans le compagnon.
10. **Tests ciblés** — vérification XML de **35 SVG** et CI de scène, régression, composition. Captures de deux profils en 1440×960 et 430×860, non publiées sur GitHub Pages.

**Limites :** Les SVG sont des créations vectorielles originales plus détaillées que les fonds initiaux ; ce ne sont pas encore des peintures numériques photoréalistes ni de la 3D. La qualité perçue devra être jugée sur les captures et de vrais appareils. La lenteur de raw.githack ne permet pas de conclure à un défaut de performance de l’application.

### Golipette P11 — dix prochains chantiers, ordre de priorité

1. Examiner les captures P10 Tauren Druide et Réprouvé Démoniste sur ordinateur et iPhone.
2. Corriger uniquement les défauts visibles : superposition, lisibilité mobile, contraste et éventuels débordements.
3. Essayer Profil actif sur iPhone : ouvrir, reconfigurer, annuler, appliquer, récupérer le focus.
4. Mesurer le chargement à froid sur un domaine de test stable ; distinguer latence du relais et poids de l’application.
5. Définir la direction matte painting AAA : profondeur, matières, lumière crédible et focale claire.
6. Raffiner en priorité les deux exemples extrêmes Druide/Tauren et Démoniste/Mort-vivant.
7. Approfondir la diversité architecturale des huit races sans simples variations de palette.
8. Affiner les signatures métiers, l’accessibilité et les FX désactivables.
9. Contrôler les neuf classes à 320, 375, 430 px et 1080p, puis les six portails.
10. Préparer la bêta limitée pour ton frère après revue et approbation ; ne pas fusionner par anticipation.

**Gouvernance :** branche `feature/binch-visual-renaissance-20261118`, PR #234 en brouillon, aucun merge, aucun changement de données WoW ou AH, aucune dépense.

### Revue réelle des captures P10 — correction ciblée

Les captures headless générées par la CI pour Tauren/Druide et Mort-vivant/Démoniste, sur 1440×960 et 430×860, ont été examinées. Un défaut vérifiable est apparu : le tracé architectural racial recouvrait excessivement le paysage de classe, comme un dessin filaire géant. Le moteur a été corrigé sur les surfaces suivantes :

- **Atelier P10** : architecture réduite à une gravure discrète positionnée en second plan, plus légère sur iPhone.
- **Vraie application** : même hiérarchie, scènes de classe dominantes ; ornements raciaux limités en taille et en opacité.
- **Dialogue Reforger mon identité** : prévisualisation corrigée pour ne pas masquer la scène principale.
- **Préchargement** : l’atelier ne charge en priorité que le panorama de la classe sélectionnée dans l’URL (liste blanche) ; pas les neuf images d’un seul coup.

Ces changements sont sur la PR en brouillon. Les captures de la dernière révision et l’essai tactile réel restent les critères de validation ; une capture headless verte ne prouve pas à elle seule le confort d’usage.
