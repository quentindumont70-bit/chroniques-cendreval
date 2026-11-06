import type {ClassId,Stats} from '../rpg.ts';
export const WEAPONS={
 sword:{name:'Épée du serment',model:'blade',damage:22,reach:2.8,recovery:.46,stamina:10,poise:18,cone:.25,ranged:false,magic:false,price:24,description:'Taillades rapides. Une riposte après parade frappe deux fois plus fort.'},
 hammer:{name:'Marteau de carrière',model:'hammer',damage:38,reach:2.5,recovery:.98,stamina:24,poise:55,cone:.1,ranged:false,magic:false,price:38,description:'Lent et lourd. La charge balaie les ennemis proches et brise leur posture.'},
 spear:{name:'Lance du passeur',model:'spear',damage:27,reach:4.1,recovery:.68,stamina:15,poise:24,cone:.82,ranged:false,magic:false,price:30,description:'Allonge supérieure, cône étroit. La charge perce les défenses.'},
 bow:{name:'Arc des branches mortes',model:'bow',damage:22,reach:24,recovery:.62,stamina:12,poise:16,cone:.9,ranged:true,magic:false,price:32,description:'Flèches physiques. Bandez l’arc pour un tir plus puissant.'},
 catalyst:{name:'Catalyseur des marées',model:'arcane',damage:18,reach:20,recovery:.5,stamina:8,poise:12,cone:.85,ranged:true,magic:true,price:32,description:'Projectiles magiques sans coût en mana. La charge applique votre marque de classe.'},
 thunder:{name:'Éclat de Thunderfury',model:'thunder',damage:27,reach:3.1,recovery:.42,stamina:11,poise:22,cone:.35,ranged:false,magic:true,price:0,description:'Unique : une frappe chargée propage un éclair à une seconde cible visible.'},
 ember:{name:'Sulfuras, le serment rompu',model:'hammer',damage:43,reach:2.7,recovery:1.02,stamina:24,poise:65,cone:.1,ranged:false,magic:false,price:0,description:'Unique : les frappes chargées déclenchent une onde de braise.'}
} as const;
export type WeaponId=keyof typeof WEAPONS;
export const ARMORS={cloth:{name:'Étoffe du voyageur',armor:0,magic:8,regen:1,speed:1,color:'#456a70',price:0},leather:{name:'Cuir des passeurs',armor:12,magic:5,regen:0,speed:1.05,color:'#866449',price:25},plate:{name:'Harnois des Veilleurs',armor:28,magic:0,regen:0,speed:.9,color:'#818b99',price:45},vestment:{name:'Chasuble des astres',armor:5,magic:24,regen:2,speed:1,color:'#85719b',price:40}} as const;
export type ArmorId=keyof typeof ARMORS;
export const AFFIXES={none:{name:'Sans rune',description:'Aucun effet',cost:0},keen:{name:'Acuité',description:'+8 % de critique',cost:28},siphon:{name:'Siphon',description:'Rend 4 mana à chaque coup porté',cost:28},impact:{name:'Fracture',description:'+35 % de dégâts de posture',cost:28},ward:{name:'Égide',description:'Une parade parfaite rend 6 vie',cost:28}} as const;
export type AffixId=keyof typeof AFFIXES;
export const DISCIPLINES:Record<ClassId,readonly {id:string;name:string;steps:readonly string[]}[]>={
 blade:[{id:'duelist',name:'Duelliste',steps:['+5 puissance','Riposte : +50 % de dégâts','La riposte rend 20 endurance']},{id:'bastion',name:'Bastion',steps:['+10 armure','Garde : dégâts reçus réduits de moitié','Parade parfaite : +12 vie']}],
 bow:[{id:'marksman',name:'Œil de cendre',steps:['+6 % critique','Charge : +35 % de dégâts','Les tirs chargés percent 20 armure']},{id:'strider',name:'Marche-brume',steps:['Esquive : coût réduit de 6','+10 % de vitesse','Après une esquive : prochaine attaque +50 %']}],
 arcane:[{id:'pyre',name:'Pyromancien',steps:['+5 puissance','Marques : durée +2 secondes','Consommer une marque produit une explosion']},{id:'prism',name:'Prismatique',steps:['+2 mana par seconde','+15 résistance magique','Une compétence dépensant du mana rend 5 vie']}],
 hex:[{id:'soul',name:'Moissonneur d’âmes',steps:['+6 % de vol de vie','Consommer une marque rend 8 vie de plus','Un ennemi vaincu rend 15 mana']},{id:'doom',name:'Tisseur de dettes',steps:['+8 pénétration magique','Marques : durée +2 secondes','Les ennemis marqués subissent +30 % de dégâts']}],
 cantor:[{id:'hymn',name:'Hymne des vivants',steps:['+2 mana par seconde','Parade parfaite : +10 vie','Les soins des compétences sont augmentés de 50 %']},{id:'discord',name:'Maître des dissonances',steps:['+5 puissance','Compétences : +25 dégâts de posture','Briser une posture rend 15 mana']}],
 reaver:[{id:'butcher',name:'Faucheur carmin',steps:['+5 puissance','Un ennemi vaincu rend 10 vie','Charge : +40 % de dégâts sous 50 vie']},{id:'bloodguard',name:'Rempart de sang',steps:['+12 armure','Subir un coup rend 8 mana','Parade parfaite : prochaine attaque +75 %']}]
};
export type Build={classId:ClassId;weapon:WeaponId;weapons:WeaponId[];armor:ArmorId;armors:ArmorId[];affix:AffixId;upgrades:Partial<Record<WeaponId,number>>;discipline:string;disciplineRank:number;ore:number;gold:number;talent:number;level:number;forgeOpen:boolean};
export function startingWeapon(id:ClassId):WeaponId{return id==='bow'?'bow':['arcane','hex','cantor'].includes(id)?'catalyst':'sword'}
export function attackProfile(p:Build,charge=0,riposte=false){const w=WEAPONS[p.weapon],full=charge>=.75,rank=p.disciplineRank;let damage=w.damage+(p.upgrades[p.weapon]||0)*4;
 if(full)damage*=p.discipline==='marksman'&&rank>=2?2.35:2;
 if(riposte)damage*=p.discipline==='duelist'&&rank>=2?2.5:2;
 return{...w,damage,full,stamina:w.stamina*(full?1.5:1),poise:w.poise*(full?1.8:1)*(p.affix==='impact'?1.35:1),recovery:w.recovery*(full?1.25:1)};
}
export function buildStats(p:Build,s:Stats):Stats{const a=ARMORS[p.armor],n={...s,armor:s.armor+a.armor,magicResist:s.magicResist+a.magic,manaRegen:s.manaRegen+a.regen};if(p.affix==='keen')n.critChance+=.08;if(p.disciplineRank<1)return n;
 if(['duelist','pyre','discord','butcher'].includes(p.discipline))n.power+=5;
 if(p.discipline==='marksman')n.critChance+=.06;
 if(p.discipline==='bastion')n.armor+=10;if(p.discipline==='bloodguard')n.armor+=12;
 if(['prism','hymn'].includes(p.discipline))n.manaRegen+=2;
 if(p.discipline==='soul')n.lifeSteal+=.06;if(p.discipline==='doom')n.magicPen+=8;
 if(p.discipline==='prism'&&p.disciplineRank>=2)n.magicResist+=15;
 return n;
}
export function forge(p:Build,action:'weapon'|'armor'|'upgrade'|'affix',id:string){
 if(!p.forgeOpen)return false;
 if(action==='weapon'){if(!Object.hasOwn(WEAPONS,id))return false;const key=id as WeaponId,w=WEAPONS[key];if(!w.price||p.weapons.includes(key)||p.gold<w.price)return false;p.gold-=w.price;p.weapons.push(key);return true}
 if(action==='armor'){if(!Object.hasOwn(ARMORS,id))return false;const key=id as ArmorId,a=ARMORS[key];if(!a.price||p.armors.includes(key)||p.gold<a.price)return false;p.gold-=a.price;p.armors.push(key);return true}
 if(action==='affix'){if(!Object.hasOwn(AFFIXES,id))return false;const key=id as AffixId;if(p.affix===key||p.gold<AFFIXES[key].cost)return false;p.gold-=AFFIXES[key].cost;p.affix=key;return true}
 const rank=p.upgrades[p.weapon]||0,cost=12+rank*10;if(rank>=3||p.ore<rank+1||p.gold<cost)return false;p.ore-=rank+1;p.gold-=cost;p.upgrades[p.weapon]=rank+1;return true;
}
export function train(p:Build,id:string){if(!DISCIPLINES[p.classId].some(d=>d.id===id)||p.discipline&&p.discipline!==id||p.disciplineRank>=3||p.talent<1||p.level<p.disciplineRank+2)return false;p.discipline=id;p.disciplineRank++;p.talent--;return true}
export function respecialize(p:Build){if(!p.disciplineRank||p.gold<20)return false;p.gold-=20;p.talent+=p.disciplineRank;p.disciplineRank=0;p.discipline='';return true}
