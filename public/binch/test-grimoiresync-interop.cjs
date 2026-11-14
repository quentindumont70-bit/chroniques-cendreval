'use strict';
// Receives the actual Lua 5.1 mock addon output from stdin, not a hand-written JS fixture.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const start=html.indexOf('function decode(s){');
const end=html.indexOf('function renderStatus(text',start);
assert.ok(start>0&&end>start,'production browser parser available');
const code=html.slice(start,end);
const parsePayload=vm.runInNewContext('(function(){'+code+';return parsePayload;})()',
 {decodeURIComponent,Object,Number,String,Set,JSON},{filename:'binch-browser-sync-parser.js'});
let input='';
process.stdin.setEncoding('utf8');
process.stdin.on('data',chunk=>input+=chunk);
process.stdin.on('end',()=>{
 const p=parsePayload(input.trim());
 assert.equal(p.schema,'GF6');
 assert.equal(p.name,'Golipette-QA');
 assert.equal(p.realm,'Forever');
 assert.equal(p.level,34);
 assert.equal(p.cls,'DRUID');
 assert.equal(p.faction,'Horde');
 assert.equal(p.zone,'Les Tarides');
 assert.equal(p.xp,2500);
 assert.equal(p.xpMax,4000);
 assert.equal(p.restedXP,600);
 assert.equal(p.skills.Minage,180);
 assert.ok(p.questIds.includes('79976'));
 assert.equal(p.questLog[0].title,'Stepping Stones');
 assert.equal(p.questLog[0].id,79192);
 assert.equal(p.questLogAPI,'GetQuestLogTitle');
 console.log('GrimoireSync real Lua -> browser parser: 15 assertions passed');
});
