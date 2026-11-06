import {TRIALS,type TrialId,type EncounterState} from './encounters.ts';
import {PROJECTS,RUMORS,type VillageState} from './village.ts';
import type {ExplorationState} from './navigation.ts';
import {MASTERIES} from './mastery.ts';
import {RELICS,type RelicId,type RelicState} from './relics.ts';
import type {ChapterState} from './chapter.ts';
import {WEAPONS,ARMORS,AFFIXES,DISCIPLINES,startingWeapon,type Build,type WeaponId,type ArmorId} from './arsenal.ts';
import type {Story} from './story.ts';
import {classId, type ClassId} from '../rpg.ts';
import type {AlchemyState} from '../alchemy.ts';
import type {TalentRanks} from '../talents.ts';
import {clamp, ground, floorAt, canStand, type Zone,places} from './world.ts';
export const SAVE_KEY='outbinched-expedition3d-v1';
export const GEAR=[{id:'pilgrim',name:'Fer du pèlerin',power:0,armor:0},{id:'watch',name:'Lame du veilleur',power:5,armor:0},{id:'tomb',name:'Sceau du tombeau',power:3,armor:10},{id:'sulfuras',name:'Sulfuras · héritage du gardien',power:12,armor:6}] as const;
export type Progress=AlchemyState & TalentRanks & Build & Story & RelicState & ChapterState & EncounterState & VillageState & ExplorationState & {mastery:string;version:1;classId:ClassId;zone:Zone;x:number;y:number;z:number;yaw:number;checkpoint:string;level:number;xp:number;talent:number;gold:number;potions:number;dead:string[];found:string[];gate:boolean;bossLoot:boolean;finished:boolean;gear:string[];equipped:string;foesDefeated:number;perfectDefenses:number;contractAccepted:number;contractClaimed:number;discoveryMask:number;campMask:number;lore:number;quest:number};
export function fresh(id:ClassId='blade'):Progress{return{trials:{},seenFoes:[],villageProjects:[],rumors:[],knownPlaces:[],trackedPlace:'',mastery:'',relic:'pilgrim',relics:['pilgrim'],lootLog:[],bells:0,puzzleStep:0,puzzleSolved:false,chapterSeen:[],weapon:startingWeapon(id),weapons:[startingWeapon(id)],armor:'cloth',armors:['cloth'],affix:'none',upgrades:{},discipline:'',disciplineRank:0,ore:0,forgeOpen:false,rescue:0,smith:0,memoryQuest:0,heartChoice:'none',flight:false,shortcut:false,apothecary:false,storyFlags:[],version:1,classId:id,zone:'valley',x:0,z:31,y:0,yaw:0,checkpoint:'hearth',level:1,xp:0,talent:0,gold:12,potions:3,hp:100,mana:100,stamina:100,dead:[],found:[],gate:false,bossLoot:false,finished:false,gear:['pilgrim'],equipped:'pilgrim',foesDefeated:0,perfectDefenses:0,contractAccepted:0,contractClaimed:0,discoveryMask:0,campMask:0,lore:0,quest:0,herb:0,mushroom:0,resin:0,tonic:1,oil:0,ward:0,harvestMask:0,gathered:0,prepared:'tonic',oilTime:0,wardTime:0,alchemyCooldown:0}}
export function decode(raw:string):Progress{
 const v=JSON.parse(raw);if(!v||typeof v!=='object'||v.version!==1)throw Error('Sauvegarde incompatible');
 const p=fresh(classId(v.classId));
 for(const k of Object.keys(p) as (keyof Progress)[]){const value=v[k];if(typeof p[k]==='number'&&typeof value==='number'&&Number.isFinite(value))(p as unknown as Record<string,unknown>)[k]=value;else if(typeof p[k]==='boolean'&&typeof value==='boolean')(p as unknown as Record<string,unknown>)[k]=value;}
 let activeTrial=false;for(const id of Object.keys(TRIALS) as TrialId[]){const wave=v.trials?.[id];if(Number.isInteger(wave)&&wave>=1&&wave<=3){if(wave<3&&activeTrial)continue;p.trials[id]=wave;if(wave<3)activeTrial=true}}p.seenFoes=['hound','sentinel','archer','boss'].filter(k=>Array.isArray(v.seenFoes)&&v.seenFoes.includes(k)) as typeof p.seenFoes;p.villageProjects=Object.keys(PROJECTS).filter(k=>Array.isArray(v.villageProjects)&&v.villageProjects.includes(k));p.rumors=RUMORS.filter(r=>Array.isArray(v.rumors)&&v.rumors.includes(r.id)).map(r=>r.id);const placeIds=Object.values(places).flat().map(t=>t.id);p.knownPlaces=placeIds.filter(id=>Array.isArray(v.knownPlaces)&&v.knownPlaces.includes(id));p.trackedPlace=placeIds.includes(v.trackedPlace)?v.trackedPlace:'';
 p.relics=Object.keys(RELICS).filter(k=>Array.isArray(v.relics)&&v.relics.includes(k)) as RelicId[];if(!p.relics.includes('pilgrim'))p.relics.unshift('pilgrim');p.relic=p.relics.includes(v.relic)?v.relic:'pilgrim';p.lootLog=Array.isArray(v.lootLog)?v.lootLog.filter((s:unknown)=>typeof s==='string'&&s.length<180).slice(0,12):[];p.chapterSeen=Array.isArray(v.chapterSeen)?v.chapterSeen.filter((s:unknown)=>typeof s==='string'&&['village','crossing','cistern','crypt','guardian','home'].includes(s)).slice(0,6):[];p.bells=Math.floor(clamp(p.bells,0,7));p.puzzleStep=Math.floor(clamp(p.puzzleStep,0,3));p.puzzleSolved=p.puzzleSolved&&p.puzzleStep===3;if(!p.puzzleSolved&&p.puzzleStep===3)p.puzzleStep=0;
 p.zone=v.zone==='cistern'?'cistern':v.zone==='crypt'?'crypt':'valley';p.x=clamp(p.x,p.zone==='valley'?-33:p.zone==='cistern'?-21:-18,p.zone==='valley'?33:p.zone==='cistern'?21:18);p.z=clamp(p.z,p.zone==='crypt'?-47:p.zone==='cistern'?-38:-50,p.zone==='crypt'?6:p.zone==='cistern'?10:35);p.y=floorAt(p.zone,p.x,p.z,clamp(p.y,-3,10));p.yaw=Number.isFinite(v.yaw)?v.yaw:0;
 p.checkpoint=['hearth','shrine','cryptfire','cisternfire'].includes(v.checkpoint)?v.checkpoint:'hearth';
 for(const k of ['hp','mana','stamina'] as const)p[k]=clamp(p[k],0,100);
 for(const k of ['gold','xp','foesDefeated','perfectDefenses'] as const)p[k]=Math.floor(clamp(p[k],0,999999));
 for(const k of ['level','talent','potions','herb','mushroom','resin'] as const)p[k]=Math.floor(clamp(p[k],k==='level'?1:0,99));
 for(const k of ['tonic','oil','ward'] as const)p[k]=Math.floor(clamp(p[k],0,9));
 for(const k of ['contractAccepted','contractClaimed'] as const)p[k]=Math.floor(clamp(p[k],0,31));
 p.harvestMask=Math.floor(clamp(p.harvestMask,0,4095));p.gathered=Math.floor(clamp(p.gathered,0,12));
 p.prepared=['tonic','oil','ward'].includes(v.prepared)?v.prepared:'tonic';
 p.oilTime=clamp(p.oilTime,0,45);p.wardTime=clamp(p.wardTime,0,45);p.alchemyCooldown=clamp(p.alchemyCooldown,0,8);
 for(const k of ['talentMight','talentWard','talentSpirit'] as const)p[k]=Math.floor(clamp(Number.isFinite(v[k])?v[k]:0,0,3));
 p.dead=Array.isArray(v.dead)?[...new Set(v.dead.filter((s:unknown)=>typeof s==='string'&&/^(v[1-6]|c[1-3]|s[1-4]|boss|trial-(orchard|drowned|vigil)-[12]-[012])$/.test(s)))].slice(0,40) as string[]:[];
 p.found=Array.isArray(v.found)?v.found.filter((s:unknown)=>typeof s==='string'&&s.length<40).slice(0,40):[];
 p.gear=GEAR.filter(g=>Array.isArray(v.gear)&&v.gear.includes(g.id)).map(g=>g.id);if(!p.gear.includes('pilgrim'))p.gear.push('pilgrim');
 p.equipped=p.gear.includes(v.equipped)?v.equipped:'pilgrim';
 p.weapons=Object.keys(WEAPONS).filter(k=>Array.isArray(v.weapons)&&v.weapons.includes(k)) as WeaponId[];if(!p.weapons.length)p.weapons=[startingWeapon(p.classId)];p.weapon=p.weapons.includes(v.weapon)?v.weapon:p.weapons[0];
 p.armors=Object.keys(ARMORS).filter(k=>Array.isArray(v.armors)&&v.armors.includes(k)) as ArmorId[];if(!p.armors.includes('cloth'))p.armors.push('cloth');p.armor=p.armors.includes(v.armor)?v.armor:'cloth';p.affix=Object.hasOwn(AFFIXES,v.affix)?v.affix:'none';
 for(const id of p.weapons){const rank=v.upgrades?.[id];p.upgrades[id]=Number.isFinite(rank)?Math.floor(clamp(rank,0,3)):0}
 p.discipline=DISCIPLINES[p.classId].some(d=>d.id===v.discipline)?v.discipline:'';p.disciplineRank=p.discipline?Math.floor(clamp(p.disciplineRank,0,3)):0;
 p.mastery=p.disciplineRank===3&&MASTERIES[p.classId].some(m=>m.id===v.mastery)?v.mastery:'';
 p.ore=Math.floor(clamp(p.ore,0,999));p.rescue=Math.floor(clamp(p.rescue,0,3));p.smith=Math.floor(clamp(p.smith,0,2));p.memoryQuest=Math.floor(clamp(p.memoryQuest,0,2));p.forgeOpen=p.smith===2;p.apothecary=p.rescue===3;
 p.heartChoice=['restore','ward'].includes(v.heartChoice)?v.heartChoice:'none';p.storyFlags=Array.isArray(v.storyFlags)?v.storyFlags.filter((s:unknown)=>typeof s==='string'&&s.length<40).slice(0,20):[];
 for(const [foe,relic] of [['v1','fang'],['s3','lantern'],['c2','bell'],['boss','oath']] as const)if(p.dead.includes(foe)&&!p.relics.includes(relic))p.relics.push(relic);
 p.bossLoot=p.bossLoot&&p.dead.includes('boss');if(p.bossLoot&&!p.weapons.includes('ember'))p.weapons.push('ember');p.finished=p.finished&&p.bossLoot;if(p.finished&&p.heartChoice==='none')p.heartChoice='restore';
 if(p.y< -8||!canStand(p.zone,p.x,p.y,p.z,p.gate)){p.x=0;p.z=p.zone==='crypt'?3:p.zone==='cistern'?7:31;p.y=ground(p.zone,p.x,p.z);}
 return p;
}
export function gainXp(p:Progress,amount:number){p.xp+=amount;while(p.level<99&&p.xp>=p.level*35){p.xp-=p.level*35;p.level++;p.talent++;p.hp=Math.min(100,p.hp+25)}}
export function objective(p:Progress){return p.finished?'Le serment est accompli. Explorez les derniers secrets.':p.bossLoot?'Rapportez le cœur à Elenn, à Valbrume.':p.dead.includes('boss')?'Recueillez le cœur de Sulfuras dans la salle du gardien.':p.zone==='cistern'?p.flight?'Traversez le gouffre et retrouvez le passeur.':'Retrouvez le souffle du passeur sur la rive est.':p.zone==='valley'?'Traversez la vallée et rejoignez le donjon.':!p.gate?'Trouvez le sceau sur la galerie est, en hauteur.':'La grille est levée. Affrontez le gardien.'}
export function rewardBoss(p:Progress){if(p.bossLoot||!p.dead.includes('boss'))return false;p.bossLoot=true;p.gear.push('sulfuras');if(!p.weapons.includes('ember'))p.weapons.push('ember');p.gold+=60;gainXp(p,80);return true}
export function finish(p:Progress){if(!p.bossLoot||p.finished)return false;p.finished=true;p.gold+=100;p.talent+=2;return true}
