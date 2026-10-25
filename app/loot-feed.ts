import {type LootItem,rarityLabel} from './loot';
export type LootEvent={id:string;itemId:string;name:string;rarity:LootItem['rarity'];count:number;source:string;at:number};
export type LootFeed=readonly LootEvent[];
const MAX_EVENTS=12;
export function appendLootEvents(feed:LootFeed,drops:readonly LootItem[],source:string,at=Date.now()):LootFeed{
 const counts=new Map<string,{item:LootItem;count:number}>();
 for(const item of drops){const previous=counts.get(item.id);counts.set(item.id,{item,count:(previous?.count??0)+1})}
 const next=[...feed];
 const sequence=feed.reduce((max,event)=>Math.max(max,Number(event.id.split(":").at(-1))||0),-1)+1;
 for(const {item,count} of counts.values())next.push({id:`${at}:${item.id}:${sequence+next.length-feed.length}`,itemId:item.id,name:item.name,rarity:item.rarity,count,source:source.slice(0,80),at});
 return next.slice(-MAX_EVENTS);
}
export function lootAnnouncement(event:LootEvent):string{
 return `${rarityLabel(event.rarity)} : ${event.name}${event.count>1?` ×${event.count}`:''} — ${event.source}`;
}
export function recentLoot(feed:LootFeed,now=Date.now(),maxAge=8000):LootFeed{
 return feed.filter(event=>Number.isFinite(event.at)&&event.at<=now&&now-event.at<=maxAge);
}
