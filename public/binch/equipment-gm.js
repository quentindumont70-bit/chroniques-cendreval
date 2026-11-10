(()=>{
'use strict';
const css=document.createElement('link');css.rel='stylesheet';css.href='./equipment-paperdoll.css?v=002';document.head.append(css);
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slots={1:'Tête',2:'Cou',3:'Épaules',4:'Chemise',5:'Torse',6:'Taille',7:'Jambes',8:'Pieds',9:'Poignets',10:'Mains',11:'Anneau I',12:'Anneau II',13:'Bijou I',14:'Bijou II',15:'Dos',16:'Main droite',17:'Main gauche',18:'Distance',19:'Tabard'};
const quality=['Médiocre','Commun','Inhabituel','Rare','Épique','Légendaire'];
const qualityOf=item=>Math.max(0,Math.min(5,Number(item?.quality)||0));
const countOf=item=>Math.max(1,Number(item?.count)||1);
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
const HISTORY='binch.armory.history.v2.';
function historyKey(data){return HISTORY+[data.realm||'',data.name||''].map(x=>encodeURIComponent(String(x).toLocaleLowerCase('fr'))).join('.')}
function snapshot(data){
 if(!data?.name||!data.updated)return;
 const key=historyKey(data),history=read(key,[]),entries=Array.isArray(history)?history:[];
 if(entries.some(x=>x.updated===data.updated))return;
 const equipment=Array.isArray(data.equipment)?data.equipment:[],inventory=Array.isArray(data.inventory)?data.inventory:[];
 entries.unshift({updated:data.updated,level:Number(data.level)||1,zone:String(data.zone||''),equipment:equipment.map(x=>[Number(x.slot)||0,Number(x.id)||0,String(x.name||'')]).slice(0,40),items:inventory.reduce((n,x)=>n+countOf(x),0),piles:inventory.length});
 try{localStorage.setItem(key,JSON.stringify(entries.slice(0,20)))}catch{}
}
function go(slug){const page=$('#page-'+slug);if(!page)return;document.querySelectorAll('#app .page').forEach(x=>x.classList.toggle('active',x===page));document.querySelectorAll('#app nav.nav [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===slug));scrollTo({top:0,behavior:'instant'})}
function nav(){const root=$('#app nav.nav');if(!root||root.querySelector('[data-page="equipment"]'))return;const button=document.createElement('button');button.type='button';button.dataset.page='equipment';button.textContent='Équipement';const gm=root.querySelector('[data-page="gm"]');root.insertBefore(button,gm||null);button.onclick=()=>{go('equipment');render()}}
function mount(){const main=$('#app main');if(!main||$('#page-equipment'))return;nav();const page=document.createElement('section');page.id='page-equipment';page.className='page';page.innerHTML='<section class="panel section binch-equipment"><header><div><div class="eyebrow">ARSENAL DU PERSONNAGE</div><h2>Équipement & inventaire</h2><p>Lecture locale du dernier import GrimoireSync. Aucun objet n’est envoyé ni transféré.</p></div><button type="button" id="binch-equipment-sync">Actualiser le profil ↻</button></header><div id="binch-equipment-summary"></div><section class="binch-armory-history"><h3>Historique de mes équipements</h3><p class="muted">Comparaison des derniers imports conservés uniquement dans ton navigateur. Les objets absents de l’export ne sont pas interprétés comme des pertes en jeu.</p><div id="binch-armory-history-list"></div></section><div class="binch-equipment-layout"><section><h3>Équipement porté</h3><div id="binch-equipment-slots"></div></section><section><h3>Objets dans les sacs</h3><div class="binch-bag-controls"><input id="binch-bag-search" type="search" placeholder="Rechercher un objet…"><select id="binch-bag-quality" aria-label="Qualité minimum"><option value="0">Toutes les qualités</option><option value="2">Inhabituel et plus</option><option value="3">Rare et plus</option><option value="4">Épique et plus</option></select><select id="binch-bag-sort" aria-label="Ordre du sac"><option value="bag">Ordre des sacs</option><option value="quality">Rareté décroissante</option><option value="count">Quantité décroissante</option><option value="name">Nom de l’objet</option></select></div><p id="binch-bag-summary" aria-live="polite"></p><div id="binch-bag-list"></div></section></div></section>';main.append(page);$('#binch-equipment-sync').onclick=()=>go('sync');$('#binch-bag-search').oninput=render;$('#binch-bag-quality').onchange=render;$('#binch-bag-sort').onchange=render;render()}
function render(){
 const page=$('#page-equipment');if(!page||!page.classList.contains('active'))return;
 const imported=read('grimoire.bridge.last',{}),profile=read('grimoire.hub.v3',{}),name=String(profile.data?.pseudo||'').trim();
 const same=!!imported.name&&!!name&&imported.name.trim().toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr');
 const equipment=same&&Array.isArray(imported.equipment)?imported.equipment:[],inventory=same&&Array.isArray(imported.inventory)?imported.inventory:[];
 const q=($('#binch-bag-search')?.value||'').trim().toLocaleLowerCase('fr'),minQuality=Number($('#binch-bag-quality')?.value||0),sort=$('#binch-bag-sort')?.value||'bag';
 const last=imported.updated?new Date(imported.updated):null,validDate=last&&!Number.isNaN(last.valueOf());
 const total=inventory.reduce((n,x)=>n+countOf(x),0),rare=inventory.filter(x=>qualityOf(x)>=3).reduce((n,x)=>n+countOf(x),0);
 if(same)snapshot(imported);
 const trail=same?read(historyKey(imported),[]):[],previous=Array.isArray(trail)&&trail.length>1?trail[1]:null;
 const oldItems=new Map(Array.isArray(previous?.equipment)?previous.equipment.map(x=>[Number(x[0]),Number(x[1])]):[]);
 const changed=previous?equipment.filter(x=>oldItems.has(Number(x.slot))&&oldItems.get(Number(x.slot))!==Number(x.id)):[];
 $('#binch-armory-history-list').innerHTML=!same?'<p>Aucun historique fiable pour ce personnage.</p>':previous?'<div class="binch-armory-history-summary"><strong>'+(changed.length?changed.length+' emplacement(s) modifié(s)':'Aucun changement d’équipement identifiable')+'</strong><small>Comparaison avec le précédent import du '+esc(new Date(previous.updated).toLocaleString('fr-FR'))+' · '+(Array.isArray(trail)?trail.length:0)+' sauvegardes conservées</small></div>'+changed.slice(0,6).map(x=>'<p>✦ '+esc(slots[Number(x.slot)]||('Emplacement '+x.slot))+' : '+esc(x.name||('Objet '+x.id))+'</p>').join(''):'<p>Une deuxième sauvegarde différente permettra de comparer tes équipements.</p>';
 $('#binch-equipment-summary').innerHTML=same?'<article><strong>'+esc(imported.name)+'</strong><span>Niveau '+Number(imported.level||1)+' · '+esc(imported.zone||'zone inconnue')+'</span><small>'+equipment.length+' pièce(s) équipées · '+inventory.length+' piles · '+total+' unités · '+rare+' rares ou mieux</small><small>'+(validDate?'Import : '+last.toLocaleString('fr-FR'):'Date de sauvegarde inconnue')+'</small></article>':
 '<article class="empty"><strong>Inventaire non confirmé pour ce personnage</strong><span>Le profil sélectionné ne correspond pas au dernier import. Synchronise ton personnage pour éviter un mélange de sacs.</span></article>';
 const bySlot=new Map(equipment.filter(x=>Number.isInteger(Number(x.slot))&&Number(x.slot)>0).map(x=>[Number(x.slot),x]));
 const primary=[1,2,3,5,6,7,8,10,15,16,17,18],secondary=Object.keys(slots).map(Number).filter(x=>!primary.includes(x));
 const card=(slot,compact=false)=>{const item=bySlot.get(slot),qualityId=qualityOf(item);
  return '<article class="binch-slot q'+qualityId+(compact?' compact':'')+'"><span>'+slot+'</span><div><small>'+slots[slot]+'</small><strong>'+(item?esc(item.name||('Objet '+item.id)):'Emplacement vide')+'</strong></div>'+(item?'<em>'+quality[qualityId]+'</em>':'')+'</article>'};
 $('#binch-equipment-slots').innerHTML='<div class="binch-paperdoll"><i></i><span class="head"></span><span class="body"></span><span class="arms"></span><span class="legs"></span><b>'+esc(same?profile.race:'Aventurier')+'<small>'+esc(same?profile.classe:'Classe inconnue')+'</small></b></div><div class="binch-gear-left">'+primary.slice(0,6).map(x=>card(x)).join('')+'</div><div class="binch-gear-right">'+primary.slice(6).map(x=>card(x)).join('')+'</div><div class="binch-gear-extra">'+secondary.map(x=>card(x,true)).join('')+'</div>';
 const rows=inventory.filter(x=>qualityOf(x)>=minQuality&&(!q||String(x.name||'').toLocaleLowerCase('fr').includes(q)||String(x.id).includes(q)));
 rows.sort((a,b)=>sort==='quality'?qualityOf(b)-qualityOf(a)||String(a.name||'').localeCompare(String(b.name||''),'fr'):sort==='count'?countOf(b)-countOf(a):sort==='name'?String(a.name||'').localeCompare(String(b.name||''),'fr'):(Number(a.bag)||0)-(Number(b.bag)||0)||(Number(a.slot)||0)-(Number(b.slot)||0));
 $('#binch-bag-summary').textContent=rows.length+' pile(s) affichée(s) · '+rows.reduce((n,x)=>n+countOf(x),0)+' unités · '+(same?'données du dernier import':'données indisponibles');
 $('#binch-bag-list').innerHTML=rows.length?rows.map(item=>'<article class="binch-bag-item q'+qualityOf(item)+'"><span>◆</span><div><strong>'+esc(item.name||('Objet '+item.id))+'</strong><small>Sac '+Number(item.bag||0)+' · emplacement '+Number(item.slot||0)+' · #'+Number(item.id||0)+'</small></div><b>× '+countOf(item)+'</b></article>').join(''):'<p class="binch-equipment-empty">'+(inventory.length?'Aucun objet ne correspond aux filtres.':'Aucun objet confirmé dans la dernière sauvegarde de ce personnage.')+'</p>';
}

const start=()=>setTimeout(mount,0);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();document.addEventListener('grimoire:sync',render);window.addEventListener('storage',e=>{if(e.key==='grimoire.bridge.last'||e.key==='grimoire.hub.v3')render()});
})();
