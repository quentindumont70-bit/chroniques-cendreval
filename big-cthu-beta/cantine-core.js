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
function analyse(menu){
 const text=[menu.entree,menu.plat,menu.side,menu.dairy,menu.dessert].filter(Boolean).join(' ').normalize('NFC');
 return Object.fromEntries(Object.entries(groups).map(([name,pattern])=>[name,pattern.test(text)]));
}
function ideas(menu){
 const seen=analyse(menu);
 const scored=recipes.map(r=>{
  let score=r.tags.reduce((n,g)=>n+(seen[g]?-2:2),0);
  if(r.tags.includes('vegetables')&&!seen.vegetables)score+=3;
  if(r.tags.includes('fruit')&&!seen.fruit)score+=2;
  if(seen.meat&&r.tags.includes('meat'))score-=3;
  return {...r,score};
 }).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'fr'));
 return scored.slice(0,3).map(({score,...rest})=>rest);
}
const api={analyse,ideas};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.BigCthuCantine=api;
})(typeof window!=='undefined'?window:{});
