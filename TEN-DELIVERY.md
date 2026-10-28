# Ten workstreams — 1080p mobile target

User device report: iPhone 17 Pro Max is comfortable at 1080p, slow at 4K.
This release does not claim a measured physical-device speed improvement.

1. Rendering: 4K retains HD geometry detail; automatic resolution starts conservatively and drops through bounded steps after sustained missed frame budgets.
2. Depth: all actors, scenery, shrines and landmarks submit to a common face-depth pass before combat overlays. Regression asserts identical paint order regardless of actor/landmark submission order. Average-depth polygon sorting remains an approximation for intersecting polygons; this is not a per-pixel depth buffer.
3. Guardian reference: closed cheek guards, reshaped crown, sunburst breastplate, layered pauldrons/knees and articulated knuckles. This remains procedural simplified art, not a final reproduction of the reference.
4. Animation: actual attack-family durations drive body and weapon contact/recovery, replacing a fixed .4-second cycle.
5. Materials: separate metal highlights, diffuse cloth and wood response under a fixed directional light.
6. Weapons: cut mage crystal and fine orbiting marks replace stacked cubes; bowstring draw responds to attack phase.
7. Landscape: species palettes, restrained clustered flowers/seeds/leaves and less heavy woodland tint.
8. Props: open plank wagon, rails/posts, undercarriage, layered hubs, shafts and tied cargo replace the solid crate.
9. UI: nearby combat suppresses exploration guidance, compact direction marker, quieter area text and responsive pause presentation.
10. Delivery: unit, build, type and browser regressions; visual scenes; explicit limitations and published commits.

Tests: npm test; typecheck:game; touch-continuity-browser (8 recontacts, upper playfield, capture loss); talent-modal-browser (4 viewports, scroll, rotation, close); three visual scenes.

Remaining: physical iPhone thermal/frame-pacing test; full level/boss smoke is not certified (previous dodge timing assertion remains unresolved); more detailed character surfaces and motion polish; exact depth for intersecting meshes. No audio or damage-rule changes.
