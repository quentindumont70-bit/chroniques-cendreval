# La Binch × Discord — roadmap de guilde (proposition, non implémentée)

Date : 14 novembre 2026. Initiative ajoutée après la priorité GrimoireSync / tests mobiles / bêta de guilde. Ne pas interrompre les travaux prioritaires.

## Intention

La Binch reste la source éditoriale et le poste de commande ; Discord devient la façade communautaire qui montre **uniquement des données consenties et publiables** et permet aux membres de répondre facilement. Aucune promesse de connexion directe en temps réel à WoW Forever sans API/événement effectivement disponible.

**État actuel réel du portail** : `guild-tools.js` possède déjà un coffre local `binch.guild.bank.v1`, avec statut, propriétaire, quantités, réservations, export/import JSON et action « Copier pour Discord ». Il précise explicitement que le registre est local et ne correspond pas à une connexion au coffre physique WoW. Réutiliser ce modèle : ne pas créer un deuxième coffre ni une BDD locale en double. Les recherches LFG et Guild Planner doivent également être inventoriés avant synchronisation.

## Les dix chantiers futurs, par priorité

1. **Modèle et consentement** — délimiter ce que chaque membre/GM partage (pseudo, personnage, disponibilité, promesses, stocks déclarés, souhaits), défaut privé ; modes brouillon / publié / retiré ; durée de vie limitée.
2. **Identité guilde** — liaison volontaire compte Discord ↔ personnage WoW Forever ; plusieurs personnages possibles ; rôles membre/officier/GM ; dissociation et retrait faciles ; aucune divulgation de SavedVariables.
3. **Événements canoniques** — définir les objets `guildNeed`, `wish`, `resourceOffer`, `guildStockDeclaration`, `eventSignup` avec IDs stables, auteur, statut, date d'observation, source et visibilité ; déduplication et idempotence.
4. **MVP annonces sortantes** — « Partager sur Discord » manuellement depuis La Binch : annonce LFG, artisan recherché, entrée de coffre publiable, souhait. D'abord texte copiable puis webhook sortant géré exclusivement par serveur autorisé. Jamais stocker un secret webhook/token dans HTML, localStorage, dépôt ou addon.
5. **Bot commandes de consultation** — slash commands `/groupe`, `/souhaits`, `/artisan`, `/coffre` pour lire des données publiées avec limites de visibilité et permissions. Réponses privées/éphémères par défaut si besoin.
6. **Appariement intelligent** — relier un souhait et une offre d'objet/recette ; DM ou notification de salon **opt-in**, pas de spam ; proposition d'échange sans transfert automatique d'objet ni achat.
7. **Synchronisation des recherches LFG** — création/modification/expiration depuis La Binch, boutons Discord « rejoindre/retirer », échéance et confirmation d'un organisateur ; pas de groupe automatiquement formé dans le jeu.
8. **Coffre et promesses** — afficher séparément « stock de guilde confirmé manuellement », « promesses membres » et « besoins ». Quantité disponible = déclarée - réservée, jamais conclure que les items sont présents physiquement sans confirmation datée. Possibilité de republier sans écraser le registre local.
9. **Événements GM et métiers** — annonces d'instance/raid, présence, réponses par rôles, recrutement complémentaire, artisans et recettes ; vues de synthèse Discord et La Binch, historique des validations.
10. **Fiabilité, coûts et déploiement** — limites Discord, file d'attente et anti-doublon, audit minimal des publications, tests sans secrets, vérifications des permissions, documentation d'installation GM, hébergement à coût nul tant qu'il est possible ; validation avant tout service payant.

## Architecture progressive

```text
WoW Forever (GrimoireSync, fichiers locaux de joueur)
      ↓ import manuel /reload, contrôle humain
La Binch (profil + guilde, vues locales)
      ↓ sélection explicite des données publiées
API de partage communautaire (si autorisée ; secrets côté serveur)
      ↔ stockage commun minimal avec TTL, autorisations et versions
      ↔ bot Discord : commandes / boutons / messages
      ↘ publication web de la guilde et retours autorisés
```

**MVP sans infrastructure** : copier l'annonce et la coller sur Discord. **MVP connecté** : webhooks pour sortie uniquement, côté serveur ; **bidirectionnel** : application Discord avec commandes/interactions HTTP ou Gateway selon besoin. Les webhooks simples ne savent pas lire les réponses ou gérer des slash commands ; ne pas leur attribuer ces capacités.

## Trois scénarios concrets

- **Tank recherché** : un donjon est publié avec niveau, rôle, heure et expiration ; un membre clique « Je viens » dans Discord, la recherche se met à jour dans La Binch après confirmation.
- **Coffre de souhaits** : un joueur souhaite des bottes ; un artisan annonce la recette et les ingrédients ; La Binch suggère le contact aux deux joueurs sans révéler leurs autres possessions.
- **Coffre Discord** : un officier confirme « 40 tissus disponibles à telle date » ; le bot affiche « 40 déclarés, 12 réservés, 28 disponibles *selon ce relevé* ». Aucun statut « temps réel » ni preuve du coffre en jeu sans intégration effectivement validée.

## Décisions à prendre *au moment d'implémenter*, pas maintenant

- Canal Discord et rôles GM habilités ; qui administre le bot ?
- Hébergement autorisé et niveau d'exposition souhaité (Internet/privé) ; plan zéro euro.
- Consentement par membre, gestion des demandes de suppression et expirations.
- Quel registre reste autoritaire pour chaque type d'information ; comment gérer les conflits et l'absence réseau ?

## Préconditions non négociables

- Ne jamais publier les fichiers `WTF/SavedVariables`, la liste complète des sacs, l'or personnel, les données de compte, les IDs secrets ni les tokens Discord.
- Ne jamais attribuer à GrimoireSync une API de banque de guilde en direct avant preuve dans le client Forever.
- Ne jamais automatiser des actions sensibles de jeu ; annonces et mises en relation, pas d'échanges WoW automatisés.
- Éviter une duplication de données et une usine à gaz : interfaces existantes `Coffre`, `Guild Planner`, `LFG` en premier.
- Jusqu'à mise en service explicite, **ce document n'est que la roadmap**. Aucun serveur, bot, permission Discord ni intégration n'a été créé.

## Sources techniques à revisiter à l'implémentation

Documentation officielle Discord : [Bots & Companion Apps](https://docs.discord.com/developers/topics/communities/communities), [Application Commands](https://docs.discord.com/developers/docs/interactions/slash-commands). Toujours vérifier les URLs et API actuelles avant le développement.
