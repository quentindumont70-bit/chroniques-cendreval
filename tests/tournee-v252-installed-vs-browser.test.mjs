import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const a=html.indexOf('function tourPatientCountFrom(state){');
const b=html.indexOf('async function tourPreviewBackupFile(){',a);
assert.ok(a>0&&b>a,'V252 storage context functions found');
const source=html.slice(a,b);

function env({standalone=false,ios=false,count=0,noNavigator=false}={}){
 const fields={
  'tour-saved-status':{textContent:''},
  'tour-storage-surface':{textContent:''},
  'tour-security-gate':{hidden:true}
 };
 const ctx={
  JSON,Array,Object,
  secureState:{tidel_Pl:JSON.stringify(Array.from({length:count},(_,i)=>({id:'fiction-'+i,n:'PERSONNE FICTIVE'})))},
  document:{getElementById:id=>fields[id]||null},
  report(){},
  window:{matchMedia:query=>({matches:standalone&&query==='(display-mode: standalone)'})}
 };
 if(!noNavigator)ctx.navigator={standalone:ios};
 runInNewContext(source+'\nthis.appLabel=tourAppSurfaceLabel;this.open=openTourRecovery;',ctx,{timeout:1000});
 return {ctx,fields};
}

test('V252 : la PWA iPhone se distingue d un navigateur sans consulter les dossiers',()=>{
 for(const props of [{standalone:true},{ios:true}]){
  const f=env({...props,count:24});
  assert.match(f.ctx.appLabel(),/Application installée/);
  f.ctx.open();
  assert.match(f.fields['tour-saved-status'].textContent,/24 fiche/);
  assert.match(f.fields['tour-storage-surface'].textContent,/Application installée/);
  assert.match(f.fields['tour-storage-surface'].textContent,/ne sont pas synchronisées/);
  assert.doesNotMatch(f.fields['tour-storage-surface'].textContent,/PERSONNE FICTIVE|fiction-1/);
  assert.equal(f.fields['tour-security-gate'].hidden,false);
 }
});

test('V252 : Safari, navigateur intégré ou contexte non détectable restent des espaces distincts',()=>{
 const browser=env({count:1});
 assert.match(browser.ctx.appLabel(),/Navigateur web/);
 browser.ctx.open();
 assert.match(browser.fields['tour-storage-surface'].textContent,/Navigateur web/);
 const noNavigator=env({noNavigator:true});
 assert.match(noNavigator.ctx.appLabel(),/Navigateur web/);
});

test('V252 : le diagnostic ne transfère ni n efface des données et n annonce aucune synchronisation',()=>{
 assert.match(html,/id="tour-storage-surface" role="status"/);
 assert.match(html,/Safari, un navigateur intégré et l’application ajoutée à l’écran d’accueil peuvent avoir des données distinctes/);
 assert.doesNotMatch(source,/fetch\s*\(|localStorage\.clear\(|localStorage\.setItem\(|removeItem\(|location\.reload\(/);
 const f=env({count:0});f.ctx.open();
 assert.match(f.fields['tour-saved-status'].textContent,/Aucune fiche/);
});
