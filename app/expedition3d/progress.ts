import {classId, type ClassId} from '../rpg.ts';
import type {AlchemyState} from '../alchemy.ts';
import type {TalentRanks} from '../talents.ts';
import {clamp, ground, floorAt, canStand, type Zone} from './world.ts';
export const SAVE_KEY='outbinched-expedition3d-v1';
export const GEAR=[{id:'pilgrim',name:'Fer du pèlerin',power:0,armor:0},{id:'watch',name:'Lame du veilleur',power:5,armor:0},{id:'tomb',name:'Sceau du tombeau',power:3,armor:10},{id:'sulfuras',name:'Sulfuras · héritage du gardien',power:12,armor:6}] as const;
export type Progress=AlchemyState & TalentRanks & {version:1;classId:ClassId;zone:Zone;x:number;y:number;z:number;yaw:number;checkpoint:string;level:number;xp:number;talent:number;gold:number;potions:number;dead:string[];found:string[];gate:boolean;bossLoot:boolean;finished:boolean;gear:string[];equipped:string;foesDefeated:number;perfectDefenses:number;contractAccepted:number;contractClaimed:number;discoveryMask:number;campMask:number;lore:number;quest:number};
export function fresh(id:ClassId='blade'):Progress{return{version:1,classId:id,zone:'valley',x:0,z:31,y:0,yaw:0,checkpoint:'hearth',level:1,xp:0,talent:0,gold:12,potions:3,hp:100,mana:100,stamina:100,dead:[],found:[],gate:false,bossLoot:false,finished:false,gear:['pilgrim'],equipped:'pilgrim',foesDefeated:0,perfectDefenses:0,contractAccepted:0,contractClaimed:0,discoveryMask:0,campMask:0,lore:0,quest:0,herb:0,mushroom:0,resin:0,tonic:1,oil:0,ward:0,harvestMask:0,gathered:0,prepared:'tonic',oilTime:0,wardTime:0,alchemyCooldown:0}}
export function decode(raw:string):Progress{
 const v=JSON.parse(raw);if(!v||typeof v!=='object'||v.version!==1)throw Error('Sauvegarde incompatible');
 const p=fresh(classId(v.classId));
 for(const k of Object.keys(p) as (keyof Progress)[]){const value=v[k];if(typeof p[k]==='number'&&typeof value==='number'&&Number.isFinite(value))(p as unknown as Record<string,unknown>)[k]=value;else if(typeof p[k]==='boolean'&&typeof value==='boolean')(p as unknown as Record<string,unknown>)[k]=value;}
 p.zone=v.zone==='crypt'?'crypt':'valley';p.x=clamp(p.x,p.zone==='valley'?-33:-18,p.zone==='valley'?33:18);p.z=clamp(p.z,p.zone==='crypt'?-47:-50,p.zone==='crypt'?6:35);p.y=floorAt(p.zone,p.x,p.z,clamp(p.y,-3,10));p.yaw=Number.isFinite(v.yaw)?v.yaw:0;
 p.checkpoint=['hearth','shrine','cryptfire'].includes(v.checkpoint)?v.checkpoint:'hearth';
 for(const k of ['hp','mana','stamina'] as const)p[k]=clamp(p[k],0,100);
 for(const k of ['gold','xp','foesDefeated','perfectDefenses'] as const)p[k]=Math.floor(clamp(p[k],0,999999));
 for(const k of ['level','talent','potions','herb','mushroom','resin'] as const)p[k]=Math.floor(clamp(p[k],k==='level'?1:0,99));
 for(const k of ['tonic','oil','ward'] as const)p[k]=Math.floor(clamp(p[k],0,9));
 for(const k of ['contractAccepted','contractClaimed'] as const)p[k]=Math.floor(clamp(p[k],0,31));
 p.harvestMask=Math.floor(clamp(p.harvestMask,0,4095));p.gathered=Math.floor(clamp(p.gathered,0,12));
 p.prepared=['tonic','oil','ward'].includes(v.prepared)?v.prepared:'tonic';
 p.oilTime=clamp(p.oilTime,0,45);p.wardTime=clamp(p.wardTime,0,45);p.alchemyCooldown=clamp(p.alchemyCooldown,0,8);
 for(const k of ['talentMight','talentWard','talentSpirit'] as const)p[k]=Math.floor(clamp(Number.isFinite(v[k])?v[k]:0,0,3));
 p.dead=Array.isArray(v.dead)?v.dead.filter((s:unknown)=>typeof s==='string'&&/^(v[1-6]|c[1-3]|boss)$/.test(s)).slice(0,10):[];
 p.found=Array.isArray(v.found)?v.found.filter((s:unknown)=>typeof s==='string'&&s.length<40).slice(0,40):[];
 p.gear=GEAR.filter(g=>Array.isArray(v.gear)&&v.gear.includes(g.id)).map(g=>g.id);if(!p.gear.includes('pilgrim'))p.gear.push('pilgrim');
 p.equipped=p.gear.includes(v.equipped)?v.equipped:'pilgrim';
 p.bossLoot=p.bossLoot&&p.dead.includes('boss');p.finished=p.finished&&p.bossLoot;
 if(!canStand(p.zone,p.x,p.y,p.z,p.gate)){p.x=0;p.z=p.zone==='crypt'?3:31;p.y=ground(p.zone,p.x,p.z);}
 return p;
}
export function gainXp(p:Progress,amount:number){p.xp+=amount;while(p.level<99&&p.xp>=p.level*35){p.xp-=p.level*35;p.level++;p.talent++;p.hp=Math.min(100,p.hp+25)}}
export function objective(p:Progress){return p.finished?'Le serment est accompli. Explorez les derniers secrets.':p.bossLoot?'Rapportez le cœur à Elenn, à Valbrume.':p.dead.includes('boss')?'Recueillez le cœur de Sulfuras dans la salle du gardien.':p.zone==='valley'?'Traversez la vallée et rejoignez le donjon.':!p.gate?'Trouvez le sceau sur la galerie est, en hauteur.':'La grille est levée. Affrontez le gardien.'}
export function rewardBoss(p:Progress){if(p.bossLoot||!p.dead.includes('boss'))return false;p.bossLoot=true;p.gear.push('sulfuras');p.gold+=60;gainXp(p,80);return true}
export function finish(p:Progress){if(!p.bossLoot||p.finished)return false;p.finished=true;p.gold+=100;p.talent+=2;return true}
