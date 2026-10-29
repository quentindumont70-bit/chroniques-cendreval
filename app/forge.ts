import {ITEMS} from './loot';
import type {InventoryState} from './inventory';
export const RECIPES=[{id:'iron',cost:8},{id:'fang',cost:24},{id:'vigil',cost:36}] as const;
export function craft(state:InventoryState,id:string):InventoryState{const recipe=RECIPES.find(r=>r.id===id);if(!recipe||(state.items.ash??0)<recipe.cost)return state;return {...state,items:{...state.items,ash:(state.items.ash??0)-recipe.cost,[id]:(state.items[id]??0)+1}}}
export function salvage(state:InventoryState,id:string):InventoryState{const item=Object.values(ITEMS).find(i=>i.id===id);if(!item||item.slot==='material'||(state.items[id]??0)<2)return state;const reward={common:1,uncommon:2,rare:4,epic:8,legendary:16}[item.rarity];return {...state,items:{...state.items,[id]:state.items[id]-1,ash:(state.items.ash??0)+reward}}}

export function salvagePreview(state:InventoryState){return Object.values(ITEMS).filter(i=>i.slot!=='material'&&i.rarity!=='legendary'&&i.rarity!=='epic'&&(state.items[i.id]??0)>1).map(i=>({id:i.id,name:i.name,count:state.items[i.id]-1,ashes:(state.items[i.id]-1)*({common:1,uncommon:2,rare:4,epic:8,legendary:16}[i.rarity])}))}
export function salvageDuplicates(state:InventoryState):InventoryState{const plan=salvagePreview(state);if(!plan.length)return state;const items={...state.items};for(const line of plan){items[line.id]=1;items.ash=(items.ash??0)+line.ashes;}return {...state,items}}
