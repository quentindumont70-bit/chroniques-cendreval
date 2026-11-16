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
