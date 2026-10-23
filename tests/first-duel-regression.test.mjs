import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

function segment(start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `Missing section: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Missing section boundary: ${end}`);
  return source.slice(from, to);
}

test("first guardian practice starts in a fair reproducible state", () => {
  const duel = segment("const prepareFirstDuel=()=>", "const preparePhaseTwo=()=>");
  for (const reset of [
    "s.quest=0", "s.shrines=7", "s.hp=100", "s.mana=100",
    "s.stamina=100", "s.enemyHp=70", "guardianPosture.current=100",
    "guardianPhase.current=1", "guardianLastStand.current=false",
    "duelFocus.current=0", "minions.current=[]",
  ]) assert.ok(duel.includes(reset), `Practice setup should include ${reset}`);
  assert.match(duel, /cooldown:1\.2/);
});

test("phase two and last stand practices preserve baseline reset", () => {
  const phaseTwo = segment("const preparePhaseTwo=()=>", "const prepareLastStand=()=>");
  const lastStand = segment("const prepareLastStand=()=>", "const claimReward=()=>");
  assert.match(phaseTwo, /prepareFirstDuel\(\)/);
  assert.match(phaseTwo, /guardianPhase\.current=2/);
  assert.match(lastStand, /prepareFirstDuel\(\)/);
  assert.match(lastStand, /guardianPhase\.current=2/);
});

test("guardian attack anticipation and defeat feedback are present", () => {
  for (const cue of [
    "PAREZ MAINTENANT", "ONDE IMBLOCABLE",
    "GARDE ÉBRANLÉE", "SE RELEVER · REJOUER LE DUEL",
    "PARADE PARFAITE", "POSTURE DU GARDIEN",
    "PREMIER GARDIEN VAINCU", "TEMPS DU DUEL",
  ]) assert.ok(source.includes(cue), `Missing combat feedback: ${cue}`);
});

test("touch combat and cursor capture both remain supported", () => {
  assert.match(source, /function touchControlsActive\(\)/);
  assert.match(source, /touchLook/);
  assert.match(source, /requestPointerLock/);
  assert.match(source, /e\.pointerType==="touch"/);
});
