# La Binch Ultimate — feuille de route produit

État au 14 novembre 2026. Ce document distingue **code présent dans le dépôt**, **validation en navigateur**, et **fonctionnalité complètement opérationnelle**. Il ne présume jamais que WoW Forever fournit une API en temps réel, ni qu'un écran conçu signifie backend disponible.

## Vision
Un compagnon Warcraft sur second écran, PC ou téléphone, qui répond sans détour : **« Que faire maintenant, où aller, pourquoi et avec quelles ressources ? »** Les données viennent du profil manuel, du SavedVariables GrimoireSync importé volontairement, et de guides/sources attribués. Un statut non connu reste *non connu*.

## Dix chantiers majeurs et critères d'acceptation

| # | Chantier | État | Critère de fin |
|---|---|---|---|
| 1 | Interface immersive, thèmes par classe et race | **Nouveau code** : ornements, textures et cadres distincts pour les 9 classes, sans image panoramique nouvelle ni test visuel mobile | 9 classes et toutes races ciblées avec paysages authentiques, cohérence visuelle, contrastes et mobile testés |
| 2 | Poste de commandement unifié | **Nouvelle intégration codée** : moteur `journey-engine.js`, panneau `ultimate-briefing.js` | Prochaine action calculée depuis un profil réellement sélectionné, lien effectif vers module, état source/fraîcheur explicite |
| 3 | Atlas Azeroth : cartes et trajets | Partiel : cartes de quête du sac et atlas existant | Cartes authentiques, coordonnées confirmées, 20 quêtes incontournables jouables et points reliés à leurs pages |
| 4 | Talents de toutes classes / builds sourcés | Partiel : 9 arbres, parcours druide farouche de pex, builds finaux druide | Chaque classe a des arbres vérifiés ; chaque recommandation a un build documenté, une date de build jeu et le bon niveau, aucun rang inventé |
| 5 | Journal intelligent / incontournable | Partiel : catalogue des quêtes par race/classe, rappels et suivi manuel | Alertes liées au niveau, complétude manuelle fiable, lien zone/source, absence de doublons et confirmation explicite du statut synchronisé |
| 6 | Métiers, équipement, consommables | Partiel : modules métier existants, conseil TDC/Dépeçage nouveau | Recettes, coûts connus, inventaire réellement importé, sacs de composants et chemins de progression avec provenance |
| 7 | Faith, conseiller contextualisé | **Nouvelle intégration codée** : Faith interroge le moteur d'aventure | Comprend profil, niveau, objectifs, import et sources ; précise données manquantes ; n'invente pas position, prix ou complétion |
| 8 | GrimoireSync et compagnon Windows | Partiel : addon/import/Windows existants | Import sans erreur, identité personnage, barre en jeu et bouton minimap validés sur un vrai client et Windows ; conformité règles du serveur |
| 9 | Bourse & économies des professions | Partiel : carnet, FIFO, radar local, relevés communautaires optionnels | Marché/royaume/faction identifiés, horodatage, rentabilité à coût connu, calculs testés, pas de fausse donnée temps réel |
| 10 | GM Hub collectif et partage sécurisé | Partiel : roster/planner locaux | Permissions et stockage partagé explicitement configurés, comptes/consentement, calendrier, tests multi-personnes et sauvegarde |

**Modules livrés en code pendant cette passe** :
- `public/binch/journey-engine.js` : règles communes et explicites de recommandations pour quêtes, talents, métiers, objectifs manuels, missions de guilde locales et synchro, avec bonus de priorité uniquement pour une zone de quête explicitement documentée.
- `public/binch/ultimate-identities.js` + CSS : neuf habillages de classe distincts (ornement, gravure, bordure, texture, ambiance) superposés aux fonds existants. Ce n'est **pas encore** la livraison des neuf panoramas d'images réels demandés : chantier visuel toujours ouvert.
- `public/binch/ultimate-briefing.js` + CSS : section de page d'accueil, mode Équilibré / Solo / Donjons / Métiers, actions proposées et export JSON.
- `public/binch/ultimate-session.js` + CSS : sessions de 30, 60 ou 120 minutes, checklist indépendante des quêtes WoW et programme copiable.
- `public/binch/ultimate-quicknav.js` + CSS : recherche des rubriques réellement disponibles, raccourci Ctrl/⌘+K et favoris locaux.
- `public/binch/faith-dialogue.js` : Faith réutilise le moteur commun pour les demandes « Que faire maintenant ? ».
- `tests/binch-ultimate-journey.test.mjs` : non-régression des recommandations, priorité, objectifs et absence de données de commerce imaginaires ; ajouté au workflow GitHub Pages.

