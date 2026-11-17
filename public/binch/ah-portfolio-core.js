/* La Binch — registre marchand : comptabilité par lots FIFO pour les achats/ventes déclarés.
   Ne contacte pas les enchères. N'invente pas le prix de revient des ventes sans achat.
   Module autonome: ne modifie jamais les opérations originales.
*/
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchAHPortfolio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const valid=x=>Number.isSafeInteger(x)&&x>=0,MAX=1000;
function ledger(trades,fee=5){
 const rate=Number.isFinite(Number(fee))?Math.max(0,Math.min(20,Number(fee)))/100:0.05;
 const buckets=new Map(),sales=[],invalid=[],positions=[];
 let invested=0,receipts=0,costRealized=0,realized=0,matchedUnits=0,unmatchedUnits=0,depositsLost=0,matchedDeposits=0,unmatchedDeposits=0;
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
  const depositLost=kind==='sell'?Number(trade.depositLost??0):0;
  if(!valid(depositLost)||depositLost>1e12){invalid.push({id:trade.id,reason:'Dépôt perdu invalide'});continue}
  const key=market+'|'+item;
  if(!buckets.has(key))buckets.set(key,{key,item:trade.item,market,lots:[],buyQty:0,sellQty:0,unmatched:0,saleGross:0,realized:0});
  const bucket=buckets.get(key);
  if(kind==='buy'){
   bucket.lots.push({price,remaining:qty,at:trade.at||''});bucket.buyQty+=qty;invested+=price*qty;continue
  }
  const saleRate=Number.isFinite(Number(trade.fee))?Math.max(0,Math.min(20,Number(trade.fee)))/100:rate;
  const net=Math.floor(price*qty*(1-saleRate));receipts+=net-depositLost;depositsLost+=depositLost;bucket.sellQty+=qty;bucket.saleGross+=net;
  let rest=qty,matched=0,cost=0;
  for(const lot of bucket.lots){if(!rest)break;const taken=Math.min(rest,lot.remaining);rest-=taken;lot.remaining-=taken;matched+=taken;cost+=taken*lot.price}
  // Allocate proceeds by unit to avoid declaring profit for inventory that was not purchased in this ledger.
  const proceedsMatched=qty?Math.floor(net*matched/qty):0;
  const matchedDeposit=Math.floor(depositLost*matched/qty),unmatchedDeposit=depositLost-matchedDeposit;
  const margin=proceedsMatched-cost-matchedDeposit;
  matchedDeposits+=matchedDeposit;unmatchedDeposits+=unmatchedDeposit;
  bucket.realized+=margin;bucket.unmatched+=rest;
  matchedUnits+=matched;unmatchedUnits+=rest;costRealized+=cost;realized+=margin;
  sales.push({id:trade.id||'',item:trade.item,market,qty,matched,unmatched:rest,net,depositLost,matchedDeposit,unmatchedDeposit,netAfterDeposits:net-depositLost,proceedsMatched,cost,margin,fee:saleRate*100,at:trade.at||''});
 }
 let remainingCost=0,remainingUnits=0;
 for(const p of buckets.values()){
  const remaining=p.lots.reduce((n,x)=>n+x.remaining,0),cost=p.lots.reduce((n,x)=>n+x.remaining*x.price,0);
  remainingCost+=cost;remainingUnits+=remaining;
  positions.push({key:p.key,item:p.item,market:p.market,remaining,carryingCost:cost,buyQty:p.buyQty,sellQty:p.sellQty,unmatched:p.unmatched,realized:p.realized,lots:p.lots.filter(x=>x.remaining>0)});
 }
 positions.sort((a,b)=>b.carryingCost-a.carryingCost||a.item.localeCompare(b.item,'fr'));
 return {fee:rate*100,realized,invested,receipts,depositsLost,matchedDeposits,unmatchedDeposits,costRealized,remainingCost,remainingUnits,matchedUnits,unmatchedUnits,invalid,sales,positions};
}
/* Bilan des ventes réellement consignées dans le carnet (et non volume de marché).
   Seules les unités rapprochées d'un achat FIFO contribuent au bénéfice calculé. */
function tradePerformance(book,{now=Date.now(),days=30}={}){
 const end=Number.isFinite(Number(now))?Number(now):Date.now();
 const windowDays=Number.isSafeInteger(days)&&days>=1&&days<=365?days:30;
 const cutoff=end-windowDays*86400000,groups=new Map();
 let sold=0,matched=0,unmatched=0,realized=0,cost=0,proceeds=0,excluded=0,operations=0,depositsLost=0,matchedDeposits=0,unmatchedDeposits=0;
 for(const s of Array.isArray(book?.sales)?book.sales:[]){
  const t=Date.parse(s.at||'');
  if(!Number.isFinite(t)||t<=0||t>end){excluded++;continue}
  if(t<cutoff)continue;
  const quantity=Number(s.qty),covered=Number(s.matched),unknown=Number(s.unmatched);
  if(!Number.isSafeInteger(quantity)||quantity<1||!Number.isSafeInteger(covered)||covered<0||
     !Number.isSafeInteger(unknown)||unknown<0||covered+unknown!==quantity){excluded++;continue}
  const profit=Number(s.margin),basis=Number(s.cost),net=Number(s.proceedsMatched);
  const deposit=Number(s.depositLost??0),appliedDeposit=Number(s.matchedDeposit??0),unknownDeposit=Number(s.unmatchedDeposit??0);
  if(!Number.isSafeInteger(profit)||!Number.isSafeInteger(basis)||basis<0||
     !Number.isSafeInteger(net)||net<0||!valid(deposit)||!valid(appliedDeposit)||!valid(unknownDeposit)||
     appliedDeposit+unknownDeposit!==deposit||profit!==net-basis-appliedDeposit){excluded++;continue}
  const key=String(s.market||'legacy')+'|'+String(s.item||'').trim().toLocaleLowerCase('fr');
  if(!groups.has(key))groups.set(key,{key,item:String(s.item||'').slice(0,100),market:s.market,
   sold:0,matched:0,unmatched:0,realized:0,cost:0,proceeds:0,depositsLost:0,matchedDeposits:0,unmatchedDeposits:0,operations:0,lastSale:null});
  const g=groups.get(key);
  g.sold+=quantity;g.matched+=covered;g.unmatched+=unknown;g.realized+=profit;g.cost+=basis;
  g.proceeds+=net;g.depositsLost+=deposit;g.matchedDeposits+=appliedDeposit;g.unmatchedDeposits+=unknownDeposit;g.operations++;g.lastSale=!g.lastSale||t>Date.parse(g.lastSale)?new Date(t).toISOString():g.lastSale;
  sold+=quantity;matched+=covered;unmatched+=unknown;realized+=profit;cost+=basis;proceeds+=net;depositsLost+=deposit;matchedDeposits+=appliedDeposit;unmatchedDeposits+=unknownDeposit;operations++;
 }
 const rows=[...groups.values()].map(g=>({...g,
  roi:g.cost>0?100*g.realized/g.cost:null,
  unitProfit:g.matched>0?g.realized/g.matched:null
 })).sort((a,b)=>b.realized-a.realized||b.matched-a.matched||a.item.localeCompare(b.item,'fr'));
 return {days:windowDays,operations,sold,matched,unmatched,realized,cost,proceeds,depositsLost,matchedDeposits,unmatchedDeposits,
  roi:cost>0?100*realized/cost:null,excluded,rows};
}
return {ledger,tradePerformance};
});
