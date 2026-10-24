export type CombatDirection={forward:number;strafe:number};
/** Capture the complete intended direction before a queued defense consumes it. */
export function combatDirection(keys:Record<string,boolean>,bindings:{forward:string;back:string;left:string;right:string},analog:CombatDirection):CombatDirection{
 let forward=(keys[bindings.forward]?1:0)-(keys[bindings.back]?1:0)+analog.forward;
 let strafe=(keys[bindings.right]?1:0)-(keys[bindings.left]?1:0)+analog.strafe;
 const length=Math.hypot(forward,strafe);if(length>1){forward/=length;strafe/=length}
 return {forward,strafe};
}
/** One finishing blow per three connected strikes; changing targets starts a new chain. */
export function nextComboStep(previous:number,remaining:number,sameTarget:boolean){return remaining>0&&sameTarget?previous%3+1:1}
export function canBufferAttack(recovery:number){return recovery>0&&recovery<=.18}
