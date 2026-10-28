import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
const bundle=await build({entryPoints:['app/voxel-world.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {drawVoxelScene,drawVoxelActor,drawVoxelLandmarks}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('scene depth is independent of actor versus landmark submission order',()=>{
 const camera={x:0,y:0,yaw:0,width:426,height:240,fov:Math.PI/3},z=new Float32Array(426).fill(Infinity),actor={x:2,y:0,boss:false,kind:'melee'};
 function paint(reverse){const colors=[];const state={fillStyle:'',fill(){colors.push(this.fillStyle)}};const ctx=new Proxy(state,{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});const a=()=>drawVoxelActor(ctx,camera,z,actor,1000),b=()=>drawVoxelLandmarks(ctx,camera,z,{lore:[{x:4,y:0}],loreMask:0},1000);drawVoxelScene(ctx,camera,z,()=>{if(reverse){b();a()}else{a();b()}});return colors;}
 const a=paint(false);assert(a.length>20);assert.deepEqual(a,paint(true));
});
