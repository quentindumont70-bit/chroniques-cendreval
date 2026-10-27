# Foreground art pass — 27 October 2026

Ten successive art commits, based on main ed1771b:

1. Replace layered rectangular leaf plates with bounded crown clusters and secondary forks.
2. Six deterministic proportions; alternate pine tier density, width and rotation through cached model variants.
3. Moss hummocks, root-adjacent ferns and fallen wood integrate tree bases.
4. Broad meadow pigment fields group dry grass, flowers and dense growth; reduce high-frequency noise.
5. Compact road centre, wandering narrow ruts and quieter organic shoulders.
6. Break arch supports into masonry courses, add fallen stones and moss foundations at waystones.
7. Group flower stems and woodland debris around grounded bases instead of uniform scatter.
8. Mage focus: banded grip, metal collar, curved cradle and faceted crystal.
9. Shorter contextual touch prompts lower on the screen, restrained messages and thumb captions.
10. Talent card spacing, stronger text hierarchy and contrast; softer directional lighting and warmer valley mist.

## Validation

- `npm test`: passes, including Pages build and geometry/visibility tests.
- `npm run typecheck:game`: passes.
- `tests/talent-modal-browser.cjs`: passes four viewports, scrolling, rotation, reopening, touch close and Escape; no JavaScript errors.
- Browser render inspection: 844×390 touch viewport, Lame and Arcanes; no JavaScript errors.
- New model regression: deterministic variants and fewer than 65 mobile tree pieces. Existing crown silhouette tests retained.
- Visibility test corrected from 12 to 10 far trees, matching the existing 60% quota on main (18 × .60, rounded down); visibility logic unchanged.
- Full `game-smoke.cjs` does NOT pass: the late-dodge stamina assertion fails both here and in a clean checkout of the starting main ed1771b. Combat logic and audio are unchanged by this pass. Later smoke assertions were consequently not reached. This remains an unresolved pre-existing test/gameplay issue, not a certified full-combat pass.

## Device follow-up

Physical iPhone testing remains necessary: frame pacing during fast rotation and combat, thermal behaviour over ten minutes, portrait/landscape talent readability, road contrast, contextual prompt legibility and mage crystal visibility. Browser emulation is not physical-device performance evidence.

No additional per-frame random generation, external textures, audio changes or mass geometry scatter were introduced. Variant models remain cached. Existing untracked atlas files were not included.
