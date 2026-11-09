# La Binch — autonomie technique et compatibilité navigateurs

## Exigence permanente
La Binch doit fonctionner **sans dépendance de disponibilité des anciennes URL `chatgpt.site`** et sans session ChatGPT obligatoire. Son site officiel actuel est hébergé sur GitHub Pages à `https://quentindumont70-bit.github.io/chroniques-cendreval/binch/`. Une migration future vers un domaine propre doit être possible sans changer les données de jeu.

### Garde-fous
- Servir CSS, JS, polices critiques et fonds depuis le dépôt contrôlé (ou prévoir des alternatives locales) ; éviter les ressources essentielles sur `chatgpt.site`.
- N'utiliser que des chemins relatifs pour les ressources et les liens internes, afin de pouvoir changer d'hébergement.
- Ne jamais stocker des secrets API dans une page statique, ni publier un dossier `WTF`/SavedVariables sur GitHub.
- Déroulement principal sans IA : importer le Lua, consulter le profil, préparer quêtes/métiers/donjons.
- Conseils enrichis par ChatGPT uniquement sur demande explicite, sans promettre d'accès continu à WoW.

### Compatibilité prioritaire
1. **Opera Windows**, navigation souris, défilement normal et glisser-déposer.
2. Chrome / Edge Windows.
3. Firefox (import manuel par `input[type=file]` même sans File System Access API).
4. Mobiles : consultation et gestion manuelle ; import selon la disponibilité du fichier et du navigateur.

### Synchronisation fiable
- UI de sélection du fichier en HTML natif (visible sans scripts), champ `type=file` et glisser-déposer ; validation réelle du payload `GrimoireSync.lua`.
- `/reload` sauve les variables WoW sur disque. Le suivi web ne peut lire le fichier automatiquement qu'avec permission et navigateur compatibles.
- Compagnon Windows local optionnel : faciliter la surveillance des SavedVariables, jamais exiger des droits administrateur ou l'accès aux mots de passe.
- Afficher la provenance et la date de chaque import ; ne pas assimiler des données manuelles ou anciennes à une capture active.

### Critères d'acceptation
- [ ] La page publiée montre le marqueur « Import Opera — édition 09/11, correctif HTML natif ».
- [ ] Opera ouvre le sélecteur de fichier natif, accepte un vrai `GrimoireSync.lua` et affiche le nom/niveau avant confirmation.
- [ ] Glisser-déposer et import donnent la même progression sans effacer les personnages précédents.
- [ ] Après `/reload`, le suivi autorisé réimporte la sauvegarde modifiée (sur Opera si API prise en charge).
- [ ] Défilement depuis le haut de Synchronisation jusqu'au dernier panneau sans blocage.
- [ ] Aucun fichier critique n'est chargé depuis `chatgpt.site`.
- [ ] Le pipeline GitHub Pages réussit et les fichiers publics déployés correspondent au commit de référence.

Les cases ne doivent être cochées **qu'après test réel**, pas seulement après commit GitHub.
