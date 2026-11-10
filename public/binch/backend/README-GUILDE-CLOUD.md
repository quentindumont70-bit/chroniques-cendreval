# La Binch — Guilde privée (préparation)

## Ce qui est livré
Une interface de guilde privée, un client REST qui utilise des sessions email Supabase, un schéma SQL avec RLS et des fonctions protégées, et une configuration publique **vide**.

**Ce n'est pas un cloud actif tant qu'aucun projet Supabase n'est connecté.** Le site public conserve ses registres locaux.

## Mise en service par le propriétaire
1. Créer un projet Supabase de confiance, sous son propre contrôle. Ne jamais publier la clé `service_role`, `sb_secret_`, la chaîne de connexion ni une clé admin.
2. Exécuter `supabase-guild-private.sql` via le SQL Editor. Les tables de guilde sont isolées par permissions RLS ; la création et les invitations passent par des fonctions SQL contrôlées.
3. Dans Supabase Auth, activer la connexion **Email OTP / Magic Link**, configurer l'adresse du site `https://quentindumont70-bit.github.io/chroniques-cendreval/binch/` et son URL de redirection. Désactiver les comptes anonymes pour ce module privé.
4. Renseigner uniquement `supabaseUrl` et `supabasePublishableKey` dans `public/binch/guild-cloud-config.json`. Ces valeurs sont publiques par nature : la confidentialité doit reposer sur RLS, jamais sur le secret d'une clé de navigateur.
5. Déployer la page, demander un lien email, ouvrir ce lien dans le navigateur, créer la guilde, puis générer des invitations par le GM/officier.
6. Tester avec deux comptes **distincts** : un membre de guilde doit voir les données de sa guilde, jamais celles d'une autre ; un membre ne doit pas confirmer une réception `received` à la place d'un officier.

## Sécurité et limites
- Les données partagées incluent noms de personnage, demandes et promesses, pas les sacs ni les sauvegardes WoW.
- L'identité et les autorisations sont contrôlées côté serveur, pas par les boutons JavaScript.
- L'invitation aléatoire est valable 48 h avec dix usages maximum. Ne jamais poster le code publiquement ; générer un nouveau code pour un groupe de confiance.
- Le rôle GM est attribué lors de la création de la guilde ; seul le GM peut changer le rôle des autres membres via la fonction SQL prévue.
- Aucune synchronisation automatique du registre local n'est activée : il n'y a pas de fusion implicite entre appareils. Les fonctions de sauvegarde JSON locales restent séparées.
- Le module LFG collectif historique utilise un schéma Supabase **séparé**, avec des comptes anonymes. Ne pas prétendre qu'il bénéficie automatiquement de l'isolation privée de cette nouvelle guilde ; sa migration est un chantier distinct.
- L'authentification email et les modifications SQL ne sont pas encore testées en production ; prévoir tests de sécurité d'accès inter-guildes avant d'ouvrir aux membres.
- Ne pas automatiser le gameplay, les transactions AH ou l'accès au compte WoW.

## Ressources
- `public/binch/backend/supabase-guild-private.sql`
- `public/binch/guild-cloud.js`
- `public/binch/guild-cloud-config.json`
- `public/binch/guild-operations.js` (registre local non synchronisé)
