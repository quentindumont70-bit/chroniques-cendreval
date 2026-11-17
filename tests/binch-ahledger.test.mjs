import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/binch/ahledger-reader.js';
const A=globalThis.BinchAHLedger;
const NOW=Date.parse('2026-11-17T12:00:00Z');

test('AHledger: allowlisted market and per-item URL, no freeform host',()=>{
 const m=A.market('eu','normal','horde');
 assert.equal(m.id,'forever.normal.horde.eu');
 assert.equal(m.page,'https://ahledger.com/markets/forever/normal/horde/eu');
 assert.equal(A.lookupUrl(m,2318),'https://api.ahledger.com/v1/prices/forever.normal.horde.eu/2318?range=7d');
 assert.equal(A.marketToolUrl(m,'deals'),'https://ahledger.com/deals?market=forever%2Fnormal%2Fhorde%2Feu');
 assert.equal(A.marketToolUrl(A.market('us','pvp','alliance'),'crafting'),'https://ahledger.com/crafting?market=forever%2Fpvp%2Falliance%2Fus');
 assert.equal(A.marketToolUrl(m,'structure'),'https://ahledger.com/structure?market=forever%2Fnormal%2Fhorde%2Feu');
 assert.equal(A.marketToolUrl(m,'signals'),'https://ahledger.com/signals?market=forever%2Fnormal%2Fhorde%2Feu');
 assert.equal(A.marketToolUrl({...m,id:'forever.normal.horde.us'},'deals'),null,'marché falsifié refusé');
 assert.equal(A.marketToolUrl(m,'https://example.org'),null,'outil non autorisé refusé');
 assert.equal(A.market('eu','evil','horde'),null);
 assert.equal(A.market('us','pvp','neutral'),null);
 assert.equal(A.lookupUrl(m,0),null);
 assert.equal(A.lookupUrl(m,1.5),null);
 assert.equal(A.lookupUrl({...m,id:'forever.normal.horde.us'},2318),null);
});

test('AHledger: documented JSON fields, timestamp, source and attribution',()=>{
 const m=A.market('eu','normal','horde');
 const p={market:m.id,item:{id:2318,name:'Cuir léger'},latest:{
  observedAt:'2026-11-17T11:00:00Z',source:'Addon scan',minBuyout:180,median:200,median7d:220,quantity:100,auctions:5
 },sales:{estimatedPerDay:2.5,windowDays:7},attribution:{url:'https://ahledger.com/items/2318-light-leather'}};
 const q=A.parseQuote(p,{...m,itemId:2318},NOW);
 assert.equal(q.ok,true);assert.equal(q.stale,false);assert.equal(q.ageH,1);
 assert.equal(q.minBuyout,180);assert.equal(q.median,200);assert.equal(q.median7d,220);
 assert.equal(q.quantity,100);assert.equal(q.auctions,5);
 assert.equal(q.estimatedSalesPerDay,2.5);assert.equal(q.salesWindowDays,7);
 assert.equal(A.parseQuote({...p,sales:{estimatedPerDay:0,windowDays:14}},{...m,itemId:2318},NOW).estimatedSalesPerDay,0,'zéro estimé reste différent de donnée absente');
 assert.equal(A.parseQuote({...p,sales:{estimatedPerDay:-1,windowDays:0}},{...m,itemId:2318},NOW).estimatedSalesPerDay,null);
 assert.equal(A.parseQuote({...p,sales:{estimatedPerDay:'n/a',windowDays:45}},{...m,itemId:2318},NOW).salesWindowDays,null);
 assert.equal(A.parseQuote({...p,sales:null},{...m,itemId:2318},NOW).estimatedSalesPerDay,null);
 assert.equal(q.attribution,'https://ahledger.com/items/2318-light-leather');
 const old=A.parseQuote({...p,latest:{...p.latest,observedAt:'2026-11-10T11:00:00Z'}},{...m,itemId:2318},NOW);
 assert.equal(old.ok,true);assert.equal(old.stale,true);
});

test('AHledger: reject wrong market/id, future/missing prices and unsafe attribution',()=>{
 const m=A.market('eu','pvp','horde');
 const p={market:m.id,item:{id:2318},latest:{observedAt:'2026-11-17T11:00:00Z',minBuyout:50}};
 assert.equal(A.parseQuote(p,{...m,itemId:42},NOW).ok,false);
 assert.equal(A.parseQuote({...p,market:'forever.pvp.horde.us'},{...m,itemId:2318},NOW).ok,false);
 assert.equal(A.parseQuote({...p,latest:{...p.latest,observedAt:'2026-11-18T11:00:00Z'}},{...m,itemId:2318},NOW).ok,false);
 assert.equal(A.parseQuote({...p,latest:{...p.latest,minBuyout:0}},{...m,itemId:2318},NOW).ok,false);
 const q=A.parseQuote({...p,attribution:{url:'https://evil.invalid/landing'}},{...m,itemId:2318},NOW);
 assert.equal(q.ok,false,'ne jamais afficher un prix tiers sans crédit valide');
 assert.match(q.reason,/lien AHledger/);
 assert.equal(A.parseQuote(p,{...m,itemId:2318},NOW).ok,false,'attribution absente refusée');
});

test('AHledger: UI access is click initiated, no automatic import or persistent cache',()=>{
 const html=readFileSync(new URL('../public/binch/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/binch/ah-trading.js',import.meta.url),'utf8');
 assert.match(html,/ahledger-reader\.js\?v=003/);
 assert.match(html,/ah-trading\.js\?v=014/);
 assert.match(ui,/id="bt-ahl-query"/);
 assert.match(ui,/data-bt-market-tool/);
 assert.match(ui,/form\.querySelectorAll\('a\[data-bt-market-tool\]'\)/);
 assert.match(ui,/AH\?\.marketToolUrl\?\.\(m,a\.dataset\.btMarketTool\)/);
 const area=ui.slice(ui.indexOf('async function onAhl('),ui.indexOf('function vLive('));
 assert.match(area,/await fetch\(url,\{signal:ctrl\.signal,cache:'no-store'\}\)/);
 assert.doesNotMatch(area,/localStorage|write\(|mergeObservations/);
 assert.match(area,/Rotation estimée/);
 assert.match(area,/non une preuve de ventes conclues/);
 assert.match(area,/Prices from AHledger/);
 assert.match(area,/Consulter gratuitement les prix du marché chez AHledger/);
});
