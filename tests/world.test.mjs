import {test} from 'node:test';
import assert from 'node:assert/strict';
import {castRay} from '../app/raycast.ts';
import {PLAINS_MAP,mapForQuest} from '../app/world-map.ts';
import {remainingToImpact,impactDelay,parryLead,TOUCH_GUARD_DELAY,TOUCH_PERFECT_WINDOW} from '../app/parry-cue.ts';
function reachable(map,from,to){const seen=new Set(),queue=[from];while(queue.length){const [x,y]=queue.shift(),key=`${x},${y}`;if(seen.has(key)||map[y]?.[x]!=='0')continue;if(x===to[0]&&y===to[1])return true;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy])}return false}
test('all shrines, the Warden and castle gate are reachable from the start',()=>{for(const target of [[7,14],[15,10],[8,5],[10,8],[16,3]])assert(reachable(PLAINS_MAP,[3,16],target),`unreachable ${target}`)});
test('castle encounter spawns are walkable and connected',()=>{for(const [quest,spawn,boss] of [[7,[15,4],[10,6]],[10,[10,8],[10,5]],[12,[10,9],[10,5]],[14,[10,15],[10,4]]])assert(reachable(mapForQuest(quest),spawn,boss),`quest ${quest}`)});
test('grid ray hits exact cardinal walls and terminates at range limit',()=>{const map=['11111','10001','10001','10001','11111'];for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){const hit=castRay(map,2.5,2.5,a);assert.equal(hit.hit,1);assert(Math.abs(hit.distance-1.5)<1e-6)}assert.equal(castRay(map,2.5,2.5,0,1).hit,0)});
test('parry cue follows windup and strike damage point including delayed feints',()=>{for(const intent of ['sweep','crush','lunge','slam','shot']){assert.equal(remainingToImpact({intent,telegraph:.2}),.2+impactDelay(intent));assert.equal(remainingToImpact({intent,telegraph:0,impactDone:true,strike:.15}),Infinity)}assert.equal(remainingToImpact({telegraph:0,strike:.18,intent:'sweep'}),.09);assert.equal(remainingToImpact({telegraph:.5,intent:'crush'}),.69)});
test('touch hold beginning at the cue leaves perfect guard active at impact',()=>{const cue=parryLead(true),hold=TOUCH_GUARD_DELAY,perfect=TOUCH_PERFECT_WINDOW;for(const reaction of [0,.1,.18]){assert(cue>hold+reaction);assert(cue<hold+reaction+perfect)}});
