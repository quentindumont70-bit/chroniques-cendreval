# Five art passes

1. Characters: separate overhead, sweep, thrust and bow poses; alternating lifted feet; grounded idle feet; asymmetrical equipment; layered shoulder/waist armour; sword and offhand shield for infantry.
2. First person: forged blade silhouette, ridge/fullers, leather grip, visible gauntlet and kite shield with rivets and impact response.
3. Vegetation: sloping three-ring crown meshes, tapered wood and roots across oak, birch and pine, preserving authored placement and mobile part budgets.
4. Architecture: broken vaulted arches with missing voussoirs, fluted pillars, fallen masonry, chipped monuments and polygonal wagon wheels.
5. Integration: warm highlights, softer meadow shadows and distance texture, actor contact shadows and reduced distant polygon detail.

Tests: full npm test and game typecheck pass. Added attack-pose distinction, planted feet, sloped crown coverage and distant mesh integrity tests. Existing full-game dodge timing issue is not claimed fixed. No changes to touch controls, audio or combat damage/timing.

Limits: these are authored procedural assets, not imported production character art or motion capture. Physical iPhone performance is unmeasured; distant polygon reduction mitigates added geometry but does not certify frame rate. No claim of final AAA art quality.
