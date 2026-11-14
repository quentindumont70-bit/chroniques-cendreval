import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V160: Maison puts frequent destinations first and folds other tools safely',async()=>{
 const html=await read('maison.html');
 const s=html.indexOf('<nav class="maison-essential-links"');
 const m=html.indexOf('<details class="maison-extra-links">',s);
 const e=html.indexOf('</details>',m);
 assert.ok(s>0&&m>s&&e>m);
 const essential=html.slice(s,m);
 const additional=html.slice(m,e);
 for(const dest of ['./equipements.html','./entretiens.html'])assert.ok(essential.includes('href="'+dest+'"'));
 for(const dest of ['./depenses-maison.html','./registre-maison.html','./contrats.html','./consommations.html','./sauvegardes.html'])assert.ok(additional.includes('href="'+dest+'"'));
 assert.doesNotMatch(html.slice(m,m+75),/\sopen(?:\s|>)/);
 assert.match(html,/\.maison-extra-links summary:focus-visible/);
 assert.match(html,/@media\(max-width:600px\)/);
});
test('V160: maintains all Maison functions and cache, without modifying Tournee',async()=>{
 const [html,sw,tour]=await Promise.all(['maison.html','sw.js','tournee-complete.html'].map(read));
 for(const id of ['form','name','maisonAddOptions','maisonPulse','total','progress','budget','export','import'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/big-cthu-v2-maison-v1/);
 assert.match(sw,/big-cthu-public-v2-v160/);
 assert.doesNotMatch(tour,/maison-essential-links|V160/);
});
