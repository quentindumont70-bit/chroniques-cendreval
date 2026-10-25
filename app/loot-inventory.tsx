"use client";
import {useMemo,useState} from "react";
import {ITEMS,rarityLabel,type LootItem} from "./loot";
import {equipItem,unequipItem,equipmentPower,type InventoryState,type EquipmentSlot} from "./inventory";
import {equipmentAttackBonus,equipmentDamageReduction} from "./equipment-effects";
const catalog:LootItem[]=Object.values(ITEMS);
const colors:Record<string,string>={common:"#b7b5af",uncommon:"#77d6a1",rare:"#72b7ff",epic:"#c798ff",legendary:"#ffca65"};
const slotName:Record<EquipmentSlot,string>={weapon:"Arme",armor:"Armure",trinket:"Bijou"};
export default function LootInventory({value,onChange}:{value:InventoryState;onChange:(next:InventoryState)=>void}){
 const [filter,setFilter]=useState("all");
 const [selected,setSelected]=useState<string|null>(null);
 const [sort,setSort]=useState<"rarity"|"name"|"power">("rarity");
 const [compare,setCompare]=useState(true);
 const entries=useMemo(()=>catalog.filter(item=>(value.items[item.id]??0)>0&&(filter==="all"||item.slot===filter)).sort((a,b)=>sort==="name"?a.name.localeCompare(b.name,"fr"):sort==="power"?b.power-a.power:({common:0,uncommon:1,rare:2,epic:3,legendary:4}[b.rarity]-{common:0,uncommon:1,rare:2,epic:3,legendary:4}[a.rarity])),[value,filter,sort]);
 const active=catalog.find(item=>item.id===selected);
 const power=equipmentPower(value,catalog);
 return <section aria-label="Butin et équipement" style={{marginTop:18,borderTop:"1px solid #8d7755",paddingTop:14}}>
 <span className="eyebrow">BUTIN · ÉQUIPEMENT</span><h3>Trésors de Cendreval</h3>
 <p style={{fontSize:13}}>Puissance équipée : <strong>+{power}</strong> · {entries.length} type(s) d’objet dans ce filtre</p>
 <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{[["all","Tout"],["weapon","Armes"],["armor","Armures"],["trinket","Bijoux"],["material","Matériaux"]].map(([id,label])=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)} style={{padding:"6px 9px",border:"1px solid #8d7755",borderRadius:5,background:filter===id?"#55442c":"#201c1b",color:"#f2e4c7"}}>{label}</button>)}</div>
 <label style={{display:"block",marginBottom:10,fontSize:13}}>Trier par <select aria-label="Trier les objets" value={sort} onChange={event=>setSort(event.target.value as typeof sort)} style={{background:"#201c1b",color:"#f2e4c7",padding:6,border:"1px solid #8d7755",borderRadius:5}}><option value="rarity">Rareté</option><option value="power">Puissance</option><option value="name">Nom</option></select></label>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(125px,1fr))",gap:8}}>
 {entries.map(item=><button key={item.id} type="button" onClick={()=>setSelected(item.id)} aria-label={item.name} style={{textAlign:"left",padding:10,border:selected===item.id?"2px solid #f5cf85":"1px solid #665b50",background:"#1c2029",borderRadius:7,color:colors[item.rarity]}}><strong>{item.name}</strong><small style={{display:"block",color:"#e4d7c4"}}>{rarityLabel(item.rarity)} · ×{value.items[item.id]}</small></button>)}
 </div>
 {entries.length===0&&<p style={{opacity:.8}}>Aucun objet trouvé. Terrassez des ennemis pour remplir le sac.</p>}
 {active&&(value.items[active.id]??0)>0&&<div style={{padding:12,marginTop:12,border:"1px solid #8d7755",borderRadius:7}}>
 <strong style={{color:colors[active.rarity]}}>{active.name}</strong><p>{active.description}</p><small>{rarityLabel(active.rarity)} · {active.slot==="material"?"Matériau":slotName[active.slot]} · Puissance +{active.power}</small>
 {active.slot!=="material"&&<div style={{marginTop:8}}><button type="button" onClick={()=>onChange(equipItem(value,active))} disabled={value.equipped[active.slot]===active.id}>{value.equipped[active.slot]===active.id?"Équipé":"Équiper"}</button></div>}
 </div>}
 <label style={{display:"flex",alignItems:"center",gap:8,marginTop:12,fontSize:13}}><input type="checkbox" checked={compare} onChange={event=>setCompare(event.target.checked)}/>Comparer avec mon équipement</label>
 {compare&&active&&active.slot!=="material"&&(value.items[active.id]??0)>0&&<div role="status" style={{fontSize:13,padding:"8px 10px",marginTop:8,border:"1px solid #71614b",borderRadius:6,background:"#201d20"}}>{(()=>{const equipped=catalog.find(item=>item.id===value.equipped[active.slot as EquipmentSlot]);const difference=active.power-(equipped?.power??0);return <><strong>{difference>0?`▲ +${difference}`:difference<0?`▼ ${difference}`:"= 0"} puissance</strong> par rapport à {equipped?.name??"un emplacement vide"}{value.equipped[active.slot]===active.id?" · Déjà équipé":""}</>})()}</div>}
 <h4>Statistiques de l’équipement</h4><p style={{fontSize:13}}>Lame : +{equipmentAttackBonus(value,"melee")} · Arc : +{equipmentAttackBonus(value,"bow")} · Magie : +{equipmentAttackBonus(value,"magic")} · Protection : {equipmentDamageReduction(value)}</p>
 <h4>Emplacements</h4><div style={{display:"grid",gap:6}}>{(["weapon","armor","trinket"] as EquipmentSlot[]).map(slot=><div key={slot} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><span>{slotName[slot]} : {catalog.find(item=>item.id===value.equipped[slot])?.name??"Vide"}</span>{value.equipped[slot]&&<button type="button" onClick={()=>onChange(unequipItem(value,slot))}>Retirer</button>}</div>)}</div>
 </section>;
}
