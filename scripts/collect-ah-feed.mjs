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
 const feed={format:'binch-ah-feed-v2',generatedAt:new Date(now).toISOString(),source:'auctionhouse.fyi — relevés horaires partagés par des joueurs (non temps réel)',markets:{},names:{},errors:[]};
 for(const m of markets){
  const [,ruleset,fac]=m.market.match(MARKET);
  feed.markets[m.market]={meta:{provider:'auctionhouse.fyi',region:'us',ruleset,faction:fac==='horde'?'Horde':'Alliance',houseId:null},at:Number(m.at)||null,scans:Number(m.scans)||0,contributors7d:Number(m.contributors7d)||0,items:{}};
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

/* Fournisseur officiel optionnel — API Blizzard Game Data (WoW Forever).
   Chemins signalés par la communauté (fil Blizzard « WoW: Forever API: what works so far ») et NON vérifiés
   par La Binch : /data/wow/ruleset/{id}/auctions/{houseId}, namespace dynamic-forever-{region}.
   Inactif sans BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET / FOREVER_RULESET_ID / FOREVER_HOUSES. */
export function parseHouses(text){
 // "2:Alliance,6:Horde,7:Neutral"
 return String(text||'').split(',').map(x=>x.trim().split(':')).filter(([id,f])=>/^\d+$/.test(id)&&['Horde','Alliance','Neutral'].includes(f)).map(([id,f])=>({id:Number(id),faction:f}));
}
export function aggregateAuctions(auctions,ids,at){
 const want=new Set(ids),by=new Map();
 for(const a of Array.isArray(auctions)?auctions:[]){
  const id=Number(a?.item?.id),q=Number(a?.quantity)||1,unit=Number(a?.unit_price)||(Number(a?.buyout)>0?Math.floor(Number(a.buyout)/q):0);
  if(!want.has(id)||!Number.isSafeInteger(unit)||unit<=0)continue;
  const e=by.get(id)||{min:Infinity,qty:0};e.min=Math.min(e.min,unit);e.qty+=q;by.set(id,e);
 }
 return Object.fromEntries([...by].map(([id,e])=>[id,{row:[e.min,e.qty,at],days:[]}]));
}
export async function collectBlizzard({ids,env=process.env,fetchImpl=fetch,now=Date.now()}){
 const {BLIZZARD_CLIENT_ID:cid,BLIZZARD_CLIENT_SECRET:sec,FOREVER_RULESET_ID:rs,FOREVER_RULESET_NAME:rsName,FOREVER_HOUSES:houses}=env;
 const region=['eu','us'].includes(env.BLIZZARD_REGION)?env.BLIZZARD_REGION:null;
 if(!cid||!sec||!region||!/^\d+$/.test(rs||'')||!parseHouses(houses).length)return {markets:{},errors:[],skipped:'Fournisseur Blizzard non configuré.'};
 const tok=await fetchImpl('https://oauth.battle.net/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(cid+':'+sec).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
 if(!tok.ok)return {markets:{},errors:['OAuth Blizzard : HTTP '+tok.status]};
 const {access_token}=await tok.json(),markets={},errors=[];
 for(const h of parseHouses(houses)){
  const url='https://'+region+'.api.blizzard.com/data/wow/ruleset/'+rs+'/auctions/'+h.id+'?namespace=dynamic-forever-'+region;
  try{
   const res=await fetchImpl(url,{headers:{Authorization:'Bearer '+access_token}});
   if(!res.ok)throw Error('HTTP '+res.status);
   const d=await res.json(),at=Date.parse(res.headers.get('last-modified'))||now;
   markets['blizzard.'+region+'.'+rs+'.'+h.id]={meta:{provider:'API Blizzard (non vérifiée)',region,ruleset:String(rsName||rs).slice(0,40),faction:h.faction,houseId:h.id},at,scans:1,contributors7d:0,items:aggregateAuctions(d.auctions,ids,at)};
  }catch(e){errors.push('Blizzard maison '+h.id+' : '+e.message)}
 }
 return {markets,errors};
}

export function watchlistIds(file){
 const w=JSON.parse(fs.readFileSync(file,'utf8'));
 return [...new Set(Object.values(w.groups||{}).flat().map(Number).filter(n=>Number.isSafeInteger(n)&&n>0))];
}

if(import.meta.url===`file://${process.argv[1]}`){
 const out=process.argv[2]||'ah-feed.json';
 const ids=watchlistIds(path.resolve('public/binch/ah-watchlist.json'));
 const feed=await collect({ids});
 try{const b=await collectBlizzard({ids});Object.assign(feed.markets,b.markets);feed.errors.push(...b.errors);if(b.skipped)console.log(b.skipped)}catch(e){feed.errors.push('Blizzard : '+e.message)}
 fs.writeFileSync(out,JSON.stringify(feed));
 const n=Object.values(feed.markets).reduce((s,m)=>s+Object.keys(m.items).length,0);
 console.log('Flux AH : '+Object.keys(feed.markets).length+' marché(s), '+n+' cotations, '+feed.errors.length+' erreur(s).');
 if(!n)process.exit(1);
}
