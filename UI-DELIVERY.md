# Five interface workstreams

1. `class-selection.tsx`: six play-style cards, strengths/constraints and expandable skill kits with real mana and cooldown data. Selecting a class uses the existing game transition.
2. `pause-menu.tsx`: six described destinations, experience and talent budget, prominent resume, diagnostics isolated from ordinary navigation.
3. `adventure-inventory.tsx`, `loot-inventory.tsx`: equipped items first, inspect/remove, character and resources pages. Ten expandable stat explanations; equipment bonuses remain explicitly separate from class/level/talent stats.
4. `action-deck.tsx`, `talent-workshop.tsx`: direct slot selectors with the existing swap/persistence model, full heal/guard details, available talent points, collapsible bonus summary and selected-rank preview.
5. `menu-focus.tsx`, `page.tsx`, `globals.css`, browser journey test: keyboard focus confinement, native button activation in menus, Escape from gestures/class selection, responsive layout and safe-area framing.

Validation: TypeScript, production Pages build, full npm test suite; menu journey at 844×390, 390×844 and 1440×900; talent closure/rotation at four sizes; spell drag/drop, key assignment, mobile casts, persistence; two-thumb continuity and isolated capture loss. Browser tests use Chromium touch emulation, not physical Safari. No world geometry, resolution or audio changes.

Physical iPhone follow-up: reach all six class cards, expand skills, resume after each menu, equip/remove a drop, rearrange a spell and cast its new gesture. Check Safari safe areas and sustained frame rate with HD retained.
