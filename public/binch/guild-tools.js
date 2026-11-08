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
 home.innerHTML='<div class="binch-gm-banner"><div class="eyebrow">♜ LA BINCH / ÉTAT-MAJOR</div><h1>La guilde, aux petits soins.</h1><p>Répartir les effectifs, organiser les sorties et préparer l’équipement, même quand on a peu de temps.</p><button type="button" data-gm-destination="event">Préparer une sortie ↗</button></div><div class="binch-gm-menu"><button data-gm-destination="event"><span>⚑</span><strong>Sorties & effectifs</strong><small>Annonce, rôles, délégations et briefing</small></button><button data-gm-destination="coffre"><span>▣</span><strong>Coffre de guilde</strong><small>Ressources proposées par les membres</small></button><button data-gm-destination="macros"><span>⌘</span><strong>Macros & raid lead</strong><small>Commandes prêtes à adapter et copier</small></button><button data-gm-destination="loot"><span>◆</span><strong>Encyclopédie loot</strong><small>Boss, objets, instances et cartes</small></button></div><p class="binch-gm-note">Les ressources déclarées sont stockées localement sur cet appareil. Le partage cloud entre membres n’est pas encore activé.</p>';
 page.prepend(home);page.append(details);
 home.addEventListener('click',e=>{
 const b=e.target.closest('[data-gm-destination]');if(!b)return;
 if(b.dataset.gmDestination==='event'){details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'});}
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
 page.innerHTML='<section class="panel section binch-chest"><div class="eyebrow">L’INTENDANCE DE GUILDE</div><h2>Le coffre des promesses</h2><p>Propose un objet de tes sacs, ta banque personnelle ou du coffre physique. Cette liste est locale et ne transfère aucun objet dans WoW.</p><form id="binch-chest-form"><label>Objet<input id="binch-chest-item" required maxlength="90" placeholder="Ex. : Étoffe de lin"></label><label>Quantité<input id="binch-chest-count" required type="number" min="1" max="99999" value="1"></label><label>Personnage<input id="binch-chest-owner" maxlength="50" placeholder="Nom du personnage"></label><label>Où se trouve-t-il ?<select id="binch-chest-place"><option>Sacs du personnage</option><option>Banque personnelle</option><option>Coffre physique de guilde</option></select></label><button type="submit">Ajouter une ressource</button></form><div class="binch-chest-bar"><strong id="binch-chest-total">0 ressources</strong><button type="button" id="binch-chest-share">Copier la liste pour Discord</button></div><div id="binch-chest-items"></div><p class="binch-chest-warning">Coffre collaboratif cloud prévu ultérieurement : il nécessitera une authentification et une base de données partagée. Ne communique pas tes fichiers SavedVariables.</p></section>';
 main.append(page);
 const render=()=>{const rows=bank();$('#binch-chest-total').textContent=rows.length+' ressource(s) proposée(s)';$('#binch-chest-items').innerHTML=rows.length?rows.map(x=>'<article class="binch-chest-row"><span class="binch-chest-gem">◆</span><span><b>'+esc(x.item)+'</b><small>'+esc(x.owner)+' · '+esc(x.place)+'</small></span><strong>× '+x.count+'</strong><button type="button" data-del-chest="'+esc(x.id)+'" aria-label="Retirer cette ressource">×</button></article>').join(''):'<p class="binch-chest-empty">Aucune ressource déclarée. Les premiers objets proposés apparaîtront ici.</p>'};
 $('#binch-chest-form').onsubmit=e=>{
  e.preventDefault();const item=$('#binch-chest-item').value.trim(),n=Number($('#binch-chest-count').value),owner=$('#binch-chest-owner').value.trim()||get('grimoire.hub.v3',{}).data?.pseudo||'Membre';
  if(!item||!Number.isInteger(n)||n<1||n>99999)return;
  const rows=bank();rows.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2),item,count:n,owner,place:$('#binch-chest-place').value});save(rows);$('#binch-chest-item').value='';render();
 };
 $('#binch-chest-items').onclick=e=>{
  const b=e.target.closest('[data-del-chest]');if(!b)return;const rows=bank(),x=rows.find(r=>r.id===b.dataset.delChest);if(!x||!confirm('Retirer '+x.item+' ?'))return;save(rows.filter(r=>r.id!==x.id));render();
 };
 $('#binch-chest-share').onclick=async()=>{
  const txt=['LA BINCH — RESSOURCES DISPONIBLES','Déclarations locales, à confirmer avec chaque propriétaire','',...bank().map(x=>x.count+' × '+x.item+' — '+x.owner+' ('+x.place+')')].join('\n');
  try{await navigator.clipboard.writeText(txt);$('#binch-chest-share').textContent='Copié ✓'}catch{window.prompt('Copier la liste',txt)}
 };
 render();
}
function loot(){
 const main=$('#app main');if(!main||$('#page-loot'))return;makeNav('loot','Butins');
 const page=document.createElement('section');page.id='page-loot';page.className='page';
 page.innerHTML='<section class="panel section binch-loot-intro"><div class="eyebrow">ATLAS / TRÉSORS D’AZEROTH</div><h2>Bestiaire & butins</h2><p>Nous construisons un codex de boss, raids, donjons et rares, avec carte, résumé des mécaniques et tables d’objets vérifiés. Les taux non documentés ne seront pas inventés.</p><div class="binch-loot-shortcuts"><button data-loot-go="progression">Cartes de zones ↗</button><button data-loot-go="bibliotheque">Guides disponibles ↗</button><button data-loot-go="metiers">Patrons et recettes ↗</button></div><p class="binch-chest-warning">Catalogue exhaustif en préparation. Cette rubrique ne prétend pas encore proposer toutes les tables de loot.</p></section>';
 main.append(page);page.onclick=e=>{const b=e.target.closest('[data-loot-go]');if(b)go(b.dataset.lootGo)};
}
function init(){gm();macros();chest();loot()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();