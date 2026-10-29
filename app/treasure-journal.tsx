"use client";
import {itemEffects} from './equipment-effects';
import {useEffect,useState} from 'react';
import {ITEMS,LOOT_TABLES,rarityLabel,type EnemyLootKind} from './loot';
import type {InventoryState} from './inventory';
import {SOURCE_NAMES,sourcesFor,dropProbability,percent} from './loot-journal';
import ItemIcon from './item-icon';
import {storage} from './progress';
const items=Object.values(ITEMS);
export default function LootJournal({inventory}:{inventory:InventoryState}){
 const [selected,setSelected]=useState<string>('oath'),[missing,setMissing]=useState(false),[source,setSource]=useState<EnemyLootKind|'all'>('all'),[attempts,setAttempts]=useState(100),[target,setTarget]=useState('');
 useEffect(()=>{const saved=storage.getItem('cendreval-treasure-target');if(items.some(i=>i.id===saved))setTarget(saved!)},[]);
 const chooseTarget=(id:string)=>{setTarget(id);storage.setItem('cendreval-treasure-target',id)};
 const active=items.find(i=>i.id===selected)??ITEMS.oath,sources=sourcesFor(active.id,LOOT_TABLES),owned=items.filter(i=>(inventory.items[i.id]??0)>0).length,tracked=items.find(i=>i.id===target);
 const visible=items.filter(i=>(!missing||!(inventory.items[i.id]>0))&&(source==='all'||sourcesFor(i.id,LOOT_TABLES).some(s=>s.kind===source)));
 return <section className="treasure-journal" aria-label="Codex des trésors"><div className="treasure-intro"><span className="eyebrow">ATLAS DES TRÉSORS</span><h3>Une légende à retrouver.</h3><p>{owned}/{items.length} trésors possédés · collection du sac actuel</p><progress aria-label="Collection de trésors" max={items.length} value={owned}/></div>
 {tracked&&<aside className="treasure-target"><b>◇ Objectif : {tracked.name}</b><span>{inventory.items[tracked.id]>0?'✓ Dans votre sac':`Meilleure chance par victoire : ${SOURCE_NAMES[sourcesFor(tracked.id,LOOT_TABLES)[0].kind]}`}</span><button onClick={()=>{setSelected(tracked.id);setMissing(false);setSource('all')}}>Voir la fiche</button><button onClick={()=>chooseTarget('')}>Ne plus suivre</button></aside>}
 <div className="treasure-filters"><label>Source<select aria-label="Source de butin" value={source} onChange={e=>setSource(e.target.value as typeof source)}><option value="all">Toutes les sources</option>{Object.entries(SOURCE_NAMES).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label><label><input type="checkbox" checked={missing} onChange={e=>setMissing(e.target.checked)}/>Afficher seulement les objets manquants</label></div>
 <div className="treasure-grid">{visible.map(item=><button key={item.id} aria-pressed={active.id===item.id} onClick={()=>setSelected(item.id)}><ItemIcon item={item}/><b>{item.name}</b><small>{rarityLabel(item.rarity)} · {inventory.items[item.id]>0?'✓ Possédé':'À découvrir'}</small></button>)}</div>{!visible.length&&<p role="status">Aucun objet ne correspond à ces filtres.</p>}
 <article className="treasure-detail"><ItemIcon item={active}/><h4>{active.name}</h4><p>{active.description}</p><p>{itemEffects(active)}</p><p>{rarityLabel(active.rarity)} · Puissance +{active.power} · {inventory.items[active.id]??0} dans le sac</p><button onClick={()=>chooseTarget(active.id)} disabled={target===active.id}>{target===active.id?'Objectif suivi':'Suivre ce trésor'}</button><h4>Où le trouver</h4><ul>{sources.map(s=><li key={s.kind}><span>{SOURCE_NAMES[s.kind]}</span><b>{percent(s.chance)} par victoire</b></li>)}</ul><p>Chaque objet a son propre tirage. Plusieurs objets peuvent tomber ensemble ; une victoire peut aussi ne rien donner.</p>
 <details><summary>Comprendre mes chances</summary><label>Nombre de victoires : {attempts}<input aria-label="Nombre de victoires" type="range" min="1" max="1000" step="1" value={attempts} onChange={e=>setAttempts(Number(e.target.value))}/></label><ul>{sources.map(s=><li key={s.kind}><span>{SOURCE_NAMES[s.kind]}</span><b>{percent(dropProbability(s.chance,attempts))}</b></li>)}</ul><p>Chance d’obtenir au moins un exemplaire sur {attempts} victoires indépendantes. Aucun nombre d’essais ne garantit le drop. Les échecs précédents ne changent pas la chance du prochain tirage.</p></details></article></section>
}
