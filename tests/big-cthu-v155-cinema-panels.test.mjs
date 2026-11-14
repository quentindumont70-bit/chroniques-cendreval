import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V155: cockpit action panels form responsive cinematic dashboard',async()=>{
 const [css,home]=await Promise.all(['cinema-upgrade.css','index.html'].map(read));
 for(const part of ['#activePulse','#nextSession','#radar','#priorities','#fastAccess','.active-pulse-list','.cthu-radar-link'])
  assert.ok(css.includes(part),part);
 assert.match(css,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
 assert.match(css,/\.live-dashboard > #activePulse\{grid-column:span 7\}/);
 assert.match(css,/\.live-dashboard > #nextSession\{grid-column:span 5\}/);
 assert.match(css,/@media\(max-width:1040px\)/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.active-pulse-list\{grid-template-columns:1fr\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 for(const id of ['activePulse','nextSession','radar','priorities','fastAccess'])
  assert.equal((home.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
});

test('V155: purely presentational assets, no data duplication or Topaze change',async()=>{
 const [css,sw,tour]=await Promise.all(['cinema-upgrade.css','sw.js','tournee-complete.html'].map(read));
 assert.doesNotMatch(css,/localStorage|fetch\(|indexedDB|XMLHttpRequest|@import|<script/i);
 assert.match(sw,/big-cthu-public-v2-v155/);
 assert.match(sw,/'\.\/cinema-upgrade\.css'/);
 assert.doesNotMatch(tour,/V155|cinema-upgrade\.css/);
});
