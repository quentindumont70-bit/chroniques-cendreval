import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V133: quatre raccourcis locaux adaptés aux vrais gestes quotidiens',async()=>{
 const html=await read('index.html');
 const start=html.indexOf('<nav class="cthu-mobile-dock"');
 const end=html.indexOf('</nav>',start);
 assert.ok(start>0&&end>start);
 const dock=html.slice(start,end);
 assert.equal((dock.match(/<a href=/g)||[]).length,4);
 for(const href of ['#activePulse','./tournee-complete.html','./maison.html','./capture.html'])assert.ok(dock.includes('href="'+href+'"'),href);
 assert.match(dock,/aria-label="Accès rapides iPhone"/);
 assert.match(html,/id="activePulse"/);
});

test('V133: barre masquée sur ordinateur, quatre cibles tactiles sur téléphone',async()=>{
 const css=await read('cockpit-themes.css');
 assert.match(css,/\.cthu-mobile-dock\{display:none\}/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/min-height:52px/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/\.cthu-mobile-dock a:focus-visible/);
});

test('V133: aucun lien externe ni modification de Tournée ou des données privées',async()=>{
 const [html,tour,sw]=await Promise.all(['index.html','tournee-complete.html','sw.js'].map(read));
 const dock=html.slice(html.indexOf('<nav class="cthu-mobile-dock"'),html.indexOf('</nav>',html.indexOf('<nav class="cthu-mobile-dock"')));
 assert.doesNotMatch(dock,/https?:\/\/|javascript:|onclick|data:|localStorage|indexedDB/);
 assert.doesNotMatch(tour,/cthu-mobile-dock/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
});
