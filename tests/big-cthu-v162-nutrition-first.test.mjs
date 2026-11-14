import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V162: nutrition attention appears before optional recipe and meal links',async()=>{
 const [html,css,js,sw]=await Promise.all(['nutrition.html','cinema-nutrition.css','nutrition-hub.js','sw.js'].map(read));
 const attention=html.indexOf('id="nutritionAttention"');
 const hub=html.indexOf('class="hub-grid"');
 assert.ok(attention>0&&hub>attention,'attention must appear before navigation cards');
 assert.match(html,/id="nutritionAttention" aria-label="Produits à surveiller" data-has-alerts="unknown"/);
 assert.match(html,/id="nh-attention-list"/);
 assert.match(html,/id="nh-status"/);
 assert.match(js,/attentionPanel\.dataset\.hasAlerts=data\.attention\.length\?'true':data\.warnings\?'unknown':'false'/);
 assert.match(css,/#nutritionAttention\[data-has-alerts="false"\]/);
 assert.match(css,/#nutritionAttention\[data-has-alerts="unknown"\]/);
 assert.match(sw,/big-cthu-public-v2-v162/);
});
test('V162: source keys, food safety notice and Tournee isolation maintained',async()=>{
 const [html,js,tour]=await Promise.all(['nutrition.html','nutrition-hub.js','tournee-complete.html'].map(read));
 for(const path of ['./garde-manger.html','./recettes.html','./repas.html','./sauvegardes.html'])assert.ok(html.includes('href="'+path+'"'),path);
 for(const key of ['big-cthu-v2-pantry-v1','big-cthu-v2-recipes-v1','big-cthu-v2-meals-v1'])assert.ok(js.includes(key),key);
 assert.match(html,/Pour une DLC dépassée, ne consomme pas le produit/);
 assert.doesNotMatch(js,/localStorage\.setItem|indexedDB|fetch\(/);
 assert.doesNotMatch(tour,/nutritionAttention|V162/);
});
