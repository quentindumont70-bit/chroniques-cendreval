import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V170: Capture and Agenda use one cinematic design with three themes',async()=>{
 const css=await read('cinema-daily.css');
 for(const page of ['capture.html','agenda.html']){
  const html=await read(page);
  assert.match(html,/data-cthu-area="daily"/);
  assert.match(html,/data-cthu-theme-tentacle="yes"/);
  assert.match(html,/href="\.\/cinema-daily\.css"/);
  assert.ok(html.indexOf('href="./cinema-daily.css"')>html.indexOf('href="./cockpit-themes.css"'));
  assert.match(html,/class="cthu-daily-flow"/);
 }
 for(const world of ['premium','organic','medical'])assert.ok(css.includes('data-cthu-theme="'+world+'"')||world==='premium');
 for(const item of ['.card','.panel','.status','.notice','.cthu-daily-flow','.capture-more','.agenda-more','.event'])assert.ok(css.includes(item),item);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.doesNotMatch(css,/localStorage|indexedDB|fetch\(|XMLHttpRequest|@import|<script/i);
});

test('V170: all live flows, cache and clinical isolation preserved',async()=>{
 const [capture,agenda,sw,tour]=await Promise.all(['capture.html','agenda.html','sw.js','tournee-complete.html'].map(read));
 for(const id of ['form','title','target','captureMore','filter','list'])assert.ok(capture.includes('id="'+id+'"'));
 for(const id of ['form','title','date','agendaMore','events','ical'])assert.ok(agenda.includes('id="'+id+'"'));
 assert.match(capture,/KEY='big-cthu-v2-inbox-v1'/);
 assert.match(agenda,/KEY='big-cthu-v2-agenda-v1'/);
 assert.match(sw,/big-cthu-public-v2-v170/);
 assert.match(sw,/'\.\/cinema-daily\.css'/);
 assert.doesNotMatch(tour,/cinema-daily\.css|V170/);
});
