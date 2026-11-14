# La Binch — recette terrain de la bêta (non exécutée)

Document de passation pour la validation **sur véritable téléphone, Windows et WoW Forever**. Les tests automatiques en CI ne certifient pas cette recette. Exécuter seulement sur une installation de jeu volontairement choisie et sauvegardée, sans partager les SavedVariables à des tiers.

## Ordre recommandé : 10 chantiers courts, priorité à la sécurité

1. **Sauvegarde avant l'addon** — copier le dossier `WTF` du client WoW Forever en lieu privé. Ne pas publier le contenu dans une issue ou un dépôt.
2. **Client et interface exacts** — relever la version WoW Forever et le message éventuel d'addon périmé ; noter l'interface `16001` annoncée dans le manifeste, sans supposer une équivalence garantie.
3. **Chargement GrimoireSync** — lancer le jeu normalement ; confirmer l'apparition de la commande `/grimoire`, puis `/grimoire debug`. Capturer uniquement les messages techniques sans identifiants de compte.
4. **Minicarte** — vérifier l'icône de livre, le clic droit (chemin relatif à compléter avec le nom de compte), puis le clic gauche (`/reload`). Confirmer que les SavedVariables sont écrites après la sauvegarde ; le chemin réel peut différer suivant l'installation.
5. **Faith désactivé par défaut** — vérifier l'absence de notifications spontanées ; `/faith statut` indique l'état. Faire `/faith on`, poser `/faith niveau` et `/faith xp`, puis `/faith off` pour revenir au silence.
6. **Faith événementiel** — si le jeu envoie des événements normaux durant le leveling, vérifier qu'une montée de niveau produit au plus une réaction rapprochée et que `/faith instance on` respecte le silence en instance. Ne provoquer aucune mort simplement pour tester.
7. **Synchronisation manuelle** — `/reload` dans WoW, puis importer **uniquement son propre fichier** `GrimoireSync.lua` dans l'onglet Synchronisation de La Binch. Le navigateur n'a pas d'accès automatique aux fichiers du jeu.
8. **Intégrité du personnage** — vérifier nom, royaume, classe, niveau, zone, XP et quelques éléments de sacs/quête ; refuser tout dialogue de substitution d'un personnage non désiré. Les données restées privées ne doivent pas apparaître sur Discord.
9. **Téléphone physique** — sous Android/iOS, tester le défilement vertical des pages, le glissement horizontal de la navigation, les trois interactions tactiles Specs (épingler, choisir Druide Farouche, retirer) et le chevauchement avec « Modifier l'interface ».
10. **Bêta guilde** — partager seulement une URL bêta autorisée et une courte procédure d'import volontaire. Prévenir que le coffre de guilde est un registre local déclaré, non un accès en direct à la banque de WoW ; ne pas activer les connecteurs Discord avant gestion des droits et consentement.

## Critères de passage

- **P0** : aucune erreur bloquante Lua au login, bouton de minicarte utilisable, import qui n'efface pas un autre personnage, pas de fuite de secrets ni de SavedVariables.
- **P1** : Faith contrôlable et silencieux lorsqu'il est désactivé ; Specs interactives sur le téléphone ; date de capture et date d'import distinguées.
- **P2** : confort visuel, performances et notifications de métiers/quêtes. Peut être amélioré après la bêta si P0/P1 restent verts.

## Protocole de retour très court

Pour un problème, noter : appareil/OS, version du client WoW (si concerné), page ou commande, résultat attendu, résultat réel, capture sans information personnelle, et la présence ou non d'une erreur. Ne pas demander à un membre de transmettre son dossier `WTF`.

## Liens

- Site public existant : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/
- PR de développement en brouillon : https://github.com/quentindumont70-bit/chroniques-cendreval/pull/129
- Plan Discord ultérieur : `docs/agent-handoff/BINCH-DISCORD-ROADMAP.md`

**Important :** le site public peut ne pas contenir les correctifs de la PR non fusionnée. Le document prépare les essais, il ne les prétend pas réalisés.
