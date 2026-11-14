import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V115: menu Apparence au-dessus de la carte hero sur Safari iPhone',async()=>{
 const css=await read('cockpit-themes.css');
 const fix=css.slice(css.indexOf('/* V115 — Safari iPhone'));
 assert.ok(fix.length>200,'specific mobile stacking context correction is included');
 assert.match(fix,/> \.shell > \.top\{\s*position:relative;\s*z-index:100/);
 assert.match(fix,/> \.shell > \.hero\{\s*position:relative;\s*z-index:0/);
 assert.match(fix,/#cthuThemeMenu\{\s*background:var\(--cthu-deep\);/);
 assert.match(fix,/max-height:min\(68dvh,520px\)/);
 assert.match(fix,/overscroll-behavior:contain/);
 assert.match(fix,/-webkit-overflow-scrolling:touch/);
});

test('V115: conservons le vrai bouton tactile, les trois thèmes et l extérieur du cockpit indépendant',async()=>{
 const [home,css,sw,tour]=await Promise.all(['index.html','cockpit-themes.css','sw.js','tournee-complete.html'].map(read));
 assert.match(home,/class="cthu-theme-wrap"/);
 assert.match(home,/id="cthuThemeMenu"/);
 for(const name of ['premium','organic','medical'])assert.match(home,new RegExp('data-cthu-choice="'+name+'"'));
 assert.match(css,/body:not\(\[data-cthu-theme-tentacle="yes"\]\)/);
 assert.match(sw,/cockpit-themes\.css/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.doesNotMatch(tour,/cockpit-themes\.css/,'Tournée CSS must stay untouched');
});
