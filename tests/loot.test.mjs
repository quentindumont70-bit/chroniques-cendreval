import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,LOOT_TABLES,rollLoot,lootForEnemy,rarityLabel} from '../app/loot.ts';
test('all loot is unique, typed and chances stay within a probability',()=>{
 const ids=new Set();
 for(const item of Object.values(ITEMS)){assert(!ids.has(item.id));ids.add(item.id);assert(item.name&&item.description);assert(item.power>=0)}
 for(const entries of Object.values(LOOT_TABLES))for(const e of entries){assert(e.chance>0&&e.chance<=1);assert(ids.has(e.item.id))}
});
test('independent rolls permit no reward, multiple drops and fixed rare guarantees in tests',()=>{
 assert.deepEqual(rollLoot('ashKing',()=>.999),[]);
 assert.deepEqual(rollLoot('ashKing',()=>0).map(i=>i.id),['vigil','oath','crown']);
 assert.deepEqual(rollLoot('echo',()=>.001).map(i=>i.id),['fang','oath']);
 assert.throws(()=>rollLoot('elite',()=>1),RangeError);
});
test('boss and elite tables classify correctly; legendary has no pity timer',()=>{
 assert.equal(lootForEnemy(false,'sentinelle noire'),'elite');
 assert.equal(lootForEnemy(true,'Gardien des ruines'),'guardian');
 assert.equal(lootForEnemy(true,'roi de cendre'),'ashKing');
 assert.equal(lootForEnemy(true,'Nébuleux',3),'echo');
 assert.equal(lootForEnemy(false,'loup'),'ordinary');
 assert.equal(LOOT_TABLES.ashKing.find(e=>e.item.id==='crown').chance,.001);
 assert.equal(rarityLabel('legendary'),'Légendaire');
});
