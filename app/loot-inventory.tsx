"use client";
import EquipmentPresets from "./equipment-presets";
import ForgePanel from "./forge-panel";
import {useMemo,useState} from "react";
import {ITEMS,rarityLabel,type LootItem} from "./loot";
import {equipItem,unequipItem,equipmentPower,type InventoryState,type EquipmentSlot} from "./inventory";
import {equipmentAttackBonus,equipmentDamageReduction,equipmentManaRegen,itemEffects} from "./equipment-effects";
import LootJournal from "./treasure-journal";
import ItemIcon from "./item-icon";
const catalog:LootItem[]=Object.values(ITEMS);
const colors:Record<string,string>={common:"#b7b5af",uncommon:"#77d6a1",rare:"#72b7ff",epic:"#c798ff",legendary:"#ffca65"};
const slotName:Record<EquipmentSlot,string>={weapon:"Arme",armor:"Armure",trinket:"Bijou"};
export default function LootInventory({value,onChange}:{value:InventoryState;onChange:(next:InventoryState)=>void}){
 const [tab,setTab]=useState<"bag"|"journal">("bag");
 const [filter,setFilter]=useState("all");
 const [query,setQuery]=useState("");const [rarity,setRarity]=useState("all");
 const normalized=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr");
 const [selected,setSelected]=useState<string|null>(null);
 const [sort,setSort]=useState<"rarity"|"name"|"power">("rarity");
 const [compare,setCompare]=useState(true);
 const entries=useMemo(()=>catalog.filter(item=>(value.items[item.id]??0)>0&&(filter==="all"||item.slot===filter)&&(rarity==="all"||item.rarity===rarity)&&normalized(item.name).includes(normalized(query.trim()))).sort((a,b)=>sort==="name"?a.name.localeCompare(b.name,"fr"):sort==="power"?b.power-a.power:({common:0,uncommon:1,rare:2,epic:3,legendary:4}[b.rarity]-{common:0,uncommon:1,rare:2,epic:3,legendary:4}[a.rarity])),[value,filter,sort,query,rarity]);
 const active=catalog.find(item=>item.id===selected);
 const ownedCount=catalog.reduce((sum,item)=>sum+(value.items[item.id]??0),0);
 const equippedCount=(["weapon","armor","trinket"] as EquipmentSlot[]).filter(slot=>Boolean(value.equipped[slot])).length;
 const power=equipmentPower(value,catalog);
 return <section className="loot-bag" aria-label="Butin et équipement" style={{marginTop:18,borderTop:"1px solid #8d7755",paddingTop:14}}>
 <div className="equipped-showcase" aria-label="Objets équipés">{(["weapon","armor","trinket"] as EquipmentSlot[]).map(slot=>{const item=catalog.find(i=>i.id===value.equipped[slot]);return <article key={slot}><span>{slotName[slot]}</span>{item?<><button className="equipped-inspect" onClick={()=>{setTab("bag");setSelected(item.id)}}><ItemIcon item={item}/><b style={{color:colors[item.rarity]}}>{item.name}</b></button><small>{rarityLabel(item.rarity)} · puissance +{item.power}</small><button onClick={()=>onChange(unequipItem(value,slot))} aria-label={`Retirer ${item.name}`}>Retirer</button></>:<><div className="empty-slot" aria-hidden="true">◇</div><b>Emplacement libre</b><small>{slot==="weapon"?"Votre arme de classe reste disponible.":"Équipez un trésor trouvé dans la vallée."}</small></>}</article>})}</div>
 <EquipmentPresets value={value} onChange={onChange}/><ForgePanel value={value} onChange={onChange}/><nav className="treasure-tabs"><button aria-pressed={tab==="bag"} onClick={()=>setTab("bag")}>MON SAC</button><button aria-pressed={tab==="journal"} onClick={()=>setTab("journal")}>CODEX DES TRÉSORS</button></nav>{tab==="journal"?<LootJournal inventory={value}/>:<><span className="eyebrow">BUTIN · ÉQUIPEMENT</span><h3>Trésors de Cendreval</h3>
 <p style={{fontSize:13}}>Puissance équipée : <strong>+{power}</strong> · {ownedCount} objet(s) · {equippedCount}/3 emplacements · {entries.length} type(s) dans ce filtre</p>
 <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{[["all","Tout"],["weapon","Armes"],["armor","Armures"],["trinket","Bijoux"],["material","Matériaux"]].map(([id,label])=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)} style={{padding:"6px 9px",border:"1px solid #8d7755",borderRadius:5,background:filter===id?"#55442c":"#201c1b",color:"#f2e4c7"}}>{label}</button>)}</div>
 <div className="loot-search"><label>Rechercher<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom d’un trésor…"/></label><label>Rareté<select aria-label="Rareté" value={rarity} onChange={e=>setRarity(e.target.value)}><option value="all">Toutes les raretés</option>{["common","uncommon","rare","epic","legendary"].map(r=><option key={r} value={r}>{rarityLabel(r as LootItem["rarity"])}</option>)}</select></label></div>
 <label style={{display:"block",marginBottom:10,fontSize:13}}>Trier par <select aria-label="Trier les objets" value={sort} onChange={event=>setSort(event.target.value as typeof sort)} style={{background:"#201c1b",color:"#f2e4c7",padding:6,border:"1px solid #8d7755",borderRadius:5}}><option value="rarity">Rareté</option><option value="power">Puissance</option><option value="name">Nom</option></select></label>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(125px,1fr))",gap:8}}>
 {entries.map(item=><button key={item.id} type="button" onClick={()=>setSelected(item.id)} aria-label={item.name} style={{textAlign:"left",padding:10,border:selected===item.id?"2px solid #f5cf85":Object.values(value.equipped).includes(item.id)?"1px solid #c8a764":"1px solid #665b50",background:"#1c2029",borderRadius:7,color:colors[item.rarity]}}><ItemIcon item={item}/><strong>{item.name}</strong>{Object.values(value.equipped).includes(item.id)&&<small style={{display:"block",color:"#f5cf85"}}>◆ ÉQUIPÉ</small>}<small style={{display:"block",color:"#e4d7c4"}}>{rarityLabel(item.rarity)} · ×{value.items[item.id]}</small></button>)}
 </div>
 {entries.length===0&&<p style={{opacity:.8}}>{ownedCount?"Aucun trésor ne correspond à ces filtres.":"Votre sac est vide. Terrassez des ennemis pour trouver du butin."}{ownedCount>0&&<button onClick={()=>{setFilter("all");setRarity("all");setQuery("")}}>Effacer les filtres</button>}</p>}
 {active&&(value.items[active.id]??0)>0&&<div className="loot-selected" style={{padding:12,marginTop:12,border:"1px solid #8d7755",borderRadius:7}}>
 <ItemIcon item={active}/><strong style={{color:colors[active.rarity]}}>{active.name}</strong><p>{active.description}</p><small>{rarityLabel(active.rarity)} · {active.slot==="material"?"Matériau":slotName[active.slot]} · Puissance +{active.power}</small>
 <p>{itemEffects(active)}</p>{active.slot!=="material"&&<div style={{marginTop:8}}><button type="button" onClick={()=>onChange(equipItem(value,active))} disabled={value.equipped[active.slot]===active.id}>{value.equipped[active.slot]===active.id?"Équipé":"Équiper"}</button></div>}
 </div>}
 <label style={{display:"flex",alignItems:"center",gap:8,marginTop:12,fontSize:13}}><input type="checkbox" checked={compare} onChange={event=>setCompare(event.target.checked)}/>Comparer avec mon équipement</label>
 {compare&&active&&active.slot!=="material"&&(value.items[active.id]??0)>0&&<div role="status" style={{fontSize:13,padding:"8px 10px",marginTop:8,border:"1px solid #71614b",borderRadius:6,background:"#201d20"}}>{(()=>{const equipped=catalog.find(item=>item.id===value.equipped[active.slot as EquipmentSlot]);const difference=active.power-(equipped?.power??0);const next=equipItem(value,active);const deltas=[["Lame",equipmentAttackBonus(next,"melee")-equipmentAttackBonus(value,"melee")],["Arc",equipmentAttackBonus(next,"bow")-equipmentAttackBonus(value,"bow")],["Magie",equipmentAttackBonus(next,"magic")-equipmentAttackBonus(value,"magic")],["Protection physique",equipmentDamageReduction(next)-equipmentDamageReduction(value)],["Protection magique",equipmentDamageReduction(next,true)-equipmentDamageReduction(value,true)],["Mana/s",equipmentManaRegen(next)-equipmentManaRegen(value)]] as const;return <><strong>{difference>0?`▲ +${difference}`:difference<0?`▼ ${difference}`:"= 0"} puissance</strong> par rapport à {equipped?.name??"un emplacement vide"}{value.equipped[active.slot]===active.id?" · Déjà équipé":""}<div className="loot-deltas">{deltas.map(([label,n])=><span key={label} data-gain={n>0?"up":n<0?"down":"same"}>{label} : {n>0?"+":""}{n}</span>)}</div><small>Variation réelle des bonus d’équipement, arrondis et plafond de protection inclus.</small></>})()}</div>}
 <h4>Statistiques de l’équipement</h4><p style={{fontSize:13}}>Lame : +{equipmentAttackBonus(value,"melee")} · Arc : +{equipmentAttackBonus(value,"bow")} · Magie : +{equipmentAttackBonus(value,"magic")} · Protection physique : {equipmentDamageReduction(value)} · Protection magique : {equipmentDamageReduction(value,true)} · Mana/s : +{equipmentManaRegen(value)}</p>

 </>} </section>;
}
