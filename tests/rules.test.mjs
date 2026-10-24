import test from 'node:test';
import assert from 'node:assert/strict';
import {canOccupy,slideMove,clearSight,decodeProgress} from '../app/world-rules.ts';
const map=['111111','100001','101101','100001','111111'];
const defaults={x:1.5,y:1.5,a:0,hp:100,mana:80,stamina:100,quest:0,shrines:0,lore:0,checkpoint:0,enemyHp:220,potions:2,arrows:14,level:1,gold:0,talent:0,xp:0,echoTier:0,echoBest:0,shadeMask:0,wardenVersion:2,spec:'blade',relic:'none',courtBoon:'none',supplies:false};
test('swept movement cannot teleport through walls, and slides along them',()=>{const p=slideMove(map,1.5,1.5,0,3);assert(canOccupy(map,p.x,p.y));assert(p.y<3.84);const q=slideMove(map,1.5,1.5,3,1.5);assert(canOccupy(map,q.x,q.y));assert(q.x>3)});
test('character radius keeps the camera away from walls',()=>{assert(!canOccupy(map,1.05,1.5));assert(canOccupy(map,1.2,1.5))});
test('walls block incoming and outgoing attack lines',()=>{assert(!clearSight(map,1.5,2.5,4.5,2.5));assert(clearSight(map,1.5,1.5,4.5,1.5));assert(clearSight(map,1.5,1.5,1.5,3.5))});
test('damaged saves clamp resources, reject unknown classes and relocate out of walls',()=>{const p=decodeProgress(JSON.stringify({x:2.5,y:2.5,hp:999,mana:-10,arrows:999,quest:999,spec:'broken',level:-4,a:999,wardenVersion:2}),defaults,()=>map);assert.equal(p.hp,100);assert.equal(p.mana,0);assert.equal(p.arrows,30);assert.equal(p.quest,16);assert.equal(p.spec,'blade');assert.equal(p.level,1);assert(canOccupy(map,p.x,p.y));assert(Math.abs(p.a)<=Math.PI)});
test('legacy guardian health migrates without resetting completion',()=>{const old=decodeProgress(JSON.stringify({enemyHp:35,quest:0}),defaults,()=>map);assert.equal(old.enemyHp,110);const finished=decodeProgress(JSON.stringify({enemyHp:0,quest:1}),defaults,()=>map);assert.equal(finished.enemyHp,0);assert.equal(finished.quest,1)});
test('invalid save structures fail cleanly for backup recovery',()=>{for(const raw of ['{oops','null','[]','"hello"'])assert.throws(()=>decodeProgress(raw,defaults,()=>map))});

test('blocked pursuit finds an open route around the wall',async()=>{const {pursuitPoint}=await import('../app/world-rules.ts');const next=pursuitPoint(map,1.5,2.5,4.5,2.5);assert(canOccupy(map,next.x,next.y));assert(next.y!==2.5);const direct=pursuitPoint(map,1.5,1.5,4.5,1.5);assert.deepEqual(direct,{x:4.5,y:1.5})});
