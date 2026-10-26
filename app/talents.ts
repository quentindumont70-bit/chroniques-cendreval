export const TALENT_BRANCHES=[{key:'talentMight',name:'Fer du serment',icon:'⚔',steps:['Force : +3 puissance','Précision : +3 % critique','Brèche : +8 pénétration physique']},{key:'talentWard',name:'Racines anciennes',icon:'◇',steps:['Rempart : +6 armure','Résilience : +6 résistance magique','Bastion : +8 armure et résistance']},{key:'talentSpirit',name:'Étoiles de cendre',icon:'✦',steps:['Source : +1 mana/s','Percée : +8 pénétration magique','Confluence : +4 puissance, +1 mana/s']}] as const;
export type TalentKey=typeof TALENT_BRANCHES[number]['key'];
export type TalentRanks=Partial<Record<TalentKey,number>>;
export function talentRank(n:unknown){return typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(3,Math.floor(n))):0}
export function canLearnTalent(ranks:TalentRanks,key:TalentKey,points:number,level:number){const rank=talentRank(ranks[key]);return rank<3&&points>=1&&level>=rank+2}
export function talentRefund(ranks:TalentRanks){return TALENT_BRANCHES.reduce((n,b)=>n+talentRank(ranks[b.key]),0)}
