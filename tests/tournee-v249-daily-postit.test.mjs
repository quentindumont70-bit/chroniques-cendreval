import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const d1='2026-11-19',d2='2026-11-20';

async function fixture(initial={}){
 const html=await read('tournee-complete.html');
 const script=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(script,'Source Tournée absente');
 assert.doesNotThrow(()=>new Script(script),'Source Tournée invalide');
 const begin=script.indexOf('/* ===== Post-it du jour :');
 const end=script.indexOf('/* ===== Weekly cycle editor:',begin);
 assert.ok(begin>=0&&end>begin,'Source des post-it absente');
 const records=new Map(Object.entries(initial)),writes=[],fields={};
 const ctx={
  TQ:{validDay:d=>/^\d{4}-\d{2}-\d{2}$/.test(d)},
  TOUR_STORE:{getItem:key=>records.get(key)??null},
  tqCommitVaultKey:async(key,value,old)=>{
   assert.equal(old,records.get(key)??null,'Le mémo n a pas changé pendant la sauvegarde');
   records.set(key,value);writes.push(key);
  },
  day:d1,short:d=>d,rel:d=>d===d1?'Jeudi':'Vendredi',
  esc:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
  document:{getElementById:id=>fields[id]??null,querySelector:()=>null},
  toast(){},Object,Array,JSON,Number
 };
 const exported=[
  'this.api={lines:tqStickyLines,items:tqStickyItems,save:tqSaveStickyText,',
  'addAssistant:tqAddToPostit,remove:tqStickyDelete,undo:tqStickyUndoDelete,',
  'add:tqStickyAdd,edit:tqStickyApplyEdit,render:tqPostitBlock,',
  'current:tqStickyText,day:d=>{day=d},getUndo:()=>tqStickyUndo,getDrafts:()=>tqStickyDrafts};'
 ].join('\n');
 runInNewContext(script.slice(begin,end)+'\n'+exported,ctx,{timeout:1000});
 return {api:ctx.api,records,writes,fields};
}

test('V249 : les notes du jeudi n apparaissent pas dans le post-it du vendredi',async()=>{
 const f=await fixture({['tidel_memo_'+d1]:JSON.stringify([{k:'tq-postit',p:null,t:'Prélèvement FICTIF'}])});
 assert.deepEqual(Array.from(f.api.items(d1)),['Prélèvement FICTIF']);
 assert.deepEqual(Array.from(f.api.items(d2)),[]);
 assert.match(f.api.render(),/Prélèvement FICTIF/);
 assert.match(f.api.render(),/uniquement ce jour/);
 f.api.day(d2);
 assert.doesNotMatch(f.api.render(),/Prélèvement FICTIF/);
 assert.match(f.api.render(),/Aucun rappel prévu pour cette journée/);
});

test('V249 : les anciennes notes séparées par des lignes deviennent des entrées distinctes',async()=>{
 const old=JSON.stringify([{k:'memo-ancien',p:'fictif',t:'Historique'},{k:'tq-postit',p:null,t:'Soin fictif\n- matériel\n• Téléphoner'}]);
 const f=await fixture({['tidel_memo_'+d1]:old});
 assert.deepEqual(Array.from(f.api.items(d1)),['Soin fictif','matériel','Téléphoner']);
 assert.match(f.api.render(),/aria-label="Effacer le rappel 3"/);
 await f.api.addAssistant(d1,'Confirmer la tournée');
 assert.deepEqual(Array.from(f.api.items(d1)),['Soin fictif','matériel','Téléphoner','Confirmer la tournée']);
 const stored=JSON.parse(f.records.get('tidel_memo_'+d1));
 assert.equal(stored.find(x=>x.k==='memo-ancien').t,'Historique');
 assert.equal(stored.filter(x=>x.k==='tq-postit').length,1);
 assert.deepEqual(f.writes,['tidel_memo_'+d1]);
});

test('V249 : ajout, modification, effacement et annulation agissent sur le jour sélectionné',async()=>{
 const f=await fixture({['tidel_memo_'+d1]:JSON.stringify([{k:'tq-postit',p:null,t:'Ligne A\nLigne B'}])});
 f.fields['tq-sticky-new']={value:'- Troisième idée',dataset:{day:d1}};
 await f.api.add();
 assert.equal(f.fields['tq-sticky-new'].value,'');
 assert.deepEqual(Array.from(f.api.items(d1)),['Ligne A','Ligne B','Troisième idée']);
 f.fields['tq-sticky-edit']={value:'Ligne B corrigée'};
 await f.api.edit(d1,1);
 assert.deepEqual(Array.from(f.api.items(d1)),['Ligne A','Ligne B corrigée','Troisième idée']);
 await f.api.remove(d1,0);
 assert.deepEqual(Array.from(f.api.items(d1)),['Ligne B corrigée','Troisième idée']);
 assert.ok(f.api.getUndo());
 await f.api.undo();
 assert.deepEqual(Array.from(f.api.items(d1)),['Ligne A','Ligne B corrigée','Troisième idée']);
 assert.deepEqual(Array.from(f.api.items(d2)),[]);
 assert.ok(f.writes.every(key=>key==='tidel_memo_'+d1));
});

test('V249 : HTML échappé, aucun transfert réseau et les autres données intactes',async()=>{
 const f=await fixture({['tidel_memo_'+d1]:JSON.stringify([{k:'tq-postit',p:null,t:'<img src=x onerror=alert(1)>'}])});
 const html=f.api.render();
 assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.doesNotMatch(html,/<img src=x/);
 const page=await read('tournee-complete.html');
 const segment=page.slice(page.indexOf('/* ===== Post-it du jour :'),page.indexOf('/* ===== Weekly cycle editor:'));
 assert.doesNotMatch(segment,/fetch\s*\(|XMLHttpRequest|sendBeacon|\.clear\(/);
 assert.match(segment,/await tqCommitVaultKey\(key,JSON\.stringify\(next\),old\)/);
});

test('V249 : un brouillon global non enregistré bloque la suppression',async()=>{
 const f=await fixture({['tidel_memo_'+d1]:JSON.stringify([{k:'tq-postit',p:null,t:'Ancienne note'}])});
 f.api.getDrafts()[d1]='Brouillon en attente';
 await f.api.remove(d1,0);
 assert.deepEqual(Array.from(f.api.items(d1)),['Ancienne note']);
 assert.equal(f.writes.length,0);
});
