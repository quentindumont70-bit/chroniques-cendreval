# Tournée Pro — plan de produit et Golipette de lancement

**Statut :** bêta privée, **interdite à la vente en l'état**. Première cible : infirmiers et infirmières libéraux exerçant seuls en France. Révision : 18 novembre 2026.

## Promesse du produit

> « Ma tournée, mes rappels et mes transmissions, lisibles en deux gestes même sans réseau. Mes données sont récupérables, je sais à tout moment où elles sont. »

Tournée est un **compagnon terrain**. Elle n'est ni un moteur de facturation SESAM-Vitale, ni un remplacement de Topaze, ni un dispositif d'aide au diagnostic. Aucun accès à des données patients depuis GitHub, les tests CI ou un assistant externe. Pas de duplication d'une base Topaze ni d'écritures Topaze sans habilitation explicite.

## Ce qu'il faut vendre

1. Une **journée claire** : tournée, ordre, faits/non faits, prochains passages.
2. Des **rappels par date** : post-it séparés par jour et par ligne, suppression et annulation.
3. Une **fiche terrain utile** : informations strictement nécessaires, mises à jour rapides.
4. Un **suivi sans surprise** : absences, modifications, transmissions et horodatage.
5. Une **mobilité fiable** : chargement iPhone, fonctionnement hors ligne et mises à jour sans perte.
6. Une **sortie de secours compréhensible** : une copie exportable/restaurable, testée, avant tout changement d'appareil.

Les modules annexes de Big Cthu (maison, musique, jeux) ne doivent pas être exposés à la clientèle de Tournée. Le marketing, la marque et l'expérience professionnelle seront distincts, **sans migration silencieuse** des données de l'application iPhone actuelle.

## Politique prix : hypothèse à valider

- **14 jours d'essai gratuit** (sans carte bancaire).
- **9,90 € TTC / mois / IDEL**, sans engagement, prix de travail et non offre en vigueur.
- **99 € TTC / an**, option annuelle.
- **20 € TTC d'installation accompagnée** uniquement sur demande : mise en place, reprise de données, contrôle avec le client. Pas de frais d'entrée obligatoires.
- Cabinet multi-utilisateurs et synchronisation HDS : **hors périmètre** jusqu'à validation des coûts et des rôles.

Le prix mensuel doit payer un avantage concret (mises à jour stables, accompagnement, support, fonctions terrain), pas une promesse de synchronisation inexistante. Comparaison publique au 18/11/2026 : Tournée Facile annonce 5,99 €/mois en annuel, 10,99 €/mois en mensuel ; InfirmiLib 24,99 €/mois. Sources : https://tourneefacile.com/tarifs/ et https://infirmilib.fr/ . Ne jamais déduire une marge sur ces prix sans connaître hébergement, assistance, TVA et frais de paiement.

## Roadmap des 10 prochains chantiers (Golipette)

| # | Chantier | Livrable mesurable | Priorité | État |
|---|---|---|---|---|
| 1 | **Centre de sauvegarde unique** | local ≠ externe, export, import et aperçu sans identité, pas de jargon ni formulaire de code | P0 | **V250 implémenté, CI à vérifier** |
| 2 | **Mises à jour sûres** | actualiser seulement après confirmation de la sauvegarde locale ; refuser sinon | P0 | **V250 implémenté, CI à vérifier** |
| 3 | **Restauration démontrable** | round-trip sur 1/24/500 patients FICTIFS, sans modification des notes ni écrasement | P0 | **V251 : tests automatisés + vérification fichier ; iOS réel encore à valider** |
| 4 | **Un seul parcours installé** | distinguer explicitement PWA installée/Safari, migration guidée, jamais de copie implicite | P0 | **V252 : identification visible de l'espace ; transfert guidé encore à construire** |
| 5 | **Refonte UI terrain** | accueil utile en 5 secondes, contraste iPhone, une action principale par écran, états vides | P1 | **V253 : accueil prioritaire et mobile ; direction artistique premium Medical Ops à venir** |
| 6 | **Cœur métier fiable** | rappels journaliers, cycles, absences, modifications et journal sans régression | P1 | V254 : brouillons des post-it protégés avant actualisation ; tests terrain à compléter |
| 7 | **Onboarding et exemples** | prise en main ≤5 min avec données fictives et import explicite | P1 | À construire |
| 8 | **Suite de tests appareil réel** | iOS PWA/Android, hors ligne, fermeture forcée, mise à jour, conflit de deux onglets | P0 | Tests automatisés partiels |
| 9 | **Conformité et exploitation** | finalité, RGPD, registre, responsabilités, contrats, HDS si hébergement confié à un tiers ; support et incidents | P0 AVANT VENTE | À instruire |
| 10 | **Pilote, modèle économique, sortie produit** | 5–10 IDEL testeurs, corrections P0, facturation/support, décision explicite go/no-go | P1 | Non lancé |

