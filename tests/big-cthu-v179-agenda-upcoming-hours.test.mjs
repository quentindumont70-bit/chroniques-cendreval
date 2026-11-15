import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V179: the cockpit does not call an already elapsed appointment upcoming',async()=>{
 const pulse=await read('active-pulse.js');
 assert.match(pulse,/const clock=String\(now\.getHours\(\)\)\.padStart\(2,'0'\)\+':'\+String\(now\.getMinutes\(\)\)\.padStart\(2,'0'\)/);
 assert.match(pulse,/\(x\.date>today\|\|!x\.time\|\|x\.time>=clock\)/);
 assert.match(pulse,/validDate\(x\.date\)/);
});
test('V179: Agenda filters elapsed clock-times yet retains all-day, history and exports',async()=>{
 const [html,sw,tour]=await Promise.all(['agenda.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/const isUpcoming=x=>x\.date>today\|\|x\.date===today&&\(!x\.time\|\|x\.time>=clock\)/);
 assert.match(html,/data\.filter\(isUpcoming\)\.length/);
 assert.match(html,/filter==='upcoming'&&isUpcoming\(x\)/);
 assert.match(html,/filter==='today'&&x\.date===today/);
 assert.match(html,/filter==='all'/);
 assert.match(html,/function exportICS\(\)/);
 assert.match(html,/KEY='big-cthu-v2-agenda-v1'/);
 assert.match(sw,/big-cthu-public-v2-v179/);
 assert.doesNotMatch(tour,/isUpcoming|V179/);
 const today='2026-11-15',clock='07:30';
 const isUpcoming=x=>x.date>today||x.date===today&&(!x.time||x.time>=clock);
 assert.equal(isUpcoming({date:today,time:'06:20'}),false);
 assert.equal(isUpcoming({date:today,time:'08:30'}),true);
 assert.equal(isUpcoming({date:today,time:''}),true);
 assert.equal(isUpcoming({date:'2026-11-16',time:'01:00'}),true);
 assert.equal(isUpcoming({date:'2026-11-14',time:'23:59'}),false);
});
