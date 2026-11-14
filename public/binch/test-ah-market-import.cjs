'use strict';
// Run: node public/binch/test-ah-market-import.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'ah-market.js'),'utf8');
const end=/\}\)\(\);\s*$/;
assert.match(source,end,'Expected IIFE module');
const script=source.replace(end,'window.__marketTest={validateRow,ingest};})();');
const values=new Map(),window={addEventListener(){}};
const document={readyState:'loading',addEventListener(){}};
const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
vm.runInNewContext(script,{window,document,localStorage,crypto:{},Date,Math,Number,String,Array,Object,JSON},{filename:'ah-market.js'});
const row={name:'Barre de cuivre',priceCopper:200,quantity:1,realm:'Forever',faction:'Horde'};
let assertions=0;
function check(value,message){assert.ok(value,message);assertions++}
check(window.__marketTest.validateRow(row,true)===null,'undated import rejected');
check(!!window.__marketTest.validateRow(row,false)?.observedAt,'manual entry gets current time');
check(window.__marketTest.validateRow({...row,observedAt:'2026-11-10T12:00:00Z'},true)?.price===200,'dated import accepted');
check(window.__marketTest.validateRow({...row,observedAt:'bad'},true)===null,'invalid date rejected');
check(window.__marketTest.validateRow(null,true)===null,'null row rejected');
check(window.__marketTest.validateRow([],true)===null,'array row rejected');
check(window.__marketTest.validateRow({...row,observedAt:new Date(Date.now()+86400000).toISOString()},true)===null,'future date rejected');
console.log('AH market import: '+assertions+' assertions passed');
