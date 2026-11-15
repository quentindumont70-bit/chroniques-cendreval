import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V176: Coffre inherits Premium, Organic and Medical CINEMA 2.0 visual world',async()=>{
 const [html,css,sw]=await Promise.all(['sauvegardes.html','cinema-coffre.css','sw.js'].map(read));
 assert.match(html,/data-cthu-area="coffre"/);
 assert.match(html,/data-cthu-theme-tentacle="yes"/);
 assert.match(html,/href="\.\/cinema-coffre\.css"/);
 assert.ok(html.indexOf('href="./cinema-coffre.css"')>html.indexOf('href="./cockpit-themes.css"'));
 for(const theme of ['organic','medical'])assert.ok(css.includes('data-cthu-theme="'+theme+'"'));
 for(const el of ['#export','#restore','.restore-details','.status.warn','.panel','.cthu-daily-flow'])assert.ok(css.includes(el),el);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(sw,/big-cthu-public-v2-v176/);
 assert.match(sw,/'\.\/cinema-coffre\.css'/);
});
test('V176: restore stays opt-in; export unencrypted warning and existing safeguards preserved',async()=>{
 const [html,css,tour]=await Promise.all(['sauvegardes.html','cinema-coffre.css','tournee-complete.html'].map(read));
 assert.match(html,/id="export"/);
 assert.match(html,/id="restore" disabled/);
 assert.match(html,/id="consent"/);
 assert.match(html,/id="restoreOptions"/);
 assert.match(html,/Le fichier JSON n'est pas chiffré/);
 assert.match(html,/Les modules présents dans le fichier remplaceront leurs données actuelles/);
 assert.match(html,/key:'big-cthu-v2-demo-tasks'/);
 assert.doesNotMatch(css,/localStorage|indexedDB|fetch\(|XMLHttpRequest|@import|<script/i);
 assert.doesNotMatch(tour,/cinema-coffre\.css|V176/);
});
