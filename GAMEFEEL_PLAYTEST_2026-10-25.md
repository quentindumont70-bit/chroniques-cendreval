# Chantier game feel — retour playtest iPhone du 25 octobre 2026

## Constat utilisateur (observé sur la version publique, pas nécessairement sur la PR)
- Déplacements agréables, vallée jolie : préserver.
- Profondeur insuffisante entre premier plan et château ; collines vertes intermédiaires artificielles.
- Combat à l'épée : mouvement de lame peu ou pas perceptible, coups sans poids ni impacts lisibles.
- Verrouillage de cible sur iPhone non trouvé ; toucher le Gardien ne semble rien faire.
- Notifications jaunes haut d'écran : trop petites, peu contrastées.
- Bloc quête en haut à gauche : dernière ligne (« plaine ») coupée.
- Cooldown : compteur visible et flash de disponibilité apprécié ; balayage radial sombre à ajouter.
- Aucun loot ni inventaire repéré pendant ce test ; attention, la PR loot n'est pas publiée.
- Écran de victoire visible et fonctionnel.

## Priorités d'implémentation et critères d'acceptation

### P0 — Combat lisible
1. Faire apparaître la lame dès le début de l'attaque, avec anticipation, arc de frappe, retour au repos ; animation synchronisée au moment exact où les dégâts sont calculés.
2. Ajouter une traînée de lame brève et distincte du décor, un flash d'impact sur l'ennemi, des particules et un son de collision seulement en cas de coup réellement réussi.
3. Ajouter un recul/hitstop bref et paramétrable, avec réduction d'animations respectée ; aucun blocage du contrôle tactile.
4. Distinguer visuellement coup manqué, coup bloqué, coup critique et coup normal.
5. Test : 10 frappes au contact puis à distance ; pas de faux impact quand la cible est hors portée.

### P0 — Ciblage mobile
1. Bouton de verrouillage accessible au pouce, avec état actif/inactif et cible indiquée clairement.
2. Choisir la cible vivante visible la plus proche du centre ; refuser les ennemis occultés/hors portée.
3. Retirer automatiquement le verrouillage à la mort, au changement de zone ou si la cible est perdue.
4. Test : verrouiller le Gardien, tourner autour, tuer une cible, changer de quête ; pas de verrouillage fantôme.

### P0 — HUD et lisibilité
1. Notifications : fond opaque ou ombré, taille de police responsive, contraste élevé et zone sûre iPhone.
2. Carte de quête : hauteur dynamique selon le retour à la ligne ; aucune troncature de « Éveillez les bornes anciennes de la plaine ».
3. Conserver compteur de recharge + flash de disponibilité, ajouter un masque radial qui révèle progressivement l'icône.
4. Test : petit iPhone en portrait/paysage, texte agrandi, encoche et barre de gestes ; aucune superposition critique.

### P1 — Loot et récompenses
1. Confirmer d'abord que la branche contient l'inventaire et les notifications reliés aux morts ; ne pas attribuer l'absence observée à un bug avant publication.
2. Ajouter une récompense de boss clairement visible, sans bloquer les commandes ; distinguer absence de drop et drop obtenu.
3. Préserver les taux réellement configurés : ne pas promettre une probabilité non vérifiée.
4. Test : plusieurs morts rapprochées, loot multiple, reload, export/import, absence de doublon.

### P1 — Vallée
1. Refaire les collines intermédiaires avec couches de teintes, silhouettes irrégulières, brume atmosphérique et contraste décroissant avec la distance.
2. Ajouter des éléments de vie sans sacrifier les FPS : végétation animée discrètement, particules légères, détails au sol.
3. Test : capture avant/après depuis le point de départ, stabilité 5 à 10 minutes sur iPhone.

## Garde-fous
- Développer sur `feature/loot-foundation-v061`, ne pas fusionner sur `main` avant compilation, tests et validation iPhone.
- Ne pas présenter un changement seulement documenté comme une fonctionnalité déjà codée.
- Relever les FPS, les erreurs de console et les régressions tactiles pendant le prochain playtest.
