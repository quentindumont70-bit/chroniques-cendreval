# La Binch — Activer le LFG partagé

Statut actuel : **code prêt à configurer, pas encore un service opérationnel en ligne**. Par défaut, le fichier `lfg-cloud-config.json` est volontairement vide et le LFG reste un brouillon privé à chaque appareil.

## Activer le service

1. Créer un projet Supabase (plan gratuit tant que l'utilisation reste dans ses limites). Choisir une région européenne.
2. Dans **Authentication → Providers → Anonymous Sign-ins**, activer les connexions anonymes, avec les protections anti-abus proposées par Supabase.
3. Dans **SQL Editor**, exécuter le fichier `backend/supabase-lfg.sql`. Cela crée deux tables avec sécurité RLS : `binch_lfg_posts` et `binch_lfg_reactions`.
4. Dans **Project Settings / API**, prendre **Project URL** et **Publishable key** (ou l'ancienne clé `anon`). **Ne jamais prendre `service_role` ni une clé `sb_secret_`.**
5. Remplir `lfg-cloud-config.json` :
   ```json
   {
     "supabaseUrl": "https://votre-projet.supabase.co",
     "supabasePublishableKey": "sb_publishable_VOTRE_CLE_PUBLIQUE"
   }
   ```
6. Publier sur GitHub Pages et ouvrir La Binch sur deux navigateurs distincts. Créer une annonce avec le premier ; actualiser le tableau avec le second et répondre. Confirmer qu'une même session ne peut avoir qu'une réaction par annonce et qu'un autre joueur ne peut supprimer l'annonce d'autrui.

## Ce que permet cette phase

- Annonces créées et consultées sur différents appareils, réactions enregistrées en ligne (une réaction par session), liste nominative des participants.
- Auteur : suppression de ses propres annonces. Date/heure et export calendrier.
- Fonctionnement sans abonnement ni crédits IA.

## Ce que cette phase NE garantit PAS

- **Ce n'est pas un salon privé de guilde.** Les sessions anonymes sont autorisées et l'interface expose le tableau à tout visiteur ayant accès au lien. N'y publiez ni informations personnelles ni messages confidentiels. Une authentification Discord avec vérification d'appartenance à la guilde est à prévoir avant lancement privé.
- Aucune validation du rang GM/officier, aucune messagerie instantanée ni notification push. Pas de promesse de disponibilité éternelle du plan gratuit.
- Le quota de 12 publications/24 h et 6 publications ouvertes par identité anonyme ne remplace pas le CAPTCHA, la modération et un vrai anti-spam serveur.
- L'identité d'une session anonyme peut être perdue si les données du navigateur sont effacées ; elle ne prouve pas le pseudo WoW.
- **Guild Planner** demeure local pour le moment, ses demandes et promesses ne sont donc pas visibles depuis les autres appareils. Il nécessite le même travail backend et des droits officier vérifiés.
- Ne pas utiliser de clé Supabase secrète dans un dépôt GitHub Pages.

## Critères de validation avant annonce aux joueurs

- [ ] Service réellement configuré
- [ ] Test de publication depuis deux appareils
- [ ] Réactions uniques et suppression par le propriétaire
- [ ] Test des erreurs réseau et du mode local
- [ ] Activer anti-bot et mécanisme de suppression des contenus abusifs
- [ ] Valider politique de confidentialité, consentement et conservation
- [ ] Restreindre l'accès aux membres de guilde si un usage privé est souhaité

La même infrastructure pourra ensuite accueillir des profils de métiers, des demandes de ressources, un coffre des promesses réellement partagé et un chat, **avec permissions**.
