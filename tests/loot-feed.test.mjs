import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const cache={};
function load(path){if(cache[path])return cache[path];const source=readFileSync(new URL('../app/'+path+'.ts',import.meta.url),'utf8');const module={exports:{}};new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(id.replace('./','')),module,module.exports);return cache[path]=module.exports}
const {ITEMS}=load('loot');const {appendLootEvents,lootAnnouncement,recentLoot}=load('loot-feed');
test('multiple copies combine into one notification',()=>{const feed=appendLootEvents([],[ITEMS.ash,ITEMS.ash,ITEMS.crown],'Roi',1000);assert.equal(feed.length,2);assert.equal(feed[0].count,2);assert.match(lootAnnouncement(feed[1]),/Légendaire/)});
test('feed is bounded to twelve entries',()=>{let feed=[];for(let i=0;i<20;i++)feed=appendLootEvents(feed,[ITEMS.ash],'Ombre',i);assert.equal(feed.length,12);assert.equal(feed[0].at,8)});
test('expired and future notifications are hidden',()=>{const feed=appendLootEvents([],[ITEMS.iron],'Garde',1000);assert.equal(recentLoot(feed,900).length,0);assert.equal(recentLoot(feed,10000).length,0);assert.equal(recentLoot(feed,2000).length,1)});
