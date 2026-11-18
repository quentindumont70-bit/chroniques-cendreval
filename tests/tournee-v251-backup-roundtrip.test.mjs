import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const segment=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>0&&b>a,'Source missing: '+start);
 return html.slice(a,b);
};
const core=segment("const PORTABLE_FORMAT='bigcthu-tournee-complete-portable-v1'","function recoverySpaceEmpty(");
const restore=segment('async function recoverOldVault(fileMode){','function fillFromBackup(');
const preview=segment('function tourPatientCountFrom(state){',"document.getElementById('tour-recovery-launch').addEventListener");

function testState(n){
 const people=Array.from({length:n},(_,i)=>({id:'fiction-'+i,n:'PERSONNE DE TEST '+i,a:'Adresse fictive, aucune personne réelle',hab:'Notes synthétiques'}));
 return {
  tidel_Pl:JSON.stringify(people),
  tidel_memo_2026_11_19:JSON.stringify([{k:'tq-postit',p:null,t:'Matériel de test\nVérifier le passage'}]),
  tidel_memo_2026_11_20:JSON.stringify([{k:'tq-postit',p:null,t:'Note du lendemain uniquement'}]),
  tidel_absences_journal_v1:JSON.stringify([{
   id:'absence-de-test',patientId:'fiction-0',day:'2026-11-19',
   reason:'Soin non réalisé',sync:'À rapprocher',note:'Observation fictive',
   history:[{at:'2026-11-19T08:00:00Z',action:'Donnée de test'}]
  }]),
  tidel_done_2026_11_19:JSON.stringify(['fiction-0']),
  tidel_note_interne:'Valeur d’essai, ne constitue pas un dossier médical'
 };
}

function setup(initial={tidel_Pl:'[]'}){
 let selected='',saves=0,reloads=0;
 const errors=[], statuses=[];
 const fields={
  'tour-file':{files:[{size:20*1024,async text(){return selected}}],addEventListener(){}},
  'tour-backup-preview':{textContent:''},
  'tour-security-gate':{hidden:false},
  'tour-saved-status':{textContent:''}
 };
 const ctx={
  Date,JSON,Object,Array,Math,Number,Uint8Array,
  secureState:structuredClone(initial),secureGen:0,
  ORIGINAL_KEY:'fiction-previous',PREVIOUS_KEY:'fiction-legacy',SECURE_KEY:'fiction-active',
  document:{getElementById:id=>fields[id]||null},
  localStorage:{getItem:()=>null},
  validVaultState:state=>{
   try{return !!state&&typeof state==='object'&&!Array.isArray(state)&&Array.isArray(JSON.parse(state.tidel_Pl||'null'))}
   catch{return false}
  },
  isEncryptedVaultRecord:x=>!!(x&&x.cipher),
  fillFromBackup:()=>{throw Error('No legacy format in this test')},
  ensureVaultSaved:async()=>{saves++},
  saveFailure:()=>{},saveStatus:(...args)=>statuses.push(args),
  report:e=>errors.push(e),
  location:{reload(){reloads++}}
 };
 runInNewContext(core+'\n'+restore+'\n'+preview+'\nthis.api={serialize:serializePortableVault,read:readPortableVault,compare:tourBackupEquivalent,preview:tourPreviewBackupFile,restore:recoverOldVault,active:()=>secureState};',ctx,{timeout:1000});
 return {api:ctx.api,ctx,fields,errors,statuses,setFile:s=>{selected=s},saves:()=>saves,reloads:()=>reloads};
}

