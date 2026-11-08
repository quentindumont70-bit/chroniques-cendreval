(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}};
const BANK='binch.guild.bank.v1';
const bank=()=>get(BANK,[]);
const save=rows=>localStorage.setItem(BANK,JSON.stringify(rows));
function go(slug){
 const page=$('#page-'+slug);if(!page)return;
 document.querySelectorAll('#app .page').forEach(x=>x.classList.toggle('active',x===page));
 document.querySelectorAll('#app nav.nav [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===slug));
 window.scrollTo({top:0,behavior:'instant'});
}
function makeNav(name,text){
 const nav=$('#app nav.nav');if(!nav)return;
 const b=document.createElement('button');b.type='button';b.dataset.page=name;b.textContent=text;nav.append(b);b.addEventListener('click',()=>go(name));
}
function gm(){
 const page=$('#page-gm');if(!page||$('#binch-gm-hub'))return;
 const existing=page.querySelector(':scope > section.panel');
 const details=document.createElement('details');details.className='binch-gm-details';details.innerHTML='<summary>Planifier une sortie et rédiger une annonce</summary>';
 if(existing)details.append(existing);
 const home=document.createElement('section');home.id='binch-gm-hub';home.className='binch-gm-hub';
 home.innerHTML='<div class="binch-gm-banner"><div class="eyebrow">♜ LA BINCH / ÉTAT-MAJOR</div><h1>La guilde, aux petits soins.</h1><p>Répartir les effectifs, organiser les sorties et préparer l’équipement, même quand on a peu de temps.</p><button type="button" data-gm-destination="event">Préparer une sortie ↗</button></div><div class="binch-gm-menu"><button data-gm-destination="event"><span>⚑</span><strong>Sorties & effectifs</strong><small>Annonce, rôles, délégations et briefing</small></button><button data-gm-destination="coffre"><span>▣</span><strong>Coffre de guilde</strong><small>Ressources proposées par les membres</small></button><button data-gm-destination="macros"><span>⌘</span><strong>Macros & raid lead</strong><small>Commandes prêtes à adapter et copier</small></button><button data-gm-destination="planner"><span>⚑</span><strong>Guild Planner</strong><small>Demandes, promesses, recettes et autonomie des métiers</small></button><button data-gm-destination="bibliotheque"><span>▤</span><strong>Bibliothèque</strong><small>Encyclopédie, boss, donjons et récits</small></button></div><p class="binch-gm-note">Les ressources déclarées sont stockées localement sur cet appareil. Le partage cloud entre membres n’est pas encore activé.</p>';
 page.prepend(home);page.append(details);
 home.addEventListener('click',e=>{
 const b=e.target.closest('[data-gm-destination]');if(!b)return;
 if(b.dataset.gmDestination==='event'){details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'});}
 else if(b.dataset.gmDestination==='planner'){const planner=$('#binch-guild-planner');if(planner){planner.open=true;planner.scrollIntoView({behavior:'smooth',block:'start'});}else alert('Guild Planner non chargé. Actualise la page.');}
 else go(b.dataset.gmDestination);
 });
}
const MACROS=[
 ['Combat','Attaquer ma cible','Tous','#showtooltip\n/startattack\n/cast Nom du sort','Remplacer le nom du sort et vérifier la compatibilité de /startattack.'],
 ['Combat','Attaque du familier','Chasseur, Démoniste','/petattack','Envoie le familier sur la cible.'],
 ['Combat','Rappel du familier','Chasseur, Démoniste','/petpassive\n/petfollow','Évite que le familier continue les attaques.'],
 ['Combat','Interrompre une incantation','Tous','/stopcasting','Commande à placer avant ton propre sort d’interruption.'],
 ['Combat','Arrêter l’attaque','Tous','/stopattack','Utile avant certains contrôles de foule.'],
 ['Combat','Utiliser un consommable','Tous','/use Nom de l’objet','Remplacer le nom par celui de l’objet.'],
 ['Combat','Attaque et sort','Classes physiques','#showtooltip\n/startattack\n/cast Nom du sort','Remplacer par une compétence utilisable.'],
 ['Combat','Changer arme main droite','Classes armées','/equipslot 16 Nom de l’arme','Tester la prise en charge sur le client Forever.'],
 ['Groupe','Assister un joueur','Tous','/assist NomDuJoueur','Cible la cible du joueur indiqué.'],
 ['Groupe','Assister le tank','Groupe','/assist NomDuTank','Remplacer par le véritable nom du tank.'],
 ['Groupe','Inviter un membre','Leader','/invite NomDuJoueur','Nécessite d’être autorisé à inviter.'],
 ['Groupe','Message au groupe','Groupe','/p Tous prêts pour le prochain combat ?','Message copiable.'],
 ['Groupe','Message de guilde','Guilde','/g Une sortie se prépare !','Annonce dans le canal guilde.'],
 ['Groupe','Quitter un groupe','Tous','/leave','À utiliser avec prudence.'],
 ['Raid lead','Annonce pull','Leader ou assistant','/rw PULL dans 5 secondes !','Les annonces raid exigent les droits correspondants.'],
 ['Raid lead','Annonce pause','Leader ou assistant','/rw Pause : regen, buffs et réparations.','Annonce de coordination.'],
 ['Raid lead','Annonce interruption','Leader ou assistant','/rw Interrompez la prochaine incantation !','Préparer la rotation avec les joueurs.'],
 ['Raid lead','Annonce dispell','Leader ou assistant','/rw Dissipez les effets dangereux sur le groupe !','Générique : adapter au boss.'],
 ['Raid lead','Annonce mouvement','Leader ou assistant','/rw Écartez-vous des zones au sol !','Générique : adapter au boss.'],
 ['Raid lead','Annonce loot','Leader ou assistant','/rw Attendez la répartition avant de ramasser.','Message de coordination.'],
 ['Raid lead','Focus sur tank','Leader ou assistant','/assist NomDuTank\n/rw Assistance sur la cible du tank','Tester les droits et éviter le spam.'],
 ['Raid lead','Rappel consommables','Leader ou assistant','/rw Vérifiez buffs, potions et bandages.','Avant le pull.'],
 ['Utilitaire','Marque étoile','Chef de raid','/script SetRaidTarget("target",1)','API à confirmer sur le client Forever.'],
 ['Utilitaire','Effacer marque','Chef de raid','/script SetRaidTarget("target",0)','API et droits à confirmer.']
];
function macros(){
 const main=$('#app main');if(!main||$('#page-macros'))return;makeNav('macros','Macros');
 const page=document.createElement('section');page.id='page-macros';page.className='page';
 page.innerHTML='<section class="panel section binch-macros"><div class="eyebrow">LES COMMANDES DE L’AVENTURIER</div><h2>Macros & raid lead</h2><p>Commandes classiques à adapter dans <code>/macro</code>. La compatibilité précise avec WoW Forever doit être testée en jeu.</p><div class="binch-macro-controls"><input type="search" id="binch-macro-query" placeholder="Rechercher un sort ou un usage…"><select id="binch-macro-filter"><option value="">Toutes les catégories</option><option>Combat</option><option>Groupe</option><option>Raid lead</option><option>Utilitaire</option></select></div><div id="binch-macro-list" class="binch-macro-list"></div></section>';
 main.append(page);
 const render=()=>{
  const q=$('#binch-macro-query').value.toLowerCase(),cat=$('#binch-macro-filter').value;
  const found=MACROS.map((m,i)=>({m,i})).filter(x=>(!cat||x.m[0]===cat)&&(!q||x.m.join(' ').toLowerCase().includes(q)));
  $('#binch-macro-list').innerHTML=found.map(({m,i})=>'<article class="binch-macro-item"><div class="binch-macro-meta"><span>'+esc(m[0])+'</span><small>'+esc(m[2])+'</small></div><h3>'+esc(m[1])+'</h3><pre>'+esc(m[3])+'</pre><p>'+esc(m[4])+'</p><button type="button" data-copy-macro="'+i+'">Copier la macro ↗</button></article>').join('')||'<p>Aucun résultat.</p>';
 };
 $('#binch-macro-query').oninput=render;$('#binch-macro-filter').onchange=render;
 page.addEventListener('click',async e=>{
 const b=e.target.closest('[data-copy-macro]');if(!b)return;const m=MACROS[Number(b.dataset.copyMacro)];if(!m)return;
 try{await navigator.clipboard.writeText(m[3]);b.textContent='Copiée ✓'}catch{window.prompt('Copier la macro',m[3])}
 });
 render();
}
function chest(){
 const main=$('#app main');if(!main||$('#page-coffre'))return;makeNav('coffre','Coffre');
 const page=document.createElement('section');page.id='page-coffre';page.className='page';
 page.innerHTML='<section class="panel section binch-chest"><header><div><div class="eyebrow">L’INTENDANCE DE GUILDE</div><h2>Le coffre de guilde</h2><p>Les objets déposés physiquement d’abord, les engagements des membres ensuite. Aucune connexion directe au coffre de WoW.</p></div><div class="binch-chest-seal"><span>▣</span><b>REGISTRE LOCAL</b><small>À confirmer avec le propriétaire</small></div></header><section class="binch-chest-physical"><div class="eyebrow">01 · STOCK PHYSIQUE DÉCLARÉ</div><h3>Le coffre de guilde</h3><p>Inventaire manuel : les quantités doivent être confirmées en jeu par un officier.</p><div id="binch-chest-physical-items"></div></section><details class="binch-chest-register"><summary>＋ Déclarer un objet / dépôt / promesse</summary><form id="binch-chest-form"><label>Objet<input id="binch-chest-item" required maxlength="90" placeholder="Ex. : Étoffe de lin"></label><label>Quantité disponible<input id="binch-chest-count" required type="number" min="1" max="99999" value="1"></label><label>Réservée<input id="binch-chest-reserved" required type="number" min="0" max="99999" value="0"></label><label>Personnage<input id="binch-chest-owner" maxlength="50" placeholder="Nom du personnage"></label><label>Emplacement<select id="binch-chest-place"><option>Sacs du personnage</option><option>Banque personnelle</option><option>Coffre physique de guilde</option></select></label><label>Disponibilité<select id="binch-chest-status"><option value="available">Disponible</option><option value="reserved">Réservé</option><option value="on-request">Sur demande</option></select></label><button type="submit">Inscrire dans le registre</button></form></details><section class="binch-chest-promises"><div class="eyebrow">02 · ENGAGEMENTS À RÉCUPÉRER</div><h3>Le coffre des promesses</h3><p>Ressources proposées qui ne sont pas encore confirmées dans le coffre de guilde.</p><div class="binch-chest-bar"><strong id="binch-chest-total">0 ressources</strong><div class="binch-chest-filters"><button type="button" data-chest-filter="all" class="active">Toutes</button><button type="button" data-chest-filter="available">Disponibles</button><button type="button" data-chest-filter="reserved">Réservées</button></div><button type="button" id="binch-chest-share">Copier pour Discord</button><button type="button" id="binch-chest-export">Exporter JSON</button><label class="binch-chest-upload">Importer<input type="file" id="binch-chest-import" accept=".json,application/json" hidden></label></div><div id="binch-chest-items"></div></section><p class="binch-chest-warning">Le futur partage cloud nécessitera comptes, permissions et consentement. Ce registre reste sur cet appareil ; ne communique pas tes SavedVariables.</p></section>';
 main.append(page);
 let activeFilter='all';
 const labels={available:'Disponible',reserved:'Réservé','on-request':'Sur demande'};
 const row=x=>{const status=x.status||'available',reserved=Math.min(Number(x.count)||0,Math.max(0,Number(x.reserved)||0)),free=Math.max(0,(Number(x.count)||0)-reserved);return '<article class="binch-chest-row status-'+esc(status)+'"><span class="binch-chest-gem">◆</span><span><small>'+esc(labels[status]||labels.available)+'</small><b>'+esc(x.item)+'</b><em>'+esc(x.owner)+' · '+esc(x.place)+'</em></span><div class="binch-chest-amount"><strong>× '+Number(x.count||0)+'</strong><small>'+free+' libre(s) · '+reserved+' réservée(s)</small></div><button type="button" data-del-chest="'+esc(x.id)+'" aria-label="Retirer cette ressource">×</button></article>'};
 const render=()=>{
  const all=bank(),physical=all.filter(x=>x.place==='Coffre physique de guilde'),pending=all.filter(x=>x.place!=='Coffre physique de guilde');
  const rows=pending.filter(x=>activeFilter==='all'||(x.status||'available')===activeFilter);
  $('#binch-chest-total').textContent=physical.length+' dépôt(s) déclaré(s) · '+pending.length+' promesse(s)';
  document.querySelectorAll('[data-chest-filter]').forEach(b=>b.classList.toggle('active',b.dataset.chestFilter===activeFilter));
  $('#binch-chest-physical-items').innerHTML=physical.length?physical.map(row).join(''):'<p class="binch-chest-empty">Aucun dépôt déclaré sur cet appareil. Ce tableau ne lit pas la banque du jeu.</p>';
  $('#binch-chest-items').innerHTML=rows.length?rows.map(row).join(''):'<p class="binch-chest-empty">Aucune promesse correspondant à ce filtre.</p>';
 };
 document.querySelectorAll('[data-chest-filter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.chestFilter;render()});
 $('#binch-chest-form').onsubmit=e=>{
  e.preventDefault();const item=$('#binch-chest-item').value.trim(),n=Number($('#binch-chest-count').value),reserved=Number($('#binch-chest-reserved').value),owner=$('#binch-chest-owner').value.trim()||get('grimoire.hub.v3',{}).data?.pseudo||'Membre';
  if(!item||!Number.isInteger(n)||n<1||n>99999||!Number.isInteger(reserved)||reserved<0||reserved>n)return;
  const rows=bank();rows.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2),item,count:n,reserved,owner,place:$('#binch-chest-place').value,status:$('#binch-chest-status').value});save(rows);$('#binch-chest-item').value='';$('#binch-chest-count').value='1';$('#binch-chest-reserved').value='0';render();
 };
 page.addEventListener('click',e=>{
  const b=e.target.closest('[data-del-chest]');if(!b)return;const rows=bank(),x=rows.find(r=>r.id===b.dataset.delChest);if(!x||!confirm('Retirer '+x.item+' ?'))return;save(rows.filter(r=>r.id!==x.id));render();
 });
 $('#binch-chest-share').onclick=async()=>{
  const txt=['LA BINCH — RESSOURCES DE GUILDE','Déclarations locales, à confirmer avec chaque propriétaire','',...bank().map(x=>x.count+' × '+x.item+' — '+x.owner+' · '+(labels[x.status||'available']||labels.available)+' · '+(Number(x.reserved)||0)+' réservée(s) · '+x.place)].join('\n');
  try{await navigator.clipboard.writeText(txt);$('#binch-chest-share').textContent='Copié ✓'}catch{window.prompt('Copier la liste',txt)}
 };
 $('#binch-chest-export').onclick=()=>{
  const json={format:'la-binch-chest-v2',exportedAt:new Date().toISOString(),resources:bank()};
  const blob=new Blob([JSON.stringify(json,null,2)],{type:'application/json'}),link=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=link;a.download='la-binch-coffre.json';a.click();setTimeout(()=>URL.revokeObjectURL(link),1500);
 };
 $('#binch-chest-import').onchange=async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file||file.size>250000)return alert('Fichier absent ou trop volumineux.');
  try{
   const data=JSON.parse(await file.text());
   if(!['la-binch-chest-v1','la-binch-chest-v2'].includes(data.format)||!Array.isArray(data.resources)||data.resources.length>300)throw Error('Format de coffre non reconnu.');
   const valid=data.resources.map(x=>{
    if(!x||typeof x!=='object'||typeof x.item!=='string'||!x.item.trim()||x.item.length>90||!Number.isInteger(Number(x.count))||Number(x.count)<1||Number(x.count)>99999||typeof x.owner!=='string'||x.owner.length>50||typeof x.place!=='string'||x.place.length>100)throw Error('Données invalides.');
    const reserved=Math.min(Number(x.count),Math.max(0,Number(x.reserved)||0)),status=['available','reserved','on-request'].includes(x.status)?x.status:'available';
    return {id:String(x.id||'').slice(0,100),item:x.item.trim(),count:Number(x.count),reserved,owner:x.owner.trim(),place:x.place,status};
   });
   if(!confirm('Importer '+valid.length+' propositions ? Les doublons seront fusionnés par identifiant et les propositions existantes conservées.'))return;
   const current=bank(),ids=new Set(current.map(x=>x.id));
   for(const x of valid){if(!x.id||ids.has(x.id))continue;ids.add(x.id);current.push(x)}
   save(current.slice(0,1000));render();
  }catch(err){alert('Import refusé : '+err.message)}
 };
 render();
}
function loot(){
 const main=$('#app main');if(!main||$('#binch-library-loot'))return;
 // Never display the encounter codex outside Bibliotheque.
 // Bibliotheque may be mounted after this script; retry once it appears.
 const lib=$('#page-bibliotheque');
 if(!lib){
  const observer=new MutationObserver(()=>{if($('#page-bibliotheque')){observer.disconnect();loot()}});
  observer.observe(main,{childList:true});
  return;
 }
 const page=document.createElement('section');page.id='binch-library-loot';page.className='binch-library-loot';
 page.innerHTML='<section class="panel section binch-loot-intro"><div class="eyebrow">BESTIAIRE / TRÉSORS D’AZEROTH</div><h2>Le codex des rencontres</h2><p>Explore le premier index des donjons du monde. La stratégie et les butins seront enrichis par boss, uniquement à partir de données sourcées. Les emplacements et taux non confirmés restent volontairement absents.</p><div class="binch-loot-controls"><label>Rechercher une instance<input id="binch-loot-search" type="search" placeholder="Nom, région ou niveau…"></label><label>Continent<select id="binch-loot-continent"><option value="">Tous les continents</option><option>Kalimdor</option><option>Royaumes de l’Est</option><option>Zéphrass</option></select></label><label>Niveau de l’instance<select id="binch-loot-level"><option value="0">Tous niveaux</option><option value="20">Autour du niveau 20</option><option value="30">Autour du niveau 30</option><option value="40">Autour du niveau 40</option><option value="50">Autour du niveau 50</option></select></label></div><div class="binch-loot-count" id="binch-loot-count"></div><div id="binch-loot-grid" class="binch-loot-grid"></div><details class="binch-loot-method"><summary>Couverture et fiabilité du codex</summary><p>La première version indexe les donjons répertoriés dans notre atlas. Ce n’est pas une base exhaustive des raids, rares, boss ni de leurs butins. Les stratégies, cartes intérieures, tables exactes et taux d’obtention exigent une vérification des sources avant publication.</p></details></section>';
 const wrap=document.createElement('details');wrap.className='binch-library-encyclopedia';
 wrap.innerHTML='<summary>⚔ Codex des rencontres <small>Donjons, boss et butins sourcés</small></summary>';
 wrap.append(page);lib.append(wrap);
 function render(){
  const all=Array.isArray(window.GRIMOIRE_DUNGEONS)?window.GRIMOIRE_DUNGEONS:[],q=$('#binch-loot-search').value.trim().toLocaleLowerCase('fr'),cont=$('#binch-loot-continent').value,lvl=Number($('#binch-loot-level').value)||0;
  const matched=all.filter(d=>(!cont||d.continent===cont)&&(!lvl||(Number(d.levels?.[0]||0)<=lvl+6&&Number(d.levels?.[1]||60)>=lvl-6))&&(!q||[d.name,d.zone,d.continent,String(d.levels?.[0]),String(d.levels?.[1])].join(' ').toLocaleLowerCase('fr').includes(q)));
  $('#binch-loot-count').textContent=matched.length+' donjon(s) dans l’index actuel · '+all.length+' au total';
  $('#binch-loot-grid').innerHTML=matched.map(d=>
   '<article class="binch-loot-instance"><div class="binch-loot-instance-top"><span>⚔ Donjon</span><small>NV. '+Number(d.levels?.[0]||0)+'–'+Number(d.levels?.[1]||0)+'</small></div>'+
   '<h3>'+esc(d.name)+'</h3><p>'+esc(d.zone)+' · '+esc(d.continent)+'</p>'+
   '<div class="binch-loot-evidence"><span>Stratégies : à documenter</span><span>Butins : à sourcer</span></div>'+
   '<button type="button" data-loot-map="'+esc(d.zone)+'">Localiser la zone sur l’atlas ↗</button></article>'
  ).join('')||'<div class="binch-loot-empty">Aucune instance pour ces filtres.</div>';
 }
 page.querySelector('#binch-loot-search').addEventListener('input',render);
 page.querySelector('#binch-loot-continent').addEventListener('change',render);
 page.querySelector('#binch-loot-level').addEventListener('change',render);
 page.addEventListener('click',e=>{
  const button=e.target.closest('[data-loot-map]');if(!button)return;
  go('progression');const query=$('#zone-search');
  if(query){query.value=button.dataset.lootMap;query.dispatchEvent(new Event('input',{bubbles:true}));const browser=$('#zone-browser');if(browser)browser.scrollIntoView({behavior:'smooth',block:'start'})}
 });
 render();
}
function init(){gm();macros();chest();loot()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
