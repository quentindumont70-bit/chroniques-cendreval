import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const d1='2026-11-19',d2='2026-11-20';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function fixture({delayCommit=false}={}){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const source=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(source,'source de Tournée présent');
 const start=source.indexOf('/* ===== Post-it du jour :');
 const end=source.indexOf('/* ===== Weekly cycle editor:',start);
 assert.ok(start>0&&end>start,'bloc post-it isolé');
 const records=new Map([[ 'tidel_memo_'+d1,JSON.stringify([{k:'tq-postit',p:null,t:'Ancien rappel'}]) ]]);
 const fields={},writes=[],window={};
 let completeCommit=null;
 const document={hidden:false,getElementById:id=>fields[id]||null,querySelector:()=>null,addEventListener(){}};
 const ctx={
  window,document,day:d1,
  TQ:{validDay:d=>/^\d{4}-\d{2}-\d{2}$/.test(d)},
  TOUR_STORE:{getItem:key=>records.get(key)??null},
  tqCommitVaultKey:async(key,value,old)=>{
   if(delayCommit)await new Promise(resolve=>{completeCommit=resolve});
   assert.equal(records.get(key)??null,old);
   records.set(key,value);writes.push(key);
  },
  esc:escapeHtml,short:d=>d,rel:d=>d,toast(){},saveFailure(){},JSON,Object,Array,Number
 };
 runInNewContext(source.slice(start,end)+'\nthis.api={trackNew:tqStickyTrackNew,trackEdit:tqStickyTrackEdit,block:tqPostitBlock,begin:tqStickyBeginEdit,add:tqStickyAdd,flush:tqStickyFlushDrafts,quick:tqStickyQuickDrafts};',ctx,{timeout:1000});
 return {ctx,api:ctx.api,fields,records,writes,release:()=>{assert.ok(completeCommit);completeCommit()}};
}

test('V255 : le nouveau rappel reste sur son jour lors de la navigation, sans écriture implicite',async()=>{
 const f=await fixture();
 f.api.trackNew({dataset:{day:d1},value:'Laboratoire & matériel'});
 f.ctx.day=d2;
 assert.doesNotMatch(f.api.block(),/Laboratoire &amp; matériel/);
 f.api.trackNew({dataset:{day:d2},value:'Contrôle du vendredi'});
 assert.match(f.api.block(),/Contrôle du vendredi/);
 f.ctx.day=d1;
 assert.match(f.api.block(),/Laboratoire &amp; matériel/);
 assert.equal(f.writes.length,0,'aucun brouillon non validé n est sauvegardé');
 await assert.rejects(f.api.flush(),/Nouveau rappel en cours/);
});

test('V255 : modifier une ligne puis changer de jour conserve la saisie et interdit une actualisation',async()=>{
 const f=await fixture();
 f.api.begin(d1,0);
 f.api.trackEdit({value:'Rappel corrigé & vérifié'});
 f.ctx.day=d2;
 assert.doesNotMatch(f.api.block(),/Rappel corrigé &amp; vérifié/);
 f.ctx.day=d1;
 assert.match(f.api.block(),/Rappel corrigé &amp; vérifié/);
 f.ctx.day=d2;
 await assert.rejects(f.api.flush(),/Rappel en cours de modification/);
 assert.equal(f.writes.length,0);
});

test('V255 : une saisie plus récente survit à la fin d un ajout asynchrone',async()=>{
 const f=await fixture({delayCommit:true});
 const input={dataset:{day:d1},value:'Premier ajout'};
 f.fields['tq-sticky-new']=input;
 f.api.trackNew(input);
 const pending=f.api.add();
 input.value='Deuxième idée non validée';
 f.api.trackNew(input);
 f.release();
 await pending;
 assert.equal(input.value,'Deuxième idée non validée');
 assert.equal(f.api.quick[d1],'Deuxième idée non validée');
 assert.match(f.records.get('tidel_memo_'+d1),/Premier ajout/);
 assert.doesNotMatch(f.records.get('tidel_memo_'+d1),/Deuxième idée/);
 await assert.rejects(f.api.flush(),/Nouveau rappel en cours/);
});
