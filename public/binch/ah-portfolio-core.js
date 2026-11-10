/* La Binch — registre marchand : comptabilité par lots FIFO pour les achats/ventes déclarés.
   Ne contacte pas les enchères. N'invente pas le prix de revient des ventes sans achat.
   Module autonome: ne modifie jamais les opérations originales.
*/
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchAHPortfolio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const valid=x=>Number.isSafeInteger(x)&&x>=0,MAX=1000;
function ledger(trades,fee=5){
 const rate=Number.isFinite(Number(fee))?Math.max(0,Math.min(20,Number(fee)))/100:0.05;
 const buckets=new Map(),sales=[],invalid=[],positions=[];
 let invested=0,receipts=0,costRealized=0,realized=0,matchedUnits=0,unmatchedUnits=0;
 const array=Array.isArray(trades)?trades.slice(0,MAX):[];
 const ordered=array.map((x,i)=>({...x,sourceIndex:i})).sort((a,b)=>{
  const aTime=Date.parse(a.at),bTime=Date.parse(b.at);
  return (Number.isFinite(aTime)?aTime:0)-(Number.isFinite(bTime)?bTime:0)||a.sourceIndex-b.sourceIndex;
 });
 const scope=x=>typeof x.scope==='string'&&x.scope.length<100?x.scope:'legacy';
 const normalize=x=>String(x??'').trim().toLocaleLowerCase('fr').slice(0,120);
 for(const trade of ordered){
  const item=normalize(trade.item),qty=Number(trade.qty),price=Number(trade.price),kind=trade.kind,market=scope(trade);
  if(!item||!Number.isInteger(qty)||qty<1||qty>100000||!valid(price)||price<1||price>1e12||!['buy','sell'].includes(kind)){invalid.push({id:trade.id,reason:'Ligne invalide'});continue}
  const key=market+'|'+item;
  if(!buckets.has(key))buckets.set(key,{key,item:trade.item,market,lots:[],buyQty:0,sellQty:0,unmatched:0,saleGross:0,realized:0});
  const bucket=buckets.get(key);
  if(kind==='buy'){
   bucket.lots.push({price,remaining:qty,at:trade.at||''});bucket.buyQty+=qty;invested+=price*qty;continue
  }
  const net=Math.floor(price*qty*(1-rate));receipts+=net;bucket.sellQty+=qty;bucket.saleGross+=net;
  let rest=qty,matched=0,cost=0;
  for(const lot of bucket.lots){if(!rest)break;const taken=Math.min(rest,lot.remaining);rest-=taken;lot.remaining-=taken;matched+=taken;cost+=taken*lot.price}
  // Allocate proceeds by unit to avoid declaring profit for inventory that was not purchased in this ledger.
  const proceedsMatched=qty?Math.floor(net*matched/qty):0;
  const margin=proceedsMatched-cost;
  bucket.realized+=margin;bucket.unmatched+=rest;
  matchedUnits+=matched;unmatchedUnits+=rest;costRealized+=cost;realized+=margin;
  sales.push({id:trade.id||'',item:trade.item,market,qty,matched,unmatched:rest,net,proceedsMatched,cost,margin,at:trade.at||''});
 }
 let remainingCost=0,remainingUnits=0;
 for(const p of buckets.values()){
  const remaining=p.lots.reduce((n,x)=>n+x.remaining,0),cost=p.lots.reduce((n,x)=>n+x.remaining*x.price,0);
  remainingCost+=cost;remainingUnits+=remaining;
  positions.push({key:p.key,item:p.item,market:p.market,remaining,carryingCost:cost,buyQty:p.buyQty,sellQty:p.sellQty,unmatched:p.unmatched,realized:p.realized,lots:p.lots.filter(x=>x.remaining>0)});
 }
 positions.sort((a,b)=>b.carryingCost-a.carryingCost||a.item.localeCompare(b.item,'fr'));
 return {fee:rate*100,realized,invested,receipts,costRealized,remainingCost,remainingUnits,matchedUnits,unmatchedUnits,invalid,sales,positions};
}
return {ledger};
});
