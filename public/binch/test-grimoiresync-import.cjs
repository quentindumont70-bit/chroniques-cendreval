'use strict';
// GrimoireSync GF3-GF6 browser import contract: node public/binch/test-grimoiresync-import.cjs
// Runs exact production browser parser in isolation, without real player records or WoW access.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const begin=html.indexOf('function decode(s){');
const end=html.indexOf('function renderStatus(text',begin);
assert.ok(begin>0&&end>begin,'browser GrimoireSync parser must be present');
const parser=html.slice(begin,end);
const {parsePayload,payloadFromLua}=vm.runInNewContext(
 '(function(){'+parser+';return {parsePayload,payloadFromLua};})()',
 {JSON,Object,Number,String,Set,decodeURIComponent},
 {timeout:1000,filename:'binch-sync-import-parser.js'}
);
let count=0;
const check=(ok,why)=>{assert.ok(ok,why);count++};
const encode=encodeURIComponent;
const core='Bobinch,Forever,34,DRUID,Tauren,Horde,'+encode('Les Tarides')+',12745,1700000000,2000,4000,500';
const sections='|P:Minage,200,300;'+encode('Ingénierie')+',150,225'+
 '|Q:79976;6082;79976'+
 '|L:79192,'+encode('Stepping Stones')+',0;79976,'+encode('This Must Be The Place')+',1'+
 '|LS:QuestLogAPI|I:6948,1,0,1,1,0,'+encode('Pierre de foyer')+
 '|E:1111,16,2,'+encode('Épée')+'|AH:Forever,Horde,1700000000,0|A:';
const gf6='GF6|C:'+core+sections;
const parsed=parsePayload(gf6);
check(parsed.schema==='GF6'&&parsed.name==='Bobinch'&&parsed.level===34,'character and schema');
check(parsed.cls==='DRUID'&&parsed.race==='Tauren'&&parsed.faction==='Horde','class race faction');
check(parsed.zone==='Les Tarides'&&parsed.xp===2000&&parsed.xpMax===4000&&parsed.restedXP===500,'zone and XP');
check(parsed.questIds.length===2&&parsed.questIds[0]==='79976','tracked quests deduplicated');
check(parsed.questLog.length===2&&parsed.questLog[0].title==='Stepping Stones'&&parsed.questLog[1].complete,'quest log parsed');
check(parsed.questLogAPI==='QuestLogAPI','quest log provenance');
check(parsed.skills.Minage===200&&parsed.skills['Ingénierie']===150,'encoded profession');
check(parsed.inventory[0].name==='Pierre de foyer'&&parsed.inventory[0].id===6948,'inventory parsed');
check(parsed.equipment[0].name==='Épée'&&parsed.equipment[0].slot===16,'equipment parsed');
check(parsed.timestamp===1700000000,'timestamp parsed');
const luafile='GrimoireSyncDB = {\\n  ["payload"] = "'+gf6+'",\\n}';
check(parsePayload(luafile).schema==='GF6','savedvariables lua supported');
check(parsePayload('GF5|C:'+core+'|P:|Q:|L:|LS:unavailable|I:|E:').schema==='GF5','legacy schema accepted');
check(parsePayload('GF3|C:'+core+'|P:|Q:').schema==='GF3','oldest allowed schema');
assert.throws(()=>parsePayload('GF7|C:'+core),/Aucun payload|Format non pris en charge/);count++;
assert.throws(()=>parsePayload('GF6|C:Nope'),/Profil incomplet/);count++;
assert.throws(()=>parsePayload('GF6|C:Bobinch,Forever,61,DRUID,Tauren,Horde,Zone,0,1'),/Niveau ou personnage invalide/);count++;
assert.throws(()=>parsePayload('GF6|C:Bobinch,Forever,NaN,DRUID,Tauren,Horde,Zone,0,1'),/Niveau ou personnage invalide/);count++;
const noxp=parsePayload('GF6|C:Bobinch,Forever,11,DRUID,Tauren,Horde,Zone,0,1,0,0,0|P:|Q:');
check(noxp.xpMax===null&&noxp.questLogAPI==='unavailable','missing XP max and journal degrade gracefully');
const escapedLua='GrimoireSyncDB = { payload = "GF6|C:Bobinch,Forever,11,DRUID,Tauren,Horde,Zone,0,1,0,0,0|LS:'+encode('Quest Log')+'" }';
check(payloadFromLua(escapedLua).startsWith('GF6|'),'unbracketed Lua key supported');
console.log('GrimoireSync import: '+count+' assertions passed');
