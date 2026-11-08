(()=>{
'use strict';
const STORE='binch.procs.v1',CATEGORIES={"relics":["Lame de l'aube oubliée","Grimoire du péon savant","Flacon d'éther bleu","Couronne de cuivre noir","Clé des cryptes perdues","Sablier du veilleur","Boussole du vagabond","Anneau des sept brumes","Masque de la cendre","Hache des trois lunes","Corne de rappel","Cristal des marées","Lanternon du gardien","Écu fendu du roi","Orbe de pluie stellaire","Dé d'obsidienne","Harpe de l'exilé","Griffe d'argent","Cœur mécanique","Graal de la Binch"],"companions":["Chat des ruelles","Bébé griffon fauve","Mini-golem mousseux","Rat de bibliothèque","Luciolion lunaire","Corbeau du guetteur","Tortue aux runes","Renarde des dunes","Papillon des cendres","Murloc en smoking","Luciole royale","Chauve-souris cuivrée","Grenouille érudite","Hibou de cristal","Crabe du navigateur","Serpent des nuages","Bébé dragon d'encre","Loup des neiges","Phénix miniature","Gardien du néant"],"characters":["Le péon philosophe","La cartographe sans carte","Le tavernier borgne","La guerrière du crépuscule","L'alchimiste distrait","Le mage aux chaussettes","La rôdeuse des ronces","Le chevalier rouillé","Le barde sans voix","La prêtresse des pluies","L'espion à monocle","Le forgeron spectral","La voleuse de cloches","Le druide endormi","La capitaine des brumes","Le nécromancien poli","L'oracle masqué","Le roi sans royaume","La sentinelle stellaire","Le maître péon de la Binch"],"mounts":["Sanglier du crépuscule","Bélier de granit","Rapace des landes","Cerf des lunes","Mécano-autruche","Lézard de saphir","Loup de bruyère","Hippogriffe de cendre","Araignée d'ambre","Tortue des tempêtes","Lynx astral","Bison d'or","Chimère pourpre","Destrier spectral","Griffon de jade","Étalon du néant","Dragonnet chevauchable","Coursier des étoiles","Phénix d'obsidienne","Monture du dernier péon"]};
const CATS=[{id:'relics',name:'Reliques',weight:35,icon:'⚔',art:'relic'},{id:'companions',name:'Compagnons',weight:30,icon:'✦',art:'creature'},{id:'characters',name:'Personnages',weight:20,icon:'♜',art:'character'},{id:'mounts',name:'Montures',weight:15,icon:'♞',art:'mount'}];
const TIERS=[{id:'common',name:'Ordinaire',weight:55,color:'#a8c5b7'},{id:'uncommon',name:'Inhabituel',weight:25,color:'#79db99'},{id:'rare',name:'Rare',weight:12,color:'#79aefc'},{id:'epic',name:'Épique',weight:6,color:'#cba5fb'},{id:'legendary',name:'Légendaire',weight:2,color:'#ffd27a'}];
const DISTRIBUTION=['common','common','common','common','common','common','common','common','uncommon','uncommon','uncommon','uncommon','uncommon','rare','rare','rare','rare','epic','epic','legendary'];
const PROBABILITY=.023,COOLDOWN=9500,$=id=>document.getElementById(id);
const READ=()=>{try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return {}}};
const SAVE=v=>{try{localStorage.setItem(STORE,JSON.stringify(v))}catch{}};
const ESC=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ITEMS=CATS.flatMap(c=>CATEGORIES[c.id].map((name,n)=>({id:c.id+'-'+(n+1),name,category:c.id,tier:DISTRIBUTION[n],art:c.art,index:n})));
const fmt=n=>(n*100).toLocaleString('fr-FR',{maximumFractionDigits:5})+' %';
let last=0,shown=false,timer=null,animation=null,activeCategory='all',collectionFilter='all';
function weighted(list){const sum=list.reduce((a,x)=>a+x.weight,0);let hit=Math.random()*sum;for(const x of list){hit-=x.weight;if(hit<=0)return x}return list[list.length-1]}
function roll(){const cat=weighted(CATS),tier=weighted(TIERS);const pool=ITEMS.filter(x=>x.category===cat.id&&x.tier===tier.id);return pool[Math.floor(Math.random()*pool.length)]}
function probability(item){const cat=CATS.find(x=>x.id===item.category),tier=TIERS.find(x=>x.id===item.tier);return PROBABILITY*cat.weight/100*tier.weight/100/ITEMS.filter(x=>x.category===item.category&&x.tier===item.tier).length}
function displayChance(item){return fmt(probability(item))}
function logDrop(item){const state=READ();state.drops=state.drops||{};state.total=(state.total||0)+1;state.drops[item.id]=(state.drops[item.id]||0)+1;state.last=item.id;SAVE(state)}
function color(item){return TIERS.find(t=>t.id===item.tier)?.color||'#b7dac8'}
function title(item){return CATS.find(x=>x.id===item.category)?.name||'Surprise'}
function hash(n){let x=n|0;x=Math.imul(x^x>>>16,0x7feb352d);x=Math.imul(x^x>>>15,0x846ca68b);return (x^x>>>16)>>>0}
function pix(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function sprite(ctx,item,time){
 const t=time/360,idx=item.index,seed=hash(idx+item.category.length*37);
 const pale=color(item),dark='#152b2c',edge='#081414',bright='#f5ebc9',gold='#c19b62',blue='#6cabc5';
 const bob=Math.sin(t)*.9,mode=item.art;
 const glow=ctx.createRadialGradient(32,33,1,32,33,29);glow.addColorStop(0,pale+'55');glow.addColorStop(1,pale+'00');ctx.fillStyle=glow;ctx.fillRect(1,1,62,62);
 for(let i=0;i<15;i++){const x=4+hash(seed+i)%56,y=4+hash(seed+i*13)%55;const pulse=Math.sin(t+i*1.9);if(pulse>.15)pix(ctx,x,y,pulse>.7?2:1,pulse>.7?2:1,pale)}
 ctx.save();ctx.translate(0,bob);
 if(mode==='relic'){
  const shape=idx%5;
  if(shape===0){pix(ctx,30,14,4,34,edge);pix(ctx,31,10,2,29,pale);pix(ctx,27,37,11,4,gold);pix(ctx,29,41,6,4,dark);pix(ctx,31,46,2,5,bright);pix(ctx,31,12,1,16,bright)}
  else if(shape===1){pix(ctx,22,15,20,34,edge);pix(ctx,24,17,17,29,dark);pix(ctx,26,19,13,23,pale);pix(ctx,31,20,2,19,bright);pix(ctx,28,43,8,3,gold)}
  else if(shape===2){pix(ctx,23,24,18,25,edge);pix(ctx,25,26,14,21,blue);pix(ctx,27,28,10,15,pale);pix(ctx,28,19,8,6,gold);pix(ctx,29,17,6,2,bright)}
  else if(shape===3){pix(ctx,20,22,24,22,edge);pix(ctx,23,25,18,16,pale);pix(ctx,27,20,10,26,gold);pix(ctx,28,25,8,16,dark);pix(ctx,31,28,2,10,bright)}
  else{pix(ctx,17,28,30,13,edge);pix(ctx,20,31,24,7,gold);pix(ctx,24,24,15,20,pale);pix(ctx,29,25,5,19,dark);pix(ctx,31,27,2,13,bright)}
 }else{
  const mount=mode==='mount',person=mode==='character';
  const bodyY=mount?34:32;
  if(mount){pix(ctx,12,37,42,13,edge);pix(ctx,15,34,37,14,dark);pix(ctx,18,37,34,10,pale);pix(ctx,18,47,5,9,edge);pix(ctx,43,47,5,9,edge);pix(ctx,43,29,14,11,edge);pix(ctx,46,32,10,7,gold);pix(ctx,49,33,2,2,bright)}
  else{pix(ctx,22,bodyY,21,23,edge);pix(ctx,25,35,16,18,person?'#405e63':pale);pix(ctx,27,52,5,5,edge);pix(ctx,36,52,5,5,edge)}
  pix(ctx,22,17,21,21,edge);pix(ctx,24,19,17,17,person?'#b58e78':pale);
  pix(ctx,24,17,5,8,dark);pix(ctx,36,17,5,8,dark);
  pix(ctx,28,29,3,2,bright);pix(ctx,36,29,3,2,bright);
  if(person){pix(ctx,22,14,20,6,gold);pix(ctx,25,13,14,4,dark);pix(ctx,27,35,13,2,gold)}
  else {pix(ctx,20,13,7,11,edge);pix(ctx,38,13,7,11,edge);pix(ctx,21,15,5,7,pale);pix(ctx,39,15,5,7,pale)}
  if(mount){pix(ctx,27,30,6,10,gold);pix(ctx,30,27,3,4,bright)}
 }

 // Rich procedural sprite variations: equipment, headgear, tails, wings,
 // saddles, luminous sigils and metallic highlights make each of 20 entries distinct.
 const accents=['#e9c277','#78bed0','#b7a7ef','#85cc99','#ec9f7b','#e0dbbc','#78a9ba','#c3a0a7'];
 const accent=accents[idx%accents.length],variant=Math.floor(idx/5);
 if(mode==='relic'){
   for(let j=0;j<3;j++){
     const px0=21+(hash(seed+j)%22),py0=22+(hash(seed+j*9)%22);
     pix(ctx,px0,py0,2,2,idx%2?accent:bright);
   }
   if(variant===0){pix(ctx,26,18,2,3,accent);pix(ctx,36,31,2,3,accent)}
   else if(variant===1){pix(ctx,18,39,7,3,accent);pix(ctx,40,26,4,3,accent)}
   else if(variant===2){pix(ctx,32,14,2,8,accent);pix(ctx,21,42,20,2,gold)}
   else {pix(ctx,18,20,5,5,accent);pix(ctx,40,39,5,5,accent)}
 }else if(mode==='character'){
   const archetype=idx%5;
   if(archetype===0){ // mage, tall hood and luminous staff
     pix(ctx,20,13,23,4,accent);pix(ctx,23,8,17,7,edge);pix(ctx,26,10,11,3,accent);
     pix(ctx,17,26,3,29,gold);pix(ctx,14,21,9,8,pale);pix(ctx,17,23,3,3,bright);
     pix(ctx,28,40,11,2,accent);
   }else if(archetype===1){ // armored warrior and small crest shield
     pix(ctx,17,34,10,12,edge);pix(ctx,19,35,7,9,accent);
     pix(ctx,38,34,9,12,edge);pix(ctx,39,35,7,8,gold);
     pix(ctx,26,13,12,4,edge);pix(ctx,27,14,10,2,accent);
     pix(ctx,28,45,9,2,gold);
   }else if(archetype===2){ // hooded rogue
     pix(ctx,20,12,24,10,edge);pix(ctx,22,16,20,5,accent);
     pix(ctx,20,40,7,15,edge);pix(ctx,38,40,7,15,edge);
     pix(ctx,17,37,5,16,gold);pix(ctx,43,37,5,16,gold);
     pix(ctx,27,31,3,2,bright);pix(ctx,36,31,3,2,bright);
   }else if(archetype===3){ // druid, antlers and cloak
     pix(ctx,18,9,3,13,gold);pix(ctx,15,7,8,3,gold);pix(ctx,43,9,3,13,gold);pix(ctx,41,7,8,3,gold);
     pix(ctx,20,37,6,18,accent);pix(ctx,40,37,6,18,accent);
     pix(ctx,28,42,8,8,edge);pix(ctx,30,43,4,6,pale);
   }else{ // priestly high-collar and halo
     pix(ctx,21,14,22,3,gold);pix(ctx,25,11,14,2,bright);
     pix(ctx,20,32,7,20,accent);pix(ctx,38,32,7,20,accent);
     pix(ctx,28,40,9,12,gold);pix(ctx,30,43,5,5,bright);
   }
   // Individually engraved chest insignia for each generation.
   pix(ctx,29+(variant%3),38,3,3,variant%2?accent:gold);
   pix(ctx,30+(variant%3),39,1,1,bright);
 }else if(mode==='creature'){
   const beast=idx%5;
   if(beast===0){ // feathered wings
     pix(ctx,12,29,13,9,edge);pix(ctx,13,29,11,6,accent);
     pix(ctx,42,29,12,9,edge);pix(ctx,43,29,10,6,accent);
     pix(ctx,15,34,5,5,gold);pix(ctx,48,34,5,5,gold);
   }else if(beast===1){ // tusks and a curled tail
     pix(ctx,19,34,7,6,bright);pix(ctx,42,34,7,6,bright);
     pix(ctx,44,47,11,5,edge);pix(ctx,51,42,5,9,accent);
   }else if(beast===2){ // pointed ears and white facial markings
     pix(ctx,19,9,8,14,edge);pix(ctx,39,9,8,14,edge);
     pix(ctx,22,10,4,11,accent);pix(ctx,41,10,4,11,accent);
     pix(ctx,31,34,4,4,bright);
   }else if(beast===3){ // ornate shell or beetle back
     pix(ctx,18,34,27,19,edge);pix(ctx,21,35,22,15,accent);
     pix(ctx,31,35,2,16,bright);pix(ctx,24,40,15,2,gold);
   }else{ // baby dragon and little horns
     pix(ctx,14,19,12,10,edge);pix(ctx,15,20,9,7,accent);
     pix(ctx,41,19,11,10,edge);pix(ctx,42,20,8,7,accent);
     pix(ctx,25,11,4,7,gold);pix(ctx,37,11,4,7,gold);
     pix(ctx,44,45,11,4,accent);pix(ctx,52,42,4,5,accent);
   }
   pix(ctx,32,43,3,3,accent);
 }else if(mode==='mount'){
   const archetype=idx%5;
   if(archetype===0){ // knightly saddle
     pix(ctx,25,30,14,5,edge);pix(ctx,27,30,11,4,gold);
     pix(ctx,35,34,8,10,accent);
   }else if(archetype===1){ // antlered woodland mount
     pix(ctx,46,20,3,13,edge);pix(ctx,40,20,11,4,gold);
     pix(ctx,53,17,3,14,edge);pix(ctx,49,16,10,4,gold);
   }else if(archetype===2){ // winged fantasy mount
     pix(ctx,7,27,17,9,edge);pix(ctx,8,28,15,6,accent);
     pix(ctx,23,32,7,8,gold);
   }else if(archetype===3){ // armored mechanical steed
     pix(ctx,18,35,19,5,accent);pix(ctx,20,40,15,3,bright);
     pix(ctx,45,30,10,6,gold);pix(ctx,17,49,5,6,gold);
   }else { // astral charger
     pix(ctx,12,29,15,4,accent);pix(ctx,8,28,8,2,bright);
     pix(ctx,40,35,11,5,gold);pix(ctx,24,44,12,3,accent);
   }
   pix(ctx,39,36,3,2,bright);
 }
 ctx.restore();
 for(let i=0;i<11;i++){const angle=i*Math.PI*2/11+t*.28,dist=19+3*Math.sin(t+i);if(i%3===0)pix(ctx,32+Math.cos(angle)*dist,31+Math.sin(angle)*dist,1,1,gold)}
}
function animate(item){const canvas=$('binch-proc-canvas');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.imageSmoothingEnabled=false;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||READ().motion===false;const start=performance.now();function frame(now){ctx.clearRect(0,0,64,64);sprite(ctx,item,reduce?0:now-start);if(!reduce&&shown&&now-start<4200)animation=requestAnimationFrame(frame)}frame(start)}
function pop(item,preview=false){
 clearTimeout(timer);if(animation)cancelAnimationFrame(animation);shown=true;
 const wrap=$('binch-proc-toast');wrap.hidden=false;
 wrap.style.setProperty('--proc-accent',color(item));
 $('binch-proc-label').textContent=preview?'APERÇU • AUCUN DROP COMPTABILISÉ':title(item)+' • '+TIERS.find(x=>x.id===item.tier).name.toUpperCase();
 $('binch-proc-title').textContent=item.name;
 $('binch-proc-chance').textContent='Chance par clic : '+displayChance(item);
 wrap.dataset.tier=item.tier;animate(item);
 timer=setTimeout(closeToast,5000);
}
function closeToast(){shown=false;const el=$('binch-proc-toast');if(el)el.hidden=true;if(animation)cancelAnimationFrame(animation)}
function eligible(e){if(e.isTrusted===false)return false;if(e.target.closest('#binch-proc-toast,#page-procs,[data-binch-proc-open]'))return false;return !!document.querySelector('#app:not(.hidden)')}
function onClick(e){if(!eligible(e))return;const now=Date.now();if(now-last<COOLDOWN)return;if(Math.random()>=PROBABILITY)return;last=now;const item=roll();logDrop(item);pop(item);renderCodex()}
function makeCodex(){
 if($('page-procs'))return;
 const nav=document.querySelector('#app nav.nav'),main=document.querySelector('#app main'),header=document.querySelector('#app .app-head');
 if(!nav||!main||!header)return;
 const button=document.createElement('button');button.type='button';button.className='binch-secret-trigger';button.title='Le Cabinet des surprises';button.setAttribute('aria-label','Ouvrir les procs secrets de La Binch');button.dataset.binchProcOpen='1';button.textContent='✧';header.append(button);
 const page=document.createElement('section');page.className='page';page.id='page-procs';
 page.innerHTML='<section class="panel section binch-procs-page"><div class="binch-procs-head"><div><div class="eyebrow">✧ La Binch / collection secrète</div><h2>Le Cabinet des surprises</h2><p>Des apparitions cosmétiques originales peuvent surgir au fil de tes clics dans La Binch. Elles n’ont aucun effet sur WoW.</p></div><button type="button" id="binch-proc-back">Retour au carnet ↗</button></div><div class="binch-proc-stats" id="binch-proc-stats"></div><p class="muted">Chance d’un proc : <b>2,3 % par clic éligible</b>, avec 9,5 secondes minimum entre deux apparitions. Tirage de catégorie : Reliques 35 %, Compagnons 30 %, Personnages 20 %, Montures 15 %. Puis rareté : Ordinaire 55 %, Inhabituel 25 %, Rare 12 %, Épique 6 %, Légendaire 2 %. Chaque élément d’une même rareté et catégorie a la même probabilité.</p><div class="binch-proc-settings"><label><input type="checkbox" id="binch-proc-animations" checked> Activer les procs cosmétiques</label><label><input type="checkbox" id="binch-proc-motion" checked> Animations pixel art</label><button id="binch-proc-preview" type="button">Aperçu visuel (sans gain)</button><button id="binch-proc-reset" type="button">Réinitialiser la collection</button></div><div class="binch-proc-tabs" id="binch-proc-tabs"></div><div class="binch-proc-filters"><button type="button" data-proc-filter="all">Tout voir</button><button type="button" data-proc-filter="owned">Découverts</button><button type="button" data-proc-filter="missing">Manquants</button></div><div class="binch-proc-list" id="binch-proc-list"></div></section>';
 main.append(page);
 const toast=document.createElement('div');toast.id='binch-proc-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
 toast.innerHTML='<div class="binch-proc-halo"></div><canvas id="binch-proc-canvas" width="64" height="64" aria-hidden="true"></canvas><div id="binch-proc-label"></div><strong id="binch-proc-title"></strong><small id="binch-proc-chance"></small><button type="button" id="binch-proc-close" aria-label="Fermer cette surprise">×</button>';
 document.body.append(toast);
 function openPage(){document.querySelectorAll('#app nav.nav button').forEach(b=>b.classList.remove('active'));document.querySelectorAll('#app main .page').forEach(p=>p.classList.toggle('active',p.id==='page-procs'));window.scrollTo({top:0,behavior:'smooth'});renderCodex()}
 button.onclick=openPage;
 $('binch-proc-back').onclick=()=>document.querySelector('#app nav [data-page="hub"]')?.click();
 $('binch-proc-close').onclick=closeToast;
 $('binch-proc-preview').onclick=()=>pop(ITEMS[78],true);
 $('binch-proc-reset').onclick=()=>{if(confirm('Effacer les découvertes cosmétiques de ce navigateur ?')){SAVE({enabled:READ().enabled!==false});renderCodex()}};
 $('binch-proc-animations').onchange=e=>{const x=READ();x.enabled=e.target.checked;SAVE(x)};
 $('binch-proc-animations').checked=READ().enabled!==false;
 $('binch-proc-motion').checked=READ().motion!==false;
 $('binch-proc-motion').onchange=e=>{const x=READ();x.motion=e.target.checked;SAVE(x)};
 $('binch-proc-tabs').onclick=e=>{const btn=e.target.closest('[data-proc-category]');if(!btn)return;activeCategory=btn.dataset.procCategory;renderCodex()};
 page.querySelector('.binch-proc-filters').onclick=e=>{const b=e.target.closest('[data-proc-filter]');if(!b)return;collectionFilter=b.dataset.procFilter;renderCodex()};
 $('binch-proc-list').onclick=e=>{const b=e.target.closest('[data-proc-preview-id]');if(!b)return;const item=ITEMS.find(i=>i.id===b.dataset.procPreviewId);if(item)pop(item,true)};

}
function renderCodex(){
 if(!$('binch-proc-list'))return;const st=READ(),drops=st.drops||{},count=ITEMS.filter(x=>drops[x.id]>0).length;
 $('binch-proc-stats').innerHTML='<div><strong>'+count+' / '+ITEMS.length+'</strong><span>Surprises découvertes</span></div><div><strong>'+(st.total||0)+'</strong><span>Apparitions obtenues</span></div><div><strong>4 × 20</strong><span>Surprises par catégorie</span></div>';
 document.querySelectorAll('.binch-proc-filters [data-proc-filter]').forEach(b=>b.classList.toggle('active',b.dataset.procFilter===collectionFilter));
 $('binch-proc-tabs').innerHTML='<button type="button" data-proc-category="all" class="'+(activeCategory==='all'?'active':'')+'">Toutes</button>'+CATS.map(c=>'<button type="button" data-proc-category="'+c.id+'" class="'+(activeCategory===c.id?'active':'')+'">'+c.icon+' '+c.name+'</button>').join('');
 $('binch-proc-list').innerHTML=ITEMS.filter(x=>(activeCategory==='all'||x.category===activeCategory)&&(collectionFilter==='all'||(collectionFilter==='owned'?!!drops[x.id]:!drops[x.id]))).map(item=>{
   const acquired=!!drops[item.id],tier=TIERS.find(t=>t.id===item.tier);
   return '<article class="binch-proc-entry" style="--tier-color:'+tier.color+'"><span class="binch-proc-emblem">'+(acquired?'✦':'?')+'</span><div><div class="binch-proc-entry-kind">'+ESC(title(item))+' · '+tier.name+'</div><strong>'+ESC(item.name)+'</strong><small>Chance par clic : '+displayChance(item)+'</small></div><span class="binch-proc-count">'+(acquired?'× '+drops[item.id]:'Non obtenu')+'</span><button type="button" class="binch-proc-preview-item" data-proc-preview-id="'+item.id+'" aria-label="Prévisualiser '+ESC(item.name)+'">✧</button></article>';
 }).join('');
}
function setup(){
 makeCodex();document.addEventListener('click',e=>{if(READ().enabled===false)return;onClick(e)},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeToast()});
}
const css=document.createElement('style');
css.textContent="\n.binch-secret-trigger{position:absolute;top:33px;right:195px;background:transparent;border:1px solid #7c6c4b99;color:#e8c989;border-radius:50%;width:30px;height:30px;display:grid;place-items:center;font-size:21px;cursor:pointer;opacity:.65;transition:opacity .2s,transform .2s}.binch-secret-trigger:hover,.binch-secret-trigger:focus-visible{opacity:1;transform:rotate(35deg)}#binch-proc-toast[hidden]{display:none!important}\n#binch-proc-toast{--proc-accent:#a5ccae;position:fixed;z-index:9999;right:min(5vw,70px);bottom:5vh;width:min(340px,90vw);display:flex;align-items:center;flex-direction:column;gap:7px;padding:25px 22px 19px;background:linear-gradient(155deg,#192a26fa,#090f12f9);border:2px solid var(--proc-accent);border-radius:15px;box-shadow:0 0 0 5px #000a,0 0 55px color-mix(in srgb,var(--proc-accent) 37%,transparent);text-align:center;overflow:hidden;animation:binch-proc-enter .42s cubic-bezier(.2,.75,.25,1)}\n#binch-proc-toast:before{content:\"\";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 32%,color-mix(in srgb,var(--proc-accent) 24%,transparent),transparent 55%);pointer-events:none}\n#binch-proc-toast canvas{position:relative;width:212px;height:212px;image-rendering:pixelated;filter:drop-shadow(0 10px 13px #0009)}#binch-proc-toast #binch-proc-label{position:relative;color:var(--proc-accent);font-size:.69rem;letter-spacing:.1em;font-weight:800;text-transform:uppercase}#binch-proc-toast strong{position:relative;color:#f8f1dc;font:700 1.15rem Cinzel,Georgia,serif}#binch-proc-toast small{color:#b9c6c2;font-size:.74rem}#binch-proc-close{position:absolute;top:6px;right:9px;border:0;background:transparent;color:#f4deb1;font-size:23px;cursor:pointer}\n@keyframes binch-proc-enter{from{opacity:0;transform:translateY(24px) scale(.85)}to{opacity:1;transform:translateY(0) scale(1)}}\n.binch-procs-page{max-width:1300px;margin:0 auto}.binch-procs-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.binch-procs-head p{max-width:650px;color:var(--muted)}.binch-procs-head>button,.binch-proc-settings button{background:#1c2c24;color:#e9c88c;border:1px solid #755f39;padding:10px 14px;border-radius:8px;cursor:pointer}\n.binch-proc-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:19px 0}.binch-proc-stats>div{border:1px solid #4b614e;border-radius:11px;background:#101a15;padding:20px;display:grid;gap:8px}.binch-proc-stats strong{font:700 1.85rem Cinzel,Georgia,serif;color:#f0cb8b}.binch-proc-stats span{font-size:.8rem;color:#b7c4b8}\n.binch-proc-settings{display:flex;flex-wrap:wrap;gap:12px;align-items:center;border-bottom:1px solid #52604a;padding:15px 0}.binch-proc-settings label{font-size:.84rem;color:#ecdfc2}.binch-proc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}.binch-proc-tabs button{padding:9px 12px;border-radius:9px;background:#15221b;border:1px solid #3c5846;color:#d7dfce;cursor:pointer}.binch-proc-tabs button.active{background:#3a3224;color:#ffdda1;border-color:#d4a85e}\n.binch-proc-filters{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}.binch-proc-filters button{padding:7px 11px;border:1px solid #48604f;border-radius:7px;background:#102018;color:#e6dcc2;cursor:pointer}.binch-proc-filters button.active{background:#493924;border-color:#e0bb78;color:#ffe2af}.binch-proc-preview-item{border:1px solid var(--tier-color);background:#14251c;color:var(--tier-color);padding:5px 9px;border-radius:7px;cursor:pointer}.binch-proc-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.binch-proc-entry{display:flex;align-items:center;gap:12px;border:1px solid #39463d;border-left:3px solid var(--tier-color);border-radius:10px;padding:14px;background:linear-gradient(130deg,#17221c,#0b100e)}.binch-proc-emblem{width:40px;height:40px;flex:none;display:grid;place-items:center;border:1px solid var(--tier-color);border-radius:7px;color:var(--tier-color);font-size:22px}.binch-proc-entry>div{min-width:0;flex:1;display:grid;gap:3px}.binch-proc-entry-kind{font-size:.63rem;text-transform:uppercase;letter-spacing:.07em;color:var(--tier-color)}.binch-proc-entry strong{font-size:.86rem}.binch-proc-entry small,.binch-proc-count{font-size:.68rem;color:#a9b8ab}.binch-proc-count{text-align:right}\n@media(max-width:1050px){.binch-proc-list{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:650px){.binch-secret-trigger{top:22px;right:135px;width:26px;height:26px}.binch-proc-list,.binch-proc-stats{grid-template-columns:1fr}.binch-proc-count{display:none}#binch-proc-toast{right:5vw;bottom:10px}#binch-proc-toast canvas{width:170px;height:170px}}\n@media(prefers-reduced-motion:reduce){#binch-proc-toast{animation:none}}\n";
document.head.append(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();