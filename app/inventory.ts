import {lootForEnemy,rollLoot,type LootItem,type EnemyLootKind} from './loot';

export type EquipmentSlot='weapon'|'armor'|'trinket';
export type InventoryState={victories?:Partial<Record<EnemyLootKind,number>>;claimedBounties?:string[];version:1;items:Record<string,number>;equipped:Partial<Record<EquipmentSlot,string>>};
export const emptyInventory=():InventoryState=>({version:1,items:{},equipped:{}});
const slots:EquipmentSlot[]=['weapon','armor','trinket'];
export function addDrops(state:InventoryState,drops:readonly LootItem[]):InventoryState{
 const items={...state.items};
 for(const drop of drops)items[drop.id]=(items[drop.id]??0)+1;
 return {...state,items};
}
export function collectEnemyLoot(state:InventoryState,enemy:{boss:boolean;name:string;echoTier?:number},random:()=>number=Math.random){
 const kind:EnemyLootKind=lootForEnemy(enemy.boss,enemy.name,enemy.echoTier??0);
 const drops=rollLoot(kind,random);
 return {kind,drops,inventory:{...addDrops(state,drops),victories:{...state.victories,[kind]:Math.min(999999,(state.victories?.[kind]??0)+1)}}};
}
export function equipItem(state:InventoryState,item:LootItem):InventoryState{
 if(!slots.includes(item.slot as EquipmentSlot))throw Error('Ce matériau ne peut pas être équipé.');
 if((state.items[item.id]??0)<1)throw Error('Objet absent de l’inventaire.');
 return {...state,equipped:{...state.equipped,[item.slot]:item.id}};
}
export function unequipItem(state:InventoryState,slot:EquipmentSlot):InventoryState{
 const equipped={...state.equipped};delete equipped[slot];return {...state,equipped};
}
export function equipmentPower(state:InventoryState,catalog:readonly LootItem[]):number{
 const byId=new Map(catalog.map(item=>[item.id,item]));
 return slots.reduce((sum,slot)=>sum+(byId.get(state.equipped[slot]??'')?.power??0),0);
}
export function parseInventory(value:unknown,catalog:readonly LootItem[]):InventoryState{
 if(!value||typeof value!=='object')return emptyInventory();
 const raw=value as Record<string,unknown>;
 const known=new Map(catalog.map(item=>[item.id,item]));
 const items:Record<string,number>={};
 if(raw.items&&typeof raw.items==='object'&&!Array.isArray(raw.items))
  for(const [id,n] of Object.entries(raw.items))if(known.has(id)&&typeof n==='number'&&Number.isSafeInteger(n)&&n>0&&n<=999999)items[id]=n;
 const equipped:InventoryState['equipped']={};
 if(raw.equipped&&typeof raw.equipped==='object'&&!Array.isArray(raw.equipped))
  for(const slot of slots){const id=(raw.equipped as Record<string,unknown>)[slot];if(typeof id==='string'&&items[id]>0&&known.get(id)?.slot===slot)equipped[slot]=id;}
 const victories:Partial<Record<EnemyLootKind,number>>={};
 if(raw.victories&&typeof raw.victories==='object')for(const kind of ['ordinary','elite','guardian','ashKing','echo'] as EnemyLootKind[]){const n=(raw.victories as Record<string,unknown>)[kind];if(typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=999999)victories[kind]=n;}
 const claimedBounties=Array.isArray(raw.claimedBounties)?raw.claimedBounties.filter((v):v is string=>typeof v==='string'&&['ordinary-5','elite-3','guardian-1','echo-3'].includes(v)):[];
 return {version:1,items,equipped,...(Object.keys(victories).length?{victories}:{}),...(claimedBounties.length?{claimedBounties:[...new Set(claimedBounties)]}:{})};
}

export type EquipmentPreset={name:string;equipped:InventoryState['equipped']};
export function validatePreset(value:unknown):EquipmentPreset|null{
 if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;
 if(typeof v.name!=='string'||!v.equipped||typeof v.equipped!=='object')return null;
 const equipped:InventoryState['equipped']={};
 for(const slot of slots){const id=(v.equipped as Record<string,unknown>)[slot];if(typeof id==='string')equipped[slot]=id;}
 return {name:v.name.slice(0,40),equipped};
}
export function applyPreset(state:InventoryState,preset:EquipmentPreset,catalog:readonly LootItem[]):InventoryState{
 const equipped:InventoryState['equipped']={};for(const slot of slots){const id=preset.equipped[slot];if(!id)continue;if(!catalog.some(i=>i.id===id&&i.slot===slot)||(state.items[id]??0)<1)return state;equipped[slot]=id;}
 return {...state,equipped};
}
