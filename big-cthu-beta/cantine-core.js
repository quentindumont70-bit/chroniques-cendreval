/* Suggestions alimentaires qualitatives : idées de variété, pas évaluation nutritionnelle. */
(function(root){
'use strict';
const groups={
 vegetables:/\b(?:salade|carott\w*|courgett\w*|tomat\w*|brocol\w*|haricot[s]? vert[s]?|epinard\w*|épinard\w*|poireau\w*|chou\w*|ratatouille|aubergine\w*|crudité\w*|legume\w*|légume\w*)\b/i,
 fruit:/\b(?:pomme|banane|poire|orange|kiwi|fraises?|clémentine\w*|mandarine\w*|compote|abricot\w*|fruit\w*)\b/i,
 dairy:/\b(?:yaourt|fromage|lait|faisselle|petit.suisse|dessert lacté)\b/i,
 legumes:/\b(?:lentille\w*|pois chiche\w*|haricot[s]? rouge[s]?|flageolet\w*|fève\w*|legumineuse\w*|légumineuse\w*)\b/i,
 meat:/\b(?:boeuf|bœuf|poulet|dinde|jambon|steak|veau|porc|viande|saucisse)\b/i,
 fish:/\b(?:poisson|saumon|thon|cabillaud|colin|sardine|merlu|merlan)\b/i,
 egg:/\b(?:oeuf|œuf|omelette)\b/i,
 starch:/\b(?:pâtes?|riz|pomme de terre|purée|semoule|pain|quinoa|boulgour|céréale\w*)\b/i
};
const recipes=[
 {title:'Poêlée de légumes, pois chiches et riz',ingredients:'légumes de saison\npois chiches\nriz',tags:['vegetables','legumes','starch'],why:'Varie les légumes et les légumineuses.'},
 {title:'Omelette aux épinards, pain et fruit',ingredients:'œufs\népinards\npain\nfruit de saison',tags:['vegetables','egg','starch','fruit'],why:'Une autre façon de proposer légumes et fruits.'},
 {title:'Poisson au four, légumes et semoule',ingredients:'poisson\nlégumes de saison\nsemoule',tags:['fish','vegetables','starch'],why:'Varie les sources d’aliments au fil de la semaine.'},
 {title:'Salade de lentilles, crudités et pain',ingredients:'lentilles\ncrudités variées\npain',tags:['legumes','vegetables','starch'],why:'Un dîner simple avec des légumes et des légumineuses.'},
 {title:'Légumes rôtis, quinoa et fromage frais',ingredients:'légumes de saison\nquinoa\nfromage frais',tags:['vegetables','starch','dairy'],why:'Diversifie les textures et les ingrédients.'},
 {title:'Poulet, carottes et pommes de terre',ingredients:'poulet\ncarottes\npommes de terre',tags:['meat','vegetables','starch'],why:'Une option familiale classique et modulable.'}
];
function parseMenuLines(text){
 const lines=String(text).replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(!lines.length||lines.length>30||String(text).length>6500)throw Error('Saisis entre 1 et 30 jours, 6 500 caractères maximum');
 const seen=new Set(),output=[];
 for(let i=0;i<lines.length;i++){
  const parts=lines[i].split(lines[i].includes('\t')?'\t':lines[i].includes(';')?';':'|').map(v=>v.trim());
  if(i===0&&/^date$/i.test(parts[0]))continue;
  const date=parts[0];
  if(parts.length<3||parts.length>6||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Ligne '+(i+1)+' : indique une date AAAA-MM-JJ suivie des colonnes séparées par ; ou tabulation');
  if(seen.has(date))throw Error('Date en double dans le texte : '+date);
  seen.add(date);
  const [entree='',plat='',side='',dairy='',dessert='']=parts.slice(1);
  if(![entree,plat,side,dairy,dessert].some(Boolean)||[entree,plat,side,dairy,dessert].some(v=>v.length>130))throw Error('Ligne '+(i+1)+' : contenu vide ou trop long');
  output.push({date,entree,plat,side,dairy,dessert,consumed:'inconnu'});
 }
 if(!output.length)throw Error('Aucun jour de cantine reconnu');
 return output;
}
function analyse(menu){
 const text=[menu.entree,menu.plat,menu.side,menu.dairy,menu.dessert].filter(Boolean).join(' ').normalize('NFC');
 return Object.fromEntries(Object.entries(groups).map(([name,pattern])=>[name,pattern.test(text)]));
}
function ideas(menu,preferences={}){
 const seen=analyse(menu);
 const filtered=recipes.filter(r=>(!preferences.vegetarian||!r.tags.includes('meat')&&!r.tags.includes('fish'))&&(!preferences.noFish||!r.tags.includes('fish')));
 const scored=filtered.map(r=>{
  let score=r.tags.reduce((n,g)=>n+(seen[g]?-2:2),0);
  if(r.tags.includes('vegetables')&&!seen.vegetables)score+=3;
  if(r.tags.includes('fruit')&&!seen.fruit)score+=2;
  if(seen.meat&&r.tags.includes('meat'))score-=3;
  return {...r,score};
 }).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'fr'));
 return scored.slice(0,3).map(({score,...rest})=>rest);
}
const api={analyse,ideas,parseMenuLines};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.BigCthuCantine=api;
})(typeof window!=='undefined'?window:{});
