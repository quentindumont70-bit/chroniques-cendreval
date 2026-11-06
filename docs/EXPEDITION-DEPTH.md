# Outbinched — cinq chantiers de profondeur

Livraison du 6 novembre 2026, sur l’expédition 3D `?expedition=1`. Base : `48dfdef86f896a5227accf12f3ae3ec532aa4d65`. Le mode classique et ses sauvegardes restent inchangés.

## 1. Identité artistique

Nouveau module `art.ts` : silhouettes équipées (capuches, carquois, plastrons, boucles, genouillères, crêtes, manteaux animés), traqueurs avec oreilles, crocs, crête et queue. Armes en main accompagnées de mains, gants et manches dont la couleur suit la tenue équipée.

Vallée : puits, marché couvert, charrette, atelier, bannières, pins, contreforts et fenêtres à arcs du château, rosace. Crypte : arcs, tombeaux, voûte relevée pour la nouvelle route aérienne. Citerne : bassin profond, piliers, chaînes et quais. La restauration du cœur fait pousser un jardin ; le choix de protection fait apparaître deux gardes. La forge se rallume après sa quête.

Les modèles sont des géométries procédurales originales. Leur présence et leurs coordonnées finies sont testées, mais la cohérence visuelle n’a pas encore été évaluée en rendu WebGL dans cet environnement. Ne pas présenter cette passe comme un niveau artistique équivalent à Queen’s Domain déjà constaté.

## 2. Arsenal et combat

- Cinq familles : épée, marteau, lance, arc, catalyseur. Portée, coût d’endurance, récupération, précision et dégâts de posture distincts.
- Deux armes uniques : Éclat de Thunderfury (charge propageant un éclair à une cible visible proche), Sulfuras (charge à dégâts de zone).
- Charge : maintenir puis relâcher clic gauche ou R ; bouton à maintien disponible sur écran tactile. Une interruption annule la charge.
- Posture : coups lourds et charges interrompent les préparations d’attaque et ouvrent une fenêtre de riposte. Les parades parfaites ouvrent aussi cette fenêtre.
- Ennemis : archer qui recule à courte distance, traqueur qui contourne, alerte des alliés proches, protection apportée par les sentinelles.
- Dégâts magiques : résistance magique utilisée pour le lanceur de la citerne et les attaques du gardien en phase 2. La garde tient compte de la direction d’arrivée des projectiles.

## 3. Monde interconnecté

Une troisième zone, la Citerne des passeurs, se rejoint par l’est de la vallée. Le souffle s’acquiert sur la première rive et ajoute un saut aérien avec une impulsion horizontale, réarmé à l’atterrissage. Le gouffre de sept mètres nécessite cette acquisition avec le parcours testé.

La rive profonde contient Tovin, du minerai et un passage vers les tombeaux du donjon. Ce passage ouvre son retour depuis la crypte. Le souffle permet aussi de revisiter le balcon de la vallée (chasuble et or) et l’autel surélevé du donjon (Thunderfury). Les plateformes, plafonds et ouvertures sont pris en compte par les collisions et la sauvegarde.

## 4. Builds et forge

- Douze spécialisations : deux voies pour chacune des six classes, trois rangs mécaniques par voie. Une voie active ; les rangs dépensent les points de talent et exigent les niveaux 2, 3, 4.
- Réorientation : 20 or, remboursement des points dépensés dans la spécialisation. Les talents communs restent séparés.
- Quatre tenues : étoffe, cuir, harnois et chasuble. Armure, résistance, régénération et vitesse distinctes ; les manches visibles changent.
- Forge déverrouillée par Rune : achat d’armes/tenues, trois niveaux d’amélioration par arme, quatre runes alternatives (critique, mana à l’impact, posture, soins sur parade).
- Armes supplémentaires trouvées sur certains ennemis ; minerais obtenus en combat et dans les caches. Chaque transaction vérifie ressources, propriété et limites avant modification.

Le panneau Arsenal affiche les profils et l’équipement ; l’atelier et les spécialisations sont accessibles dans les menus. Les armures du joueur sont visibles sur ses bras en vue subjective ; aucune caméra à la troisième personne n’est ajoutée dans cette livraison.

## 5. Valbrume et quêtes

- Mara : retrouver Tovin, revenir annoncer son sauvetage, rouvrir l’apothicairerie. Tovin apparaît alors au village ; achats de soins et d’ingrédients disponibles.
- Rune : rapporter trois minerais, réparer le foyer et obtenir un marteau. L’atelier devient disponible.
- Sœur Vey : lire deux mémoires et revenir pour recevoir un point de talent.
- Elenn : après le gardien, choisir une seule destination pour le cœur. Restauration : jardin et +1 mana/s. Protection : gardes et +10 armure. Récompense finale unique.
- Journal des étapes, dialogues à choix, évolution persistante et musique synthétique variant entre village, exploration, citerne et combat. Les PNJ ont des animations de présence ; ils n’ont pas encore de routines quotidiennes complexes.

## Sauvegarde

La clé `outbinched-expedition3d-v1` est conservée. Les anciennes parties 3D reçoivent les nouveaux champs par défaut et une arme adaptée à la classe. Équipement, runes, renforcement, spécialisations, quêtes, souffle et passages sont validés et sauvegardés. Les anciennes parties déjà terminées obtiennent le choix de restauration sans recevoir à nouveau la récompense finale.

## Validation

`npm run typecheck:game` et `npm test` : 168 tests, dont 22 nouveaux tests de profondeur et 18 tests 3D existants. Build GitHub Pages inclus.

Tests : profils d’armes ; charge et interruption ; posture/riposte ; recul et protection des alliés ; transactions de forge et plafonds ; les douze voies et remboursement ; combinaison des stats ; gouffre infranchissable sans souffle puis franchissable avec ; réarmement ; accès à l’autel ; sauvegarde sur plateforme ; sauvetage, forge, mémoire et choix final sans double récompense ; migration d’anciennes parties ; contrôle des données corrompues ; géométrie finie des trois zones ; éclair en chaîne ; allonge et occlusion ; résistance magique et garde directionnelle.

Limite conservée : le dernier essai navigateur avait échoué dès la création du contexte WebGL (`GL_RENDERER = Disabled`). La nouvelle passe n’est donc pas certifiée visuellement, au clavier/souris réel ou sur iPhone. Les tests de simulation n’établissent ni le rendu final ni un objectif FPS. L’expédition reste en avant-première et le mode classique reste l’entrée par défaut.
