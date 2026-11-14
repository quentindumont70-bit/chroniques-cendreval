import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V159: Nutrition has three cinematic worlds with stable functional regions',async()=>{
 const [html,css,sw]=await Promise.all(['nutrition.html','cinema-nutrition.css','sw.js'].map(read));
 assert.match(html,/data-cthu-area="nutrition"/);
 assert.match(html,/href="\.\/cinema-nutrition\.css"/);
 assert.ok(html.indexOf('cinema-nutrition.css')>html.indexOf('cockpit-themes.css'));
 for(const theme of ['premium','organic','medical'])assert.ok(css.includes('data-cthu-theme="'+theme+'"'));
 for(const part of ['.hero','.hub-grid','.hub-action','.attention','.panel'])assert.ok(css.includes(part));
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(sw,/big-cthu-public-v2-v159/);
 assert.match(sw,/'\.\/cinema-nutrition\.css'/);
});
test('V159: same pantry and meals, no clinic changes or client data migration',async()=>{
 const [html,css,tour]=await Promise.all(['nutrition.html','cinema-nutrition.css','tournee-complete.html'].map(read));
 for(const id of ['nh-stock-count','nh-recipes-count','nh-meals-count','nh-attention-list','nh-status'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const href of ['./garde-manger.html','./recettes.html','./repas.html'])
  assert.ok(html.includes('href="'+href+'"'));
 assert.match(html,/src="\.\/nutrition-hub\.js"/);
 assert.doesNotMatch(css,/localStorage|fetch\(|indexedDB|XMLHttpRequest|@import|<script/i);
 assert.doesNotMatch(tour,/cinema-nutrition\.css|V159/);
});
