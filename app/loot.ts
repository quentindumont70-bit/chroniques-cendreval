/** Drop tables shared by ordinary enemies, named elites and major bosses.
 * No pity timer: long-tail prestige items stay genuinely rare.
 * Roll is injectable so combat tests and future server events are reproducible.
 */
export type Rarity='common'|'uncommon'|'rare'|'epic'|'legendary';
export type LootItem={id:string;name:string;rarity:Rarity;slot:'weapon'|'armor'|'trinket'|'material';power:number;description:string;affinity?:'melee'|'bow'|'magic';physicalGuard?:number;magicGuard?:number;manaRegen?:number};
export type DropEntry={item:LootItem;chance:number};
export type EnemyLootKind='ordinary'|'elite'|'guardian'|'ashKing'|'echo';
const item=(id:string,name:string,rarity:Rarity,slot:LootItem['slot'],power:number,description:string):LootItem=>({id,name,rarity,slot,power,description});
export const ITEMS={
 longbow:{...item('longbow','Arc du bois de lune','rare','weapon',9,'Un arc tendu pour les tirs lointains. Excellent bonus aux flèches, faible en mêlée.'),affinity:'bow'},
 emberstaff:{...item('emberstaff','Sceptre des braises','rare','weapon',9,'Un foyer de verre qui amplifie les sorts plutôt que les coups physiques.'),affinity:'magic'},
 moonbow:{...item('moonbow','Arc du guetteur pâle','epic','weapon',23,'Une branche lunaire réservée aux chasseurs des échos.'),affinity:'bow'},
 starstaff:{...item('starstaff','Bâton du firmament brisé','epic','weapon',23,'Les fractures du cristal répondent aux arcanes.'),affinity:'magic'},
 plate:{...item('plate','Cuirasse du rempart','rare','armor',8,'Protection physique 4 ; protection magique 1.'),physicalGuard:4,magicGuard:1},
 veil:{...item('veil','Voile des lucioles','rare','armor',6,'Protection physique 1 ; protection magique 3 ; régénération +1 mana/s.'),physicalGuard:1,magicGuard:3,manaRegen:1},
 moonstone:{...item('moonstone','Pierre de source','rare','trinket',3,'Une réserve modeste de puissance, mais +1 mana/s permanent.'),manaRegen:1},
 ash:item('ash','Éclat de cendre','common','material',0,'Une poussière encore chaude, prisée des artisans.'),
 iron:item('iron','Garde de fer noir','uncommon','armor',3,'Une vieille cuirasse renforcée aux jointures.'),
 fang:item('fang','Crochet du maraudeur','rare','weapon',7,'Sa morsure laisse une entaille profonde.'),
 vigil:item('vigil','Œil du veilleur','rare','trinket',9,'Une lucidité inquiétante au cœur de la brume.'),
 oath:item('oath','Lame du serment brisé','epic','weapon',18,'L’acier vibre au souvenir de son dernier duel.'),
 crown:item('crown','Couronne des cendres','legendary','trinket',36,'Le souverain défunt refuse encore de céder.'),
 eclipse:item('eclipse','Lame de l’Éclipse','legendary','weapon',42,'Une arme que les ombres reconnaissent comme reine.')
} as const satisfies Record<string,LootItem>;
/** Independent Bernoulli trials; chances are probabilities per kill, not normalized weights. */
export const LOOT_TABLES:Record<EnemyLootKind,readonly DropEntry[]>={
 ordinary:[{item:ITEMS.longbow,chance:.004},{item:ITEMS.emberstaff,chance:.004},{item:ITEMS.ash,chance:.26},{item:ITEMS.iron,chance:.038},{item:ITEMS.fang,chance:.004}],
 elite:[{item:ITEMS.longbow,chance:.025},{item:ITEMS.emberstaff,chance:.025},{item:ITEMS.plate,chance:.035},{item:ITEMS.veil,chance:.035},{item:ITEMS.moonstone,chance:.02},{item:ITEMS.ash,chance:.55},{item:ITEMS.iron,chance:.15},{item:ITEMS.fang,chance:.025},{item:ITEMS.vigil,chance:.009}],
 guardian:[{item:ITEMS.plate,chance:.12},{item:ITEMS.veil,chance:.12},{item:ITEMS.starstaff,chance:.012},{item:ITEMS.iron,chance:.4},{item:ITEMS.vigil,chance:.075},{item:ITEMS.oath,chance:.012}],
 ashKing:[{item:ITEMS.starstaff,chance:.065},{item:ITEMS.moonbow,chance:.065},{item:ITEMS.vigil,chance:.24},{item:ITEMS.oath,chance:.065},{item:ITEMS.crown,chance:.001}],
 echo:[{item:ITEMS.moonbow,chance:.028},{item:ITEMS.moonstone,chance:.1},{item:ITEMS.fang,chance:.11},{item:ITEMS.oath,chance:.028},{item:ITEMS.eclipse,chance:.001}]
};
export function rollLoot(kind:EnemyLootKind,random:()=>number=Math.random):LootItem[]{
 const found:LootItem[]=[];
 for(const entry of LOOT_TABLES[kind]){
  const value=random();
  if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Loot RNG must return a number in [0, 1)');
  if(value<entry.chance)found.push(entry.item);
 }
 return found;
}
export function lootForEnemy(boss:boolean,name:string,echoTier=0):EnemyLootKind{
 if(echoTier>0||/écho|echo/i.test(name))return 'echo';
 if(/roi de cendre|ash king/i.test(name))return 'ashKing';
 if(boss)return 'guardian';
 return /capitaine|sentinelle|brute|élite|elite/i.test(name)?'elite':'ordinary';
}
export function rarityLabel(r:Rarity){return({common:'Commun',uncommon:'Inhabituel',rare:'Rare',epic:'Épique',legendary:'Légendaire'} as const)[r]}
