import type {ClassId} from './rpg';
export type Affliction={kind:ClassId;remaining:number;tick:number};
export const AFFLICTIONS:Record<ClassId,{label:string;color:string;description:string;dps:number}>={
 blade:{label:'Fracture',color:'#ffe3a3',description:'Brise-armure fracture pendant 5 s. Le prochain coup de base consomme la fracture : +10 dégâts.',dps:0},
 bow:{label:'Traque',color:'#bce7a2',description:'Les compétences offensives ralentissent de 25 % pendant 5 s. Le prochain tir consomme la marque : +12 dégâts.',dps:0},
 arcane:{label:'Braise',color:'#ffac61',description:'Les compétences offensives brûlent : 3 dégâts/s pendant 4 s. Une attaque de base fait détoner la braise : +8 dégâts.',dps:3},
 hex:{label:'Dette',color:'#ce93ff',description:'Les compétences offensives maudissent : 2 dégâts/s pendant 5 s. Une attaque de base consomme la dette et rend jusqu’à 6 vie.',dps:2},
 cantor:{label:'Résonance',color:'#92edeb',description:'Les compétences offensives font résonner pendant 5 s. Une attaque de base consomme la note : +6 dégâts et +8 mana.',dps:0},
 reaver:{label:'Saignement',color:'#ff7185',description:'Les compétences offensives font saigner : 3 dégâts/s pendant 4 s. Une attaque de base consomme la marque : +6 dégâts et jusqu’à 5 vie.',dps:3}
};
export function applyAffliction(kind:ClassId):Affliction{return {kind,remaining:kind==='arcane'||kind==='reaver'?4:5,tick:0}}
export function parseAffliction(value:unknown):Affliction|undefined{if(!value||typeof value!=='object')return;const s=value as Affliction;if(!Object.hasOwn(AFFLICTIONS,s.kind)||!Number.isFinite(s.remaining)||!Number.isFinite(s.tick))return;return {kind:s.kind,remaining:Math.max(0,Math.min(5,s.remaining)),tick:Math.max(0,Math.min(.999,s.tick))}}
/** Accumulate elapsed game time: damage is identical at 30, 60 or 120 FPS. */
export function tickAffliction(s:Affliction|undefined,dt:number){if(!s||dt<=0||s.remaining<=0)return 0;const elapsed=Math.min(dt,s.remaining);s.remaining=Math.max(0,s.remaining-elapsed);s.tick+=elapsed;const ticks=Math.floor(s.tick+1e-8);s.tick=Math.max(0,s.tick-ticks);return ticks*AFFLICTIONS[s.kind].dps}
export function consumeAffliction(s:Affliction|undefined,kind:ClassId){if(!s||s.remaining<=0||s.kind!==kind)return {bonus:0,heal:0,mana:0,label:''};s.remaining=0;return {bonus:kind==='blade'?10:kind==='bow'?12:kind==='arcane'?8:kind==='cantor'||kind==='reaver'?6:0,heal:kind==='hex'?6:kind==='reaver'?5:0,mana:kind==='cantor'?8:0,label:AFFLICTIONS[kind].label}}
