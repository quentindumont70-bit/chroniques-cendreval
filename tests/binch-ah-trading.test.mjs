import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/binch/ah-trading-core.js';
import '../public/binch/ah-portfolio-core.js';
const T=globalThis.BinchTrading;
const NOW=Date.parse('2026-11-16T12:00:00Z');
const sec=iso=>Math.floor(Date.parse(iso)/1000);
const enc=s=>encodeURIComponent(s);

function payload({at='2026-11-16T11:00:00Z',faction='Horde',listings,inventory=[],prof='Travail%20du%20cuir,120,150;D%C3%A9pe%C3%A7age,130,150'}={}){
 const C=['Bobinch','Forever',32,'DRUID','Tauren','Horde','Mulgore',123456,sec(at),0,0,0].map(String).join(',');
 const A=(listings||[]).map(l=>[l.id,l.count,l.unit*l.count,l.unit,enc(l.name)].join(',')).join(';');
 const I=inventory.map(i=>[i.id,i.count,0,1,i.quality??1,i.vendor??0,enc(i.name)].join(',')).join(';');
 return 'GF6|C:'+C+'|P:'+prof+'|Q:|L:|LS:ok|I:'+I+'|E:|AH:Forever,'+faction+','+sec(at)+','+(listings||[]).length+'|A:'+A;
}
const lua=p=>'GrimoireSyncDB = {\n ["payload"] = "'+p.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'",\n}';

test('Scan GrimoireSync: payload Lua lu, royaume/faction/date conservés, agrégation par objet',()=>{
 const p=payload({listings:[{id:2318,count:20,unit:30,name:'Cuir léger'},{id:2318,count:5,unit:28,name:'Cuir léger'},{id:2318,count:100,unit:45,name:'Cuir léger'},{id:4234,count:1,unit:900,name:'Cuir lourd'}]});
 const g=T.parseGrimoire(lua(p),NOW);
 assert.equal(g.character.name,'Bobinch');
 assert.equal(g.character.gold,123456);
 assert.equal(g.professions['Travail du cuir'].rank,120);
 assert.equal(g.scan.valid,true);
 assert.equal(g.scan.realm,'Forever');
 assert.equal(g.scan.at,'2026-11-16T11:00:00.000Z');
 const agg=T.aggregateListings(g.scan.listings).find(x=>x.itemId===2318);
 assert.equal(agg.floor,28);
 assert.equal(agg.quantity,125);
 assert.equal(agg.listings,3);
 assert.equal(agg.ask10,30); // 10 % de 125 = 12,5 unités : atteint dans la 2e annonce
 assert.equal(agg.qtyAtFloor,5);
 const obs=T.scanObservations(g.scan);
 assert.equal(obs.length,2);
 assert.equal(obs[0].source,T.SCAN_SOURCE);
});

test('Scan GrimoireSync: futur, faction inconnue ou scan vide ne produisent aucune observation',()=>{
 const future=T.parseGrimoire(payload({at:'2026-11-17T12:00:00Z',listings:[{id:1,count:1,unit:5,name:'X'}]}),NOW);
 assert.equal(future.scan.valid,false);
 assert.deepEqual(T.scanObservations(future.scan),[]);
 const empty=T.parseGrimoire(payload({listings:[]}),NOW);
 assert.equal(empty.scan.valid,false);
 assert.match(empty.scan.problem,/Aucune annonce/);
 assert.throws(()=>T.parseGrimoire('pas un fichier',NOW),/Aucun payload/);
});

