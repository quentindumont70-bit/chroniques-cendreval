import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V122: glassmorphism has physical material, no fake replacement for the alpine photograph',async()=>{
 const html=await read('premium-cinema.html');
 assert.match(html,/Crystal Vista/);
 assert.match(html,/\.page:before\{[^}]*images\.unsplash\.com\/photo-/);
 assert.match(html,/\.hero\{[^}]*backdrop-filter:none/);
 assert.match(html,/\.glass:before\{[^}]*border-top:1px solid/);
 assert.match(html,/\.module\{[\s\S]*?backdrop-filter:blur\(18px\)/);
 assert.match(html,/\.topinner:before\{[\s\S]*?linear-gradient/);
 assert.match(html,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(html,/@media\(forced-colors:active\)/);
 assert.match(html,/\.page:before\{[^}]*position:fixed/);
});

test('V122: iPhone mountain stays visible under a readable glass surface',async()=>{
 const html=await read('premium-cinema.html');
 const section=html.slice(html.indexOf('/* V122 / Crystal Vista:'));
 assert.match(section,/@media\(max-width:760px\)/);
 assert.match(section,/\.page:before\{filter:saturate\(\.96\).*brightness\(\.98\)/);
 assert.match(section,/\.hero:before\{background:linear-gradient/);
 assert.match(section,/\.module,\.glass\{-webkit-backdrop-filter:blur\(11px\)/);
 assert.match(html,/prefers-reduced-motion:reduce/);
});

function fakeServiceWorker(source){
 const handlers={}; const stored=new Map();let networkCalls=0,puts=0;
 const response={type:'opaque',ok:false,clone(){return this},body:'public-image'};
 const bucket={
  async match(request){return stored.get(request.url)},
  async put(request,value){puts++;stored.set(request.url,value)}
 };
 const fakeSelf={
  location:{origin:'https://example.github.io'},
  registration:{scope:'https://example.github.io/chroniques-cendreval/big-cthu-beta/'},
  addEventListener(name,fn){handlers[name]=fn}
 };
 const api={
  self:fakeSelf,
  caches:{open:async()=>bucket,match:async()=>null,keys:async()=>[]},
  fetch:async()=>{networkCalls++;return response},
  URL,Promise
 };
 runInNewContext(source,api,{timeout:1000});
 return {
  invoke(request){
   let awaited=null;
   handlers.fetch({request,respondWith(promise){awaited=promise}});
   return awaited;
  },
  network:()=>networkCalls,puts:()=>puts
 };
}

test('V122: public mountain photo fetched once and reused offline on later views',async()=>{
 const sw=await read('sw.js');
 const env=fakeServiceWorker(sw);
 const url='https://images.unsplash.com/photo-1649401691853-6ecfa00f044e?auto=format&fit=crop&w=960&q=82';
 const req={url,method:'GET',destination:'image',mode:'no-cors'};
 const first=await env.invoke(req);
 assert.equal(first.body,'public-image');
 assert.equal(env.network(),1);
 assert.equal(env.puts(),1);
 const second=await env.invoke(req);
 assert.equal(second.body,'public-image');
 assert.equal(env.network(),1);
 assert.equal(env.puts(),1);
});

test('V122: no arbitrary third-party resources, patient data or writes are cached',async()=>{
 const sw=await read('sw.js');
 const env=fakeServiceWorker(sw);
 const other={method:'GET',destination:'image',url:'https://images.unsplash.com/photo-OTHER?auto=format&fit=crop'};
 assert.equal(env.invoke(other),null);
 const evil={method:'GET',destination:'script',url:'https://images.unsplash.com/photo-1649401691853-6ecfa00f044e'};
 assert.equal(env.invoke(evil),null);
 const privateUrl={method:'GET',destination:'image',url:'https://example.org/secret-patient-image'};
 assert.equal(env.invoke(privateUrl),null);
 assert.equal(env.network(),0);
 assert.match(sw,/PUBLIC_SCENERY_CACHE='big-cthu-public-scenery-v1'/);
 assert.match(sw,/big-cthu-public-v2-v124/);
 assert.doesNotMatch(sw,/tidel_Pl|tidel_absences_journal_v1/);
});
