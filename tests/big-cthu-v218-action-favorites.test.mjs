import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
async function boot(initial=null,deny=false){
 const saved=new Map();
 const key='big-cthu-v2-action-favorites-v1';
 if(initial!==null)saved.set(key,initial);
 let writes=0;
 const window={};
 const localStorage={
  getItem:k=>saved.get(k)??null,
  setItem(k,value){writes++;if(deny)throw Error('QuotaExceededError');saved.set(k,String(value))}
 };
 runInNewContext(await read('action-favorites.js'),{window,localStorage,JSON,Set},{timeout:1200});
 return {api:window.BigCthuActionFavorites,saved,writes:()=>writes,key};
}

test('V218: épingler et retirer une référence sans copier le contenu métier',async()=>{
 const f=await boot();
 const ref=f.api.makeKey('Priorités','task-123');
 assert.equal(ref,'Priorités:task-123');
 assert.equal(f.api.toggle(ref).ok,true);
 assert.equal(f.api.read().ids[0],ref);
 assert.equal(f.saved.get(f.key),'["Priorités:task-123"]');
 assert.equal(f.api.toggle(ref).ok,true);
 assert.deepEqual(Array.from(f.api.read().ids),[]);
 assert.equal(f.writes(),2);
});

test('V218: stockage illisible jamais écrasé et écriture refusée sans succès fictif',async()=>{
 const broken=await boot('{not-json');
 const bad=broken.api.toggle('Maison:job-1');
 assert.equal(bad.ok,false);
 assert.equal(broken.saved.get(broken.key),'{not-json');
 assert.equal(broken.writes(),0);
 const full=await boot(null,true);
 assert.equal(full.api.toggle('Maison:job-1').ok,false);
 assert.equal(full.saved.has(full.key),false);
});

test('V219: rejette les identifiants invalides, doublons et valeurs hors limite',async()=>{
 const f=await boot(JSON.stringify(['Jeux:session-1','Jeux:session-1']));
 assert.equal(f.api.read().blocked,true);
 assert.equal(f.api.toggle('Jeux:session-2').ok,false);
 const other=await boot();
 assert.equal(other.api.makeKey('Patient','secret'),'');
 assert.equal(other.api.makeKey('Musique','x'.repeat(121)),'');
 assert.equal(other.api.toggle('Patient:secret').ok,false);
 assert.equal(other.writes(),0);
});

test('V219: Coffre V27 conserve les références et le cache public emporte le script',async()=>{
 const [html,backup,sw,pulse]=await Promise.all(['index.html','sauvegardes.html','sw.js','active-pulse.js'].map(read));
 assert.match(html,/src="\.\/action-favorites\.js" defer/);
 assert.match(html,/id="activePulsePinButton"/);
 assert.match(backup,/version:27,exportedAt/);
 assert.match(backup,/data\.actionFavorites=readActionPins\(\)/);
 assert.match(backup,/stage\(ACTION_PINS,staged\.actionFavorites\)/);
 assert.match(sw,/'\.\/action-favorites\.js'/);
 assert.match(sw,/big-cthu-public-v2-v219/);
 assert.doesNotMatch(pulse,/localStorage\.setItem|fetch\(|XMLHttpRequest/);
});
