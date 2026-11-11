# THE OUTBINCHED — First encounter vertical slice

Status: implementation design, not a claim of AAA production quality.
Target: immersive first-person 16-bit fantasy with deliberate, legible Souls-like combat.
Scope: Guardian of the Ruins, three existing disciplines (blade, bow, arcane), desktop + iPhone.

## Pillars
1. **Intent before spectacle.** Every attack has a unique silhouette, audio cue, wind-up, active contact and recovery.
2. **Earned mastery.** Perfect defense is a very short, teachable timing window. A normal block mitigates; an excellent parry changes the turn.
3. **Weight with control.** Short hit-stop only on confirmed impacts, tightly limited shake, strong but non-obscuring VFX, predictable lock-on and camera.
4. **Honest difficulty.** The player's mistake must be attributable to a readable decision; no off-screen phantom hits, unavoidable animation chains or hidden cooldowns.
5. **Preserve an accessible touch version.** Combat stays possible at mobile frame rates and when pointer lock is unavailable.

## Boss: The Ash Warden / Le Gardien des Ruines
Silhouette: massive asymmetrical stone-and-iron armor; fractured ember core, hammer-sword, luminous left arm. Shape hierarchy first; pixel detail second.
Opening: dust rolls outward, ring of embers ignites, brief silhouette reveal, then player control. Intro is skippable and must not steal input.
Phase 1, 100–50% HP: three teaching attacks.
- **Ash Sweep / Balayage:** clear lateral wind-up, horizontal crescent. Blockable; a well-timed parry yields high posture damage. Recovery opens a melee riposte.
- **Piercing Lunge / Estocade:** weapon draws backward and center reticle tightens before linear commitment. Dodge sideways; a perfect dodge places the player at flank.
- **Stone Crush / Écrasement:** delayed overhead wind-up (intentional rhythm break), heavier chip damage on normal guard. Sidestep or late parry. The blade should remain visibly suspended during the delay.
Phase transition at 50%: stagger and ember-core eruption, short invulnerability, camera-safe contrast and readable reset. Does not hit player during cinematic.
Phase 2, 50–0%: add mix-ups without invalidating taught rules.
- **Cinder Break / Rupture:** unmistakable two-stage vertical glow and bass warning, radial unblockable shockwave; dodge on pulse, never parry. Successful dodge grants a short counter window.
- **False Crush / Feinte:** overhead telegraph briefly cancels, foot pivots, then slash; advanced test of reactive defense. The fake and real releases must have distinct cues.
- **Last Stand / Dernier souffle:** desperation rhythm with fast–slow–fast pattern, each strike separately escapable. Follow-up ends in a generous punish window.
Death: core shatters, armor loses weight, screen-space dust trails and low-frequency decay; end-card names the concrete skill the player demonstrated.

## 3 playable paths — distinct defensive rewards
**Blade / Voie de l'épée**: close-range one-two chain; perfect parry instantly recovers stamina, opens heavy riposte and breaks boss posture. Wide arc for crowd control. Skill ceiling: deliberate cancel restrictions and rhythm.
**Bow / Rôdeur**: swift low-damage shot, committed charged/precision strike on recovery, lateral dodge can restore an arrow; punish exposed ember core during stagger. Maintain readable aiming and ammo.
**Arcane / Mage**: low-cost ember bolt, chargeable piercing burst, ground-burning special. Perfect defense refunds mana; short cast punish windows and clear telegraphs for resource decisions.
Avoid adding fourth/fifth class until each path can complete and enjoy the full duel with genuinely different rhythms.

## Impact language
- Normal hit: 25–40 ms camera freeze at most; impact flash on *enemy*, small positional recoil and mid-frequency weapon sound.
- Heavy confirmed hit: 50–70 ms bounded hit-stop, deeper transient, directional particles and 1–2 px recoil at the native render resolution.
- Perfect parry: metallic high transient with bass tail, 60–90 ms local freeze, golden concentric sparks, immediate enemy recoil and temporary lock-on emphasis. Give a short actionable riposte cue.
- Perfect dodge: one translucent afterimage, brief audio low-pass then restoration, optional micro-slowdown (must not alter fairness unpredictably), stamina feedback.
- Failed defense: clearly distinct sound and animation; a guard break cannot read like a parry.
- Color: never rely solely on color; icon/shape/sound/timing must all convey blockable vs unblockable.
- Settings: independent screen shake intensity, sound effects volume, reduced motion. Keep legibility at 426×240 canvas and iPhone portrait/landscape.

## Implementation checkpoints
A. Contract tests for opening reset, classes, telegraphs, safety rules, touch input.
B. Refactor boss attack scheduling into explicit wind-up/active/recovery states, preserving saved games.
C. Implement response-specific defensive feedback with deterministic timing, no unbounded hit-stop.
D. Distinct discipline animations and active frames, with boss posture interactions.
E. Phase transition, last stand, death choreography, mobile UX and tactile QA.
F. Run `npm test`, `npm run build`, `npm run lint`, desktop and iPhone manual playtests. Record actual results. No 'AAA complete' label without gameplay review.

## Definition of done
Playable from fresh start to boss victory and death/retry; each attack's wind-up identifies it without text; each class has a fun win route; parry, perfect parry and dodge feel unmistakably different; restart state reproducible; no input lock on iPhone; performance acceptable in the opening arena; automated test/build output documented.

## Review gates
Keep work on feature branch; do not merge into main or overwrite live deployment before tests and gameplay feedback. Preserve existing characters, progression and local storage compatibility.
