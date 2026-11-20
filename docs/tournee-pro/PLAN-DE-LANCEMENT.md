# Tournée Pro — plan de produit et Golipette de lancement

**Statut :** bêta privée, **interdite à la vente en l'état**. Première cible : infirmiers et infirmières libéraux exerçant seuls en France. Révision : 19 novembre 2026.

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
| 5 | **Refonte UI terrain** | accueil utile en 5 secondes, contraste iPhone, une action principale par écran, états vides | P1 | **V261 : petits iPhone, cibles tactiles et alertes visibles ; validation physique iPhone restante** |
| 6 | **Cœur métier fiable** | rappels journaliers, cycles, absences, modifications et journal sans régression | P1 | V262 : bascule de cycles datée depuis la fiche, alertes de sauvegarde compactes ; essais iOS réels à faire |
| 7 | **Onboarding et exemples** | prise en main ≤5 min avec données fictives et import explicite | P1 | V256 : guide fictif en 5 étapes ; essai réel de prise en main et import assisté à valider |
| 8 | **Suite de tests appareil réel** | iOS PWA/Android, hors ligne, fermeture forcée, mise à jour, conflit de deux onglets | P0 | V257 : contrôle local des pages publiques hors ligne et tests CI ; essais iPhone/Android réels toujours à faire |
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

## Golipette V255 — brouillons rapides lors du changement de jour

Pendant la session ouverte, le champ **Ajouter un rappel** garde son texte par date lors d'une navigation entre jours. La modification d'une ligne reste aussi visible lorsqu'on revient au jour concerné. La fonction de mise à jour sûre refuse le rechargement tant qu'un ajout ou une édition n'a pas été validé, même lorsque le brouillon est sur une autre journée. Une saisie faite pendant une écriture asynchrone n'est pas effacée à son retour.

**Limite claire :** ces brouillons *non validés* restent **en mémoire vive**, pas dans une deuxième base. Ils peuvent disparaître si iOS tue l'application ; seuls les rappels explicitement ajoutés/modifiés sont écrits dans le coffre chiffré existant. Un test iPhone réel est toujours requis. Aucun patient ni post-it existant n'est réimporté ou migré.

## Golipette V256 — premiers pas professionnels sans données réelles

Une page autonome « Premiers pas » accessible depuis « ⋯ Outils » explique en cinq étapes l'espace PWA/iPhone, la lecture de la tournée, les post-it par date, le journal local d'absences (sans modification Topaze) et l'export JSON de secours. Les illustrations sont statiques, les fichiers de démonstration ne sont jamais importés dans les dossiers de la bêta et aucune nouvelle base n'est créée.

Le guide est ajouté aux fichiers publics précachés du service worker V256. Cela **ne remplace pas** le test sur un iPhone réel hors ligne et ne prouve pas encore la prise en main en cinq minutes. Il ne faut jamais faire d'essai de restauration en écrasant un coffre réel.

## Golipette V257 — vérifier le cache public avant l'essai iPhone

La page `tournee-controle-iphone.html`, accessible depuis le guide « Premiers pas », inspecte **uniquement** la présence du cache public V257, ses trois pages essentielles et l'activité du service worker dans le contexte du navigateur courant. Elle n'accède à aucun coffre local, aucune note, aucun patient et n'effectue aucune requête réseau. Elle indique clairement qu'une page en cache ne signifie ni stockage clinique récupérable, ni sauvegarde externe, ni validation d'un vrai redémarrage sous iOS. En l'absence de cache, de contrôle du service worker ou d'accès à CacheStorage, elle signale une vérification incomplète et n'affiche pas de réussite trompeuse.

Une suite de tests Node V257 couvre cache prêt/absent/partiel, service non actif, accès refusé et non-accès aux données sensibles. **La validation sur un iPhone réel reste obligatoire**, de même que les scénarios multi-onglets en environnement fictif ; aucune synchronisation, migration de patients ou infrastructure cloud n'a été ajoutée.

