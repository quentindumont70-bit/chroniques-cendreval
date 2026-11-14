import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V150: index officiel reprend la scène cinématique et ses trois décors',async()=>{
 const [index,premium,organic,medical,sw]=await Promise.all(
  ['index.html','premium-cinema.html','organic-cinema.html','medical-ops-cinema.html','sw.js'].map(read));
 assert.match(index,/<title>Big Cthu · Cockpit cinématographique<\/title>/);
 assert.match(index,/class="page"/);
 assert.match(index,/class="topbar container"/);
 assert.match(index,/class="scene-stamp"/);
 assert.match(index,/class="panel-grid"/);
 assert.match(index,/Ton monde\.<br><em>Sous contrôle\.<\/em>/);
 for(const [src,page] of [
  ['photo-1649401691853-6ecfa00f044e',premium],
  ['photo-1523486230352-65ff5222cea4',organic],
  ['photo-1648565726114-cfb73eb46340',medical]
 ]){assert.ok(page.includes(src));assert.ok(index.includes(src))}
 for(const mood of ['premium','organic','medical'])assert.ok(index.includes('data-cthu-choice="'+mood+'"'));
 assert.match(sw,/big-cthu-public-v2-v150/);
});

test('V150: modules vivants et scripts existants présents, sans migration de données',async()=>{
 const html=await read('index.html');
 for(const id of ['cthuThemeToggle','cthuThemeMenu','cthuThemeStatus','profile','welcome','focus',
  'cthuPrivacyInfo','networkState','tentacleSearch','tentacleReset','cthuCatalogToggle','tiles',
  'favoriteLinks','favoriteSelect','favoriteAdd','activePulse','activePulseList','nextSession',
  'ns-form','ns-list','radar','priorities','taskform','tasklist','refreshUpdate','export','import',
  'importfile','legacySection','section','completed','remaining']){
  const re=new RegExp('\\bid="'+id+'"','g');assert.equal((html.match(re)||[]).length,1,id);
 }
 for(const source of ['cockpit-themes.js','next-session.js','active-pulse.js'])
  assert.ok(html.includes('src="./'+source+'"'),source);
 for(const key of ['big-cthu-v2-demo-tasks','big-cthu-v2-favorites-v1','big-cthu-v2-agenda-v1','big-cthu-v2-maison-v1'])
  assert.ok(html.includes(key),key);
 assert.match(html,/function renderRadar\(\)/);
 assert.match(html,/function renderFavorites\(\)/);
 assert.match(html,/renderProfile\(\);renderFavorites\(\);renderTasks\(\);renderRadar\(\);renderNetwork\(\)/);
 assert.match(html,/href="\.\/tournee-complete\.html"/);
 assert.match(html,/href="\.\/sauvegardes\.html"/);
});

test('V150: ancienne route renvoie au nouveau cockpit, sans stockage ou code clinique',async()=>{
 const [legacy,main,tour]=await Promise.all(['cockpit-neuf.html','index.html','tournee-complete.html'].map(read));
 assert.match(legacy,/http-equiv="refresh" content="0;url=\.\/index\.html"/);
 assert.match(legacy,/location\.replace\('\.\/index\.html'/);
 assert.doesNotMatch(legacy,/localStorage|indexedDB|setItem|removeItem/);
 assert.doesNotMatch(main,/Galerie visuelle|Retour à l'application actuelle|Prévisualisation graphique Command Center Premium V2/);
 assert.doesNotMatch(tour,/V150|cinematic-cockpit-default|scene-stamp/);
});

test('V150: conserver le dock mobile et les accès officiels, sans anciennes maquettes à la place',async()=>{
 const html=await read('index.html');
 const start=html.indexOf('<nav class="cthu-mobile-dock"');
 assert.ok(start>0);
 const dock=html.slice(start,html.indexOf('</nav>',start));
 assert.equal((dock.match(/<a href=/g)||[]).length,4);
 for(const href of ['#activePulse','./tournee-complete.html','./maison.html','./sauvegardes.html'])
  assert.ok(dock.includes('href="'+href+'"'),href);
 assert.match(html,/\.cthu-mobile-dock a\{display:grid;place-items:center/);
 assert.match(html,/body:not\(\[data-cthu-theme-tentacle="yes"\]\)/);
});
