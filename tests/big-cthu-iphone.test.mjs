import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {inflateSync} from 'node:zlib';

const base=new URL('../big-cthu-beta/',import.meta.url);
const read=name=>readFile(new URL(name,base),'utf8');
const pages=['budget.html','voyages.html','cantine.html','repas.html','agenda.html','maison.html','passions.html','sauvegardes.html','capture.html','garde-manger.html'];

test('iPhone: manifeste autonome garde une identité stable et la même portée',async()=>{
 const manifest=JSON.parse(await read('manifest.webmanifest'));
 assert.equal(manifest.id,'./');
 assert.equal(manifest.start_url,'./index.html');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.lang,'fr');
 assert.ok((await read('icon.svg')).includes('<svg'));
 assert.ok(manifest.icons.some(i=>i.src==='./apple-touch-icon.png'&&i.sizes==='180x180'&&i.type==='image/png'));
 const png=await readFile(new URL('apple-touch-icon.png',base));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),180);
 assert.equal(png.readUInt32BE(20),180);
 const length=png.readUInt32BE(33);
 assert.equal(png.subarray(37,41).toString(),'IDAT');
 assert.equal(inflateSync(png.subarray(41,41+length)).length,180*(1+180*4));
});

test('iPhone: guide accessible depuis le cockpit avec précautions de migration',async()=>{
 const [home,guide]=await Promise.all([read('index.html'),read('installation-iphone.html')]);
 assert.match(home,/href="\.\/installation-iphone\.html"/);
 assert.match(home,/rel="manifest"/);
 assert.match(home,/apple-mobile-web-app-capable/);
 assert.match(home,/rel="apple-touch-icon"/);
 assert.match(home,/controllerchange/);
 assert.match(guide,/Ouvrir comme app web/);
 assert.match(guide,/rel="apple-touch-icon"/);
 assert.match(guide,/stockages (?:séparés|locaux|distincts)/);
 assert.match(guide,/anciens raccourcis/);
 assert.match(guide,/sauvegardes\.html/);
 assert.match(guide,/Copier l'adresse principale/);
 assert.match(guide,/id="testStorage"/);
 assert.match(guide,/localStorage\.removeItem\(key\)/);
 assert.match(guide,/display-mode: standalone/);
 assert.match(guide,/Une seule icône|une seule icône/);
 assert.doesNotMatch(guide,/api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/);
});

test('iPhone: les principales tentacules portent le même manifeste et activent le cache',async()=>{
 for(const page of pages){
  const source=await read(page);
  assert.match(source,/rel="manifest" href="\.\/manifest\.webmanifest"/,page);
  assert.match(source,/apple-mobile-web-app-capable/,page);
  assert.match(source,/src="\.\/mobile-boot\.js" defer/,page);
 }
 const boot=await read('mobile-boot.js');
 assert.match(boot,/worker\.register\('\.\/sw\.js'\)/);
});

test('iPhone: le service worker contient les ressources publiques requises',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/const CACHE='big-cthu-public-v2-v\d+'/);
 assert.match(sw,/ignoreSearch:true/);
 const assets=sw.match(/const ASSETS=\[([\s\S]*?)\];/)[1];
 const names=[...assets.matchAll(/'\.\/([^']+)'/g)].map(x=>x[1]);
 assert.equal(names.length,new Set(names).size);
 for(const name of ['index.html','installation-iphone.html','mobile-boot.js','sauvegardes.html','voyages.html','cantine.html','manifest.webmanifest','icon.svg','apple-touch-icon.png']){
  assert.ok(names.includes(name),name+' missing');
  if(name.endsWith('.png'))await readFile(new URL(name,base));else await read(name);
 }
 const guide=await read('installation-iphone.html');
 const localLinks=[...guide.matchAll(/href="\.\/([^"#?]+)"/g)].map(x=>x[1]);
 for(const file of localLinks)assert.ok(names.includes(file),'Guide link not cached: '+file);
});

test('iPhone: navigation avec un paramètre conserve le mode hors-ligne',async()=>{
 const source=await read('sw.js');
 const listeners={};
 const hit={status:200,label:'cached page'};
 const caches={
  async open(){return {async addAll(){}}},async keys(){return []},async match(request,opts){
   const url=typeof request==='string'?request:request.url;
   if(url.includes('/voyages.html')&&opts?.ignoreSearch)return hit;
   return null;
  }
 };
 const scope='https://example.invalid/chroniques-cendreval/big-cthu-beta/';
 const self={location:{origin:'https://example.invalid'},registration:{scope},clients:{claim:async()=>{}},
  skipWaiting(){},addEventListener(type,fn){listeners[type]=fn}};
 runInNewContext(source,{self,caches,fetch:()=>Promise.reject(new Error('offline')),URL,Promise});
 let response;
 const event={request:{url:scope+'voyages.html?utm_source=iphone',method:'GET',mode:'navigate'},
  respondWith(value){response=value}};
 listeners.fetch(event);
 assert.equal(await response,hit);
});

test('iPhone: aucune ressource distante requise pour le shell public',async()=>{
 const sw=await read('sw.js');
 assert.doesNotMatch(sw,/api\.openai|api\.anthropic|fetch\(['"]https:\/\//);
 assert.match(sw,/r\.method!=='GET'/);
 assert.match(sw,/origin!==self\.location\.origin/);
});

test('Tournée IDEL: le cockpit ouvre le lien existant sans publier de données médicales',async()=>{
 const home=await read('index.html');
 const tour='https://claude.ai/artifact/Na1RpnwQ5d5pqbqBLdnjj8';
 assert.ok(home.includes("b.href='"+tour+"'"),'historical Tournée link not configured');
 assert.match(home,/b\.target='_blank'/);
 assert.match(home,/b\.rel='noopener noreferrer'/);
 assert.match(home,/if\(i\[3\]!=='tour'\)b\.addEventListener/);
 assert.match(home,/Le cockpit public ne copie ni ne synchronise les patients/);
 const sw=await read('sw.js');
 assert.doesNotMatch(sw,/Na1RpnwQ5d5pqbqBLdnjj8/);
 assert.match(sw,/public-v2-v59/);
});
