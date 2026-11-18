# La Binch — Golipette P9 · Identité vivante

18 novembre 2026 · Branche \`feature/binch-visual-renaissance-20261118\` · PR #234 **DRAFT**

## Objectif produit

L’interface ne doit plus appliquer un simple recoloring. La race sculpte l’architecture et les bordures, la classe apporte une scène et une énergie propres, et les deux métiers choisis ajoutent des ornements discrets. L’ambiance et le mode léger restent indépendants. Les données WoW, quêtes, talents, prix et guilde ne sont pas recréés par l’habillage.

## Réalisation dans cette passe

| Chantier | État / preuve dans le dépôt |
|---|---|
| 1. « Profil actif » cliquable | Le badge est désormais un bouton natif dans \`index.html\` et ouvre un dialogue. |
| 2. Reconfiguration sans reset | \`visual-identity-compositor.js\` propose peuple, classe, 0–2 métiers dans le dialogue « Reforger ton identité ». |
| 3. Aperçu avant validation | Décor + scène + architecture et signature sont calculés pour le brouillon local ; l’application réelle n’est pas modifiée avant « Appliquer ». |
| 4. Sauvegarde transactionnelle | \`commit\` conserve \`data\`, \`checks\`, \`map\` et les champs additionnels du même profil ; seule l’identité est changée. Rechargement contrôlé après sauvegarde. |
| 5. Identité raciale réelle | Huit tracés SVG architecturaux distincts, construits à partir de paths statiques originaux : voûtes humaines, forge naine, bosquet elfe, engrenages gnomes, camp orc, nécropole réprouvée, totems taurens, masque troll. Les contours et la géométrie des cartes changent aussi. |
| 6. Identité de classe | Neuf vrais paysages vectoriels existants réutilisés, plus 9 comportements d’aura / lumière distincts sur la scène. Pas de duplication de scène recolorée. |
| 7. Accents métiers | Neuf métiers reconnus, deux signatures maximum, micro-effets spécifiques et rares (feuille, rouage, étincelles, runes), statiques ou inactifs en mode léger / mouvement réduit. |
| 8. Interface cohérente | Rendu intégré au hero initial, à la scène cinématique si disponible, aux cartes d’accueil, au chapitre et aux onglets actifs. |
| 9. Accessibilité/performance de la passe | Illustrations raciales SVG intégrées sans nouvelle requête réseau ; fonds des classes en cache lorsqu’ils sont identiques. Dialogue natif, état aria-pressed, cibles tactiles, mobile 2 colonnes, retour du focus ; animations désactivables. |
| 10. Régression CI | \`tests/binch-visual-identity-compositor.test.mjs\` teste 8/9/9 variations, deux identités contrastées, l’aperçu sans écriture, la persistance de données et les garde-fous. Test raccordé à \`.github/workflows/verify.yml\`. |

### Intégration

- \`public/binch/visual-identity-compositor.js\` : \`RACES\`, \`CLASSES\`, \`JOBS\`, \`compose\`, \`commit\`, dialogue et montage visuel.
- \`public/binch/visual-identity-compositor.css\` : profondeur, architectures, scènes, signatures, animations rares, responsive.
- \`public/binch/index.html\` : bouton « Profil actif » et inclusion du moteur.
- La clé existante \`grimoire.hub.v3\` est la **seule** source du profil. Aucun clone de base ou re-synchronisation distante.
- Aucun achat, aucune transaction, aucune fusion à \`main\`, aucun déploiement GitHub Pages.

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
