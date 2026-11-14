import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V143: Coffre utilise les trois themes partages, sans modifier ses actions',async()=>{
 const [html,theme,js,sw,tour]=await Promise.all(['sauvegardes.html','cockpit-themes.css','cockpit-themes.js','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/<body data-cthu-theme-tentacle="yes">/);
 assert.match(html,/<link rel="stylesheet" href="\.\/cockpit-themes.css">/);
 assert.match(html,/<script src="\.\/cockpit-themes.js"><\/script>/);
 for(const mode of ['premium','organic','medical']){
  assert.ok(theme.includes('html[data-cthu-theme="'+mode+'"]'));
  assert.ok(js.includes(mode+":'"));
 }
 assert.match(theme,/body\[data-cthu-theme-tentacle="yes"\] \.panel/);
 assert.match(js,/cthu-theme-mini/);
 assert.match(html,/id="export"/);
 assert.match(html,/id="restore"/);
 assert.match(html,/id="consent"/);
 assert.match(html,/id="restoreOptions"/);
 assert.match(sw,/big-cthu-public-v2-v143/);
 assert.doesNotMatch(tour,/cthu-theme-tentacle|cthu-theme-mini/);
});
