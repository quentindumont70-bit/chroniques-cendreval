/* La Binch Market Bridge: read-only snapshots of the two local ledgers.
   No writes, automatic merges, guessed realm/faction, or live-price claims. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchMarketBridge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const clean=(x,n=90)=>String(x??'').trim().slice(0,n);
const normalize=x=>clean(x).toLocaleLowerCase('fr');
function snapshot(legacy,ah,scope){
 const realm=normalize(scope?.realm),faction=scope?.faction;
 if(!realm||!['Horde','Alliance'].includes(faction))return {items:[],status:'scope-required'};
 const items=[];
 const push=(name,price,date,source,store)=>{
  const amount=Number(price),timestamp=Date.parse(date);
  if(!clean(name)||!Number.isSafeInteger(amount)||amount<=0||amount>1e12||!Number.isFinite(timestamp)||timestamp>Date.now())return;
  items.push({name:clean(name),price:amount,observedAt:new Date(timestamp).toISOString(),source:clean(source||'Saisie manuelle',80),store});
 };
 for(const x of Array.isArray(legacy?.prices)?legacy.prices:[]){
  if(normalize(x.realm)!==realm||x.faction!==faction)continue;
  push(x.item,x.unit,x.time,x.source||'Manuel (Bourse V1)','binch.market.v1');
 }
 for(const x of Array.isArray(ah?.items)?ah.items:[]){
  if((x.scope||'legacy')!==realm+'|'+faction)continue;
  push(x.name,x.last,x.observedAt,x.source||'Carnet AH','binch.ah.market.v1');
 }
 items.sort((a,b)=>b.observedAt.localeCompare(a.observedAt));
 return {items,status:items.length?'observed':'empty'};
}
function latestFor(snapshotValue,name){
 return snapshotValue?.items?.find(x=>normalize(x.name)===normalize(name))||null;
}
return {snapshot,latestFor};
});