## Cadence Golipette
Une phase = de vrais blocs fonctionnels, pas dix sous-parties vendues comme dix chantiers. À chaque livraison : commits, contrôles syntaxiques, tests ciblés, suivi GitHub Actions, documentation et test d'usage. Ne jamais appeler « final » une maquette, un prototype ou une fonctionnalité sans connexion réelle.

## Limitations restantes
L'UI seule ne remplace pas la synchronisation en jeu. Les données de guides, positions et prix peuvent devenir obsolètes après des mises à jour du serveur. La Bourse est un conseil et un registre manuel, pas un système d'achat/vente. Le backend partagé du GM Hub, l'agent Windows et les tests en client WoW restent des chantiers à part entière.

## Point de reprise
1. Vérifier que GitHub Pages déploie la dernière révision sans échec et tester `La Binch > Accueil` sur ordinateur et téléphone.
2. Vérifier la recherche rapide, la sélection du mode de jeu, les liens du plan, la checklist de session et la fraîcheur GrimoireSync.
3. Ajuster priorités et sources selon retour réel, puis avancer chantier 1 (identité visuelle) et chantier 3 (atlas), sans casser les outils existants.

## Passe Golipette du 18 novembre 2026 — continuité personnage (PR #226, brouillon)

**Statut : code soumis à revue, pas une fonctionnalité déployée.** Les sauvegardes locales proposent désormais de conserver aussi la priorité Faith (texte brut contrôlé), le build sélectionné et le suivi manuel des talents par personnage, ainsi que les préférences Trading. Les données brutes GrimoireSync et les caches de flux tiers ne sont pas exportés. Aucun mécanisme de synchronisation cloud n'est revendiqué.

- **Faith Druide** : les rôles Farouche pex et Ours tank ne sont plus assimilés l'un à l'autre ; l'orientation de pex ouvre la route de talents existante sans prétendre lire les points vraiment attribués.
- **Talents** : des points *proposés par le guide* restent distincts des points *déclarés placés manuellement*. Confirmation et réinitialisation locales, attachées à l'identité du Druide ; progression comprise dans le fichier d'export.
- **Données** : les compteurs de ressources invalides sont ignorés et un import d'un autre royaume connu n'est pas appliqué à Faith.
- **Qualité** : tests dédiés tests/binch-character-continuity.test.mjs reliés à .github/workflows/verify.yml. L'état final de la CI doit être constaté avant toute promotion.

### Les dix chantiers suivants

1. Confirmer CI et revue de la PR #226, puis vérifier le déploiement **après intégration autorisée**.
2. Réconcilier les PR économiques #202, #204, #207, #212, #215, #220, #221 et #222 : test vert ne signifie pas absence de conflit Git.
3. Tester la sauvegarde et la restauration sur deux appareils réels, sans export implicite ni fuite de SavedVariables.
4. Vérifier que la progression de talents manuelle reste isolée entre plusieurs personnages.
5. Valider deux imports GrimoireSync réels au comptoir AH, sans données fabriquées.
6. Spécifier la banque séparément des sacs, puis ne la synchroniser que si l'addon fournit un relevé attesté.
7. Compléter les recettes de métiers Forever avec références vérifiables et coûts non présumés.
8. Améliorer la sélection des quêtes et zones pour Druide Farouche via des sources vérifiées, sans coordonnées inventées.
9. Tester l'interface iPhone, le changement d'onglet et la sauvegarde sur des écrans réels.
10. Faire tester au futur GM les scénarios de guilde sans prétendre disposer d'un backend partagé.

**Règles de livraison** : zéro coût API ; aucune transaction en jeu ; PR en brouillon tant que les preuves nécessaires manquent ; aucune fusion sans revue ; toujours distinguer le code, les tests automatisés et la validation réelle sur WoW Forever.
