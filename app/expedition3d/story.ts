import type {Progress} from './progress.ts';
export type NpcId='village'|'mara'|'rune'|'vey'|'tovin';
export type Story={rescue:number;smith:number;memoryQuest:number;heartChoice:'none'|'restore'|'ward';flight:boolean;shortcut:boolean;apothecary:boolean;forgeOpen:boolean;storyFlags:string[]};
export type Dialogue={name:string;title:string;text:string;choices:{id:string;label:string;disabled?:boolean}[]};
function baseDialogue(p:Progress,id:NpcId):Dialogue{
 if(id==='mara')return{name:'Mara · herboriste',title:p.rescue===3?'Une maison rallumée':'La lumière sous la pierre',text:p.rescue===0?'Tovin est descendu dans la citerne à l’est du pont. Les eaux ont emporté les passerelles. Ramenez-le, et mes remèdes seront les vôtres.':p.rescue===1?'L’entrée de la citerne est au pied du belvédère. On raconte qu’un ancien souffle y porte les voyageurs au-dessus du vide.':p.rescue===2?'Vous l’avez trouvé… Il est revenu avant vous. Je peux enfin rouvrir l’échoppe.':'Tovin dort enfin sans trembler. Prenez ce dont vous avez besoin pour le chemin.',choices:p.rescue===0?[{id:'rescue-start',label:'Je retrouverai Tovin.'}]:p.rescue===2?[{id:'rescue-finish',label:'Il est hors de danger. Recevoir les provisions.'}]:p.apothecary?[{id:'buy-potion',label:'Acheter une potion · 8 or',disabled:p.gold<8||p.potions>=99},{id:'buy-herbs',label:'Ravitaillement : 2 de chaque ingrédient · 12 or',disabled:p.gold<12}]:[]};
 if(id==='rune')return{name:'Rune · forgeron',title:p.forgeOpen?'Le marteau reprend son chant':'Rallumer la forge',text:p.forgeOpen?'Le métal retient ce que la main lui confie. Choisissez votre arme, renforcez-la, puis gravez-y votre rune.':'Il me manque trois fragments de minerai pour réparer le foyer. Les pillards en portent ; les coffres de la citerne en contiennent aussi. Rapportez-les et la forge ouvrira.',choices:p.forgeOpen?[{id:'forge',label:'Ouvrir l’atelier'}]:p.smith===0?[{id:'smith-start',label:'Je trouverai le minerai.'}]:[{id:'smith-finish',label:`Réparer le foyer · ${p.ore}/3 minerais`,disabled:p.ore<3}]};
 if(id==='vey')return{name:'Sœur Vey · gardienne des mémoires',title:p.memoryQuest===2?'Les noms ont retrouvé leur place':'Ceux que la vallée oublie',text:p.memoryQuest===2?'Le souvenir n’est pas une chaîne. Il est ce qui nous permet de revenir.':'Deux pierres de mémoire racontent les derniers jours des passeurs. Lisez-les et rapportez-moi leurs paroles. Je vous enseignerai une voie de votre serment.',choices:p.memoryQuest===0?[{id:'memory-start',label:'Je retrouverai leurs histoires.'}]:p.memoryQuest===1?[{id:'memory-finish',label:'Transmettre deux mémoires · +1 point de talent',disabled:((p.lore&1?1:0)+(p.lore&2?1:0)+(p.lore&4?1:0))<2}]:[]};
 if(id==='tovin')return{name:'Tovin · passeur égaré',title:p.rescue>=2?'Le chemin du retour':'De l’autre côté de l’eau',text:p.rescue>=2?'Mara m’attend. Je ne redescendrai plus sans une corde, cette fois.':'La passerelle s’est effondrée. J’ai trouvé le levier du vieux passage vers le château, mais je n’arrive plus à remonter. Aidez-moi à rejoindre le village.',choices:p.rescue<2?[{id:'rescue-found',label:'La route est libre. Remontons ensemble.',disabled:!p.flight}]:[]};
 return{name:'Elenn · doyenne de Valbrume',title:p.finished?'Le village se souviendra':'Le cœur du serment',text:p.finished?(p.heartChoice==='ward'?'Le cœur protège désormais nos portes. Les Veilleurs sont revenus monter la garde.':'Le cœur réchauffe le foyer. Les jardins et les voix ont retrouvé leur place.') :p.bossLoot?'Le cœur peut rendre la vie à nos jardins ou renforcer le rempart. Une fois confié au village, ce choix restera le nôtre.':'Le gardien retient nos morts au-delà du pont. Retrouvez son cœur. Mara, Rune et Vey peuvent vous aider à préparer le voyage.',choices:p.bossLoot&&!p.finished?[{id:'heart-restore',label:'Rendre sa chaleur au village · soins au retour, +1 mana/s'},{id:'heart-ward',label:'Protéger les portes · +10 armure'}]:[]};
}
export function choose(p:Progress,id:string):string|null{
 switch(id){
 case'rescue-start':if(p.rescue!==0)return null;p.rescue=1;return 'Retrouvez Tovin dans la citerne.';
 case'rescue-found':if(p.rescue>=2||!p.flight)return null;p.rescue=2;p.shortcut=true;return 'Tovin rejoint Valbrume. Le passage vers le donjon est ouvert.';
 case'rescue-finish':if(p.rescue!==2)return null;p.rescue=3;p.apothecary=true;p.gold+=35;p.potions=Math.min(99,p.potions+3);return 'Échoppe ouverte · 35 or et 3 potions.';
 case'smith-start':if(p.smith!==0)return null;p.smith=1;return 'Rapportez trois minerais à Rune.';
 case'smith-finish':if(p.smith!==1||p.ore<3)return null;p.ore-=3;p.smith=2;p.forgeOpen=true;if(!p.weapons.includes('hammer'))p.weapons.push('hammer');return 'La forge est ouverte. Rune vous offre un marteau de carrière.';
 case'memory-start':if(p.memoryQuest!==0)return null;p.memoryQuest=1;return 'Retrouvez deux pierres de mémoire.';
 case'memory-finish':if(p.memoryQuest!==1||((p.lore&1?1:0)+(p.lore&2?1:0)+(p.lore&4?1:0))<2)return null;p.memoryQuest=2;p.talent++;return 'Les noms sont rendus à la vallée · +1 point de talent.';
 case'buy-potion':if(!p.apothecary||p.gold<8||p.potions>=99)return null;p.gold-=8;p.potions++;return 'Une potion rejoint vos provisions.';
 case'buy-herbs':if(!p.apothecary||p.gold<12||p.herb>97||p.resin>97||p.mushroom>97)return null;p.gold-=12;p.herb+=2;p.resin+=2;p.mushroom+=2;return 'Deux unités de chaque ingrédient ajoutées.';
 case'heart-restore':case'heart-ward':if(!p.bossLoot||p.finished)return null;p.finished=true;p.heartChoice=id==='heart-ward'?'ward':'restore';p.gold+=100;p.talent+=2;p.hp=100;return 'Serment accompli · 100 or et 2 points de talent. Valbrume change.';
 default:return null;
 }
}
export function journal(p:Progress){return[
 {title:'Le cœur du serment',stage:p.finished?'Accompli':p.bossLoot?'Choisir le destin du cœur auprès d’Elenn':'Vaincre le gardien et recueillir son cœur'},
 {title:'La lumière sous la pierre',stage:['Parler à Mara','Trouver Tovin au-delà du gouffre de la citerne','Revenir auprès de Mara','Tovin est revenu ; l’échoppe est ouverte'][p.rescue]},
 {title:'Rallumer la forge',stage:['Parler à Rune',`Rapporter trois minerais à Rune (${p.ore}/3)`,'Forge restaurée'][p.smith]},
 {title:'Ceux que la vallée oublie',stage:['Parler à Sœur Vey','Lire deux mémoires, puis revenir','Mémoires transmises'][p.memoryQuest]}
]}

export function dialogue(p:Progress,id:NpcId):Dialogue{const d=baseDialogue(p,id),rumor=id==='mara'?'flight':id==='rune'?'thunder':id==='vey'?'tides':id==='tovin'?'bridge':null;if(rumor&&!p.rumors.includes(rumor))d.choices.push({id:'rumor-'+rumor,label:'Connaissez-vous un endroit oublié ?'});if(id==='village')d.choices.push({id:'villageworks',label:'Parlons de l’avenir de Valbrume.'});return d}
