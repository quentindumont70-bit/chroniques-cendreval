import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const load=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const d1='2026-11-19',d2='2026-11-20';

async function memoFixture(initial={},fail=false){
 const html=await load();
 const script=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(script);
 assert.doesNotThrow(()=>new Script(script));
 const start=script.indexOf('/* ===== Post-it du jour :');
 const stop=script.indexOf('/* ===== Weekly cycle editor:',start);
 assert.ok(start>0&&stop>start);
 const records=new Map(Object.entries(initial)),writes=[],events={},fields={};
 const doc={hidden:false,getElementById:id=>fields[id]||null,querySelector:()=>null,addEventListener:(n,cb)=>{events[n]=cb}};
 const win={};
 const ctx={
  window:win,document:doc,day:d1,
  TQ:{validDay:d=>/^\d{4}-\d{2}-\d{2}$/.test(d)},
  TOUR_STORE:{getItem:key=>records.get(key)??null},
  tqCommitVaultKey:async(key,value,old)=>{
   if(fail)throw Error('Echec fictif du disque');
   assert.equal(old,records.get(key)??null);
   records.set(key,value);writes.push(key);
  },
  saveFailure(){},short:d=>d,rel:d=>d,toast(){},
  esc:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
  JSON,Object,Array,Number
 };
 const exports='\nthis.api={flush:tqStickyFlushDrafts,save:tqStickySave,drafts:tqStickyDrafts,saved:tqStickyText,pending:tqStickyPending,shown:tqStickyShown};';
 runInNewContext(script.slice(start,stop)+exports,ctx,{timeout:1000});
 return {api:ctx.api,records,writes,events,doc,win,fields};
}

test('V254: les brouillons de chaque jour sont sauvegardes separement',async()=>{
 const f=await memoFixture({
  ['tidel_memo_'+d1]:JSON.stringify([{k:'memo-special',p:null,t:'Historique conserve'}]),
  ['tidel_memo_'+d2]:JSON.stringify([{k:'tq-postit',p:null,t:'Ancien vendredi'}])
 });
 f.api.drafts[d1]='- Laboratoire fictif\n- Materiel fictif';
 f.api.drafts[d2]='Controle vendredi';
 await f.api.flush();
 assert.equal(f.api.pending(d1),false);
 assert.equal(f.api.pending(d2),false);
 assert.deepEqual(f.writes,['tidel_memo_'+d1,'tidel_memo_'+d2]);
 const rows=JSON.parse(f.records.get('tidel_memo_'+d1));
 assert.equal(rows.find(x=>x.k==='memo-special').t,'Historique conserve');
 assert.equal(rows.find(x=>x.k==='tq-postit').t,'Laboratoire fictif\nMateriel fictif');
 assert.equal(f.api.saved(d2),'Controle vendredi');
});

test('V254: une erreur de stockage ne fait perdre ni le brouillon ni la note ancienne',async()=>{
 const old=JSON.stringify([{k:'tq-postit',p:null,t:'Note initiale'}]);
 const f=await memoFixture({['tidel_memo_'+d1]:old},true);
 f.api.drafts[d1]='Modification non enregistree';
 await assert.rejects(f.api.flush(),/Echec fictif/);
 assert.equal(f.records.get('tidel_memo_'+d1),old);
 assert.equal(f.api.drafts[d1],'Modification non enregistree');
 assert.equal(f.api.pending(d1),true);
});

test('V254: une edition plus recente reste prioritaire apres le blur',async()=>{
 const f=await memoFixture();
 const field={dataset:{day:d1},value:'Version A',closest:()=>null};
 f.api.drafts[d1]='Version A';
 const job=f.api.save(field);
 f.api.drafts[d1]='Version B';
 await job;
 await f.api.flush();
 assert.equal(f.api.saved(d1),'Version B');
 assert.equal(f.api.pending(d1),false);
});

test('V254: un rappel en cours de saisie interdit une mise a jour prematuree',async()=>{
 const f=await memoFixture();
 f.fields['tq-sticky-new']={value:'Pas encore ajoute'};
 await assert.rejects(f.api.flush(),/valide « Ajouter »/);
 f.fields['tq-sticky-new'].value='';
 f.fields['tq-sticky-edit']={value:'Modification inachevee'};
 await assert.rejects(f.api.flush(),/valide « OK »/);
 assert.deepEqual(f.writes,[]);
});

test('V254: la sauvegarde pour mise en veille utilise le stockage deja existant',async()=>{
 const f=await memoFixture();
 assert.equal(typeof f.win.tourneeSavePostitDrafts,'function');
 assert.equal(typeof f.events.visibilitychange,'function');
 f.api.drafts[d1]='Exemple sans patient reel';
 await f.win.tourneeSavePostitDrafts();
 assert.equal(f.api.saved(d1),'Exemple sans patient reel');
 assert.deepEqual(f.writes,['tidel_memo_'+d1]);
});

async function refreshFixture(opts={}){
 const html=await load(),start=html.indexOf('window.tourneeSafeRefresh=async()=>{');
 const end=html.indexOf('\n};',start)+3;
 assert.ok(start>=0&&end>start);
 const calls=[],window={};
 const ctx={
  window,secureBooted:true,secureKey:'testkey',secureGen:3,secureSavedGen:3,
  ensureVaultSaved:async()=>{calls.push('coffre');if(opts.failVault)throw Error('Echec coffre')},
  location:{reload(){calls.push('reload')}}
 };
 window.tourneeSavePostitDrafts=async()=>{calls.push('postit');if(opts.failDraft)throw Error('Echec postit')};
 runInNewContext(html.slice(start,end),ctx,{timeout:1000});
 return {window,calls};
}

test('V254: mise a jour iPhone : post-it, puis coffre, puis rechargement',async()=>{
 const f=await refreshFixture();
 await f.window.tourneeSafeRefresh();
 assert.deepEqual(f.calls,['postit','coffre','reload']);
});

test('V254: en cas de panne du post-it ou du coffre, pas de rechargement',async()=>{
 const f=await refreshFixture({failDraft:true});
 await assert.rejects(f.window.tourneeSafeRefresh(),/Echec postit/);
 assert.deepEqual(f.calls,['postit']);
 const g=await refreshFixture({failVault:true});
 await assert.rejects(g.window.tourneeSafeRefresh(),/Echec coffre/);
 assert.deepEqual(g.calls,['postit','coffre']);
});

test('V254: aucune transmission reseau ni second espace de donnees',async()=>{
 const html=await load(),start=html.indexOf('async function tqStickyFlushDrafts(){');
 const end=html.indexOf('async function tqAddToPostit(',start);
 assert.ok(start>0&&end>start);
 const section=html.slice(start,end);
 assert.doesNotMatch(section,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage\.setItem|localStorage\.clear/);
 assert.match(section,/await tqSaveStickyText\(d,tqStickyLines\(raw\)\.join/);
 assert.match(html,/await window\.tourneeSavePostitDrafts\(\)/);
});