## Golipette V258 — deux fenêtres et coffre local : écriture exclusive

- Écriture chiffrée dans la **clé existante** : un verrou Web Locks par coffre sérialise la comparaison du dernier snapshot, l'écriture et sa relecture, si le navigateur prend en charge cette API. En l'absence de Web Locks, la comparaison optimiste préexistante demeure et **ne constitue pas une atomicité garantie entre processus**.
- Une fenêtre périmée ne peut plus annoncer « déjà sauvegardé » lorsque son snapshot diverge, même sans modification locale. Un événement `storage` provenant d'une autre fenêtre déclenche rapidement le message de conflit sans remplacer les patients.
- En cas d'indisponibilité du verrou demandé, l'écriture échoue prudemment ; le coffre antérieur n'est pas effacé. Le bouton Sauvegarder restitue le vrai motif de conflit.
- Tests fictifs de deux fenêtres simultanées, coffre périmé, événement `storage`, verrou refusé et navigateur sans Web Locks. Aucune synchronisation multi-appareils, aucune donnée médicale transmise, aucune nouvelle base, aucune suppression ni migration.

**Limites non levées :** les anciens onglets utilisant une version non verrouillée, certains navigateurs ne prenant pas en charge Web Locks et la fermeture forcée iOS restent des risques. Essais sur appareil réel et sauvegarde externe indépendante restent indispensables avant vente.

## Golipette V259 — conflit inter-fenêtres : avertissement permanent

Après détection d'un coffre modifié dans un autre onglet, la fenêtre périmée **ne peut plus écrire dans ce coffre**, ni masquer l'erreur derrière un état « enregistrement en cours » ou « enregistré ». Le bouton de réessai est masqué pour ce conflit seulement ; une erreur non conflictuelle (par exemple stockage plein) peut toujours être retentée. Les brouillons restent en mémoire jusqu'à la fermeture : **ils ne sont pas sauvegardés** ; aucune fusion ou réouverture automatique n'est déclenchée. Le message de conflit indique de comparer les changements avant de fermer la fenêtre. Une vérification du snapshot final empêche aussi qu'un contrôle rapide annonce un succès après une modification extérieure détectée.

Tests fictifs : conflit avant écriture, saisie ultérieure, conflit pendant chiffrement, absence de fausse réussite, erreur de stockage récupérable et flux normal. Aucun patient réel, nouveau stockage, réseau, Topaze ou transfert automatique. La reprise iPhone et les conflits d'onglets restent à confirmer sur appareil réel avant commercialisation.

## Golipette V260 — Medical Ops du futur, premier thème clinique réversible

Le sélecteur 🎨 de Tournée propose désormais un thème **« Medical Ops »**, non activé par défaut. Cette première tranche applique une identité professionnelle sombre, accents cyan à haut contraste, cockpit journalier clarifié, statistiques visibles, ligne de temps, cartes de soins, rappels, barres d'état et zones tactiles adaptées à l'iPhone. Elle reprend les principes du concept Medical Ops de Big Cthu tout en évitant les photographies distantes et les animations lourdes (mode mouvement réduit pris en compte).

Le mode utilise exclusivement le **réglage de thème existant** `tidel_theme` dans le coffre chiffré local : aucune clé nouvelle, aucune migration, aucun patient réimporté et aucun accès réseau lié au visuel. Au lancement, le thème choisi est réappliqué après ouverture du coffre, sans tentative de lire les dossiers en dehors du parcours normal. Une valeur de thème inconnue est ignorée. Un retour instantané vers **Lagon** ou **Nuit** est possible via 🎨.

Tests fictifs V260 : choix, restauration du thème au démarrage, retour à Lagon, éléments tactiles, CSS strictement dédié, préchargement hors ligne et non-régression des composants métier. **Cette livraison n'est pas encore la refonte complète.** Les essais réels iPhone (contraste, navigation à une main, performance et lisibilité), la sauvegarde externe sécurisée et la conformité sont nécessaires avant commercialisation.

