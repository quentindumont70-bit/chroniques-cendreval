import test from 'node:test';
import assert from 'node:assert/strict';
import {collect,getJSON} from '../scripts/collect-ah-feed.mjs';
const resp=(status,body,headers={})=>({ok:status<300,status,headers:{get:k=>headers[k.toLowerCase()]??null},json:async()=>body});
test('Collecteur: marchés Forever seulement, Retry-After respecté, noms issus de l’API',async()=>{
 const calls=[],waits=[];let limited=false;
 const fetchImpl=async url=>{calls.push(url);
  if(url.endsWith('/ah'))return resp(200,{markets:[{market:'forever.normal.horde.us',at:1,scans:3,contributors7d:2},{market:'autre.jeu',at:1}]});
  if(url.includes('/ah/forever.normal.horde.us/2318')){if(!limited){limited=true;return resp(429,{}, {'retry-after':'2'})}return resp(200,{market:'forever.normal.horde.us',item:2318,row:[30,10,1],days:[[1,2,3,4]]})}
  if(url.includes('/items/2318'))return resp(200,{item:{n:'Light Leather',q:1}});
  return resp(404,{});
 };
 const feed=await collect({ids:[2318],fetchImpl,pause:async ms=>{waits.push(ms)},delay:0,now:0});
 assert.deepEqual(Object.keys(feed.markets),['forever.normal.horde.us']);
 assert.deepEqual(feed.markets['forever.normal.horde.us'].items[2318].row,[30,10,1]);
 assert.equal(feed.names[2318].n,'Light Leather');
 assert.ok(waits.includes(2000));
 await assert.rejects(getJSON('x',{fetchImpl:async()=>resp(500,{}),pause:async()=>{}}),/HTTP 500/);
});
import {collectBlizzard,aggregateAuctions,parseHouses} from '../scripts/collect-ah-feed.mjs';
test('Blizzard: inactif sans configuration, agrégation, maison indisponible signalée',async()=>{
 assert.match((await collectBlizzard({ids:[2318],env:{}})).skipped,/non configuré/);
 assert.deepEqual(parseHouses('2:Alliance,6:Horde,x:Neutral,7:Neutral,9:Autre'),[{id:2,faction:'Alliance'},{id:6,faction:'Horde'},{id:7,faction:'Neutral'}]);
 const agg=aggregateAuctions([{item:{id:2318},quantity:20,unit_price:30},{item:{id:2318},quantity:5,unit_price:28},{item:{id:2318},quantity:1,buyout:50},{item:{id:9},quantity:1,unit_price:1}],[2318],123);
 assert.deepEqual(agg,{2318:{row:[28,26,123],days:[]}});
 const env={BLIZZARD_CLIENT_ID:'a',BLIZZARD_CLIENT_SECRET:'b',BLIZZARD_REGION:'eu',FOREVER_RULESET_ID:'1',FOREVER_HOUSES:'6:Horde'};
 const fetchImpl=async url=>url.includes('oauth')?resp(200,{access_token:'t'}):resp(503,{});
 const r=await collectBlizzard({ids:[2318],env,fetchImpl});
 assert.deepEqual(r.markets,{});assert.match(r.errors[0],/maison 6 : HTTP 503/);
 const ok=await collectBlizzard({ids:[2318],env,fetchImpl:async url=>url.includes('oauth')?resp(200,{access_token:'t'}):resp(200,{auctions:[{item:{id:2318},quantity:3,unit_price:31}]}),now:5});
 const m=ok.markets['blizzard.eu.1.6'];
 assert.equal(m.meta.region,'eu');assert.equal(m.meta.faction,'Horde');assert.deepEqual(m.items[2318].row,[31,3,5]);
});

import {readFileSync as readPublicSource} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('Lecteur public: prix/quantité/date invalides refusés avant affichage',async()=>{
 const source=readPublicSource(new URL('../public/binch/ah-public-snapshots.js',import.meta.url),'utf8');
 const marker='const start=()=>setTimeout(mount,0);';
 assert.ok(source.includes(marker),'point de test du lecteur public disponible');
 const market='forever.normal.horde.us',item=2318,now=Date.now();
 const read=async(data)=>{
  const context={
   document:{readyState:'loading',addEventListener(){}},
   fetch:async()=>({ok:true,json:async()=>data}),
   AbortController,setTimeout,clearTimeout,Date
  };
  runInNewContext(source.replace(marker,'globalThis.__readSnapshot=read;\n'+marker),context);
  return context.__readSnapshot(market,item);
 };
 const payload=row=>({market,item,row});
 assert.equal((await read(payload([500,8,now-60000]))).row[0],500);
 assert.equal((await read(payload([null,null,now-60000]))).row[0],null);
 for(const row of [[500,-2,now-60000],[-1,8,now-60000],[500,1.2,now-60000],[500,8,0],[500,8,now+7200000],[500,8,null]]){
  await assert.rejects(read(payload(row)),/invalides/,'rejet : '+JSON.stringify(row));
 }
 await assert.rejects(read({market:'forever.pvp.horde.us',item,row:[500,8,now-60000]}),/inattendue/);
});
