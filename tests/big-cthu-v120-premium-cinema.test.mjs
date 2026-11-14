import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V120: la prévisualisation Premium possède un véritable visuel photo, pas un faux fond CSS',async()=>{
 const source=await read('premium-cinema.html');
 assert.match(source,/\.page:before\{[^}]*images\.unsplash\.com\/photo-/);
 assert.match(source,/background-position:58% 44%/);
 assert.match(source,/\.page:before\{[^}]*position:fixed/);
 assert.match(source,/.hero:before\{[^}]*linear-gradient/);
 assert.match(source,/vue alpine est une photographie/);
 assert.match(source,/Fabrizio Lunardi sur Unsplash/);
});

test('V120: interface véritablement recomposée, iPhone et desktop différenciés',async()=>{
 const source=await read('premium-cinema.html');
 assert.match(source,/class="topinner"/);
 assert.match(source,/class="hero-content"/);
 assert.match(source,/class="panel-grid"/);
 assert.match(source,/class="module tournee special"/);
 assert.match(source,/class="mobile-dock"/);
 assert.match(source,/@media\(max-width:760px\)/);
 assert.match(source,/prefers-reduced-motion:reduce/);
 assert.match(source,/background-image:url\("https:\/\/images\.unsplash\.com\/photo-/);
 assert.match(source,/class="lower"/);
});

test('V120: preview isolée, sans import, modification patient ou faux indicateurs chiffrés',async()=>{
 const source=await read('premium-cinema.html');
 assert.doesNotMatch(source,/<script\b/);
 assert.doesNotMatch(source,/localStorage|indexedDB|tidel_|Topaze|crypto\.subtle/i);
 assert.match(source,/Aucune donnée personnelle chargée/);
 assert.match(source,/sans simuler de statistiques/);
 const tournee=await read('tournee-complete.html');
 assert.doesNotMatch(tournee,/premium-cinema\.html/);
});

test('V120: liens fonctionnels vers modules réels et publication strictement allowlistée',async()=>{
 const [source,sw]=await Promise.all(['premium-cinema.html','sw.js'].map(read));
 for(const module of ['index.html','tournee-complete.html','maison.html','agenda.html','budget.html','passions.html','escalade.html']){
  assert.ok(source.includes('./'+module),'lien absent : '+module);
 }
 assert.match(sw,/'\.\/premium-cinema\.html'/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 const shellList=sw.slice(sw.indexOf('const ASSETS=['),sw.indexOf('];',sw.indexOf('const ASSETS=['))+2);
 assert.doesNotMatch(shellList,/images[.]unsplash[.]com/,'no third-party image in the mandatory shell list');
});
