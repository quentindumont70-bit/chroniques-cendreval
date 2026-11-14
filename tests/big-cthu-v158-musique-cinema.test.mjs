import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V158: Studio Bobinch cinematic skin retains three themes, content and mobile access',async()=>{
 const [html,css,sw]=await Promise.all(['musique.html','cinema-musique.css','sw.js'].map(read));
 assert.match(html,/data-cthu-area="musique"/);
 assert.match(html,/href="\.\/cinema-musique\.css"/);
 assert.ok(html.indexOf('cinema-musique.css')>html.indexOf('cockpit-themes.css'));
 for(const t of ['premium','organic','medical'])assert.ok(css.includes('data-cthu-theme="'+t+'"'));
 for(const s of ['.hero','.project','.project-actions','.input-row','.links'])assert.ok(css.includes(s));
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(sw,/big-cthu-public-v2-v158/);
 assert.match(sw,/'\.\/cinema-musique\.css'/);
});
test('V158: project workflow and historical passions remain unchanged',async()=>{
 const [html,css,tour]=await Promise.all(['musique.html','cinema-musique.css','tournee-complete.html'].map(read));
 for(const id of ['studio-form','studio-title','studio-next','studio-list','studio-status'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/href="\.\/passions\.html#musique"/);
 assert.match(html,/src="\.\/musique-studio\.js"/);
 assert.doesNotMatch(css,/localStorage|fetch\(|indexedDB|XMLHttpRequest|@import|<script/i);
 assert.doesNotMatch(tour,/cinema-musique\.css|V158/);
});
