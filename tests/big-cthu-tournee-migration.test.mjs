import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await read();
 const from=html.indexOf('function fillFromBackup(d){');
 const to=html.indexOf('const TOUR_STORE=',from);
 assert.ok(from>0&&to>from,'the local backup transformer is present');
 const sandbox={};
 runInNewContext(html.slice(from,to)+'\nthis.fillFromBackup=fillFromBackup;',sandbox,{timeout:1000});
 return {html,fill:sandbox.fillFromBackup};
}

test('Tournée complète : une sauvegarde fictive de version 1 se convertit localement',async()=>{
 const {fill}=await fixture();
 const dummy={v:1,P:[{id:'fake-1',n:'Exemple',a:'Adresse inventée'}],kv:{done_2026:'["fake-1"]'},remps:[],ordos:[],contacts:[],DN:[]};
 const state=fill(dummy);
 assert.equal(JSON.parse(state.tidel_Pl)[0].id,'fake-1');
 assert.equal(state.tidel_done_2026,'["fake-1"]');
 assert.equal(state.tidel_remps,'[]');
 assert.equal(state.tidel_contacts,'[]');
});

test('Tournée complète : refuse les sauvegardes erronées avant toute écriture',async()=>{
 const {fill}=await fixture();
 const d={v:1,P:[{id:'fake-1',n:'Exemple',a:'Inventée'}],kv:{}};
 assert.throws(()=>fill({...d,v:2}),/incompatible/);
 assert.throws(()=>fill({...d,P:[{id:1,n:'Exemple',a:'Inventée'}]}),/Patients/);
 assert.throws(()=>fill({...d,kv:{'bad-key':7}}),/Suivi/);
 assert.throws(()=>fill({...d,remps:'incorrect'}),/Rubrique/);
 assert.throws(()=>fill({...d,kv:[]}),/incompatible/);
});

test('Tournée complète : import JSON interdit si un coffre local chiffré existe déjà',async()=>{
 const {html}=await fixture();
 assert.match(html,/if\(fileMode\)\{\s*if\(full\|\|previous\)throw Error/);
 assert.match(html,/un nouvel import pourrait écraser tes dossiers/);
 assert.match(html,/ORIGINAL_KEY='bigcthu_tournee_full_encrypted_v1'/);
 assert.match(html,/AES-GCM/);
 assert.match(html,/PBKDF2/);
 assert.match(html,/n'est pas un hébergement HDS certifié/);
});
