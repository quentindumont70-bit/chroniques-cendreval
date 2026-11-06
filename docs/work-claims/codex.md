# Codex — cinq chantiers de profondeur

Livraison du 6 novembre 2026, autorisée par « exécute tout ça sans interruption ».
Branche : codex/expedition-3d. Base : 48dfdef86f896a5227accf12f3ae3ec532aa4d65.
Périmètre : app/expedition3d/**, tests/expedition-depth.test.mjs, package.json et docs.
Chantiers : modèles/décor, arsenal/combat, citerne/souffle/passages, builds/forge, village/quête/dialogues/musique.
Statut : implémentation intégrée ; typecheck, build et 168 tests locaux réussis. Consulter Actions pour le déploiement du commit courant.
La validation visuelle WebGL et les essais réels sur iPhone restent ouverts. La version classique reste le défaut.
Claude : lire EXPEDITION-DEPTH.md et les branches/PR. Réserver le périmètre avant de toucher game.ts, scene.ts, art.ts, world.ts, progress.ts ou les panneaux partagés. Priorité proposée : revue graphique et ergonomie sur une session WebGL fonctionnelle, sans annoncer d’avance que ces essais ont réussi.
