# Faceted character pass

Reference: public/ash-warden-v1.png. The silhouette, horned helmet, dark plate,
bronze edges, layered shoulders and split cloak were interpreted manually in 3D.
Side/back volumes are authored interpretations, not recovered from the image.

Ten blocks: tapered mesh renderer; chest/waist; helmet/horns/visor; hip/knee rig;
shoulder/elbow/wrist rig; cape/hood; wrist-mounted hammer/bow; dual blades;
breathing/recoil/death; integration, locomotion tracking and regressions.

Characters now use eight-sided tapered sections and joint-oriented bone segments
instead of box bodies. This is a procedural skeletal-style rig, not imported
motion capture or a skinned GLTF asset. Terrain and existing scenery are unchanged.
Each character stays below 80 parts; face count per part is higher than a box.
Physical iPhone performance still needs testing; no device FPS claim is made.

Validation: npm test, game typecheck, pose determinism/finite geometry/budget tests,
and browser render inspection. The earlier full-game dodge smoke issue is unchanged.
