import {ITEMS,type LootItem} from './loot';
import {type InventoryState,type EquipmentSlot} from './inventory';
const catalog:Record<string,LootItem>=Object.fromEntries(Object.values(ITEMS).map(item=>[item.id,item]));
export function equippedItem(state:InventoryState,slot:EquipmentSlot):LootItem|undefined{
 const id=state.equipped[slot];const item=id?catalog[id]:undefined;
 return item&&item.slot===slot&&(state.items[item.id]??0)>0?item:undefined;
}
/** Item power is converted into a modest additive attack bonus; no multiplicative runaway. */
export function equipmentAttackBonus(state:InventoryState,attack:'melee'|'bow'|'magic'):number{
 const weapon=equippedItem(state,'weapon');
 const trinket=equippedItem(state,'trinket');
 const weaponBonus=weapon?(attack==='magic'?Math.floor(weapon.power*.35):attack==='bow'?Math.floor(weapon.power*.65):weapon.power):0;
 return weaponBonus+(trinket?Math.floor(trinket.power*.35):0);
}
export function equipmentDamageReduction(state:InventoryState):number{
 return Math.min(15,Math.floor((equippedItem(state,'armor')?.power??0)*.5));
}
export function itemRarityColor(item:LootItem):string{
 return ({common:'#b7b5af',uncommon:'#77d6a1',rare:'#72b7ff',epic:'#c798ff',legendary:'#ffca65'} as const)[item.rarity];
}
