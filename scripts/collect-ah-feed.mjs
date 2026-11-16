// La Binch — collecteur des relevés communautaires auctionhouse.fyi pour WoW Forever.
// Lecture publique anonyme (prix horaires + 7 jours), une requête à la fois, Retry-After respecté.
// Sortie : un fichier JSON servi ensuite par raw.githubusercontent.com (CORS ouvert) à La Binch.
// Usage : node scripts/collect-ah-feed.mjs [sortie.json]
import fs from 'node:fs';
import path from 'node:path';

const API='https://auctionhouse.fyi/api/v1';
const MARKET=/^forever\.(normal|pvp|rp)\.(horde|alliance)\.us$/;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export async function getJSON(url,{fetchImpl=fetch,tries=3,pause=sleep}={}){
 for(let attempt=1;;attempt++){
  const res=await fetchImpl(url,{headers:{Accept:'application/json','User-Agent':'LaBinch-feed/1.0 (+github.com/quentindumont70-bit/chroniques-cendreval)'}});
  if(res.status===429||res.status===503){
   if(attempt>=tries)throw Error(url+' : HTTP '+res.status+' persistant');
   const wait=Math.min(120,Number(res.headers.get('retry-after'))||10);await pause(wait*1000);continue;
  }
  if(!res.ok)throw Error(url+' : HTTP '+res.status);
  return res.json();
 }
}

export async function collect({ids,fetchImpl=fetch,pause=sleep,delay=400,now=Date.now()}){
 const list=await getJSON(API+'/ah',{fetchImpl,pause});
 const markets=(list.markets||[]).filter(m=>MARKET.test(m.market));
 const feed={format:'binch-ah-feed-v1',generatedAt:new Date(now).toISOString(),source:'auctionhouse.fyi — relevés horaires partagés par des joueurs (non temps réel)',markets:{},names:{},errors:[]};
 for(const m of markets){
  feed.markets[m.market]={at:Number(m.at)||null,scans:Number(m.scans)||0,contributors7d:Number(m.contributors7d)||0,items:{}};
  for(const id of ids){
   try{
    const d=await getJSON(API+'/ah/'+m.market+'/'+id,{fetchImpl,pause});
    if(d.market===m.market&&Number(d.item)===id)feed.markets[m.market].items[id]={row:Array.isArray(d.row)?d.row.slice(0,3):null,days:Array.isArray(d.days)?d.days.slice(-7):[]};
   }catch(e){feed.errors.push(String(e.message).slice(0,160))}
   await pause(delay);
  }
 }
 for(const id of ids){
  try{const meta=await getJSON(API+'/items/'+id,{fetchImpl,pause});if(meta?.item?.n)feed.names[id]={n:String(meta.item.n).slice(0,100),q:Number(meta.item.q)||0}}
  catch(e){feed.errors.push(String(e.message).slice(0,160))}
  await pause(delay);
 }
 feed.errors=feed.errors.slice(0,50);
 return feed;
}

export function watchlistIds(file){
 const w=JSON.parse(fs.readFileSync(file,'utf8'));
 return [...new Set(Object.values(w.groups||{}).flat().map(Number).filter(n=>Number.isSafeInteger(n)&&n>0))];
}

if(import.meta.url===`file://${process.argv[1]}`){
 const out=process.argv[2]||'ah-feed.json';
 const ids=watchlistIds(path.resolve('public/binch/ah-watchlist.json'));
 const feed=await collect({ids});
 fs.writeFileSync(out,JSON.stringify(feed));
 const n=Object.values(feed.markets).reduce((s,m)=>s+Object.keys(m.items).length,0);
 console.log('Flux AH : '+Object.keys(feed.markets).length+' marché(s), '+n+' cotations, '+feed.errors.length+' erreur(s).');
 if(!n)process.exit(1);
}
