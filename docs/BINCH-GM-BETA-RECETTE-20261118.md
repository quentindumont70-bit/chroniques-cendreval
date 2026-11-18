# La Binch — protocole de recette bêta GM (18 novembre 2026)

**État : pré-livraison sur PR #232, pas encore fusionnée ni présente sur le site public.** Les critères ci-dessous concernent la première bêta testée par un maître de guilde. Les CI automatisées ne remplacent pas ces validations sur un vrai téléphone et dans WoW Forever.

## Mise en situation et dix vérifications

| # | Vérification | Résultat attendu | Nature de la preuve |
|---|---|---|---|
| 1 | Ouvrir GM sur iPhone et Windows | Tableau de garde lisible, pas de carte coupée | Contrôle visuel manuel |
| 2 | Ajouter un donjon à 5 pour demain | Événement dans les 7 prochains jours | Calendrier local |
| 3 | Ajouter un raid avec plus de 5 places | Capacité réelle affichée sans supposer des rôles de donjon | Calendrier / briefing |
| 4 | Enregistrer des inscriptions confirmées et incertaines | Comptage distinct et pas de disponibilité inventée | Registre local |
| 5 | Reproduire un doublon d'inscription dans une copie de test | Une seule personne comptée, doublon signalé | Test automatisé et recette |
| 6 | Ouvrir « Préparer » depuis la vue hebdomadaire | Calendrier déplié avant navigation | Interface |
| 7 | Créer une demande urgente de composants | Seules les réceptions explicitement confirmées apparaissent reçues | Guild Planner local |
| 8 | Copier le briefing et le coller dans Discord | Texte daté avec réserves, aucune publication automatique | Action manuelle |
| 9 | Bloquer une délégation | La checklist GM indique la mission bloquée | Registre de délégations |
| 10 | Recharger, exporter, changer d'appareil si souhaité | Les données restent locales, le transfert exige un fichier et une restauration explicites | Tests réels sur deux navigateurs |

## Règles anti-invention

- Les effectifs et les rôles proviennent du calendrier local. Deux lignes portant le même nom ne font pas deux joueurs ; le doublon doit être confirmé par le GM.
- L'étiquette **« confirmé »** signifie déclaration dans le registre local, pas présence constatée en jeu. Les réservations et les rôles sont à reconfirmer avant le départ.
- Le coffre de guilde n'est pas automatiquement lu dans WoW. Les quantités de composants reçues demandent une validation humaine explicite.
- Un calendrier importé ou copié dans le navigateur d'un autre joueur ne devient pas une base partagée. Aucun droit GM n'est garanti sans authentification.
- Un event mal daté, déjà passé ou hors de l'horizon de 7 jours ne doit pas figurer dans la vue hebdomadaire.
- Pas de transactions, de transfert automatique, de notifications externes, de demandes de mot de passe ou de coût API.

## Statut de la passe

- **Code** : vue hebdomadaire corrigée, briefing GM enrichi, checklist et cartes mobiles ajoutées.
- **Tests** : `tests/binch-gm-readiness.test.mjs` appelé par `.github/workflows/verify.yml`. Attendre CI verte du dernier commit.
- **Validation sur appareil** : à faire ultérieurement avec le vrai bêta-testeur ; aucune conclusion de fonctionnement en jeu avant cette preuve.
- **Intégration** : PR #232 conservée en brouillon jusqu'à revue ; ne pas fusionner automatiquement.

## Suites prioritaires

1. CI verte PR #232.
2. Revue des effets sur données existantes et navigation mobile.
3. Test du briefing sur véritable iPhone.
4. Test sous Windows avec navigateur du futur GM.
5. Test d'inscription et de suppression de doublon.
6. Réconciliation des demandes Planner et du coffre déclaré.
7. Contrôle des échéances et de l'heure locale.
8. Préparation d'un jeu de données de démonstration distinct des vraies données.
9. Validation du transfert volontaire de sauvegarde entre deux appareils.
10. Retour du GM puis fusion/déploiement uniquement après validation.
