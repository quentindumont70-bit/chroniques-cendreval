import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

// Only synthetic fixtures. Never load production exports in CI.
async function converter(){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const start=html.indexOf('function fillFromBackup(d){');
 const end=html.indexOf('const TOUR_STORE=',start);
 assert.ok(start>=0&&end>start);
 const sandbox={};
 runInNewContext(html.slice(start,end)+'\nthis.convert=fillFromBackup;',sandbox,{timeout:1000});
 return sandbox.convert;
}
const sample=()=>({
 v:1,
 P:[{id:'fiction-1',n:'Patient fictif A',a:'1 avenue imaginaire',h:'08:30',soins:'Soin fictif'}],
 kv:{done_2026_11_13:'["fiction-1"]',note_test:'texte sans valeur médicale'},
 remps:[{id:'fictif-remplacement'}],
 ordos:[{id:'fictive-ordonnance'}],
 contacts:[{id:'fiction-contact'}],
 DN:[{id:'fiction-DN'}]
});

test('migration V74: préserve toutes les rubriques et les identifiants fictifs',async()=>{
 const convert=await converter(),d=sample(),s=convert(d);
 assert.deepEqual(JSON.parse(s.tidel_Pl),d.P);
 assert.equal(s.tidel_done_2026_11_13,d.kv.done_2026_11_13);
 assert.equal(s.tidel_note_test,d.kv.note_test);
 assert.deepEqual(JSON.parse(s.tidel_remps),d.remps);
 assert.deepEqual(JSON.parse(s.tidel_ordos),d.ordos);
 assert.deepEqual(JSON.parse(s.tidel_contacts),d.contacts);
 assert.deepEqual(JSON.parse(s.tidel_import_DN),d.DN);
 assert.ok(Object.keys(s).every(k=>k.startsWith('tidel_')));
});

test('migration V74: ne modifie jamais le fichier source fictif',async()=>{
 const convert=await converter(),d=sample(),before=JSON.stringify(d);
 const s=convert(d);
 s.tidel_Pl='[]';
 assert.equal(JSON.stringify(d),before);
 assert.equal(d.P.length,1);
});

test('migration V74: rubriques optionnelles absentes sans fabrication de dossiers',async()=>{
 const convert=await converter();
 const s=convert({v:1,P:[],kv:{}});
 assert.equal(s.tidel_Pl,'[]');
 assert.equal(Object.hasOwn(s,'tidel_remps'),false);
 assert.equal(Object.hasOwn(s,'tidel_contacts'),false);
});

test('migration V74: rejette les formats et les clés de suivi dangereux',async()=>{
 const convert=await converter(),d=sample();
 for(const bad of [
  {...d,v:0},
  {...d,kv:{'../../fichier':'contenu'}},
  {...d,kv:{ok:42}},
  {...d,contacts:{}},
  {...d,P:[{id:'sans-champs'}]},
  {...d,P:Array.from({length:10001},(_,i)=>({id:'fic-'+i,n:'Fictif',a:'Inventée'}))},
  {...d,kv:{['a'.repeat(161)]:'valeur'}}
 ])assert.throws(()=>convert(bad));
});

test('migration V74: refuse de remplacer un coffre existant et conserve les parcours distincts',async()=>{
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const classic=await readFile(new URL('../big-cthu-beta/tournee.html',import.meta.url),'utf8');
 assert.match(html,/if\(fileMode\)\{\s*if\(full\|\|previous\)throw Error/);
 assert.match(html,/bigcthu_tournee_full_encrypted_v1/);
 assert.match(html,/bigcthu_tournee_encrypted_v1/);
 assert.doesNotMatch(classic,/bigcthu_tournee_full_encrypted_v1/);
});
