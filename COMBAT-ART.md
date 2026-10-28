# Combat presence pass

Ten commits: infantry armour; hooded archer and quiver; heavy raider silhouette;
ordinary enemy anticipation/recoil; compact lower parry cue; correct ordinary-enemy
attack announcements; shrine masonry and ground integration; restrained voxel
outlines/speckles; quieter damp meadow pigments; segmented bow and visible arrow.

The cue timing is unchanged; its radius is capped at 19 scene pixels and its centre
is below the enemy's face. A unit test covers the visual bound and timing constants.

Validation: existing npm test and game typecheck pass; new parry visual unit test
passes; mobile two-thumb browser regression passes all eight recontacts and capture
loss. No changes to touch gesture logic, audio or damage formulas. Physical iPhone
performance remains unmeasured. The earlier full-game dodge assertion remains open.
