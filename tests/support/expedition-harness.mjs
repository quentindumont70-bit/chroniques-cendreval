import * as T from 'three';
import {Expedition} from '../../app/expedition3d/game.ts';
import {fresh} from '../../app/expedition3d/progress.ts';
import {places,ground} from '../../app/expedition3d/world.ts';
import {actor} from '../../app/expedition3d/scene.ts';
import {DEFAULT_PREFERENCES} from '../../app/expedition3d/controls.ts';
export function sim(id='blade'){
 const g=Object.create(Expedition.prototype);
 Object.assign(g,{p:fresh(id),preferences:{...DEFAULT_PREFERENCES},scene:new T.Scene(),camera:new T.PerspectiveCamera(),enemies:[],bolts:[],fx:[],hazards:[],keys:new Set(),touches:new Map(),stick:{x:0,y:0},cooldowns:[0,0,0],paused:false,charging:false,charge:0,riposte:0,airUsed:false,airBurst:0,dodgeBonus:0,attackCd:0,swing:0,swingDuration:.46,guardTime:0,guarding:false,dodgeTime:0,dodgeBurst:0,vy:0,pitch:0,locked:null,elapsed:0,noticeTime:0,saveTime:0,sound:false,cleanups:[],world:{root:new T.Group(),markers:new Map(Object.values(places).flat().map(p=>{const m=new T.Group();m.position.set(p.x,p.y||0,p.z);return[p.id,m]})),gates:[]},save(){},emit(){},pause(){this.paused=true;this.touches.clear();this.stick={x:0,y:0};this.guarding=false},onPause(){}});
 return g;
}
export function enemy(g,id='v1',kind='sentinel',x=0,z=29){const model=actor(kind),y=ground(g.p.zone,x,z),e={id,kind,x,y,z,hp:1000,max:1000,wind:0,recover:0,flash:0,phase:1,model,expose:0,poise:0,stun:0,alert:0,home:{x,z}};g.enemies.push(e);g.scene.add(model.root);return e}
export function frames(g,n){for(let i=0;i<n;i++)g.advance(1/60)}
