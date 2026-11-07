export type CombatEntry={id:number;text:string;kind:'hit'|'critical'|'parry'|'hurt'|'skill'|'block';remaining:number};
export function combatMessage(entries:CombatEntry[],text:string,kind:CombatEntry['kind'],id:number){return[{id,text,kind,remaining:kind==='parry'?2.2:1.6},...entries].slice(0,4)}
export function advanceMessages(entries:CombatEntry[],dt:number){return entries.map(e=>({...e,remaining:e.remaining-dt})).filter(e=>e.remaining>0)}