test('Fusion carnet: compatible binch.ah.market.v1, sans doublon, sans relevé non attribué',()=>{
 const legacy={version:1,items:[{key:'vieux',scope:'legacy',name:'Vieux',history:[{price:5,quantity:1,at:'2026-11-01T00:00:00Z',source:'x'}],last:5}],trades:[{id:'t'}],alerts:[],fee:5};
 const rows=[{name:'Cuir léger',itemId:2318,priceCopper:28,quantity:125,listings:3,ask10:30,qtyAtFloor:5,source:T.SCAN_SOURCE,observedAt:'2026-11-16T11:00:00Z',realm:'Forever',faction:'Horde'},
  {name:'Sans marché',priceCopper:10,quantity:1,observedAt:'2026-11-16T11:00:00Z'},
  {name:'Futur',priceCopper:10,quantity:1,observedAt:'2026-11-17T11:00:00Z',realm:'Forever',faction:'Horde'}];
 const a=T.mergeObservations(legacy,rows,NOW);
 assert.equal(a.added,1);assert.equal(a.rejected,2);
 const item=a.store.items.find(x=>x.key==='forever|Horde|cuir léger');
 assert.equal(item.itemId,2318);assert.equal(item.last,28);assert.equal(item.history[0].listings,3);
 assert.equal(a.store.items[0].history.length,1,'les anciens relevés sont conservés');
 assert.deepEqual(a.store.trades,[{id:'t'}]);
 assert.equal(legacy.items.length,1,'fusion pure : entrée intacte');
 const b=T.mergeObservations(a.store,rows,NOW);
 assert.equal(b.added,0,'réimport du même scan sans doublon');
});

test('Marchés AH : rejeter les mélanges entre rulesets et régions sans altérer le carnet',()=>{
 const now=NOW,base={name:'Cuir léger',itemId:2318,realm:'Forever',faction:'Horde',priceCopper:120,quantity:25,source:'relevé externe'};
 const first={...base,market:'forever.normal.horde.us',region:'us',observedAt:'2026-11-16T10:00:00Z'};
 const a=T.mergeObservations({version:1,items:[],trades:[],alerts:[],fee:5},[first],now);
 assert.equal(a.added,1);assert.equal(a.store.items[0].history[0].market,first.market);
 assert.equal(a.store.items[0].history[0].region,'us');
 const b=T.mergeObservations(a.store,[{...first,market:'forever.pvp.horde.us',observedAt:'2026-11-16T11:00:00Z'}],now);
 assert.equal(b.added,0);assert.equal(b.marketConflicts,1);
 assert.equal(b.store.items[0].history.length,1,'historique préservé');
 const c=T.mergeObservations(a.store,[{...first,region:'eu',observedAt:'2026-11-16T11:00:00Z'}],now);
 assert.equal(c.added,0);assert.equal(c.marketConflicts,1);
 const d=T.mergeObservations(a.store,[{...first,priceCopper:150,observedAt:'2026-11-16T11:00:00Z'}],now);
 assert.equal(d.added,1);assert.equal(d.marketConflicts,0,'même marché accepté');
});

test('Relevé communautaire collé: row + days convertis, journée future ignorée',()=>{
 const json={market:'forever.normal.horde.us',item:2318,row:[30,15560,Date.parse('2026-11-16T10:00:00Z')],days:[[20772,23,29,15381],[20773,24,30,15560],[20800,1,1,1]],volume:[],now:NOW,live:false};
 const rows=T.parseCommunity(json,{name:'Cuir léger',realm:'Forever',now:NOW});
 assert.equal(rows.length,3);
 assert.ok(rows.every(r=>r.faction==='Horde'&&r.source.startsWith(T.COMMUNITY_SOURCE)));
 assert.ok(rows.every(r=>r.region==='us'&&r.market==='forever.normal.horde.us'));
 assert.throws(()=>T.parseCommunity({foo:1}),/non reconnue/);
});

function history(prices,{start='2026-11-10T12:00:00Z',stepH=24,scan=true}={}){
 return prices.map((p,i)=>({price:p,quantity:50,at:new Date(Date.parse(start)+i*stepH*3600000).toISOString(),source:scan?T.SCAN_SOURCE:'Saisie',...(scan?{listings:4,ask10:p,qtyAtFloor:10}:{})}));
}
function store(items){return {version:1,trades:[],alerts:[],fee:5,items:items.map(([name,id,prices,opt])=>{const h=history(prices,opt);const l=h[h.length-1];return {key:'forever|Horde|'+name.toLowerCase(),scope:'forever|Horde',name,itemId:id,history:h,last:l.price,quantity:l.quantity,observedAt:l.at,source:l.source}})}}