**Ordre d'exécution :** 1 → 2 → 3 → 4 → 8 → 5 → 6 → 7 → 9 → 10. Les travaux UI ne doivent jamais passer devant une perte potentielle de données.

## Contrat de sauvegarde — compréhensible et vérifiable

- **Sauvegarde locale :** chaque écriture patients/notes est chiffrée dans le stockage de l'appareil. Elle peut être perdue si le stockage du navigateur est supprimé, si l'iPhone est perdu ou si la clé locale disparaît.
- **Copie externe :** le bouton « Télécharger ma sauvegarde complète » génère un JSON exportable. **Ce fichier est lisible et contient des données sensibles.** L'app ne peut pas garantir sa présence dans Fichiers après le clic ; elle doit le dire.
- **Restauration :** prévisualiser seulement le **nombre** de fiches et le format ; ne jamais révéler de noms dans les logs, fichiers publics ou supports. Ne pas écraser les patients déjà présents.
- **Ancien coffre technique :** il dépend de sa clé de chiffrement locale et n'est **pas** un moyen fiable de transférer les données sur un nouvel appareil. Le conserver mais le placer en option avancée.
- **Synchronisation automatique :** **absente**. Ne pas l'annoncer tant qu'une solution conforme, interopérable, testée et réellement disponible n'existe pas.
- **Échec :** ne pas afficher « réussi » si une écriture, un export ou une lecture de contrôle échoue. Ne pas supprimer les anciens coffres.

La version V250 clarifie ce contrat mais **ne résout pas** la résilience d'un appareil volé ou totalement détruit. La sauvegarde automatisée multi-appareils est un chantier majeur, à cadrer sur une infrastructure adaptée.

## Architecture commerciale à ne pas confondre avec la bêta actuelle

La PWA actuelle tourne sous le même domaine GitHub Pages que les modules personnels Big Cthu. Or **localStorage et IndexedDB sont isolés par origine (domaine), et non par chemin de page** : une application de santé commercialisée doit être séparée techniquement des jeux, démonstrations et scripts personnels.

- **Cible commerciale :** domaine/origine réservée à Tournée, contrôle des dépendances et des scripts, politique de sécurité (CSP) testée, identité PWA indépendante, aucune fonctionnalité personnelle accessible depuis l'app professionnelle.
- **Migration :** expliquer qu'un changement de domaine crée un stockage neuf ; transfert par export/import testé et accompagné. Aucun transfert silencieux de dossiers réels et aucune supposition que Safari et l'icône iOS partagent leurs bases.
- **Infrastructure :** si synchronisation/backup serveur un jour, choisir et contractualiser le prestataire HDS requis, chiffrer en transit et au repos, gérer droits des remplaçants et sauvegardes vérifiables. Pas de serveur clandestin ni de paiements activés depuis la bêta.
- **Positionnement réglementaire :** documenter la finalité fonctionnelle ; si des modules d'aide à la décision clinique apparaissent, faire qualifier leur statut réglementaire avant d'en promettre l'usage.

## Avant toute ouverture commerciale : portes de sortie obligatoires

- **Qualité:** pas de P0/P1 ouvert, tests CI verts, restauration réelle à partir de sauvegardes fictives iOS/Android, lancement hors ligne vérifié, récupération depuis PWA installée validée.
- **Sécurité:** chiffrement et intégrité, absence de PHI dans dépôt / suivi / analytics, contrôle d'accès et sauvegardes adaptés au périmètre. Pas de « sécurité supprimée » qui laisserait des patients exposés.
- **Juridique:** politique de confidentialité, DPA/contrat sous-traitant si applicable, information utilisateurs, droits et suppression, revue du traitement, décision sur nécessité d'AIPD et cadre HDS selon le flux réel. Une sauvegarde cloud chiffrée de données de santé reste dans le champ de l'hébergement HDS si applicable.
- **Produit:** aucun code patient, aucune sauvegarde utilisateur, aucune clé publique, aucune donnée factice se faisant passer pour une vraie donnée. Aucun lien de paiement avant revue.
- **Commerce:** offre, CGV, support, procédures de réclamation, résiliation, facture et processus de remboursement documentés avant encaissement.

