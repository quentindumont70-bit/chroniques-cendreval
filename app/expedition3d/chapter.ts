import type {Progress} from './progress.ts';
import {grantRelic} from './relics.ts';
export type ChapterState={bells:number;puzzleStep:number;puzzleSolved:boolean;chapterSeen:string[]};
export const CHAPTER_STEPS=[
 {id:'village',title:'Les voix de Valbrume',text:'Parlez à Elenn. Mara cherche un passeur ; Rune attend du minerai.'},
 {id:'crossing',title:'Le pont des absents',text:'La lumière du château trace le chemin du nord. Sous le pont, une cache attend les curieux.'},
 {id:'cistern',title:'Le souffle retrouvé',text:'À l’est, la citerne conserve un art oublié : sauter une seconde fois en l’air.'},
 {id:'crypt',title:'Le poids du serment',text:'La galerie orientale monte vers le sceau. Les mémoires annoncent les armes du gardien.'},
 {id:'guardian',title:'Ce qui veille encore',text:'Le marteau frappe le sol. Les lames de foudre poursuivent les imprudents. Observez avant de riposter.'},
 {id:'home',title:'Une lumière pour les vivants',text:'Le cœur est à vous. Elenn attend votre décision à Valbrume.'}
] as const;
export function chapterIndex(p:Progress){return p.bossLoot?5:p.gate?4:p.zone==='crypt'?3:p.flight||p.zone==='cistern'?2:p.z<15||p.zone!=='valley'?1:0}
export function discoverChapter(p:Progress){const step=CHAPTER_STEPS[chapterIndex(p)];if(p.chapterSeen.includes(step.id))return null;p.chapterSeen.push(step.id);return step}
export function ringBell(p:Progress,index:number){if(index<0||index>2||!Number.isInteger(index)||p.puzzleSolved)return '';const order=[1,0,2];if(index!==order[p.puzzleStep]){p.puzzleStep=index===1?1:0;return 'Les marées retombent. La pierre dit : lune, source, soleil.'}p.puzzleStep++;p.bells|=1<<index;if(p.puzzleStep===3){p.puzzleSolved=true;p.gold+=35;grantRelic(p,'tide');return 'Les trois marées s’accordent. Perle des marées et 35 or.'}return ['','La lune écoute.','La source répond.'][p.puzzleStep]}
export function memoryReward(p:Progress){if((p.lore&7)!==7)return false;return grantRelic(p,'ember')}
