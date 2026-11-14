import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V116: cockpit a disclosure native, privacy and migration information remain intact',async()=>{
 const home=await read('index.html');
 assert.match(home,/<details id="cthuPrivacyInfo">/);
 assert.match(home,/<summary>🔒 Mode local · données sur cet appareil/);
 assert.match(home,/Sans synchronisation entre appareils/);
 assert.match(home,/Aucun dossier patient n'est inclus/);
 assert.match(home,/id="networkState"/);
 assert.match(home,/id="openTourneeSecure"/);
 assert.match(home,/id="tourneeLegacyExport"/);
 assert.match(home,/id="tentacleSearch"/);
 const block=home.slice(home.indexOf('<details id="cthuPrivacyInfo">'),home.indexOf('</details>',home.indexOf('<details id="cthuPrivacyInfo">')));
 assert.doesNotMatch(block,/<script|<form/i);
 assert.match(block,/id="networkState"/);
});

test('V116: mobile hero shrinks, privacy accessible without an extra JS listener',async()=>{
 const css=await read('cockpit-themes.css');
 const fix=css.slice(css.indexOf('/* V116 — cockpit quotidien'));
 assert.match(fix,/\.cthu-privacy-note summary:focus-visible/);
 assert.match(fix,/\.cthu-privacy-body/);
 assert.match(fix,/@media\(max-width:750px\)/);
 assert.match(fix,/\.hero\{\s*min-height:0/);
 assert.match(fix,/\.hero \.symbol\{\s*display:none/);
 assert.match(fix,/details\[open\]/);
});

test('V116: palette still shared, local data and Tournée untouched',async()=>{
 const [home,sw,tour]=await Promise.all(['index.html','sw.js','tournee-complete.html'].map(read));
 assert.match(home,/src="\.\/cockpit-themes\.js"/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.match(sw,/cockpit-themes\.css/);
 assert.doesNotMatch(tour,/cthuPrivacyInfo/);
 assert.doesNotMatch(tour,/cockpit-themes\.css/);
});