test('Statistiques: médiane, volatilité, tendance, confiance et « Insuffisante »',()=>{
 const s=T.itemStats(store([['Cuir léger',2318,[100,100,100,100,100,100,80]]]).items[0],NOW);
 assert.equal(s.median,100);
 assert.equal(Math.round(s.discount),20);
 assert.equal(s.confidence,'Élevée');
 const few=T.itemStats(store([['Rare',1,[100,90]]]).items[0],NOW);
 assert.equal(few.confidence,'Insuffisante');assert.equal(few.sufficient,false);
 const old=T.itemStats(store([['Ancien',2,[100,100,100,100]]],).items[0],Date.parse('2026-11-30T00:00:00Z'));
 assert.equal(old.sufficient,false,'relevé > 3 jours : pas de conseil');
});

test('Simulation: commission, dépôt, seuil de rentabilité et ventes partielles',()=>{
 const s=T.simulate({buy:1000,sell:2000,qty:10,fee:5,deposit:300});
 assert.equal(s.net,19000);assert.equal(s.profit,8700);
 assert.equal(s.breakEven,Math.ceil(10300/(10*0.95)));
 assert.equal(T.simulate({buy:1000,sell:2000,qty:10,fee:5,unsoldShare:0.5}).partial.profit,9500-10000);
 assert.equal(T.simulate({buy:1,sell:0,qty:1}),null);
});

test('Simulation de stress AH : invendus, baisse des prix et relistage sans bénéfices fictifs',()=>{
 const s=T.simulate({buy:1000,sell:2000,qty:10,fee:5,deposit:300,unsoldShare:.5,priceDropPct:10,extraDeposits:200});
 assert.equal(s.stress.sold,5);
 assert.equal(s.stress.unsold,5);
 assert.equal(s.stress.salePrice,1800);
 assert.equal(s.stress.soldNet,8550);
 assert.equal(s.stress.heldCost,5000);
 assert.equal(s.stress.fees,500);
 assert.equal(s.stress.cashflow,-1950,'achat des invendus encore financé');
 assert.equal(s.stress.matchedMargin,3050,'la marge sur ventes ne transforme pas le stock en perte réalisée');
 assert.equal(s.stress.breakEvenSold,Math.ceil(10500/(5*.95)));
 assert.equal(s.partial.profit,9500-10000-300,'ancien contrat conservé');
 const full=T.simulate({buy:1000,sell:2000,qty:10,fee:5,deposit:300});
 assert.equal(full.stress.cashflow,full.profit,'sans décote, relistage ou invendu, les scénarios convergent');
 assert.equal(full.stress.heldCost,0);
 const none=T.simulate({buy:1000,sell:2000,qty:10,fee:5,unsoldShare:1});
 assert.equal(none.stress.sold,0);
 assert.equal(none.stress.heldCost,10000);
 assert.equal(none.stress.breakEvenSold,null,'aucun seuil garanti quand personne n’achète');
 assert.equal(T.simulate({buy:1000,sell:2000,qty:10,deposit:-1}),null);
 assert.equal(T.simulate({buy:1000,sell:2000,qty:10,extraDeposits:-2}),null);
 assert.equal(T.simulate({buy:1000,sell:2000,qty:10,priceDropPct:999}).stress.priceDropPct,95);
 assert.equal(T.simulate({buy:1000,sell:2000,qty:0}),null);
});

test('Interface simulateur : hypothèses visibles, frais séparés et aucune transaction',()=>{
 const ui=readFileSync(new URL('../public/binch/ah-trading.js',import.meta.url),'utf8');
 assert.match(ui,/name="drop"/);
 assert.match(ui,/name="extra"/);
 assert.match(ui,/priceDropPct:Number\(d\.get\('drop'\)\)/);
 assert.match(ui,/extraDeposits:gold\(d\.get\('extra'\)\)/);
 assert.match(ui,/r\.stress\.cashflow/);
 assert.match(ui,/r\.stress\.heldCost/);
 assert.match(ui,/r\.stress\.matchedMargin/);
 assert.match(ui,/sans valeur de revente garantie/);
});

