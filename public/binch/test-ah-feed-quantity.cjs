/* Regression: an invalid live AH quantity must never be silently replaced by one. */
'use strict';
const assert = require('node:assert/strict');
const T = require('./ah-trading-core.js');
const now = Date.now();
const market = 'forever.normal.horde.us';
const item = (row) => ({row,days:[]});
const make = (row) => ({format:'binch-ah-feed-v2',markets:{[market]:{items:{2589:item(row)}}}});
const read = (row) => T.feedObservations(make(row),market,{realm:'Forever',now});
assert.equal(read([10000,3,now-60000]).length,1,'valid snapshot must be retained');
for(const quantity of [null,-1,0,1.5,'3',undefined]){
 assert.equal(read([10000,quantity,now-60000]).length,0,'invalid quantity '+String(quantity)+' must be ignored');
}
assert.equal(read([10000,3,now+60000]).length,0,'future snapshot must be ignored');
const day = Math.floor((now - 86400000) / 86400000);
const daily = (quantity) => ({format:'binch-ah-feed-v2',markets:{[market]:{items:{2589:{row:null,days:[[day,10000,null,quantity]]}}}}});
for(const quantity of [null,-1,0,1.5,'3',undefined]){
 assert.equal(T.feedObservations(daily(quantity),market,{realm:'Forever',now}).length,0,'invalid daily quantity '+String(quantity)+' must be ignored');
}
assert.equal(T.feedObservations(daily(3),market,{realm:'Forever',now}).length,1,'valid daily quantity must be retained');
console.log('AH live and daily quantity guards: OK');
