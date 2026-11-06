import type {Progress} from './progress.ts';
import type {Stats} from '../rpg.ts';
import type {EnemyKind} from './world.ts';
/** Guaranteed authored drops: no rare-roll dependency can block a build or quest. */
export const RELICS={
 pilgrim:{name:'Médaillon du pèlerin',source:'Équipement initial',effect:'Sans effet',rarity:'Commun'},
 fang:{name:'Croc de la meute',source:'Traqueurs de la vallée',effect:'Après une esquive : +20 % dégâts pendant 3 secondes',rarity:'Rare'},
 lantern:{name:'Lanterne des noyés',source:'Lanceur de la citerne',effect:'Consommer une marque rend 8 mana supplémentaires',rarity:'Rare'},
 bell:{name:'Clochette du veilleur',source:'Arbalétrier de la crypte',effect:'Parade parfaite : +25 endurance',rarity:'Rare'},
 oath:{name:'Anneau du dernier serment',source:'Gardien du serment',effect:'Sous 40 vie : +12 puissance, +15 armure',rarity:'Unique'},
 tide:{name:'Perle des trois marées',source:'Énigme de la citerne',effect:'Souffle aérien : +15 endurance ; +8 résistance magique',rarity:'Unique'},
 ember:{name:'Braise qui ne meurt pas',source:'Stèle des trois mémoires',effect:'Compétence offensive : rend 3 vie ; +1 mana/s',rarity:'Unique'},
} as const;
export type RelicId=keyof typeof RELICS;
export type RelicState={relic:RelicId;relics:RelicId[];lootLog:string[]};
export function recordLoot(p:Progress,message:string){p.lootLog=[message,...(p.lootLog||[])].slice(0,12)}
export function grantRelic(p:Progress,id:RelicId){if(p.relics.includes(id))return false;p.relics.push(id);recordLoot(p,`${RELICS[id].rarity} · ${RELICS[id].name}`);return true}
export const DROP_TABLE:Record<EnemyKind,{gold:number;ore:number;xp:number;material:'resin'|'herb'|'mushroom'}>={hound:{gold:7,ore:1,xp:22,material:'herb'},archer:{gold:11,ore:1,xp:25,material:'resin'},sentinel:{gold:10,ore:2,xp:28,material:'mushroom'},boss:{gold:60,ore:5,xp:100,material:'resin'}};
export function enemyLoot(p:Progress,id:string,kind:EnemyKind){const d=DROP_TABLE[kind];p.gold+=d.gold;p.ore=Math.min(999,p.ore+d.ore);p[d.material]=Math.min(99,p[d.material]+1);recordLoot(p,`+${d.gold} or · +${d.ore} minerai(s) · +1 ${d.material==='resin'?'résine':d.material==='herb'?'achillée':'morille'}`);const relic=id==='v1'?'fang':id==='s3'?'lantern':id==='c2'?'bell':id==='boss'?'oath':null;if(relic)grantRelic(p,relic);return d.xp}
export function relicStats(p:Progress,s:Stats):Stats{const n={...s};if(p.relic==='oath'&&p.hp<40){n.power+=12;n.armor+=15}if(p.relic==='tide')n.magicResist+=8;if(p.relic==='ember')n.manaRegen+=1;return n}
export function salvage(p:Progress,kind:'weapon'|'armor',id:string){if(!p.forgeOpen)return false;if(kind==='weapon'){const key=id as keyof typeof import('./arsenal.ts').WEAPONS;if(key===p.weapon||['thunder','ember'].includes(id)||!p.weapons.includes(key)||p.weapons.length<=1)return false;p.weapons=p.weapons.filter(w=>w!==key);delete p.upgrades[key];p.ore=Math.min(999,p.ore+2);p.gold+=8;}else{const key=id as keyof typeof import('./arsenal.ts').ARMORS;if(key===p.armor||id==='cloth'||!p.armors.includes(key))return false;p.armors=p.armors.filter(a=>a!==key);p.ore=Math.min(999,p.ore+2);p.gold+=6;}recordLoot(p,'Recyclage · +2 minerais et récupération d’or');return true}
