# Outbinched — son et lisibilité du combat

7 novembre 2026. Base : 3dd6617ba0a29fc780b6f9995e49bc820eff4685. Chantier autonome autorisé par « go ».

## Son

Mixeur Web Audio à trois canaux : musique, ambiance, effets. Volumes et activation conservés dans `outbinched-audio-v1`, séparément de la sauvegarde de jeu. Le contexte audio est créé après l’action d’entrée/reprise du joueur, pas au chargement de la page. Son activé par défaut, coupure générale dans Pause.

Six motifs musicaux synthétiques : village, vallée, crypte, citerne, combat et gardien. Accents ambiants périodiques : oiseaux stylisés dehors, gouttes dans la citerne, graves en intérieur. Ce sont des timbres synthétiques originaux, pas des enregistrements réalistes ni une bande-son orchestrale.

Signatures pour lame, arme lourde, arc, magie, impact, critique, parade, garde, blessure, soin et découverte. Pas selon le sol (terre, pierre, eau). Les sons précédents de saut, souffle et cloches utilisent aussi le nouveau canal d’effets.

Maximum de 24 oscillateurs simultanés, enveloppes bornées et compression générale. Pas de générateur de bruit blanc continu. La pause arrête les voix programmées ; la reprise n’accumule pas de retard musical. Une reprise asynchrone ancienne ne réactive pas le mixeur après une nouvelle pause. Un bouton « Écouter une parade » dans Pause permet un essai explicite.

## Combat et interface

Affichage temporaire séparé, quatre entrées au maximum : coups, critiques, parade, garde, compétences et soins. Les coups ordinaires n’écrasent plus le bandeau des découvertes et annonces narratives. Les entrées expirent et se vident au changement de zone.

Cadrans de recharge sur les compétences, calculés sur leur durée effective avec les statistiques du personnage. Les commandes et les règles de dégâts restent inchangées.

## Validation

TypeScript, compilation Pages et 225 tests réussis (13 nouveaux tests). Couverture : validation des réglages, timbres et fréquences, sélection du contexte musical, démarrage explicite, silence en pause, limite et libération des voix, volumes indépendants, absence d’accumulation après suspension, reprise retardée, expiration du flux de combat et préservation des annonces narratives.

Ces tests utilisent un contexte audio simulé pour vérifier la programmation et le cycle de vie. Pas de certification d’écoute sur iPhone ni de qualité sonore perceptuelle ; le navigateur de contrôle avait WebGL désactivé au dernier essai, empêchant un parcours du jeu. Le bouton d’essai et les volumes séparés restent disponibles sur l’appareil de jeu.
