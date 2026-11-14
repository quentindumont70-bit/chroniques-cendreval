import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V139: evenement simple titre/date, options conservees sans ouverture initiale',async()=>{
 const html=await read('agenda.html');
 const form=html.slice(html.indexOf('<form id="form">'),html.indexOf('</form>',html.indexOf('<form id="form">')));
 assert.match(form,/<input id="title"[^>]+required/);
 assert.match(form,/<input id="date" type="date" required/);
 assert.match(form,/<details class="agenda-more" id="agendaMore">/);
 assert.match(form,/<summary>Options facultatives/);
 assert.ok(form.indexOf('id="date"')<form.indexOf('<details class="agenda-more"'));
 assert.ok(form.indexOf('id="category"')>form.indexOf('<details class="agenda-more"'));
 assert.ok(form.indexOf('id="notes"')<form.indexOf('</details>'));
 assert.doesNotMatch(form,/<details[^>]+open(?:\s|>)/);
 assert.match(form,/<option value="perso">Personnel<\/option>/);
 assert.match(form,/<button class="btn" type="submit">Ajouter à l'agenda<\/button>/);
});

test('V139: calendrier local et export ICS inchanges; Tournée isolee',async()=>{
 const [agenda,sw,tour]=await Promise.all(['agenda.html','sw.js','tournee-complete.html'].map(read));
 assert.match(agenda,/const KEY='big-cthu-v2-agenda-v1'/);
 assert.match(agenda,/localStorage\.setItem\(KEY,JSON\.stringify\(next\)\)/);
 assert.match(agenda,/function exportICS\(\)/);
 assert.match(agenda,/id="ical"/);
 assert.match(agenda,/Ne pas saisir de données permettant d'identifier un patient/);
 assert.match(sw,/big-cthu-public-v2-v139/);
 assert.match(sw,/'\.\/agenda\.html'/);
 assert.doesNotMatch(tour,/agenda-more|agendaMore/);
});
