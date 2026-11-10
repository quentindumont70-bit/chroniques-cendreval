/* La Binch — talent trees WoW Forever.
   Primary data: talentsforever.com CC BY 4.0, decoded from WoW Forever game client.
   No fabricated talent positions. Real icons resolve via WoW icon CDN. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src='https://talentsforever.com/export/druid.json';
const calc='https://armorywowforever.com/fr/talents/druid';
const icon=s=>/^[-a-z0-9_]+$/i.test(String(s||''))?'https://wow.zamimg.com/images/wow/icons/large/'+s+'.jpg':'';
const note='La position des talents provient des données du client Forever. Les rangs affichés sont une progression conseillée, jamais une lecture du personnage en jeu.';
const routes=[
{level:10,tree:'Feral Combat',name:'Ferocity'},{level:11,tree:'Feral Combat',name:'Ferocity'},{level:12,tree:'Feral Combat',name:'Ferocity'},{level:13,tree:'Feral Combat',name:'Ferocity'},{level:14,tree:'Feral Combat',name:'Ferocity'},
{level:15,tree:'Feral Combat',name:'Feral Instinct'},{level:16,tree:'Feral Combat',name:'Feral Instinct'},{level:17,tree:'Feral Combat',name:'Feral Instinct'},
{level:18,tree:'Feral Combat',name:'Feral Swiftness'},{level:19,tree:'Feral Combat',name:'Feral Swiftness'},
{level:20,tree:'Feral Combat',name:'Feral Charge'},
{level:21,tree:'Feral Combat',name:'Savage Fury'},{level:22,tree:'Feral Combat',name:'Savage Fury'},
{level:23,tree:'Feral Combat',name:'Sharpened Claws'},{level:24,tree:'Feral Combat',name:'Sharpened Claws'},
{level:25,tree:'Feral Combat',name:'Lacerate'},
{level:26,tree:'Feral Combat',name:'Blood Frenzy'},{level:27,tree:'Feral Combat',name:'Blood Frenzy'},
{level:28,tree:'Feral Combat',name:'Predatory Discipline'},
{level:29,tree:'Feral Combat',name:'Predatory Strikes'},
{level:30,tree:'Feral Combat',name:'Leader of the Pack'},
{level:31,tree:'Feral Combat',name:'Natural Instinct'},
{level:32,tree:'Feral Combat',name:'Natural Instinct'},
{level:33,tree:'Feral Combat',name:'Predatory Strikes'},{level:34,tree:'Feral Combat',name:'Predatory Strikes'},
{level:35,tree:'Feral Combat',name:'Rend and Tear'},{level:36,tree:'Feral Combat',name:'Rend and Tear'},{level:37,tree:'Feral Combat',name:'Rend and Tear'},{level:38,tree:'Feral Combat',name:'Rend and Tear'},{level:39,tree:'Feral Combat',name:'Rend and Tear'},
{level:40,tree:'Feral Combat',name:'Primal Bite'},
{level:41,tree:'Feral Combat',name:'Shifting Power'},
{level:42,tree:'Restoration',name:'Heart of the Wild'},{level:43,tree:'Restoration',name:'Heart of the Wild'},{level:44,tree:'Restoration',name:'Heart of the Wild'},{level:45,tree:'Restoration',name:'Heart of the Wild'},{level:46,tree:'Restoration',name:'Heart of the Wild'},
{level:47,tree:'Restoration',name:'Naturalist'},{level:48,tree:'Restoration',name:'Naturalist'},{level:49,tree:'Restoration',name:'Naturalist'},{level:50,tree:'Restoration',name:'Naturalist'},{level:51,tree:'Restoration',name:'Naturalist'},
{level:52,tree:'Balance',name:'Genesis'},{level:53,tree:'Balance',name:'Genesis'},{level:54,tree:'Balance',name:'Genesis'},{level:55,tree:'Balance',name:'Genesis'},{level:56,tree:'Balance',name:'Genesis'},
{level:57,tree:'Balance',name:"Nature's Reach"},{level:58,tree:'Balance',name:"Nature's Reach"},
{level:59,tree:'Balance',name:"Nature's Majesty"},{level:60,tree:'Balance',name:"Nature's Majesty"}
];
// Published level-60 allocations from ForeverSpec (6 November 2026). Never project a 60 build onto earlier levels.
const PRESETS={
 bear:[
 ['Feral Combat','Ferocity',5],['Feral Combat','Thick Hide',3],['Feral Combat','Feral Instinct',3],
 ['Feral Combat','Feral Swiftness',2],['Feral Combat','Savage Fury',2],['Feral Combat','Sharpened Claws',2],
 ['Feral Combat','Feral Charge',1],['Feral Combat','Predatory Strikes',3],['Feral Combat','Lacerate',1],
 ['Feral Combat','Blood Frenzy',2],['Feral Combat','Leader of the Pack',1],['Feral Combat','Natural Instinct',2],
 ['Feral Combat','Natural Reaction',5],['Feral Combat','Rend and Tear',5],['Feral Combat','Primal Bite',1],
 ['Feral Combat','Furor',3],['Restoration','Heart of the Wild',5],['Restoration','Naturalist',5]],
 cat:[
 ['Feral Combat','Ferocity',5],['Feral Combat','Furor',5],['Feral Combat','Savage Fury',2],
 ['Feral Combat','Sharpened Claws',2],['Feral Combat','Shredding Attacks',3],['Feral Combat','Predatory Strikes',3],
 ['Feral Combat','Blood Frenzy',2],['Feral Combat','Leader of the Pack',1],['Feral Combat','Predatory Discipline',1],
 ['Feral Combat','Natural Instinct',2],['Feral Combat','Rend and Tear',5],['Feral Combat','Shifting Power',1],
 ['Balance','Genesis',5],['Balance',"Nature's Majesty",2],['Balance',"Nature's Reach",2],
 ['Restoration','Heart of the Wild',5],['Restoration','Naturalist',5]],
 heal:[
 ['Restoration','Heart of the Wild',5],['Restoration','Naturalist',5],['Restoration','Reflection',3],
 ['Restoration','Gift of Nature',5],['Restoration','Bloom',1],['Restoration','Tranquil Spirit',5],
 ['Restoration','Improved Rejuvenation',3],['Restoration','Swiftmend',1],['Restoration',"Nature's Swiftness",1],
 ['Restoration','Living Spirit',3],['Restoration','Improved Tranquility',2],['Restoration','Improved Regrowth',5],
 ['Restoration','Wild Growth',1],['Balance','Genesis',5],['Balance','Moonglow',3],
 ['Balance',"Nature's Majesty",2],['Balance',"Nature's Splendor",1]]
};
function presetCounts(g,level){
 if(level!==60)return null;
 const key=String(g).toLocaleLowerCase('fr');
 const preset=key.includes('ours')?'bear':key.includes('félin')?'cat':key.includes('restauration')?'heal':null;
 if(!preset)return null;
 const entries=PRESETS[preset],counts=new Map();
 for(const [tree,name,count] of entries)counts.set(tree+'|'+name,count);
 return {preset,counts,entries};
}
function validatePreset(preset){
 if(!dataset||!preset)return false;
 const map=new Map(dataset.map(t=>[t.name,t]));
 return preset.entries.reduce((n,x)=>n+x[2],0)===51&&preset.entries.every(([tree,name,count])=>{
 const t=map.get(tree),talent=t&&find(t,name);return talent&&Number(talent.max)>=count;
 });
}

let dataset=null,error='';
const fixes={'Feral Combat':'Combat farouche',Balance:'Équilibre',Restoration:'Restauration'};
const aliases={
'Feral Instinct':['Feral Instinct'],'Feral Swiftness':['Feral Swiftness'],
'Feral Charge':['Feral Charge'],'Savage Fury':['Savage Fury'],'Sharpened Claws':['Sharpened Claws'],
'Lacerate':['Lacerate'],'Blood Frenzy':['Blood Frenzy'],'Predatory Discipline':['Predatory Discipline'],
'Natural Instinct':['Natural Instinct'],'Primal Bite':['Primal Bite'],
'Shifting Power':['Shifting Power'],'Heart of the Wild':['Heart of the Wild'],'Naturalist':['Naturalist'],
'Nature’s Reach':["Nature's Reach"]
};
function find(t,name){
 const terms=aliases[name]||[name];
 return t.talents.find(x=>terms.some(n=>String(x.name).toLowerCase()===n.toLowerCase()))||null;
}
function points(level){const counts=new Map();for(const x of routes){if(x.level>level)continue;const k=x.tree+'|'+x.name;counts.set(k,(counts.get(k)||0)+1)}return counts}
function validateRoute(){
 if(!dataset||routes.length!==51||routes.some((x,i)=>x.level!==i+10))return false;
 const treeMap=new Map(dataset.map(x=>[x.name,x]));
 for(const [key,count]of points(60)){
  const [tree,name]=key.split('|'),t=treeMap.get(tree),found=t&&find(t,name);
  if(!found||count>found.max)return false;
 }
 return true;
}
function render(){
 const host=$('binch-spec-tree-visual');if(!host)return;
 const select=$('binch-specs-level'),level=Number(select?.value)||10,g=$('binch-specs-selection')?.textContent||'';
 if(!g.includes('Druide')){host.hidden=true;const old=$('binch-specs-route');if(old)old.hidden=false;return}host.hidden=false;const old=$('binch-specs-route');if(old)old.hidden=false;
 if(!dataset){host.innerHTML='<div class="binch-tree-info"><strong>Arbres du druide Forever</strong><p>'+esc(error||'Chargement des arbres de talents sourcés…')+'</p><a href="'+calc+'" target="_blank" rel="noopener noreferrer">Voir le calculateur Forever</a></div>';return}
 const isLeveling=String(g).toLocaleLowerCase('fr').includes('pex');
 const preset=presetCounts(g,level),presetValid=validatePreset(preset);
 const valid=isLeveling&&validateRoute(),counts=valid?points(level):presetValid?preset.counts:new Map(),next=valid?routes.find(x=>x.level===level+1):null;
 if(old)old.hidden=valid||presetValid;
 const treeHTML=dataset.map(t=>{
 const current=t.talents.reduce((n,x)=>n+(counts.get(t.name+'|'+x.name)||0),0);
 const cells=t.talents.map(x=>{
  const owned=Math.min(Number(x.max)||0,counts.get(t.name+'|'+x.name)||0);
  const coming=next?.tree===t.name&&next?.name===x.name;
  const img=icon(x.icon),safe=esc(x.name),tip=esc((x.desc||[])[Math.max(0,Math.min(x.max-1,owned-1))]||x.desc?.[0]||'');
  return '<button type="button" class="binch-tree-node'+(owned?' has-points':'')+(coming?' is-next':'')+'" style="--tree-row:'+Number(x.row)+';--tree-col:'+Number(x.col)+'" aria-label="'+safe+' : '+owned+'/'+Number(x.max)+' rangs" data-tree-tooltip="'+safe+'" data-tree-description="'+tip+'"><img loading="lazy" alt="" src="'+img+'"><span>'+owned+'/'+Number(x.max)+'</span></button>';
 }).join('');
 return '<section class="binch-tree-panel"><header><h4>'+esc(fixes[t.name]||t.name)+'</h4><strong>'+current+' point(s)</strong></header><div class="binch-tree-cells">'+cells+'</div></section>';
 }).join('');
 host.innerHTML='<section class="binch-tree-info"><h3>Arbres de talents Forever · Druide</h3><p>'+esc(note)+'</p><div class="binch-tree-badges"><strong>Level '+level+'</strong><span>'+(valid?Math.max(0,level-9):0)+'/51 points · recommandation pex validée si disponible</span><span>'+ (valid?'Parcours pex validé sur les talents exportés':presetValid?'Allocation ForeverSpec niveau 60':'Aucun rang attribué sans vérification')+'</span></div><p>'+(next?'Prochain point au niveau '+next.level+' : '+esc(next.name)+' ('+esc(fixes[next.tree]||next.tree)+')':valid?'Parcours de pex terminé.':presetValid?'Build niveau 60 sourcé ForeverSpec ; ne représente pas la répartition avant 60.':'Pas de préremplissage : consulte le guide propre au profil.')+'</p><a href="'+calc+'" target="_blank" rel="noopener noreferrer">Ouvrir le calculateur avec les véritables talents</a></section><div class="binch-tree-grid">'+treeHTML+'</div><div id="binch-tree-description" class="binch-tree-description" role="status">Sélectionne une icône pour lire son effet. Les rangs colorés représentent le parcours recommandé.</div><p class="binch-tree-license">Données d’arbres et positions : <a href="'+src+'" target="_blank" rel="noopener noreferrer">Talents Forever</a> · CC BY 4.0 · export du client bêta (4 nov. 2026). Icônes © Blizzard. Le calculateur Armory Forever peut refléter un hotfix plus récent.</p>';
 host.querySelectorAll('.binch-tree-node').forEach(b=>b.addEventListener('click',()=>{
  $('binch-tree-description').textContent=b.dataset.treeTooltip+' — '+b.dataset.treeDescription;
 }));
}
async function load(){
 try{const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),9000);
  let result;try{result=await fetch(src,{signal:ctrl.signal,mode:'cors'})}finally{clearTimeout(timer)}
  if(!result.ok)throw Error('HTTP '+result.status);
  const data=await result.json();if(!data?.talents?.trees||!Array.isArray(data.talents.trees))throw Error('Format inattendu');
  dataset=data.talents.trees.filter(x=>['Balance','Feral Combat','Restoration'].includes(x.name)&&Array.isArray(x.talents));
  if(dataset.length!==3)throw Error('Arbres incomplets');
  error='';render();
 }catch{error='Le navigateur ne peut pas accéder à la source distante. Le calculateur Forever officiel reste accessible ci-dessous.';render()}
}
function mount(){
 if($('binch-spec-tree-visual'))return;
 const page=$('page-specs'),route=$('binch-specs-route');if(!page||!route)return;
 const host=document.createElement('section');host.id='binch-spec-tree-visual';host.className='binch-spec-tree-visual';
 route.before(host);
 const level=$('binch-specs-level'),cards=$('binch-specs-cards');
 level?.addEventListener('change',render);
 $('binch-specs-auto-level')?.addEventListener('click',()=>setTimeout(render,0));
 cards?.addEventListener('click',()=>setTimeout(render,0));
 page.querySelector('#binch-specs-class')?.addEventListener('change',()=>setTimeout(render,0));
 document.querySelector('#app nav.nav [data-page="specs"]')?.addEventListener('click',()=>setTimeout(render,0));
 document.addEventListener('grimoire:sync',render);
 load();
}
function start(){if(mount())return;const main=$('#app main');if(!main)return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(main,{childList:true});setTimeout(()=>observer.disconnect(),10000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();