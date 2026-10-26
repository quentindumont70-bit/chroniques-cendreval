import type {DropEntry,EnemyLootKind} from './loot';
export const SOURCE_NAMES:Record<EnemyLootKind,string>={ordinary:'Ennemis ordinaires',elite:'Élites',guardian:'Gardien des ruines',ashKing:'Roi de cendre',echo:'Échos de cendre'};
export function sourcesFor(itemId:string,tables:Record<EnemyLootKind,readonly DropEntry[]>){return (Object.keys(tables) as EnemyLootKind[]).flatMap(kind=>tables[kind].filter(e=>e.item.id===itemId).map(e=>({kind,chance:e.chance}))).sort((a,b)=>b.chance-a.chance)}
/** Independent trials, not a promise or a pity threshold. */
export function dropProbability(chance:number,attempts:number){if(!Number.isFinite(chance)||!Number.isFinite(attempts))return 0;const p=Math.max(0,Math.min(1,chance)),n=Math.max(0,Math.floor(attempts));return n===0?0:p===1?1:-Math.expm1(n*Math.log1p(-p))}
export function percent(value:number){return (100*value).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %'}
