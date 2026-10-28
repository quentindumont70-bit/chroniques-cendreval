import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clipNear} from '../app/near-clip.ts';
test('faces crossing the eye plane remain finite and partially visible',()=>{
 const face=[{side:-1,depth:-1,z:0},{side:1,depth:1,z:0},{side:1,depth:1,z:1},{side:-1,depth:-1,z:1}];
 const result=clipNear(face);assert.equal(result.length,4);assert(result.every(p=>p.depth>=.081&&Number.isFinite(p.side)));
 assert.deepEqual(clipNear(face.map(p=>({...p,depth:-1}))),[]);
 const front=face.map(p=>({...p,depth:2}));assert.deepEqual(clipNear(front),front);
});
