import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V132: anciens modules et compteurs deviennent repliables sans être supprimés',async()=>{
 const html=await read('index.html');
 assert.match(html,/<details class="panel cthu-legacy-details" id="legacySection"><summary>/);
 assert.doesNotMatch(html,/<details[^>]*id="legacySection"[^>]*\sopen[\s>]/);
 assert.match(html,/id="section" aria-live="polite"/);
 assert.match(html,/id="completed"/);
 assert.match(html,/id="remaining"/);
 assert.match(html,/id="cthuCatalogToggle"/);
 assert.match(html,/id="nextSession"/);
 assert.match(html,/id="activePulse"/);
 assert.match(html,/href="\.\/tournee-complete\.html"/);
});

test('V132: cliquer une ancienne tentacule ouvre automatiquement sa fiche conservée',async()=>{
 const html=await read('index.html');
 const code=html.slice(html.indexOf('function renderProfile(){'),html.indexOf('function renderTasks(){'));
 assert.match(code,/const older=\$\('#legacySection'\);if\(older\)older\.open=true;/);
 assert.match(code,/const h=\$\('#section'\);h\.replaceChildren\(\)/);
 assert.match(code,/descriptions\[i\[3\]\]/);
});

test('V132: anciennes pages accessibles par le catalogue et la recherche',async()=>{
 const html=await read('index.html');
 assert.match(html,/catalogExpanded\|\|dailyCockpit\[profile\]/);
 assert.match(html,/const matches=i=>/);
 for(const name of ['Sanctuaire RPG','Cerveau Cthu','Boîte à outils','Discobinch'])assert.ok(html.includes(name),name);
});

test('V132: panneau tactile et cache actualisé sans modifier Tournée ou les sauvegardes',async()=>{
 const [css,sw,tournee]=await Promise.all(['cockpit-themes.css','sw.js','tournee-complete.html'].map(read));
 assert.match(css,/\.cthu-legacy-details summary\{/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/summary:focus-visible/);
 assert.match(sw,/big-cthu-public-v2-v132/);
 assert.doesNotMatch(tournee,/cthu-legacy-details|legacySection/);
});
