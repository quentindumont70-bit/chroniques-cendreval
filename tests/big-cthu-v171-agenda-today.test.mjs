import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V171: Aujourd’hui means only today, not every future event',async()=>{
 const html=await read('agenda.html');
 assert.match(html,/<option value="today">Aujourd’hui<\/option>/);
 assert.match(html,/filter==='today'&&x\.date===today/);
 assert.match(html,/\$\('today'\)\.addEventListener\('click',\(\)=>\{\$\('filter'\)\.value='today';render\(\)\}\)/);
 assert.match(html,/filter==='upcoming'&&x\.date>=today/);
 assert.match(html,/filter==='past'&&x\.date<today/);
 const sample=[{date:'2026-11-13'},{date:'2026-11-14'},{date:'2026-11-15'}];
 assert.equal(sample.filter(x=>x.date==='2026-11-14').length,1);
});

test('V171: preserves calendar sources, iCal export, cinematic themes, and Tournee isolation',async()=>{
 const [html,sw,tour]=await Promise.all(['agenda.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/KEY='big-cthu-v2-agenda-v1'/);
 assert.match(html,/function exportICS\(\)/);
 assert.match(html,/href="\.\/cinema-daily\.css"/);
 for(const id of ['today','filter','form','events','ical'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(sw,/big-cthu-public-v2-v171/);
 assert.doesNotMatch(tour,/value="today"|V171/);
});
