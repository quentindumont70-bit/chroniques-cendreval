# Big Cthu — validation iPhone V110–V112 (sans données réelles)

## Périmètre
- L'application Tournée doit s'ouvrir directement, sans phrase secrète, sur l'appareil où la clé locale est accessible.
- Le bouton **Absent** marque un passage du jour après confirmation et laisse la trace dans **Absences & modifications**. **Topaze reste inchangé** ; le rapprochement est manuel.
- Une annulation ne supprime pas la trace historique ; les anciennes absences de Tournée reçoivent aussi une trace d'annulation.
- La validation automatisée porte sur des dossiers entièrement fictifs. Un test réel du comportement Safari / iOS reste nécessaire.

## Scénario manuel sur appareil de TEST vide uniquement
1. Installer/ouvrir Big Cthu, confirmer qu'aucun code n'est demandé à l'ouverture normale.
2. Vérifier **Ajouter un passage** : sans saisie, aucun patient listé ; à 1 caractère rien ; dès 2 caractères, 8 résultats au plus, défilement fluide, création d'un patient neuf accessible.
3. Sur un passage **fictif**, appuyer sur **Absent** puis **Annuler** dans la confirmation : aucun changement.
4. Refaire, **Confirmer** : badge Absent, entrée « Absences du jour », journal et historique. Appuyer deux fois rapidement ne doit pas inverser l'état.
5. Ouvrir « Absences du jour », puis le journal. Vérifier les filtres et l'historique.
6. Annuler l'absence avec confirmation : badge retiré, historique conservé, entrée annulée / Sans suite dans le journal.
7. Passer hors ligne, fermer Safari ou l'app depuis le sélecteur, puis rouvrir. Vérifier que l'état **enregistré** se retrouve sans erreur réseau ; les changements non confirmés pendant une fermeture forcée ne sont pas garantis.
8. Vérifier que **Topaze**, la facturation et les vrais dossiers n'ont pas été utilisés pendant cet essai.

## Protection des données
Ne jamais exécuter ces scénarios d'écriture sur une vraie tournée. L'export JSON portable est **lisible** : ne pas le publier et le stocker dans un espace privé. Conserver des sauvegardes séparées avant tout transfert entre appareils. Si le bandeau de sauvegarde signale une erreur, garder la page ouverte et utiliser Réessayer ; ne pas annoncer les données comme persistées.
