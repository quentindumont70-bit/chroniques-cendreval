import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V177: cockpit resume cards navigate directly to live target lists',async()=>{
 const [js,agenda,capture,studio]=await Promise.all(['active-pulse.js','agenda.html','capture.html','musique.html'].map(read));
 for(const [kind,route,id,html] of [
  ['Agenda','./agenda.html#events','events',agenda],
  ['Captures','./capture.html#list','list',capture],
  ['Musique','./musique.html#studio-list','studio-list',studio]
 ]){
  assert.ok(js.includes("kind:'"+kind+"',url:'"+route+"'"),kind);
  assert.ok(html.includes('id="'+id+'"'),kind);
 }
 assert.match(capture,/<option value="inbox" selected>À traiter<\/option>/);
 assert.match(agenda,/<option value="upcoming">À venir<\/option>/);
});

test('V177: navigation only, same local data and independent clinical application',async()=>{
 const [js,sw,tour]=await Promise.all(['active-pulse.js','sw.js','tournee-complete.html'].map(read));
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|XMLHttpRequest/);
 assert.match(sw,/big-cthu-public-v2-v177/);
 assert.doesNotMatch(tour,/V177|#studio-list|#events/);
});
