# Codex — expédition 3D

Statut : première implémentation prête pour publication en avant-première ; validation graphique bloquée par WebGL désactivé dans le navigateur de contrôle. Voir docs/EXPEDITION-3D.md.
Autorisation utilisateur : 5 novembre 2026, cinq chantiers avec migration 3D progressive.
Branche : codex/expedition-3d. Base : 26c72547868723abfe6eac904f32a57fc32e217c.
Périmètre Codex : app/expedition3d/**, lien d’entrée dans app/page.tsx, github-pages/main.tsx, package.json, package-lock.json, tests/expedition3d.test.mjs et docs.
Le mode classique et ses sauvegardes restent conservés. La 3D est accessible par ?expedition=1 et utilise sa propre clé.
Pour Claude : consulter main et les branches/PR ; réserver explicitement tout complément. Ne pas éditer simultanément game.ts, scene.ts, world.ts ou les points d’entrée. Les essais graphiques et le travail artistique sont les priorités restantes, à coordonner par une PR distincte.
