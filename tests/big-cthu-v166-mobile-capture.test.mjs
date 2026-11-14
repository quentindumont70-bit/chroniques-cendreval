import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V166: mobile one-tap capture replaces rare backup shortcut without losing access',async()=>{
 const html=await read('index.html');
 const begin=html.indexOf('<nav class="cthu-mobile-dock"');
 const end=html.indexOf('</nav>',begin);
 assert.ok(begin>0&&end>begin);
 const dock=html.slice(begin,end);
 assert.equal((dock.match(/<a href=/g)||[]).length,4);
 for(const href of ['#activePulse','./tournee-complete.html','./maison.html','./capture.html'])
  assert.ok(dock.includes('href="'+href+'"'));
 assert.match(dock,/aria-label="Capturer une idée rapidement"/);
 assert.ok(!dock.includes('href="./sauvegardes.html"'));
 assert.ok(html.includes('href="./sauvegardes.html"'),'Coffre remains accessible beyond dock');
 assert.ok(html.includes('id="cthuThemeToggle"'));
});
test('V166: mobile accessibility and original clinical boundary preserved',async()=>{
 const [css,sw,tour]=await Promise.all(['cinema-upgrade.css','sw.js','tournee-complete.html'].map(read));
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(sw,/big-cthu-public-v2-v166/);
 assert.match(sw,/'\.\/capture\.html'/);
 assert.doesNotMatch(tour,/mobile-capture-first|V166/);
});
