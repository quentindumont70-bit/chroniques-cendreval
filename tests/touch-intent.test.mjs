import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rightIntent,nearbyTap} from '../app/touch-intent.ts';
test('quick horizontal recontact keeps camera control past the old skill threshold',()=>{
 let mode=rightIntent('pending',true,12,2);
 assert.equal(mode,'look');
 assert.equal(rightIntent(mode,true,48,-64),'look');
});
test('deliberate vertical double swipes retain both abilities',()=>{
 assert.equal(rightIntent('pending',true,2,-15),'pending');
 assert.equal(rightIntent('pending',true,3,-35),'skill-up');
 assert.equal(rightIntent('pending',true,3,35),'skill-down');
 assert.equal(rightIntent('skill-up',true,60,60),'skill-up');
 assert.equal(rightIntent('pending',false,0,-35),'look');
});
test('separate thumb landings are not double taps',()=>{
 assert(nearbyTap({x:600,y:200},610,205));
 assert(!nearbyTap({x:600,y:200},700,200));
 assert(!nearbyTap(null,600,200));
});
