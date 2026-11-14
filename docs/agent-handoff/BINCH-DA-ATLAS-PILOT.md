# La Binch — Atlas artistique pilote (v0.2)

**État : six concepts visuels implémentés, aucun couple considéré comme officiellement jouable sans vérification sur WoW Forever.** Ce document est un atlas de direction artistique, non une matrice de compatibilité du jeu.

## Les six signatures

| Concept de travail | Matériau | Grammaire géométrique | Mouvement / motif | Emblème original | Identité |
| --- | --- | --- | --- | --- | --- |
| Tauren × Druide | Bois, cuir, jade | courbes organiques et racines | stries obliques naturelles | feuille et nervure | Cœur du Vivant |
| Troll × Chaman | Totems, fibres, turquoise | axes rituels asymétriques | lignes élémentaires verticales | éclair découpé | Totem des Trois Orages |
| Orc × Guerrier | Fer noir, rivets, braises | angles coupés, impacts | diagonal d'armurerie | lames croisées | Marque du Siège |
| Elfe × Druide | Argent, verre, feuillage nocturne | cercles lunaires et verrières | ondes concentriques | croissant | Croissant des Sentinelles |
| Mort-vivant × Démoniste | Encre, cuivre terni, violet | reliquaires et cadres carrés | strates de sceaux | reliquaire polygonal | Sceau du Pacte Voilé |
| Gnome × Mage | Cuivre, cristal, verre | instruments de précision | graduations d'atelier | boussole/cristal | Compas du Nexus |

## Contrats techniques

Le prototype isolé `public/binch/da-lab.html` expose un identifiant sûr via `data-pair`, liste blanche dans l'objet `concepts`, et une interface identique pour les six thèmes. Chaque thème change le motif, la forme, les matériaux, l'emblème, la signature narrative et le contenu de progression fictif. **Aucune donnée de vrai personnage, compte WoW ou serveur** n'est lue. Les boutons de jeu de la maquette sont volontairement inertes et annoncent clairement le mode aperçu.

Avant intégration à la vraie Binch, construire **une matrice de compatibilité Forever avec preuves** (client, sources vérifiables et éventuelles règles custom), en séparant trois états : `verified-playable`, `verified-unavailable` et `unverified`. Ne jamais déduire la jouabilité des 72 paires mathématiques ni du simple fait qu'une maquette existe.

## Plan des dix prochains chantiers

1. Obtenir les preuves de compatibilité des races et classes sur Forever, garder `unverified` tant que nécessaire.
2. Mesurer contrastes et zones tactiles des six concepts sur 390 px et 1440 px.
3. Extraire tokens communs et schémas de paire vers un manifeste versionné.
4. Créer le moteur de sélection d'identité `race + classe + pairArtDirection` avec repli neutre.
5. Produire des emblèmes, textures et décors originaux sans reprendre d'assets sous droits.
6. Adapter l'accueil vivant en préservant la synchronisation en haut de page.
7. Harmoniser le Poste de commandement, les talents, les métiers et le guild hub.
8. Ajouter mouvements sobres et choix « effets réduits » persistant, sans impact sur le jeu.
9. Exécuter la validation navigateur et les essais sur téléphones physiques.
10. Préparer la démonstration au frère/GM, puis intégrer par PR distincte uniquement après validation.

## État du chantier

Le premier contrôle statique CI de la branche graphique et les six concepts passent. Cette branche est **séparée** du développement fonctionnel (#129) et ne doit ni le bloquer ni modifier `main` sans revue.

PR artistique : https://github.com/quentindumont70-bit/chroniques-cendreval/pull/154