## Golipette V261 — Medical Ops sur petit iPhone : ergonomie et alertes visibles

La feuille `tournee-medical-ops.css` conserve son périmètre **uniquement quand le thème facultatif Medical Ops est sélectionné**. Pour les iPhone étroits (≤430, ≤380 et ≤340 px CSS), l'en-tête se répartit sur deux lignes sans diminuer les 5 boutons sous 44 px ; la navigation basse limite les débordements de libellés et ménage l'espace d'écran avec la zone de sécurité iOS ; les chiffres de la journée se réorganisent sur deux puis une colonne ; les actions principales et la saisie des rappels passent sur une colonne quand nécessaire.

Dans les rappels, les boutons d'édition/suppression reçoivent une cible d'au moins 44 × 44 px ; les champs importants utilisent une taille d'écriture de 16 px minimum pour éviter le zoom automatique Safari, tout en respectant une taille supérieure si l'utilisateur l'a choisie. **Une erreur de sauvegarde n'est plus tronquée par la limite visuelle de deux lignes** en mode Medical Ops ; l'alerte complète reste consultable avant toute fermeture ou actualisation. Modes contrastes renforcés et mouvement réduit conservés. Tests automatiques V261 couvrent ces règles CSS, les seuils mobiles, le message d'erreur et le non-accès aux données.

Aucune nouvelle base, aucun réimport, aucune modification de soin, journal, planning, Topaze ou logique de chiffrement. **Limite :** les tests de style sont structurels ; ils ne prouvent pas encore la géométrie réelle des 44 px ni l'absence de débordement sur un iPhone physique. Captures, lisibilité à 140 %, navigation réelle hors ligne et suivi de conservation des données restent à faire avant une sortie commerciale.

## Golipette V262 — retour terrain : sauvegarde compacte + bouton cycle dans la fiche

**Bandeau de sauvegarde iPhone** : lorsqu'il est vert ou en cours, il reste une ligne d'état compacte ; « Mes sauvegardes » reste accessible dans le menu « ⋯ Outils » (qui contient déjà « Sauvegarder / restaurer »). Lorsqu'il est rouge, le signal reste visible sans envahir la navigation ; le bouton **Détails** développe le message intégral et les actions « Réessayer » si pertinentes ; le panneau déplié n'est pas sticky et peut défiler. Un conflit d'écriture demeure bloquant, ne propose pas de réessai dangereux et ne disparaît pas au repli. Même comportement quel que soit le thème.

**Alternance chimio / Granocytes depuis la fiche patient** : une carte de cycle apparaît exclusivement pour les fiches disposant d'un cycle structuré valide, dont celle visée par le retour terrain. Elle montre la semaine actuelle et la prochaine, puis un bouton **« Inverser Granocytes / chimio »**. Après confirmation explicite, la bascule s'applique à partir du lundi de la semaine en cours. Le cœur de calcul gère un petit historique trié des dates de bascule dans le cycle **existant** du patient, permettant de revenir en arrière au deuxième appui sur la même semaine, sans réécrire le passé ni toucher les passages déjà marqués faits. Aucun nouveau coffre, aucun changement Topaze et aucune migration. Les exceptions hebdomadaires explicites restent prioritaires et sont signalées à l'écran avant confirmation, jamais supprimées silencieusement. Une sauvegarde non confirmée n'affiche pas de succès.

**Validation** : tests automatiques V262 sur bascule avant/après, deuxième appui, historique, cycles invalides, affichage uniquement si cycle, annulation, échec, conservation des exceptions, bandeau replié/déplié et non-régression. Les essais sur iPhone réel avec une sauvegarde de secours préalable sont toujours requis. Un clic sur le bouton ne vérifie pas une prescription médicale : l'utilisateur doit confirmer l'ordonnance/rythme attendu avant d'appliquer le changement.

## Golipette V263 — calendrier vérifiable à 14 jours dans les fiches avec cycle

