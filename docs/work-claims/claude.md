# Claude — La Binch · Assistant Trading (Hôtel des ventes WoW Forever)

Base : 70221a3335f2d01f8972c082afad5437b75fa4fd (main au 16 novembre 2026).
Branche : feature/claude-ah-trading-advisor (nom imposé par l'utilisateur). Aucun push sur main.
Revue prévue : ChatGPT ; intégration : l'utilisateur ou l'intégrateur désigné.

## Périmètre réservé

Nouveaux fichiers, sans réécriture des modules existants :

- `public/binch/ah-trading-core.js` : moteur économique pur, testable sous Node.
- `public/binch/ah-trading.js`, `public/binch/ah-trading.css` : onglet « Assistant Trading ».
- `tests/binch-ah-trading.test.mjs` : tests du moteur.
- `docs/BINCH-TRADING.md` : faisabilité de la collecte AH, architecture, limites.

Fichiers partagés modifiés au strict minimum :

- `public/binch/index.html` : deux balises (CSS + scripts), rien d'autre.
- `.github/workflows/pages.yml` : une ligne pour lancer le test du moteur.

Non modifiés volontairement (PR #129 ouverte dessus) : `ah-market.js`, `ah-craft.js`,
`market-bridge.js`, `addon/GrimoireSync/*`. Aucun changement Big Cthu ni Tournée.

## Statut

En cours. Voir `docs/BINCH-TRADING.md` pour l'état des lots.
