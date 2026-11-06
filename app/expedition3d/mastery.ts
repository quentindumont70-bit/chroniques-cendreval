import type {ClassId,Stats} from '../rpg.ts';
import type {Progress} from './progress.ts';
export const MASTERIES:Record<ClassId,readonly {id:string;name:string;description:string}[]>={
 blade:[{id:'tempo',name:'Tempo du duelliste',description:'Attaques non chargées : récupération réduite de 20 %.'},{id:'bulwark',name:'Mur vivant',description:'Garde : coût réduit à 6 endurance ; +8 armure.'}],
 bow:[{id:'patient',name:'Tir patient',description:'Charge complète : +25 % dégâts ; récupération augmentée de 20 %.'},{id:'feather',name:'Pas de plume',description:'Esquive : coût réduit de 8 endurance ; +5 % critique.'}],
 arcane:[{id:'glass',name:'Verre astral',description:'+18 puissance, mais −15 armure.'},{id:'well',name:'Puits de lumière',description:'+3 mana/s ; −10 % coût en mana des compétences.'}],
 hex:[{id:'hunger',name:'Faim profonde',description:'+10 % vol de vie, mais −10 résistance magique.'},{id:'echo',name:'Écho de dette',description:'Consommer une marque prolonge la fenêtre de riposte à 2 secondes.'}],
 cantor:[{id:'mercy',name:'Grâce persistante',description:'Une compétence de soin rend aussi 15 mana.'},{id:'resonance',name:'Résonance',description:'Une compétence offensive inflige +20 dégâts de posture.'}],
 reaver:[{id:'risk',name:'Dernier souffle',description:'Sous 40 vie : attaques +35 % dégâts.'},{id:'harvest',name:'Moisson',description:'Ennemi vaincu : +20 endurance et +5 vie.'}]
};
export function canMaster(p:Progress,id:string){return !p.mastery&&p.level>=5&&p.disciplineRank===3&&p.talent>=2&&MASTERIES[p.classId].some(m=>m.id===id)}
export function learnMastery(p:Progress,id:string){if(!canMaster(p,id))return false;p.mastery=id;p.talent-=2;return true}
export function masteryStats(p:Progress,s:Stats){const n={...s};if(p.mastery==='bulwark')n.armor+=8;if(p.mastery==='feather')n.critChance+=.05;if(p.mastery==='glass'){n.power+=18;n.armor=Math.max(0,n.armor-15)}if(p.mastery==='well')n.manaRegen+=3;if(p.mastery==='hunger'){n.lifeSteal+=.1;n.magicResist=Math.max(0,n.magicResist-10)}return n}
