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
