# Outbinched — rencontres, village et exploration

Trois chantiers supplémentaires autorisés le 6 novembre 2026 par « on enchaîne avec plusieurs blocs ». Base : `bcd088904685e067c94f5f490a58d77a12ea1ef1` ; les cinq chantiers précédents ont été déployés avec succès avant cette livraison.

## 1. Rencontres et bestiaire

Trois épreuves facultatives : verger de la vallée, rive profonde de la citerne, nef de la crypte. Chacune comporte deux vagues de deux à trois ennemis ; une seule épreuve peut être active. L’interaction avec sa borne la lance. Les adversaires sont créés dans des emplacements marchables et disposent d’un délai initial avant de frapper. Les groupes combinent traqueurs, sentinelles et archers ; pas de nouvelle famille de modèle.

Après la dernière vague : or, minerai et un point de talent, une seule fois. Les ennemis vaincus et le numéro de vague sont sauvegardés. Revenir dans une zone recrée uniquement les survivants de la vague active, avec leur vie pleine : les dégâts partiels ne sont pas sauvegardés. Une retraite reste possible ; quitter une zone n’annule pas l’épreuve.

Bestiaire dans le menu : les quatre familles se révèlent après une rencontre à portée de détection. Comportements, contres et butins y sont décrits. Le panneau affiche également l’état des épreuves et permet d’en suivre la destination.

## 2. Valbrume se reconstruit

Trois projets permanents, accessibles depuis Elenn ou le panneau Village après réouverture des métiers de Mara et Rune :

- Jardin : 35 or, minimum de quatre potions lors du repos.
- Lanternes : 40 or et deux minerais, un tonique gratuit aux feux s’il n’en reste plus.
- Mémorial : 55 or et trois minerais, un point de talent unique.

Jardin, lanternes éclairées et stèle existent dans le décor, avec des groupes indépendants de la fusion statique. Les avantages des feux s’appliquent dans toutes les zones. Les habitants changent leur position dans un petit périmètre marchable autour de leur activité ; Rune reste à la forge. À proximité du joueur, ils cessent de se déplacer et se tournent vers lui. Ce sont des routines locales, pas un cycle quotidien complet.

Quatre rumeurs s’obtiennent dans les dialogues de Mara, Rune, Vey et Tovin. Elles restent consultables dans Village, avec suivi de leur piste. Les dialogues existants et le choix final du cœur sont conservés.

## 3. Atlas et journal d’exploration

Les lieux d’intérêt se révèlent à proximité et en ligne de vue. Les secrets et lieux nécessitant le souffle demandent une approche plus proche. Les lieux précédemment trouvés et le feu enregistré restent connus ; les nouvelles découvertes persistent.

Un objectif peut être suivi depuis le journal, le bestiaire, les rumeurs ou l’atlas. Son nom et sa distance directe apparaissent en jeu. L’atlas trace un itinéraire pédestre calculé sur les collisions, les hauteurs et les grilles, avec un budget maximal de recherche. Les destinations dans une autre zone renvoient d’abord vers le portail approprié.

Le bouton « Recalculer depuis ici » actualise le parcours. Le chemin n’est pas recalculé à chaque image. Les sauts, vols et trajets impossibles ne sont pas inventés : l’absence de route est indiquée, notamment au gouffre de la citerne ou vers un autel surélevé. Il ne s’agit pas d’un guidage aérien ni d’une navigation autonome du personnage.

## Compatibilité et validation

Même clé de sauvegarde. Validation des identifiants d’épreuves, rumeurs, projets, lieux et ennemis ; un seul état d’épreuve actif accepté. Les anciens champs gardent leur interprétation.

`npm run typecheck:game` et `npm test` réussis : 212 tests, dont 15 nouveaux tests d’exploration. Build Pages inclus. Tests de lancement, progression, sauvegarde et récompenses des épreuves ; positions de création ; transactions et avantages du village ; déplacements des PNJ ; rumeurs ; découvertes ; pont, grilles et gouffre pour les routes ; états corrompus ; maintien des modèles conditionnels après fusion.

Limite graphique inchangée depuis l’essai de la livraison précédente : WebGL désactivé dans le navigateur de contrôle. Pas de nouveau contournement ni de faux essai visuel ; iPhone, lisibilité graphique des bornes et équilibre en session réelle restent à évaluer.
