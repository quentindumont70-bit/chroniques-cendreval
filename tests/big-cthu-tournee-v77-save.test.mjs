import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture({fail=false}={}){
 const html=await read();
 const begin=html.indexOf('function saveStatus(state,message){');
 const end=html.indexOf('function report(message){',begin);
 assert.ok(begin>=0&&end>begin,'save pipeline present');
 const elements=Object.fromEntries(['tour-save-strip','tour-save-text','tour-save-retry','tour-lock'].map(id=>[id,{dataset:{},hidden:false,disabled:false,textContent:'',addEventListener(type,fn){this[type]=fn}}]));
 let writes=0,reloads=0,shouldFail=fail;
 const sandbox={
  document:{hidden:false,getElementById:id=>elements[id],addEventListener(){}},
  localStorage:{setItem(){if(shouldFail)throw Error('QuotaExceeded');writes++}},
  crypto:{getRandomValues(arr){return arr.fill(1)},subtle:{encrypt:async()=>new Uint8Array([1,2,3])}},
  setTimeout:()=>1,clearTimeout:()=>{},TextEncoder,Uint8Array,JSON,
  SECURE_KEY:'test-encrypted-only',secureKey:'fake-key',secureBooted:false,secureSalt:new Uint8Array(16),secureGen:1,secureSavedGen:0,secureActive:null,secureTimer:0,secureState:{tidel_Pl:'[]'},
  to64:()=> 'AQID',enc:new TextEncoder(),location:{reload(){reloads++}}
 };
 runInNewContext(html.slice(begin,end)+'\nthis.flushTest=flush;this.dirtyTest=dirty;this.checkTourIdleTest=checkTourIdle;this.noteTourActivityTest=noteTourActivity;this.setIdleTest=(timestamp)=>{secureBooted=true;lastTourActivity=timestamp};',sandbox,{timeout:1000});
 return {sandbox,elements,flush:()=>sandbox.flushTest(),setFail:v=>{shouldFail=v},writes:()=>writes,reloads:()=>reloads};
}

test('V77: si le navigateur refuse le coffre, erreur persistante et essai possible',async()=>{
 const f=await fixture({fail:true});
 await assert.rejects(f.flush(),/QuotaExceeded/);
 assert.equal(f.elements['tour-save-strip'].dataset.state,'error');
 assert.match(f.elements['tour-save-text'].textContent,/Ne ferme pas la page/);
 assert.equal(f.elements['tour-save-retry'].hidden,false);
 assert.equal(f.writes(),0);
 f.setFail(false);
 await f.elements['tour-save-retry'].click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.writes(),1);
 assert.equal(f.elements['tour-save-strip'].dataset.state,'saved');
 assert.equal(f.elements['tour-save-retry'].hidden,true);
});

test('V77: verrouillage refuse la fermeture tant que la sauvegarde échoue',async()=>{
 const f=await fixture({fail:true});
 await f.elements['tour-lock'].click();
 assert.equal(f.reloads(),0);
 assert.equal(f.elements['tour-lock'].disabled,false);
 assert.equal(f.elements['tour-save-strip'].dataset.state,'error');
 f.setFail(false);
 await f.elements['tour-lock'].click();
 assert.equal(f.reloads(),1);
});

test('V77: ouverture de coffre existant ne réécrit pas inutilement son contenu',async()=>{
 const html=await read();
 assert.match(html,/if\(!full\)\{secureGen\+\+;await flush\(\)\}launch\(\)/);
 assert.match(html,/id="tour-save-strip"/);
 assert.match(html,/id="tour-lock"/);
 assert.match(html,/id="tour-save-retry"/);
 assert.match(html,/type="password" autocomplete="current-password"/);
 assert.doesNotMatch(html,/fetch\(['"]https:\/\/.*patient/);
});

test('V79: évite les écritures répétées du coffre déjà enregistré',async()=>{
 const f=await fixture();
 await f.flush();
 assert.equal(f.writes(),1);
 await f.flush();
 assert.equal(f.writes(),1);
});

test('V79: sauvegarde en arrière-plan seulement si modifications non encore persistées',async()=>{
 const html=await read();
 assert.match(html,/document\.addEventListener\('visibilitychange',\(\)=>\{if\(document\.hidden\)saveIfPending\(\);else checkTourIdle\(\)\}\)/);
 assert.match(html,/window\.addEventListener\('pagehide',saveIfPending\)/);
 assert.match(html,/secureGen!==secureSavedGen/);
 assert.match(html,/secureSavedGen=last/);
 assert.match(html,/if\(secureSavedGen===secureGen\)return/);
});

test('V80: 15 minutes sans interaction provoquent une sauvegarde avant verrouillage',async()=>{
 const f=await fixture();
 f.sandbox.setIdleTest(Date.now()-16*60*1000);
 f.sandbox.checkTourIdleTest();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.reloads(),1);
 assert.equal(f.writes(),1);
});

test('V80: ne verrouille pas si la sauvegarde échoue, même après inactivité',async()=>{
 const f=await fixture({fail:true});
 f.sandbox.setIdleTest(Date.now()-16*60*1000);
 f.sandbox.checkTourIdleTest();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.reloads(),0);
 assert.equal(f.elements['tour-save-strip'].dataset.state,'error');
 assert.equal(f.elements['tour-lock'].disabled,false);
});

test('V80: une interaction remet à zéro le délai et un retour iPhone vérifie le verrou',async()=>{
 const f=await fixture();
 f.sandbox.setIdleTest(Date.now()-16*60*1000);
 f.sandbox.noteTourActivityTest();
 f.sandbox.checkTourIdleTest();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.reloads(),0);
 const html=await read();
 assert.match(html,/const IDLE_LOCK_MS=15\*60\*1000/);
 assert.match(html,/for\(const event of \['pointerdown','keydown','input'\]\)/);
 assert.match(html,/if\(document\.hidden\)saveIfPending\(\);else checkTourIdle\(\)/);
});
