'use strict';
// Run: node public/binch/test-market-bridge.cjs
const assert=require('node:assert/strict');
const bridge=require('./market-bridge.js');
const when='2026-11-10T10:00:00.000Z';
const legacy={prices:[
 {item:'Feuillerêve',unit:700,time:when,realm:'Forever',faction:'Horde',source:'Saisie manuelle'},
 {item:'Feuillerêve',unit:999,time:when,realm:'Forever',faction:'Alliance'}
]};
const ah={items:[
 {name:'Barre de cuivre',last:325,observedAt:when,scope:'forever|Horde',source:'Import étiqueté'},
 {name:'Barre de cuivre',last:0,observedAt:when,scope:'forever|Horde'}
]};
const horde=bridge.snapshot(legacy,ah,{realm:'Forever',faction:'Horde'});
assert.equal(bridge.snapshot(legacy,ah,{}).status,'scope-required');
assert.equal(horde.items.length,2);
assert.equal(bridge.snapshot(legacy,ah,{realm:'Forever',faction:'Alliance'}).items.length,1);
assert.ok(horde.items.every(x=>x.price>0));
assert.equal(bridge.latestFor(horde,'barre de CUIVRE').store,'binch.ah.market.v1');
assert.equal(bridge.latestFor(horde,'Sulfuras'),null);
assert.equal(legacy.prices.length,2,'read-only legacy ledger');
assert.equal(ah.items.length,2,'read-only AH ledger');
const future=new Date(Date.now()+60*60*1000).toISOString();
const futureOnly=bridge.snapshot({prices:[{item:'Fausse cotation',unit:500,time:future,realm:'Forever',faction:'Horde'}]}, {items:[]}, {realm:'Forever',faction:'Horde'});
assert.equal(futureOnly.status,'empty','future legacy prices cannot be quoted');
assert.equal(bridge.latestFor(futureOnly,'Fausse cotation'),null);
const futureAH=bridge.snapshot({prices:[]}, {items:[{name:'Fausse cotation',last:500,observedAt:future,scope:'forever|Horde'}]}, {realm:'Forever',faction:'Horde'});
assert.equal(futureAH.status,'empty','future AH prices cannot be quoted');
console.log('Market bridge: 11 assertions passed');