Sources réglementaires officielles : https://www.cnil.fr/fr/rgpd-et-professionnels-de-sante-liberaux-ce-que-vous-devez-savoir ; https://esante.gouv.fr/faq/quel-est-le-champ-dapplication-de-la-legislation-relative-lhebergement-de-donnees-de-sante-caractere-personnel ; https://gnius.esante.gouv.fr/fr/reglementation/fiches-reglementation/hebergement-des-donnees-de-sante-hds .

## Décision stratégique

**Ne pas ajouter de fonctionnalités secondaires tant qu'un infirmier ne peut pas prouver qu'il retrouve ses dossiers sans assistance.** D'abord la confiance, puis la finition, enfin le tarif. L'usage actuel reste privé ; la mise en vente nécessitera une nouvelle décision fondée sur les gates réels.

## Golipette V251 — contrôle réel du fichier choisi

Une copie JSON portable peut être sélectionnée dans « Mes sauvegardes » pour vérifier **sur l'appareil** que les patients et toutes les rubriques enregistrées correspondent exactement au coffre actuel. Aucun nom n'est montré pendant le contrôle. Si des changements existent, l'interface annonce que la copie est ancienne. Les anciennes sauvegardes V95 sans empreinte restent compatibles ; la comparaison repose sur l'égalité exacte des clés/valeurs du coffre.

**Limite impérative :** cette vérification confirme le contenu du fichier sélectionné à cet instant ; elle n'est ni une sauvegarde distante, ni une garantie que ce fichier sera accessible après perte de l'iPhone. Ne jamais afficher « sauvegarde cloud active ». Les tests de bout en bout utilisent uniquement des dossiers fictifs, y compris un jeu de 500 fiches, les post-it par date, les absences et la détection des fichiers corrompus.

### Golipette V252 — identifier le bon espace

L'écran « Mes sauvegardes » précise s'il est ouvert dans une application installée sur l'écran d'accueil ou dans un navigateur. Il rappelle que ces espaces peuvent être séparés : un fichier exporté doit être choisi dans le bon espace, **sans synchronisation automatique supposée**. Il ne lit aucun autre navigateur, ne transmet aucune donnée et ne lance aucune migration cachée.

## Golipette V253 — écran d'accueil métier puis refonte Medical Ops

Une nouvelle hiérarchie privilégie les passages du jour, la progression, la prochaine visite, les rappels propres au jour et les actions rapides. Les outils secondaires (assistant local, réglage des semaines, bilan, ambiance) restent accessibles dans une section repliable et via le bouton d'assistant de l'en-tête. Les données et les clés de stockage ne changent pas.

**Direction artistique approuvée pour une phase dédiée : Medical Ops du futur**, héritée de l'ambiance Medical Ops de Big Cthu, avec identité professionnelle autonome et haut niveau de finition. Objectif : cockpit clinique élégant, typographie hiérarchisée, surfaces et animations discrètes, palette médico-technologique, contraste, affichage une main, vitesse perceptible, micro-interactions sûres. Les thèmes alternatifs viendront après. Cette direction ne doit pas sacrifier lisibilité, accessibilité, sobriété batterie ni continuité de service sur iPhone.

**Critères de passage** : tests métier et hors ligne verts, pas de stockage modifié, contraste/lecture du jour, boutons ≥44 px, vrai iPhone à confirmer avant toute promesse commerciale. La phase V253 améliore la structure, **elle n'est pas la refonte graphique époustouflante finale**.

## Golipette V254 — brouillons de post-it et mise à jour iOS

Avant qu'une nouvelle version recharge la PWA, les brouillons multiligne sont enregistrés dans le **coffre chiffré local existant**, sans nouvelle base. Les écritures de post-it sont sérialisées. Si la persistance échoue, l'actualisation est refusée et le brouillon reste dans la session actuelle. En passant l'application en arrière-plan, une sauvegarde est tentée, sans garantie si iOS termine immédiatement le processus. Tests CI sur deux dates fictives, échec d'écriture et reprise avant rechargement.

Ce mécanisme ne constitue pas une sauvegarde hors appareil ; il ne remplace pas les vérifications iPhone réel et hors connexion ni la future sauvegarde externe.