test('Sacs: marchand, AH, garder, transformer et données insuffisantes',()=>{
 const st=store([['Cuir léger',2318,[30,30,30,30,30,30,30]],['Cuir moyen',2319,[400,400,400,400,400,400,400]],['Dent',5,[100,100,100,100,100,100,60]],['Bijou',6,[1000,1000,1000,1000,1000,1000,1000]],['Croc',7,[10,10,10,10,10]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const crafts=T.craftAnalysis({index,professions:{'Travail du cuir':{rank:120}},fee:5});
 const conv=crafts.find(c=>c.recipe.output.itemId===2319);
 assert.equal(conv.status,'ok');
 assert.equal(conv.transformGain,Math.floor(400*0.95)-Math.floor(120*0.95));
 const bags=T.bagAdvice({inventory:[{id:2318,count:8,name:'Cuir léger',quality:1,vendor:5},{id:5,count:3,name:'Dent',quality:1,vendor:1},{id:6,count:1,name:'Bijou',quality:2,vendor:10},{id:7,count:2,name:'Croc',quality:1,vendor:50},{id:99,count:1,name:'Gris',quality:0,vendor:7},{id:98,count:1,name:'Inconnu',quality:1,vendor:3}],index,crafts,fee:5});
 const d=Object.fromEntries(bags.map(b=>[b.name,b.decision]));
 assert.equal(d['Cuir léger'],'Transformer');
 assert.equal(d['Dent'],'Garder');
 assert.equal(d['Bijou'],'Vendre à l’AH');
 assert.equal(d['Croc'],'Vendre au marchand');
 assert.equal(d['Gris'],'Vendre au marchand');
 assert.equal(d['Inconnu'],'Données insuffisantes');
 const noProf=T.craftAnalysis({index,professions:{},fee:5});
 assert.equal(noProf.filter(c=>c.recipe.builtin).length,0,'pas de conversion sans Travail du cuir');
});

test('Opportunités: décote étayée, plafond d’exposition et profondeur, rien sur données pauvres',()=>{
 const st=store([['Dent',5,[100,100,100,100,100,100,60]],['Pauvre',8,[100,40]],['Stable',9,[100,100,100,100,100,100,100]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const budget=T.budgetPlan({capital:1000,reservePct:40,maxItemPct:30});
 assert.deepEqual(budget,{capital:1000,reserve:400,deployable:600,perItemCap:300});
 const o=T.opportunities({index,fee:5,budget});
 assert.equal(o.length,1);
 assert.equal(o[0].name,'Dent');
 assert.equal(o[0].qty,5,'300 pc / 60 pc = 5 unités, sous les 10 au plancher');
 assert.equal(o[0].unitMargin,95-60);
 assert.ok(o[0].risks.length>=0);
});

test('Radar AH : capital et profondeur vérifiés, pas de faux ordre d’achat',()=>{
 const idx=T.marketIndex(store([['Dent',5,[100,100,100,100,100,100,60]]]),'forever|Horde',NOW);
 const rich=T.budgetPlan({capital:1000,reservePct:40,maxItemPct:30});
 const buy=T.opportunities({index:idx,budget:rich});
 assert.equal(buy.length,1);
 assert.equal(buy[0].status,'Achat à étudier');
 assert.equal(buy[0].qty,5);
 assert.equal(buy[0].stressedUnitMargin,Math.floor(90*0.95)-60);
 assert.equal(buy[0].margin,5*(95-60));
 assert.equal(T.opportunities({index:idx,budget:T.budgetPlan({capital:1000,reservePct:40,maxItemPct:5})}).length,0,
  'capital trop faible pour une seule unité : ne pas proposer un ordre d’achat de 1 par défaut');
 const unknownCapital=T.opportunities({index:idx});
 assert.equal(unknownCapital[0].status,'Surveillance');
 assert.match(unknownCapital[0].warnings.join(' '),/Capital disponible non renseigné/);
 const manual=T.marketIndex(store([['Dent',5,[100,100,100,100,100,100,60],{scan:false}]]),'forever|Horde',NOW);
 const watch=T.opportunities({index:manual,budget:rich})[0];
 assert.equal(watch.status,'Surveillance');
 assert.equal(watch.qty,null,'sans profondeur confirmée, aucune quantité supposée');
 assert.match(watch.warnings.join(' '),/Quantité au meilleur prix inconnue/);
 const falling=T.marketIndex(store([['Descente',6,[250,240,230,200,170,130,80]]]),'forever|Horde',NOW);
 const decline=T.opportunities({index:falling,budget:rich})[0];
 assert.equal(decline.status,'Surveillance','une chute déjà installée ne doit pas être annoncée comme une bonne affaire');
 assert.match(decline.warnings.join(' '),/Baisse antérieure/);
 const oneDay=T.marketIndex(store([['Rapide',7,[100,100,100,100,100,100,60],{start:'2026-11-16T04:00:00Z',stepH:1}]]),'forever|Horde',NOW);
 assert.equal(T.opportunities({index:oneDay,budget:rich})[0].status,'Surveillance','3 jours distincts nécessaires');
 const brief=T.faithBrief({opps:unknownCapital,scope:'forever|Horde'});
 assert.match(brief.lines.join(' '),/Sous surveillance, sans conseil d’achat/);
});

test('Radar AH : source historique non signée et origines mélangées ne deviennent pas un ordre d’achat',()=>{
 const rich=T.budgetPlan({capital:1000,reservePct:40,maxItemPct:30});
 const source=(type)=>{
  const st=store([['Dent',5,[100,100,100,100,100,100,60]]]);
  st.items[0].history.forEach((h,i)=>{
   if(type==='external'){h.source='auctionhouse.fyi';h.market='forever.normal.horde.us';}
   if(type==='manual'){h.source='Saisie';}
   if(type==='mixed'&&i===0){h.source='Saisie';}
  });
  return T.marketIndex(st,'forever|Horde',NOW);
 };
 const scan=T.opportunities({index:source('scan'),budget:rich})[0];
 const external=T.opportunities({index:source('external'),budget:rich})[0];
 const manual=T.opportunities({index:source('manual'),budget:rich})[0];
 const mixed=T.opportunities({index:source('mixed'),budget:rich})[0];
 assert.equal(scan.status,'Achat à étudier');
 assert.equal(scan.sourceKind,'scan');
 for(const [o,kind] of [[external,'community'],[manual,'manual'],[mixed,'mixed']]){
  assert.ok(o,'une décote non certifiée reste visible pour surveillance');
  assert.equal(o.status,'Surveillance');
  assert.equal(o.sourceKind,kind);
  assert.match(o.warnings.join(' '),/non certifiés|mélangées/);
 }
 assert.equal(T.observationOrigin({source:T.SCAN_SOURCE}),'scan');
 assert.equal(T.observationOrigin({source:'Saisie'}),'manual');
 assert.equal(T.observationOrigin({source:'aucune',region:'eu'}),'community');
 assert.equal(T.observationOrigin({source:'auctionhouse.fyi'}),'community');
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{source:'scan'},NOW).length,1);
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{source:'community'},NOW)[0].status,'Surveillance');
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{source:'mixed'},NOW)[0].sourceKind,'mixed');
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{status:'buy'},NOW).length,1);
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{status:'watch'},NOW).length,3);
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{ageH:6},NOW).length,4);
 assert.equal(T.filterOpportunities([scan,external,manual,mixed],{ageH:6},NOW+7*3600000).length,0);
 assert.equal(T.filterOpportunities([scan],{},NOW-60000).length,0,'aucun cours futur');
 assert.equal(T.filterOpportunities([scan],{},NOW).length,1,'la fonction ne mutile pas les opportunités');
});
test('Radar UI : filtres persistés, origine affichée et aucune fausse élévation du signal',()=>{
 const ui=readFileSync(new URL('../public/binch/ah-trading.js',import.meta.url),'utf8');
 assert.match(ui,/id="bt-radar-source"/);
 assert.match(ui,/id="bt-radar-age"/);
 assert.match(ui,/id="bt-radar-status"/);
 assert.match(ui,/T\.filterOpportunities\(c\.opps/);
 assert.match(ui,/if\(e\.target\.id==='bt-radar-source'\)/);
 assert.match(ui,/if\(e\.target\.id==='bt-radar-age'\)/);
 assert.match(ui,/if\(e\.target\.id==='bt-radar-status'\)/);
 assert.match(ui,/sourceNames\[o\.sourceKind\]/);
 assert.match(ui,/les filtres n’ajoutent jamais de prix/i);
});
test('Revente, journal et alertes: aucune valeur fabriquée',()=>{
 const st=store([['Dent',5,[100,100,100,100,100,100,200]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const L=globalThis.BinchAHPortfolio.ledger([{id:'a',kind:'buy',item:'Dent',qty:4,price:100,scope:'forever|Horde',at:'2026-11-10T00:00:00Z'},{id:'b',kind:'buy',item:'Inconnu',qty:1,price:5,scope:'forever|Horde',at:'2026-11-10T00:00:00Z'}],5);
 const r=T.resaleCandidates({positions:L.positions,index,fee:5});
 assert.equal(r.find(x=>x.item==='Dent').status,'Revente bénéficiaire possible');
 assert.equal(r.find(x=>x.item==='Inconnu').status,'Données insuffisantes');
 const j=T.journalReview({decisions:[{id:'d',item:'Dent',action:'buy',reference:100,expected:150,at:'2026-11-12T00:00:00Z'}],trades:[{kind:'sell',item:'Dent',qty:2,price:180,at:'2026-11-15T00:00:00Z'},{kind:'sell',item:'Dent',qty:9,price:1,at:'2026-11-01T00:00:00Z'}],index,fee:5});
 assert.equal(j[0].realizedQty,2);assert.equal(j[0].realizedAvg,180);assert.equal(Math.round(j[0].realizedVsExpected),20);
 const a=T.evaluateAlerts([{name:'Dent',ceiling:250,kind:'below'},{name:'Absent',ceiling:1}],index);
 assert.equal(a[0].state,'Seuil atteint');assert.equal(a[1].state,'Aucun relevé');
});

test('Faith marchande: références datées, refus sans marché identifié',()=>{
 const st=store([['Bijou',6,[1000,1000,1000,1000,1000,1000,1000]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const bags=T.bagAdvice({inventory:[{id:6,count:1,name:'Bijou',quality:2,vendor:10}],index,fee:5});
 const f=T.faithBrief({bags,opps:[],crafts:[],scope:'forever|Horde'});
 assert.match(f.lines[0],/Bijou ×1 vers 10pa 0pc \[1\]/);
 assert.equal(f.refs.length,1);
 assert.match(f.lines.at(-1),/aucune enchère/);
 assert.match(T.faithBrief({scope:'legacy'}).lines[0],/Données insuffisantes/);
});

const FEED={format:'binch-ah-feed-v1',generatedAt:'2026-11-16T11:00:00Z',names:{2318:{n:'Light Leather'},2319:{n:'Medium Leather'}},markets:{
 'forever.normal.horde.us':{at:Date.parse('2026-11-16T10:00:00Z'),contributors7d:7,items:{2318:{row:[30,15560,Date.parse('2026-11-16T10:00:00Z')],days:[[20770,19,25,2521],[20771,23,26,34027],[20772,23,29,15381],[20773,24,30,15560]]},2319:{row:[94,4859,Date.parse('2026-11-16T10:00:00Z')],days:[]}}},
 'forever.pvp.horde.us':{at:Date.parse('2026-11-06T10:00:00Z'),contributors7d:0,items:{2318:{row:[45,100,Date.parse('2026-11-06T10:00:00Z')],days:[]}}}}};

test('Flux multi-marchés: observations du carnet, comparaison et fraîcheur',()=>{
 const rows=T.feedObservations(FEED,'forever.normal.horde.us',{realm:'Forever',now:NOW});
 assert.equal(rows.filter(r=>r.itemId===2318).length,5);
 const merged=T.mergeObservations({version:1,items:[],trades:[],alerts:[],fee:5},rows,NOW);
 const s=T.itemStats(merged.store.items.find(x=>x.itemId===2318),NOW);
 assert.equal(s.sufficient,true,'le flux suffit à produire une cote');
 const cm=T.crossMarket(FEED,2318,NOW);
 assert.equal(cm[0].label,'US · Normal · Horde (auctionhouse.fyi)');assert.equal(cm[0].region,'us');assert.equal(cm[0].price,30);assert.equal(cm[1].price,45);
 assert.equal(cm[0].faction,'Horde');assert.equal(cm[0].fresh,true,'relevé de 2 h comparable');
 assert.equal(cm[1].fresh,false,'relevé vieux de dix jours visible mais non comparable');
 assert.equal(T.feedSummary(FEED,NOW).markets.length,2);
 assert.deepEqual(T.feedObservations({format:'autre'},'x'),[]);
});

test('Comparateur AH : cotations futures écartées et données sans date non comparables',()=>{
 const future={format:'binch-ah-feed-v2',markets:{
  'forever.normal.horde.us':{items:{2318:{row:[17,12,NOW+3600000]}}},
  'forever.pvp.horde.us':{items:{2318:{row:[18,10,0]}}}
 }};
 const c=T.crossMarket(future,2318,NOW);
 assert.equal(c.length,2);
 assert.ok(c.every(x=>x.price===null&&x.at===null&&x.fresh===false));
 assert.ok(c.every(x=>x.region==='us'&&x.faction==='Horde'));
});

test('Progression: seuil de dépeçage Classic et plan selon le niveau',()=>{
 assert.equal(T.skinSkillFor(20),100);assert.equal(T.skinSkillFor(32),160);
 assert.equal(T.maxSkinnableLevel(150),30);
 const plan=T.skinningPlan({level:32,professions:{'Dépeçage':{rank:150}},feedMarket:FEED.markets['forever.normal.horde.us']});
 assert.equal(plan.maxMob,30);
 assert.equal(plan.best.name,'Cuir moyen','94pc > 30pc, accessible à ce niveau');
 assert.equal(plan.tiers.find(t=>t.itemId===4304).reachable,false);
 assert.equal(T.skinningPlan({level:32,professions:{}}).status,'Dépeçage non importé');
});

test('Isolation des marchés: région, confirmation, faction, maison neutre',()=>{
 const base={confirmedMarket:'forever.normal.horde.us',marketId:'forever.normal.horde.us',scopeFaction:'Horde',enabled:true};
 assert.equal(T.canMergeFeed({...base,userRegion:'us'}).ok,true);
 assert.match(T.canMergeFeed({...base,userRegion:'eu'}).reason,/US différent de ta région EU/);
 assert.match(T.canMergeFeed({...base,userRegion:null}).reason,/non renseignée/);
 assert.equal(T.canMergeFeed({...base,userRegion:'us',confirmedMarket:null}).ok,false);
 assert.equal(T.canMergeFeed({...base,userRegion:'us',enabled:false}).ok,false);
 assert.equal(T.canMergeFeed({...base,userRegion:'us',scopeFaction:'Alliance'}).ok,false);
 const eu={provider:'API Blizzard (non vérifiée)',region:'eu',ruleset:'normal',faction:'Neutral',houseId:7};
 assert.match(T.canMergeFeed({userRegion:'eu',confirmedMarket:'blizzard.eu.1.7',marketId:'blizzard.eu.1.7',marketInfo:eu,scopeFaction:'Horde',enabled:true}).reason,/neutre/);
 assert.equal(T.MARKET_LABEL('forever.pvp.alliance.us'),'US · JcJ · Alliance (auctionhouse.fyi)');
 assert.equal(T.marketMeta('blizzard.x',{region:'zz'}).region,null);
});

test('Flux v2: maison neutre et région inconnue jamais fusionnées, marché ancien signalé',()=>{
 const feed={format:'binch-ah-feed-v2',generatedAt:'2026-11-16T11:00:00Z',names:{},markets:{
  'blizzard.eu.1.7':{meta:{provider:'API Blizzard',region:'eu',ruleset:'normal',faction:'Neutral',houseId:7},at:Date.parse('2026-11-16T10:00:00Z'),items:{2318:{row:[30,5,Date.parse('2026-11-16T10:00:00Z')],days:[]}}},
  'mystere':{meta:{faction:'Horde'},at:Date.parse('2026-11-01T10:00:00Z'),items:{2318:{row:[30,5,Date.parse('2026-11-01T10:00:00Z')],days:[]}}}}};
 const neutral=T.feedObservations(feed,'blizzard.eu.1.7',{realm:'Forever',now:NOW});
 assert.equal(neutral.length,1);
 assert.equal(T.mergeObservations({version:1,items:[]},neutral,NOW).added,0,'sans faction : refusé par le carnet');
 assert.deepEqual(T.feedObservations(feed,'mystere',{realm:'Forever',now:NOW}),[],'région inconnue : aucune observation');
 const sum=T.feedSummary(feed,NOW);
 assert.equal(sum.markets.find(m=>m.market==='mystere').stale,true);
 assert.equal(sum.markets.find(m=>m.market==='blizzard.eu.1.7').stale,false);
});

test('Historique AH: comparer uniquement deux scans personnels frais et du même marché',()=>{
 const scan=T.SCAN_SOURCE,now=NOW;
 const at=(h)=>new Date(now-h*3600000).toISOString();
 const row=(h,qty,listings,price,over={})=>({at:at(h),price,quantity:qty,listings,source:scan,...over});
 const item={history:[row(4,90,12,100),row(2,60,8,95)]};
 const d=T.supplyChange(item,now);
 assert.ok(d);
 assert.equal(d.from,90);assert.equal(d.to,60);assert.equal(d.change,-30);
 assert.equal(Math.round(d.changePct),-33);
 assert.equal(d.listingsChange,-4);
 assert.equal(d.floorFrom,100);assert.equal(d.floorTo,95);
 assert.equal(d.hours,2);
 assert.equal(d.source,scan);
 assert.equal(T.supplyChange({history:[row(2,30,5,10)]},now),null,'un seul scan insuffisant');
 assert.equal(T.supplyChange({history:[row(80,50,6,10),row(73,40,5,12)]},now),null,
  'un relevé trop ancien ne produit pas une comparaison');
 assert.equal(T.supplyChange({history:[row(220,50,6,10),row(2,40,5,12)]},now),null,
  'deux scans séparés de plus de 7 jours ne sont pas comparés');
 assert.equal(T.supplyChange({history:[row(2,50,6,10),row(2,40,5,12)]},now),null,
  'deux imports du même instant ne forment pas deux scans');
 assert.equal(T.supplyChange({history:[row(4,90,12,100,{market:'forever.normal.horde.eu'}),
  row(2,60,8,95,{market:'forever.pvp.horde.eu'})]},now),null,'marchés distincts non mélangés');
 assert.equal(T.supplyChange({history:[row(4,90,12,100,{region:'us'}),
  row(2,60,8,95,{region:'eu'})]},now),null,'régions distinctes non mélangées');
 assert.equal(T.supplyChange({history:[row(4,90,12,100,{source:'Saisie manuelle'}),
  row(2,60,8,95)]},now),null,'la saisie manuelle ne fait pas croire à un scan');
 assert.equal(T.supplyChange({history:[row(4,90,12,100,{listings:0}),row(2,60,8,95)]},now),null,
  'une observation non exhaustive sans annonce ne devient pas un instantané');
 assert.equal(T.supplyChange({history:[row(4,90,12,100),row(2,60,8,95),
  row(-3,10,2,70)]},now).to,60,'un scan futur est exclu et ne provoque pas de comparaisons fantômes');
});
test('Historique AH: la vue parle d’offre observée sans prétendre identifier des ventes',()=>{
 const ui=readFileSync(new URL('../public/binch/ah-trading.js',import.meta.url),'utf8');
 assert.match(ui,/T\.supplyChange\(item\)/);
 assert.match(ui,/supplySection\(cur\)/);
 assert.match(ui,/ne prouve pas une vente/);
 assert.match(ui,/deux scans GrimoireSync/);
});

test('GrimoireSync: aucune unité inventée pour sacs ou enchères avec quantité invalide',()=>{
 const p=payload({inventory:[
  {id:2318,count:3,name:'Cuir léger'},
  {id:2319,count:0,name:'Cuir moyen'},
  {id:4234,count:-2,name:'Cuir lourd'},
  {id:4304,count:1.5,name:'Cuir épais'}],
  listings:[
   {id:2318,count:3,unit:100,name:'Cuir léger'},
   {id:2319,count:0,unit:200,name:'Cuir moyen'},
   {id:4234,count:-2,unit:300,name:'Cuir lourd'},
   {id:4304,count:1.5,unit:400,name:'Cuir épais'}]});
 const g=T.parseGrimoire(lua(p),NOW);
 assert.deepEqual(g.inventory.map(x=>[x.id,x.count]),[[2318,3]]);
 assert.equal(g.scan.valid,true,'un scan contenant une annonce valable reste exploitable');
 assert.deepEqual(g.scan.listings.map(x=>[x.id,x.count]),[[2318,3]]);
 assert.equal(T.scanObservations(g.scan).length,1);
});
