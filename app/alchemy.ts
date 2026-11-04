export type Preparation='tonic'|'oil'|'ward';
export type AlchemyState={gold:number;herb:number;mushroom:number;resin:number;tonic:number;oil:number;ward:number;harvestMask:number;gathered:number;prepared:string;oilTime:number;wardTime:number;alchemyCooldown:number;hp:number;mana:number;stamina:number};
export const HERBS=[
 {x:4.4,y:14.1,kind:'herb',name:'Achillée carmin'}, {x:6.4,y:16.8,kind:'resin',name:'Résine dorée'},
 {x:9.5,y:14.5,kind:'mushroom',name:'Morille lunaire'}, {x:15.6,y:12.1,kind:'herb',name:'Achillée carmin'},
 {x:4.5,y:7.5,kind:'resin',name:'Résine dorée'}, {x:15.5,y:7.1,kind:'mushroom',name:'Morille lunaire'},
 {x:7.1,y:3.5,kind:'herb',name:'Achillée carmin'}, {x:17.3,y:9.5,kind:'mushroom',name:'Morille lunaire'},
 {x:8.4,y:11.4,kind:'resin',name:'Résine dorée'}, {x:2.6,y:6.6,kind:'herb',name:'Achillée carmin'},
 {x:17.3,y:16.5,kind:'resin',name:'Résine dorée'}, {x:12.6,y:3.8,kind:'mushroom',name:'Morille lunaire'}
] as const;
export const RECIPES=[
 {id:'tonic',name:'Tonique lunaire',icon:'◕',description:'Rend 35 mana et 25 endurance. Ne consomme rien si les deux jauges sont pleines.',cost:{herb:1,mushroom:1,resin:0}},
 {id:'oil',name:'Huile de braise',icon:'♨',description:'Vos attaques infligent +5 dégâts de base pendant 45 secondes de jeu. Ne se cumule pas.',cost:{herb:0,mushroom:1,resin:1}},
 {id:'ward',name:'Baume du veilleur',icon:'⬡',description:'Réduit de 3 les dégâts des coups directs pendant 45 secondes de jeu. Ne protège pas des coups traversant la garde.',cost:{herb:1,mushroom:0,resin:1}}
] as const;
export function harvest<T extends AlchemyState>(p:T,index:number):T{const node=HERBS[index];if(!node||p.harvestMask&(1<<index))return p;return {...p,[node.kind]:Math.min(99,p[node.kind]+2),harvestMask:p.harvestMask|(1<<index),gathered:p.gathered+1}}
export function canBrew(p:AlchemyState,id:Preparation){const r=RECIPES.find(r=>r.id===id);return Boolean(r&&p[id]<9&&Object.entries(r.cost).every(([k,v])=>p[k as 'herb'|'mushroom'|'resin']>=v))}
export function brew<T extends AlchemyState>(p:T,id:Preparation):T{const r=RECIPES.find(r=>r.id===id);if(!r||!canBrew(p,id))return p;return {...p,herb:p.herb-r.cost.herb,mushroom:p.mushroom-r.cost.mushroom,resin:p.resin-r.cost.resin,[id]:p[id]+1}}
export function usePreparation<T extends AlchemyState>(p:T):T{const id=p.prepared;if(!['tonic','oil','ward'].includes(id)||p.alchemyCooldown>0||p.hp<=0||p[id as Preparation]<=0)return p;if(id==='tonic'&&p.mana>=100&&p.stamina>=100||id==='oil'&&p.oilTime>0||id==='ward'&&p.wardTime>0)return p;return {...p,[id]:p[id as Preparation]-1,mana:id==='tonic'?Math.min(100,p.mana+35):p.mana,stamina:id==='tonic'?Math.min(100,p.stamina+25):p.stamina,oilTime:id==='oil'?45:p.oilTime,wardTime:id==='ward'?45:p.wardTime,alchemyCooldown:8}}
export function tickAlchemy(p:AlchemyState,dt:number){p.oilTime=Math.max(0,p.oilTime-dt);p.wardTime=Math.max(0,p.wardTime-dt);p.alchemyCooldown=Math.max(0,p.alchemyCooldown-dt)}

export type Ingredient='herb'|'mushroom'|'resin';
export function buyIngredient<T extends AlchemyState>(p:T,key:Ingredient):T{if(!['herb','mushroom','resin'].includes(key)||p.gold<6||p[key]>97)return p;return {...p,gold:p.gold-6,[key]:p[key]+2}}
