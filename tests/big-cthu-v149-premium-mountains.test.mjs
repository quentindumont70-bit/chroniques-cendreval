import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V149: true Premium cockpit receives the same mountain as its cinematic mockup',async()=>{
 const [css,preview,html,js,sw]=await Promise.all(['cockpit-themes.css','premium-cinema.html','index.html','cockpit-themes.js','sw.js'].map(read));
 const photo='photo-1649401691853-6ecfa00f044e';
 assert.ok(css.includes(photo));
 assert.ok(preview.includes(photo));
 assert.match(css,/html\[data-cthu-theme="premium"\] body:not\(\[data-cthu-theme-tentacle="yes"\]\)::before/);
 assert.match(css,/position:fixed;inset:0;z-index:0;pointer-events:none/);
 assert.match(css,/background-size:cover,cover/);
 assert.match(css,/@media\(prefers-reduced-data:reduce\)/);
 assert.match(html,/id="cthuThemeToggle"/);
 for(const theme of ['premium','organic','medical'])assert.ok(js.includes(theme+":'"));
 assert.match(sw,/big-cthu-public-v2-v149/);
});

test('V149: landscape remains strictly Premium; opt-in subpages and Tournee untouched',async()=>{
 const [css,tour]=await Promise.all(['cockpit-themes.css','tournee-complete.html'].map(read));
 const start=css.indexOf('/* V149');
 assert.ok(start>0);
 const patch=css.slice(start);
 assert.ok(patch.includes('data-cthu-theme="premium"'));
 assert.ok(patch.includes('body:not([data-cthu-theme-tentacle="yes"])'));
 assert.doesNotMatch(patch,/data-cthu-theme="organic"\]|data-cthu-theme="medical"\]/);
 assert.doesNotMatch(tour,/V149|photo-1649401691853/);
});
