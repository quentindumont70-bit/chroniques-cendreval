import {lootForEnemy,rollLoot,type LootItem,type EnemyLootKind} from './loot';

export type EquipmentSlot='weapon'|'armor'|'trinket';
export type InventoryState={version:1;items:Record<string,number>;equipped:Partial<Record<EquipmentSlot,string>>};
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
 return {kind,drops,inventory:addDrops(state,drops)};
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
 return {version:1,items,equipped};
}
