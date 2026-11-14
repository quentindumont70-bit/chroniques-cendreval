/* La Binch DA pilot — isolated theme registry, no game data access or networking. */
(function(root){
'use strict';
const concepts={
 'tauren-druid':{culture:'Cuir rituel · Racines ancestrales',headline:"L’appel des anciens",summary:'Sous les plaines, les racines murmurent. Ton grimoire épouse le bois sculpté, les griffes et les rites de métamorphose.',signature:'Cœur du Vivant',material:'Bois · cuir · jade',role:'Gardien des métamorphoses',goal:'Objectif épinglé : prochain talent de Farouche.',ornament:'✧',crest:'M32 54C8 40 10 18 32 9c22 9 24 31 0 45Zm0 0V17M20 34l12 8 12-8'},
 'troll-shaman':{culture:'Totems gravés · Éclairs turquoise',headline:'Le pacte des tempêtes',summary:'Les cordes des totems vibrent au rythme du ciel. Une géométrie rituelle et des éclairs contenus sculptent le grimoire.',signature:'Totem des Trois Orages',material:'Fibre · pierre · azur',role:'Médiateur des éléments',goal:'Objectif épinglé : rassembler les composants du prochain totem.',ornament:'⌁',crest:'M28 5 12 34h14l-4 25 31-36H36l7-18-15 0Z'},
 'orc-warrior':{culture:'Fer noir · Rivets · Braises',headline:'Le serment du fer',summary:'Une armurerie de campagne gravée dans l’acier. Ici, les lignes de force et les entailles racontent la discipline du guerrier.',signature:'Marque du Siège',material:'Fer forgé · cuir · braises',role:'Sentinelle du front',goal:'Objectif épinglé : préparer l’équipement avant la prochaine expédition.',ornament:'✕',crest:'M10 12l44 40M54 12L10 52M16 13l-5 4 4 5M48 13l5 4-4 5M21 55l-6-6M43 55l6-6'},
 'elf-druid':{culture:'Clair de lune · Verrières de feuilles',headline:'Les veilleurs du croissant',summary:'Un manuscrit de nuit bleutée. Les filigranes et les cercles lunaires dessinent une lecture plus silencieuse que les racines des plaines.',signature:'Croissant des Sentinelles',material:'Argent · verre · feuilles',role:'Veilleur des clairières',goal:'Objectif épinglé : méditer avant la prochaine métamorphose.',ornament:'☾',crest:'M43 9C20 15 20 49 43 55C16 57 6 33 18 17c7-9 16-11 25-8Z'},
 'undead-warlock':{culture:'Reliquaire · Encre obscure · Sceaux',headline:'Le livre des serments',summary:'Les reliquaires de cuivre terni veillent sur des pactes inscrits à l’encre. Une géométrie carrée et des fissures rituelles remplacent les ornements naturels.',signature:'Sceau du Pacte Voilé',material:'Encre · cuivre · violet',role:'Archiviste des pactes',goal:'Objectif épinglé : étudier le prochain rituel.',ornament:'♜',crest:'M16 16l16-9 16 9v31L32 56 16 47V16Zm16-9v49M16 16l16 11 16-11'},
 'gnome-mage':{culture:'Arcanotech · Cuivre poli · Cristal',headline:'L’atelier des étoiles',summary:'Des cadrans de précision, du verre gravé et un cristal azur : l’art de mesurer les sortilèges transforme le grimoire en console d’expérimentation.',signature:'Compas du Nexus',material:'Cuivre · cristal · verre',role:'Ingénieur des arcanes',goal:'Objectif épinglé : calibrer le prochain sort.',ornament:'◇',crest:'M32 7 57 32 32 57 7 32 32 7Zm0 11v28M18 32h28M24 24l16 16'}
};;
const pairs=Object.freeze(Object.keys(concepts));
const aliases=Object.freeze({
  race:{tauren:'tauren',troll:'troll',orc:'orc',elf:'elf',elfe:'elf',nightelf:'elf',mortvivant:'undead',undead:'undead',gnome:'gnome'},
  class:{druide:'druid',druid:'druid',chaman:'shaman',shaman:'shaman',guerrier:'warrior',warrior:'warrior',demoniste:'warlock',warlock:'warlock',mage:'mage'}
});
function normalize(value){return String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');}
function findPair(race,cls){
  const r=aliases.race[normalize(race)],c=aliases.class[normalize(cls)];
  const id=r&&c?r+'-'+c:'';
  return Object.hasOwn(concepts,id)?id:null;
}
function resolve(id){return typeof id==='string'&&Object.hasOwn(concepts,id)?concepts[id]:null;}
const api=Object.freeze({version:'0.3.0',pairs,resolve,findPair,compatibility:'unverified'});
if(typeof module==='object'&&module.exports)module.exports=api;
else root.BinchDaThemes=api;
})(typeof window==='object'?window:{});