for(const count of [1,24,500]){
 test('V251 : round-trip complet sur '+count+' patient(s) fictif(s) + notes + absences',async()=>{
  const original=testState(count);
  const source=setup(original);
  const serialized=source.api.serialize(original);
  const parsed=JSON.parse(serialized);
  assert.equal(parsed.format,'bigcthu-tournee-complete-portable-v1');
  assert.equal(parsed.checksumType,'fnv1a32');
  assert.deepEqual(JSON.parse(JSON.stringify(source.api.read(parsed))),original);
  source.setFile(serialized);
  await source.api.preview();
  assert.match(source.fields['tour-backup-preview'].textContent,/Copie contrôlée/);
  assert.match(source.fields['tour-backup-preview'].textContent,new RegExp(count+' fiche\\(s\\)'));
  assert.doesNotMatch(source.fields['tour-backup-preview'].textContent,/PERSONNE DE TEST|Adresse fictive/);

  const target=setup();
  target.setFile(serialized);
  await target.api.preview();
  assert.match(target.fields['tour-backup-preview'].textContent,/restauration possible/);
  await target.api.restore(true);
  assert.equal(target.saves(),1);
  assert.equal(target.reloads(),1);
  assert.deepEqual(JSON.parse(JSON.stringify(target.api.active())),original);
  assert.equal(JSON.parse(target.api.active().tidel_memo_2026_11_20)[0].t,'Note du lendemain uniquement');
 });
}

test('V251 : copie valide mais plus à jour signalée clairement, sans aucune écriture',async()=>{
 const current=testState(24);
 const f=setup(current);
 const old=testState(24);
 old.tidel_memo_2026_11_19=JSON.stringify([{k:'tq-postit',p:null,t:'Ancienne version'}]);
 f.setFile(f.api.serialize(old));
 await f.api.preview();
 assert.match(f.fields['tour-backup-preview'].textContent,/ne correspond pas exactement/);
 assert.equal(f.saves(),0);
 assert.equal(f.reloads(),0);
 assert.equal(f.api.compare(old,current),false);
});

test('V251 : le contrôle détecte une rubrique disparue, même avec autant de patients',async()=>{
 const current=testState(24),changed={...current};
 delete changed.tidel_done_2026_11_19;
 const f=setup(current);
 f.setFile(f.api.serialize(changed));
 await f.api.preview();
 assert.match(f.fields['tour-backup-preview'].textContent,/ne correspond pas exactement/);
 assert.equal(f.api.compare(changed,current),false);
});

test('V251 : corruptions ou faux formats refusés, aucune donnée importée',async()=>{
 const active=testState(1),f=setup(active);
 const file=JSON.parse(f.api.serialize(active));
 file.data.tidel_memo_2026_11_19='Altéré hors export';
 f.setFile(JSON.stringify(file));
 await f.api.preview();
 assert.match(f.fields['tour-backup-preview'].textContent,/non reconnu ou endommagé/);
 await f.api.restore(true);
 assert.equal(f.saves(),0);
 assert.equal(f.reloads(),0);
 assert.deepEqual(JSON.parse(JSON.stringify(f.api.active())),active);
});

test('V251 : sauvegarde complète sans empreinte (ancienne V95) encore lisible, sans fausse validation automatique',async()=>{
 const current=testState(1),f=setup(current);
 const legacy={format:'bigcthu-tournee-complete-portable-v1',v:1,data:current};
 f.setFile(JSON.stringify(legacy));
 await f.api.preview();
 assert.match(f.fields['tour-backup-preview'].textContent,/Copie contrôlée/);
 assert.deepEqual(JSON.parse(JSON.stringify(f.api.read(legacy))),current);
});

test('V251 : restauration bloquée sur appareil déjà rempli, y compris si la copie est identique',async()=>{
 const original=testState(24),f=setup(original);
 f.setFile(f.api.serialize(original));
 await f.api.restore(true);
 assert.equal(f.saves(),0);
 assert.equal(f.reloads(),0);
 assert.match(f.errors[0],/ne rien écraser/);
});

test('V251 : aucun nouveau réseau, aucun accès GitHub et aucune donnée patient dans la CI',()=>{
 assert.doesNotMatch(preview,/fetch\s*\(|XMLHttpRequest|sendBeacon|GitHub\.|localStorage\.setItem/);
 assert.match(html,/Après le téléchargement, sélectionne le fichier dans l'étape 3/);
});
