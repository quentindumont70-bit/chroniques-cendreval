# Mobile continuity pass

Camera hotfix: spatially bounded double taps and latched camera intent prevent horizontal recontacts from turning into spell swipes.

Ten follow-up blocks:
1. One touch playfield, per-pointer cancellation, two-thumb browser regression.
2. Staggered spiral pine branches at both detail tiers.
3. Broken valley bank strata and moss footings.
4. Continuous meadow pigment transitions and reduced bright flecks.
5. Interpolated distant terrain height and lighting.
6. Open reticle centre and smaller, displaced combat feedback.
7. Near-plane polygon clipping for close voxel faces.
8. Release captures and held gestures on device rotation.
9. Responsive objective text and portrait top controls.
10. Updated gesture instructions and integrated regression coverage.

Validation: npm test and typecheck:game pass. touch-continuity-browser passes eight rapid right-thumb recontacts with left held, upper-playfield dragging, and per-finger capture loss. Capture-loss movement is tested at an unobstructed spawn so collisions cannot invalidate the assertion. Pine shape and camera-plane clipping have unit coverage.

Physical Safari/iPhone frame pacing, thermal behaviour and touch reliability still require device testing. The pre-existing full game-smoke dodge assertion is not certified fixed by this pass. No audio changes.
