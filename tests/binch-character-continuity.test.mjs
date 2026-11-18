import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function probe(file,marker,bindings,rows={}){
 const source=readFileSync(new URL('../public/binch/'+file,import.meta.url),'utf8');
 assert.ok(source.includes(marker),file+' probe insertion point');
 const storage=new Map(Object.entries(rows));
 const localStorage={getItem:k=>storage.get(k)??null,key:i=>[...storage.keys()][i]??null,get length(){return storage.size}};
 const sandbox={localStorage,document:{readyState:'loading',addEventListener(){}},window:{}};
 runInNewContext(source.replace(marker,'globalThis.__probe={'+bindings+'};\n'+marker),sandbox,{filename:file});
 return sandbox.__probe;
}

test('Sauvegarde portable: conserve Faith, talents et AH sans exporter le dernier import brut',()=>{
 const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();";
 const b=probe('local-backup.js',marker,'eligible,validValue,collect',{
  'grimoire.hub.v3':'{"data":{"pseudo":"Bobinch"}}',
  'binch.faith.goal.v1':'class',
  'binch.specs.focus.v1':'{"id":"druid-feral","pinned":true}',
  'binch.ah.trading.v1':'{"view":"dashboard"}',
  'binch.leveling.log.v1.bobinch.tauren.druide':'[]',
  'grimoire.bridge.last':'{"name":"Bobinch","inventory":[{"id":1,"count":4}]}',
  'binch.ah.feed.cache.v1':'{"stale":true}',
  'binch.guild.invalid.v1':'not-json'
 });
 const rows=b.collect();
 assert.equal(rows['binch.faith.goal.v1'],'class');
 assert.equal(JSON.parse(rows['binch.specs.focus.v1']).id,'druid-feral');
 assert.equal(JSON.parse(rows['binch.ah.trading.v1']).view,'dashboard');
 assert.ok(rows['binch.leveling.log.v1.bobinch.tauren.druide']);
 assert.equal(rows['grimoire.bridge.last'],undefined);
 assert.equal(rows['binch.ah.feed.cache.v1'],undefined);
 assert.equal(rows['binch.guild.invalid.v1'],undefined);
 assert.equal(b.validValue('binch.faith.goal.v1','not-an-option'),false);
 assert.equal(b.validValue('binch.faith.goal.v1','balanced'),true);
 assert.equal(b.eligible('constructor'),false);
});

test('Faith: farouche pex distinct du tank, stocks invalides exclus, royaume respecté',()=>{
 const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();";
 const profile={race:'Tauren',classe:'Druide',data:{pseudo:'Bobinch',level:32,realm:'Forever',spec:'Farouche'}};
 const last={name:'Bobinch',realm:'Forever',level:32,zone:'Orneval',inventory:[
  {id:2770,count:4},{id:2770,count:0},{id:2770,count:-3},{id:2835,count:'non numérique'}]};
 const f=probe('faith-strategist.js',marker,'snapshot,recommendations',{
  'grimoire.hub.v3':JSON.stringify(profile),'grimoire.bridge.last':JSON.stringify(last)
 });
 const p=f.snapshot();
 assert.equal(p.same,true);
 assert.equal(p.copper,4);
 assert.equal(p.stones,0);
 assert.equal(p.zone,'Orneval');
 const choices=f.recommendations(p,'class');
 assert.ok(choices.some(x=>x.title==='Suivre le build Farouche — pex'&&x.page==='specs'));
 assert.ok(!choices.some(x=>x.title==='Préparer ton équipement tank'));
 const mismatch=probe('faith-strategist.js',marker,'snapshot',{
  'grimoire.hub.v3':JSON.stringify(profile),
  'grimoire.bridge.last':JSON.stringify({...last,realm:'Autre serveur'})
 });
 assert.equal(mismatch.snapshot().same,false);
 assert.equal(mismatch.snapshot().copper,0);
});
