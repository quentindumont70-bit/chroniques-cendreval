import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await read();
 const start=html.lastIndexOf('function saveIfPending(){');
 const end=html.lastIndexOf('</script>');
 assert.ok(start>=0&&end>start,'iPhone lifecycle hooks present');
 const events=new Map(),windowEvents=new Map();
 let writes=0,failures=0,checks=0;
 const document={hidden:false,addEventListener(type,handler){events.set(type,handler)}};
 const window={addEventListener(type,handler){windowEvents.set(type,handler)}};
 const context={
  document,window,
  secureKey:{},secureGen:2,secureSavedGen:1,secureBooted:true,
  flush:async()=>{writes++;context.secureSavedGen=context.secureGen},
  saveFailure:()=>{failures++},
  checkTourIdle:()=>{checks++},
  autoOpenTournee:async()=>false
 };
 runInNewContext(html.slice(start,end),context,{timeout:1000});
 return {context,document,events,windowEvents,writes:()=>writes,failures:()=>failures,checks:()=>checks};
}

test('V89: mise en arrière-plan demande une sauvegarde seulement pour une génération non persistée',async()=>{
 const f=await fixture();
 f.document.hidden=true;
 f.events.get('visibilitychange')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.writes(),1);
 f.events.get('visibilitychange')();
 f.windowEvents.get('pagehide')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.writes(),1,'no duplicate write for the same generation');
 assert.equal(f.failures(),0);
});

test('V89: retour depuis écran verrouillé vérifie le délai sans le remettre à zéro',async()=>{
 const f=await fixture();
 f.context.secureGen=f.context.secureSavedGen;
 f.document.hidden=false;
 f.events.get('visibilitychange')();
 f.windowEvents.get('pageshow')();
 f.windowEvents.get('focus')();
 assert.equal(f.checks(),3);
 assert.equal(f.writes(),0);
 f.context.secureBooted=false;
 f.windowEvents.get('pageshow')();
 f.windowEvents.get('focus')();
 assert.equal(f.checks(),3,'locked page does not re-activate a session');
});

test('V89: échec en arrière-plan est signalé sans prétendre que iOS a enregistré',async()=>{
 const f=await fixture();
 f.context.flush=async()=>{throw Error('QuotaExceeded')};
 f.document.hidden=true;
 f.events.get('visibilitychange')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.failures(),1);
 assert.equal(f.context.secureSavedGen,1,'failed save must not mark the latest generation as committed');
});

test('V89: checklist terrain limite les essais aux données fictives sans nettoyage du stockage',async()=>{
 const guide=await readFile(new URL('../big-cthu-beta/installation-iphone.html',import.meta.url),'utf8');
 assert.match(guide,/Essai de reprise iPhone sur données fictives/);
 assert.match(guide,/Ne supprime aucun stockage/);
 assert.match(guide,/second navigateur vierge/);
 assert.match(guide,/Exporter une sauvegarde complète JSON/);
 assert.doesNotMatch(guide,/Effacer l'historique Safari pour réinitialiser/);
});


test('V98: retour iPhone après échec de stockage relance une sauvegarde seulement si nécessaire',async()=>{
 const f=await fixture();
 let blocked=true;
 f.context.flush=async()=>{
  if(blocked)throw Error('QuotaExceeded');
  f.context.secureSavedGen=f.context.secureGen;
 };
 f.document.hidden=true;
 f.events.get('visibilitychange')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.failures(),1);
 assert.equal(f.context.secureSavedGen,1);
 blocked=false;
 f.document.hidden=false;
 f.windowEvents.get('pageshow')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.context.secureSavedGen,2);
 assert.equal(f.checks(),1);
 f.windowEvents.get('focus')();
 assert.equal(f.checks(),2);
 assert.equal(f.failures(),1);
});

test('V98: retour après échec encore actif ne déclare jamais une sauvegarde réussie',async()=>{
 const f=await fixture();
 f.context.flush=async()=>{throw Error('Ecriture impossible')};
 f.document.hidden=false;
 f.windowEvents.get('pageshow')();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.context.secureSavedGen,1);
 assert.equal(f.failures(),1);
 assert.equal(f.checks(),1);
});

test('V98: iPhone et navigateur en ligne/hors ligne n imposent aucun nouveau code',async()=>{
 const html=await read();
 assert.match(html,/function resumeTournee\(\)/);
 assert.match(html,/if\(secureKey&&secureGen!==secureSavedGen\)saveIfPending\(\)/);
 assert.match(html,/window\.addEventListener\('pageshow',resumeTournee\)/);
 assert.match(html,/window\.addEventListener\('focus',resumeTournee\)/);
 assert.match(html,/localStorage\.getItem\(SECURE_KEY\)!==record/);
 assert.doesNotMatch(html,/window\.addEventListener\('pageshow',\(\)=>location\.reload/);
 assert.match(html,/id="tour-security-gate" hidden/);
});
