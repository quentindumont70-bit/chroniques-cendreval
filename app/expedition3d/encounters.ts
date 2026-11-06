import type {Progress} from './progress.ts';
import type {Zone,EnemyKind} from './world.ts';
export const TRIALS={
 orchard:{name:'Les Veilleurs du verger',zone:'valley' as Zone,x:-25,z:-32,reward:45,ore:4,waves:[['hound','hound'],['sentinel','archer']] as EnemyKind[][]},
 drowned:{name:'Le cercle des noyés',zone:'cistern' as Zone,x:-10,z:-34,reward:60,ore:5,waves:[['archer','hound'],['sentinel','sentinel']] as EnemyKind[][]},
 vigil:{name:'La dernière veillée',zone:'crypt' as Zone,x:0,z:-20,reward:75,ore:6,waves:[['sentinel','hound'],['archer','sentinel','hound']] as EnemyKind[][]},
} as const;
export type TrialId=keyof typeof TRIALS;
export type EncounterState={trials:Partial<Record<TrialId,number>>;seenFoes:EnemyKind[]};
export const BESTIARY:Record<EnemyKind,{name:string;behavior:string;counter:string;loot:string}>={
 hound:{name:'Traqueur creux',behavior:'Rapide, contourne sa cible et bondit après une préparation courte.',counter:'Conservez assez d’endurance pour esquiver, puis frappez pendant sa récupération.',loot:'Achillée, minerai, or. Le premier traqueur de la vallée porte le Croc de la meute.'},
 sentinel:{name:'Veilleur déchu',behavior:'Protège les alliés proches. Sa préparation est plus longue, mais sa frappe lourde.',counter:'Éloignez-le des archers, brisez sa posture avec une charge ou parez au dernier moment.',loot:'Deux minerais, morille et or.'},
 archer:{name:'Arbalétrier des brumes',behavior:'Tire à distance et recule quand vous approchez. Celui de la citerne lance des projectiles magiques.',counter:'Utilisez les murs comme couvert. Une attaque à distance ou un contournement interrompt sa tranquillité.',loot:'Résine, minerai et or. Certains portent des reliques de parade ou de magie.'},
 boss:{name:'Gardien du serment',behavior:'Marteau et onde au sol, puis deux lames et impacts de foudre annoncés.',counter:'Sautez l’onde, contournez les attaques frontales et quittez les cercles bleus. Sa préparation fixe son orientation.',loot:'Anneau du dernier serment, minerai, or et cœur donnant Sulfuras.'}
};
export function startTrial(p:Progress,id:TrialId){if(!Object.hasOwn(TRIALS,id)||p.trials[id])return false;if(Object.values(p.trials).some(v=>v===1||v===2))return false;p.trials[id]=1;return true}
export function trialSpawns(p:Progress,id:TrialId){const t=TRIALS[id],wave=p.trials[id]||0;if(wave<1||wave>2)return[];return t.waves[wave-1].map((kind,i)=>({id:`trial-${id}-${wave}-${i}`,kind,x:t.x+Math.cos(i*2.4)*2,z:t.z+Math.sin(i*2.4)*2})).filter(e=>!p.dead.includes(e.id))}
export function advanceTrial(p:Progress,id:TrialId){const wave=p.trials[id]||0;if(wave<1||wave>2||trialSpawns(p,id).length)return false;p.trials[id]=wave+1;if(wave===2){p.gold+=TRIALS[id].reward;p.ore=Math.min(999,p.ore+TRIALS[id].ore);p.talent++;}return true}
export function trialForEnemy(id:string):TrialId|null{for(const key of Object.keys(TRIALS) as TrialId[])if(id.startsWith('trial-'+key+'-'))return key;return null}
