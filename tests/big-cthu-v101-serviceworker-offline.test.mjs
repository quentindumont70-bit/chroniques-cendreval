import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const scope='https://example.test/chroniques-cendreval/big-cthu-beta/';
const read=()=>readFile(new URL('../big-cthu-beta/sw.js',import.meta.url),'utf8');
async function fixture({server='offline'}={}){
 const script=await read(),events=new Map(),cached=new Map();
 let networkCalls=0,cacheLookups=0,cleanup=[];
 const urlOf=v=>new URL(typeof v==='string'?v:v.url,scope);
 const keyOf=(v,ignoreSearch=false)=>{
  const url=urlOf(v);
  return ignoreSearch?url.pathname:url.pathname+url.search;
 };
 const caches={
  async match(value,opts={}){
   cacheLookups++;
   const key=keyOf(value,!!opts.ignoreSearch);
   if(!opts.ignoreSearch)return cached.get(key)||null;
   return [...cached.entries()].find(([k])=>k.split('?')[0]===key)?.[1]||null;
  },
  async open(name){
   return {async addAll(assets){for(const a of assets)cached.set(keyOf(a),{status:200,body:'CACHED '+a});},name};
  },
  async keys(){return ['big-cthu-public-v2-v99','big-cthu-public-v2-v102']},
  async delete(name){cleanup.push(name);return true}
 };
 const ctx={
  URL,caches,
  fetch:async request=>{
   networkCalls++;
   if(server==='offline')throw Error('Network unreachable');
   if(server==='error')return {status:503,body:'FAIL'};
   return {status:200,body:'LIVE'};
  },
  self:{
   location:{origin:'https://example.test'},
   registration:{scope},
   addEventListener:(name,handler)=>events.set(name,handler),
   skipWaiting:async()=>{},
   clients:{claim:async()=>{}}
  }
 };
 runInNewContext(script,ctx,{timeout:1000});
 async function install(){
  let work;
  events.get('install')({waitUntil:p=>{work=p}});
  await work;
 }
 async function activate(){
  let work;
  events.get('activate')({waitUntil:p=>{work=p}});
  await work;
 }
 async function navigate(path,mode='navigate',method='GET'){
  const url=new URL(path,scope);
  let pending;
  const request={method,url:url.href,mode};
  events.get('fetch')({request,respondWith:p=>{pending=p}});
  return pending?await pending:undefined;
 }
 return {script,events,install,activate,navigate,cached,cacheLookups:()=>cacheLookups,networkCalls:()=>networkCalls,cleanup:()=>cleanup};
}
test('V101: ouverture iPhone hors ligne depuis URL paramétrée retrouve la page Tournée dans le cache',async()=>{
 const f=await fixture();
 await f.install();
 const result=await f.navigate('tournee-complete.html?v=20261113&utm_source=iphone');
 assert.equal(result.status,200);
 assert.equal(result.body,'CACHED ./tournee-complete.html');
 assert.equal(f.networkCalls(),1);
 assert.ok(f.cacheLookups()>0);
});
test('V101: réponse 503 après fermeture Safari revient au cache public et ne montre pas erreur réseau',async()=>{
 const f=await fixture({server:'error'});
 await f.install();
 const result=await f.navigate('tournee-complete.html?mode=standalone');
 assert.equal(result.body,'CACHED ./tournee-complete.html');
 assert.equal(f.networkCalls(),1);
});
test('V101: en ligne la navigation reçoit la version réseau à jour',async()=>{
 const f=await fixture({server:'online'});
 await f.install();
 const result=await f.navigate('tournee-complete.html');
 assert.equal(result.body,'LIVE');
 assert.equal(f.networkCalls(),1);
});
test('V101: hors ligne, une page inconnue revient au cockpit sans exposer de données',async()=>{
 const f=await fixture();
 await f.install();
 const result=await f.navigate('module-inexistant.html');
 assert.equal(result.body,'CACHED ./index.html');
});
test('V101: jamais intercepter une écriture ni un site externe ; assets uniquement publics',async()=>{
 const f=await fixture();
 await f.install();
 assert.equal(await f.navigate('tournee-complete.html','navigate','POST'),undefined);
 assert.equal(await f.navigate('https://autre.example/patient','navigate'),undefined);
 assert.equal(f.networkCalls(),0);
 assert.doesNotMatch(f.script,/tidel_Pl|absences_journal_v1|indexedDB|localStorage/);
 assert.match(f.script,/const CACHE='big-cthu-public-v2-v101'/);
});
test('V101: activation supprime uniquement les anciens caches Big Cthu, conserve le cache courant',async()=>{
 const f=await fixture();
 await f.install();
 await f.activate();
 assert.deepEqual(f.cleanup(),['big-cthu-public-v2-v99']);
});
