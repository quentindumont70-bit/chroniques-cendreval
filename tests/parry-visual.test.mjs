import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawParryCue,remainingToImpact,parryLead} from '../app/parry-cue.ts';
test('compact cue keeps timing semantics and bounded visual radius',()=>{
 const radii=[];const ctx=new Proxy({arc:(_x,_y,r)=>radii.push(r)}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const intent of ['sweep','slam','crush','shot'])drawParryCue(ctx,{telegraph:.2,intent,impactDone:false},100,100,true);
 assert(radii.length>0&&radii.every(r=>r<=19));assert.equal(parryLead(true),.35);
 assert.equal(remainingToImpact({telegraph:0,impactDone:true}),Infinity);
});
