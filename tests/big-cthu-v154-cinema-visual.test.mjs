import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V154: CINEMA 2.0 is visual-only and loaded after the legacy stylesheet',async()=>{
 const [home,css,sw]=await Promise.all(['index.html','cinema-upgrade.css','sw.js'].map(read));
 assert.ok(home.includes('href="./cinema-upgrade.css"'));
 assert.ok(home.indexOf('href="./cinema-upgrade.css"')>home.indexOf('</style>'));
 assert.ok(home.indexOf('href="./cinema-upgrade.css"')<home.indexOf('</head>'));
 assert.match(sw,/big-cthu-public-v2-v154/);
 assert.match(sw,/'\.\/cinema-upgrade\.css'/);
 assert.doesNotMatch(css,/localStorage|sessionStorage|fetch\(|indexedDB|XMLHttpRequest|@import|<script/i);
});

test('V154: all three cinematic universes have distinct styles, with reduced motion',async()=>{
 const css=await read('cinema-upgrade.css');
 for(const selector of ['html[data-cthu-theme]','html[data-cthu-theme="organic"]','html[data-cthu-theme="medical"]'])
  assert.ok(css.includes(selector),selector);
 for(const zone of ['.topinner','.hero h1','.module','.live-dashboard .panel','.active-pulse-item','.page::after'])
  assert.ok(css.includes(zone),zone);
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/outline:3px solid var\(--cinema-highlight\)/);
});

test('V154: all real modules and clinical separation preserved',async()=>{
 const [html,tour]=await Promise.all(['index.html','tournee-complete.html'].map(read));
 for(const id of ['activePulse','activePulseList','nextSession','radar','priorities','favoriteLinks','cthuThemeToggle','refreshUpdate'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const link of ['./tournee-complete.html','./sauvegardes.html','./capture.html'])
  assert.ok(html.includes('href="'+link+'"'));
 assert.doesNotMatch(tour,/cinema-upgrade\.css|V154/);
});
