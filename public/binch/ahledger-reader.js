/* La Binch — lecture ponctuelle AHledger. Aucune écriture ni mémoire persistante.
   Usage communautaire gratuit sous attribution : https://ahledger.com/developers */
(function(root,factory){const api=factory();root.BinchAHLedger=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const REGIONS=new Set(['eu','us']),RULESETS=new Set(['normal','pvp','rp','rppvp']),FACTIONS=new Set(['horde','alliance']);
const validPrice=n=>Number.isSafeInteger(n)&&n>0&&n<1000000000000;
function market(region,ruleset,faction){
 if(!REGIONS.has(region)||!RULESETS.has(ruleset)||!FACTIONS.has(faction))return null;
 const id='forever.'+ruleset+'.'+faction+'.'+region;
 return {id,region,ruleset,faction,page:'https://ahledger.com/markets/forever/'+ruleset+'/'+faction+'/'+region};
}
function lookupUrl(m,itemId){
 if(!m||!market(m.region,m.ruleset,m.faction)||m.id!=='forever.'+m.ruleset+'.'+m.faction+'.'+m.region||
    !Number.isSafeInteger(itemId)||itemId<=0||itemId>1000000)return null;
 return 'https://api.ahledger.com/v1/prices/'+m.id+'/'+itemId+'?range=7d';
}
function attribution(raw,fallback){
 try{const u=new URL(raw);if(u.protocol==='https:'&&['ahledger.com','www.ahledger.com'].includes(u.hostname)&&!u.username&&!u.password)return u.href}catch{}
 return fallback;
}
function parseQuote(payload,expected,now=Date.now()){
 if(!expected||!payload||payload.market!==expected.id||Number(payload.item?.id)!==expected.itemId)
  return {ok:false,reason:'La réponse ne correspond pas au marché ou à l’objet demandé.'};
 const x=payload.latest;
 if(!x||typeof x!=='object')return {ok:false,reason:'Aucune cotation disponible pour cet objet sur ce marché.'};
 const time=Date.parse(x.observedAt||'');
 if(!Number.isFinite(time)||time>now||time<=0)return {ok:false,reason:'Date de relevé absente, invalide ou future.'};
 const floor=Number(x.minBuyout),median=Number(x.median);
 if(!validPrice(floor)&&!validPrice(median))return {ok:false,reason:'Aucun prix positif vérifiable sur cette cotation.'};
 const credit=attribution(payload.attribution?.url,null);
 if(!credit)return {ok:false,reason:'Source non créditable : lien AHledger propre à cet objet absent ou invalide.'};
 const ageH=(now-time)/3600000;
 const num=n=>Number.isSafeInteger(n)&&n>=0?n:null;
 return {ok:true,id:expected.itemId,name:String(payload.item?.name||'Objet #'+expected.itemId).slice(0,100),
  observedAt:new Date(time).toISOString(),ageH,stale:ageH>72,minBuyout:validPrice(floor)?floor:null,
  median:validPrice(median)?median:null,median7d:validPrice(Number(x.median7d))?Number(x.median7d):null,
  quantity:num(x.quantity),auctions:num(x.auctions),source:String(x.source||'Relevé tiers').slice(0,80),
  attribution:credit};
}
return {market,lookupUrl,parseQuote};
});
