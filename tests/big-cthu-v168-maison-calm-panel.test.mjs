import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V168: empty Maison deadlines compact only when every local source is readable',async()=>{
 const [html,js,css]=await Promise.all(['maison.html','maison-pulse.js','cinema-maison.css'].map(read));
 assert.match(html,/id="maisonPulse" data-has-items="unknown"/);
 assert.match(js,/panel\.dataset\.hasItems=data\.warnings\?'unknown':data\.total\?'true':'false'/);
 assert.match(js,/Aucune échéance dans les 30 prochains jours/);
 assert.match(css,/\.maison-pulse\[data-has-items="false"\] \.maison-pulse-list/);
 assert.match(css,/\.maison-pulse\[data-has-items="unknown"\]/);
 assert.match(js,/if\(data\.total>data\.entries\.length\)/);
});
test('V168: all deadlines remain linked, errors remain visible, no clinical module changes',async()=>{
 const [js,html,sw,tour]=await Promise.all(['maison-pulse.js','maison.html','sw.js','tournee-complete.html'].map(read));
 for(const path of ['./maison.html','./equipements.html','./entretiens.html'])assert.ok(js.includes(path));
 assert.match(js,/Certaines données locales sont illisibles/);
 assert.match(html,/id="maisonPulseStatus"/);
 assert.match(sw,/big-cthu-public-v2-v168/);
 assert.doesNotMatch(tour,/maison-pulse\[data-has-items|V168/);
});