Après le retour terrain V262, le bloc « Alternance des semaines » dans une fiche avec cycle affiche désormais les 14 dates (lundi → dimanche), les **jours effectivement prévus** selon la logique existante `onDate`, le type effectif de chaque semaine (chimio ou Granocytes), et le symbole `+` pour un passage ponctuel hors cycle. Les exclusions par date, suspensions et dates exclusives sont prises en compte.

**Priorité aux exceptions explicites :** une exception de semaine affiche le traitement effectif qu'elle impose et indique le traitement du cycle de fond. La fiche avertit que le bouton « Inverser » ne modifie pas ces exceptions ; la confirmation le rappelle. En cas de liste d'exceptions illisible, l'inversion est indisponible jusqu'à correction, sans effacer les données.

Cette livraison ajoute seulement une prévisualisation locale et son habillage responsive (390/340 px), sans nouvelle clé patient, migration, réseau, modification automatique de soins ou appel à Topaze. Tests fictifs V263 sur jours actifs, inversions, exceptions, dates ponctuelles, suspensions et valeurs illisibles. La prescription, le planning réel et la lisibilité sur iPhone restent à confirmer par l'IDEL avant usage clinique.

## Golipette V264 — ajuster les semaines depuis la fiche, sans dupliquer l'éditeur

Après V263, chaque fiche disposant d'un cycle présente **« ✎ Ajuster cette semaine »** et **« ✎ Ajuster la semaine prochaine »** sous le calendrier à 14 jours. Un appui ouvre directement le véritable éditeur de semaines déjà intégré à Tournée : bon patient préselectionné, les deux exceptions actuelles chargées, semaine souhaitée ciblée, détails ouverts, jours proposés réexaminables. L'utilisateur valide ensuite lui-même les traitements et les jours avant d'enregistrer ; la protection de confirmation et le coffre chiffré existants restent inchangés.

Le raccourci est une **navigation uniquement**, sans nouveau formulaire patient, base, import, mutation ou API. Si le dossier n'a plus de cycle, si la fiche est fermée ou si les exceptions sont illisibles, aucun changement de planning n'est lancé. Il n'écrase jamais une exception en la masquant. En cas d'impossibilité d'afficher l'éditeur après navigation, un message prudent est présenté. L'utilisateur peut toujours revenir à la fiche par Patients.

Petites cibles adaptées à l'iPhone (au moins 48 px de hauteur), bouton sur une colonne aux écrans de 350 px, focus visible en Medical Ops ; CSS et service worker publics mis à jour en V264. Neuf tests fictifs couvrent la transition, la sélection du bon patient et de la bonne semaine, les refus, la réutilisation du chemin de sauvegarde existant et l'absence de transfert. **Les tests sur iPhone réel et la vérification de la prescription restent obligatoires avant usage clinique et commercial.**

## Golipette V265 — depuis la fiche, n'enregistrer que la semaine ciblée

V264 ouvre l'éditeur des semaines depuis la fiche d'un patient ayant un cycle. V265 supprime le risque de modifier **l'autre semaine** en enregistrant depuis ce raccourci : seules les décisions concernant la semaine visée sont produites, prévisualisées et soumises au circuit de sauvegarde chiffré existant. Les exceptions de la seconde semaine, celles d'autres patients et les semaines historiques restent intactes.

L'éditeur affiche explicitement « seule cette semaine sera enregistrée », masque les contrôles de l'autre semaine et retire le bouton d'inversion groupée dans ce mode. En revenant à l'éditeur général depuis Tournée, les deux semaines restent éditables normalement. La cible est réinitialisée en quittant l'onglet Tournée. Pas de nouveau stockage, d'import, de facturation Topaze ni de traitement médical automatique.

Tests fictifs V265 : mode une ou deux semaines, préservation de la seconde et des autres patients, retour au cycle normal uniquement pour la semaine visée, annulation, panne d'enregistrement, refus de jours invalides, affichage ciblé, cache V265 et contrôle de la navigation. Le planning doit rester conforme à la prescription et être testé sur le véritable iPhone avant emploi clinique.
