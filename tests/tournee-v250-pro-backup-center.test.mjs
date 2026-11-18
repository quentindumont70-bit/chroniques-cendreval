import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext, Script} from 'node:vm';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

async function previewFixture({currentPatients=[],file,fill}={}){
 const html=await read('tournee-complete.html');
 const a=html.indexOf('function tourPatientCountFrom(state){');
 const b=html.indexOf("document.getElementById('tour-recovery-launch').addEventListener",a);
 assert.ok(a>0&&b>a);
 const local={tidel_Pl:JSON.stringify(currentPatients)};
 const elements={
  'tour-saved-status':{textContent:''},
  'tour-storage-surface':{textContent:''},
  'tour-backup-preview':{textContent:''},
  'tour-file':{addEventListener(){},files:file?[{size:512,async text(){return typeof file==='string'?file:JSON.stringify(file)}}]:[]},
  'tour-security-gate':{hidden:true}
 };
 const calls=[];
 const sandbox={
  JSON,Object,Array,
  secureState:local,PORTABLE_FORMAT:'bigcthu-tournee-complete-portable-v1',
  document:{getElementById(id){return elements[id]||null;}},
  report(text){calls.push(text)},
  isEncryptedVaultRecord:x=>!!x.cipher,
  readPortableVault:x=>x.data,
  fillFromBackup:x=>fill?fill(x):{tidel_Pl:JSON.stringify(x.P)},
  validVaultState:x=>!!x&&Array.isArray(JSON.parse(x.tidel_Pl||'null'))
 };
 runInNewContext(html.slice(a,b)+'\nthis.preview=tourPreviewBackupFile;this.open=openTourRecovery;',sandbox,{timeout:1000});
 return {preview:sandbox.preview,open:sandbox.open,elements,calls};
}
test('V250 : le centre distingue clairement coffre local, copie externe et restauration',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/id="tour-backup-title">Mes sauvegardes/);
 assert.match(html,/id="tour-recovery-direct">Mes sauvegardes/);
 assert.match(html,/id="tour-portable-export"/);
 assert.match(html,/id="tour-file" accept="\.json,application\/json"/);
 assert.match(html,/id="tour-backup-preview"/);
 assert.match(html,/Ce stockage n'est pas une copie de secours/);
 assert.match(html,/Aucune copie extérieure n'est vérifiée par Tournée/);
 assert.match(html,/id="tour-vault-export"/);
 assert.equal(html.split('id="tour-portable-export"').length-1,1);
 assert.equal(html.split('id="tour-file"').length-1,1);
});
test('V250 : aperçu d un export traditionnel à 24 patients fictifs, sans nom affiché ni écriture',async()=>{
 const names=Array.from({length:24},(_,i)=>({id:'test-'+i,n:'PATIENT FICTIF '+i,a:'rue inventée'}));
 const f=await previewFixture({file:{v:1,P:names,kv:{}}});
 await f.preview();
 assert.match(f.elements['tour-backup-preview'].textContent,/24 fiche\(s\)/);
 assert.match(f.elements['tour-backup-preview'].textContent,/restauration possible/);
 assert.doesNotMatch(f.elements['tour-backup-preview'].textContent,/PATIENT FICTIF|rue inventée/);
 f.open();
 assert.match(f.elements['tour-saved-status'].textContent,/Aucune fiche/);
 assert.equal(f.elements['tour-security-gate'].hidden,false);
});
test('V250 : une liste existante rend l import explicitement non remplaçable',async()=>{
 const f=await previewFixture({currentPatients:[{id:'fictif'}],file:{v:1,P:[{id:'autre'}],kv:{}}});
 await f.preview();f.open();
 assert.match(f.elements['tour-backup-preview'].textContent,/aucune restauration par-dessus/);
 assert.match(f.elements['tour-saved-status'].textContent,/1 fiche/);
});
test('V250 : les anciens coffres et JSON invalides sont refusés au précontrôle sans écrire',async()=>{
 const old=await previewFixture({file:{v:1,cipher:'faux',salt:'sel'}});
 await old.preview();
 assert.match(old.elements['tour-backup-preview'].textContent,/Ancien coffre technique/);
 const invalid=await previewFixture({file:'{not valid json'});
 await invalid.preview();
 assert.match(invalid.elements['tour-backup-preview'].textContent,/non reconnu ou endommagé/);
});
test('V250 : export JSON s auto-valide sans prétendre vérifier Fichiers, zéro réseau',async()=>{
 const html=await read('tournee-complete.html');
 const a=html.indexOf('async function exportPortableVault(){');
 const b=html.indexOf("document.getElementById('tour-portable-export').addEventListener",a);
 assert.ok(a>0&&b>a);
 const block=html.slice(a,b);
 assert.match(block,/readPortableVault\(JSON\.parse\(data\)\)/);
 assert.match(block,/ne peut pas confirmer son enregistrement ailleurs/);
 assert.doesNotMatch(block,/fetch\(|XMLHttpRequest|sendBeacon/);
});
test('V250 : la mise à jour iOS attend la sauvegarde réelle, sans effacer de données',async()=>{
 const html=await read('tournee-complete.html'),boot=await read('mobile-boot.js');
 const a=html.indexOf('window.tourneeSafeRefresh=async()=>'),b=html.indexOf('function launch(){',a);
 assert.ok(a>0&&b>a);
 assert.match(html.slice(a,b),/await ensureVaultSaved\(\)/);
 assert.match(html.slice(a,b),/secureSavedGen!==secureGen/);
 assert.match(boot,/await window\.tourneeSafeRefresh\(\)/);
 assert.doesNotMatch(boot,/if\(window\.confirm\([^]*?\)\)location\.reload\(\)/);
});
test('V250 : le script principal reste syntaxiquement valide',async()=>{
 const html=await read('tournee-complete.html');
 const block=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(block);assert.doesNotThrow(()=>new Script(block));
});
