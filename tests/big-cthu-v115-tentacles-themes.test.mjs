import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const base=new URL('../big-cthu-beta/',import.meta.url);
const read=name=>readFile(new URL(name,base),'utf8');
const modules=['agenda.html','voyages.html','garde-manger.html','equipements.html','entretiens.html','depenses-maison.html','recettes.html','escalade.html','programmes.html','repas.html','capture.html'];

test('V115: onze tentacules utiles partagent les trois thèmes, même choix, aucun écran Tournée modifié',async()=>{
 for(const page of modules){
  const html=await read(page);
  assert.match(html,/data-cthu-theme-tentacle="yes"/,page);
  assert.match(html,/href="\.\/cockpit-themes\.css"/,page);
  assert.match(html,/src="\.\/cockpit-themes\.js"/,page);
  assert.ok(html.indexOf('src="./cockpit-themes.js"')<html.indexOf('<body'),'appearance loads before UI: '+page);
  assert.ok(html.indexOf('href="./cockpit-themes.css"')<html.indexOf('<body'),'style loads before UI: '+page);
 }
 const tournee=await read('tournee-complete.html');
 assert.doesNotMatch(tournee,/data-cthu-theme-tentacle/);
 assert.doesNotMatch(tournee,/cockpit-themes\.js/);
});

test('V115: les feuilles de style, scripts et pages demeurent disponibles dans le cache hors ligne',async()=>{
 const sw=await read('sw.js');
 const match=sw.match(/const ASSETS=\[([\s\S]*?)\];/);
 assert.ok(match);
 const assets=[...match[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
 assert.equal(assets.length,new Set(assets).size);
 for(const file of [...modules,'cockpit-themes.css','cockpit-themes.js'])assert.ok(assets.includes(file),'asset not precached: '+file);
 assert.match(sw,/big-cthu-public-v2-v115/);
});

test('V115: l apparence ne lit ni ecrit les donnees personnelles et reste locale',async()=>{
 const js=await read('cockpit-themes.js'),css=await read('cockpit-themes.css');
 assert.match(js,/big-cthu-cockpit-theme-v1/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|indexedDB|tidel_|Topaze/);
 assert.match(css,/body\[data-cthu-theme-tentacle="yes"\]/);
 for(const theme of ['premium','organic','medical'])assert.match(css,new RegExp('data-cthu-theme="'+theme+'"'));
});
