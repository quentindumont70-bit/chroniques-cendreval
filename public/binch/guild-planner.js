/* La Binch · Guild Planner — première version locale.
 * IMPORTANT : ne pas confondre ce prototype avec la publication partagée.
 * Aucune permission GM n'est vérifiée sans authentification de guilde.
 */
(()=>{'use strict';
const KEY='binch.guild.planner.v1', $=q=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=180)=>String(s??'').trim().slice(0,n);
const profs=['Alchimie','Calligraphie','Couture','Cuisine','Dépeçage','Enchantement','Forge','Herboristerie','Ingénierie','Joaillerie','Minage','Premiers secours','Pêche','Travail du cuir'];
// On sépare les professions historiques et celles qui seraient spécifiques à d'autres extensions.
const alertUnverified=new Set(['Calligraphie','Joaillerie']);
const kindLabel={materials:'Matériaux',recipe:'Recette à apprendre',craft:'Fabrication',misc:'Autre objectif'};
const statusLabel={working:'Je suis sur le coup',ready:'Je les ai déjà',deposited:'Dépôt annoncé',confirmed:'Réception confirmée'};
const newState=()=>({version:1,requests:[],characters:[]});
function read(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&v.version===1&&Array.isArray(v.requests)&&Array.isArray(v.characters)?v:newState()}catch{return newState()}}
let state=read(),tab='requests',reqFilter='open';
function save(){state.requests=state.requests.slice(-200);state.characters=state.characters.slice(-100);try{localStorage.setItem(KEY,JSON.stringify(state));document.dispatchEvent(new Event('binch:planner-change'))}catch{};draw();}
function profile(){try{const p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{};return clean(p.data?.pseudo||p.name||'',40)}catch{return ''}}
function id(){return (window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12))}
function count(r,type){return (r.contributions||[]).filter(c=>!type||c.status===type).reduce((x,c)=>x+Number(c.quantity||0),0)}
function deadline(r){if(!r.deadline)return 'Sans échéance';const d=new Date(r.deadline);return Number.isFinite(+d)?d.toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}):'Échéance à confirmer'}
function isLate(r){return !!r.deadline&&new Date(r.deadline)<Date.now()&&!r.closed&&count(r,'confirmed')<r.quantity}
function challenge(r){const confirmed=count(r,'confirmed'),promised=count(r);return Math.max(0,r.quantity-confirmed)+' restant(s) · '+Math.max(0,promised-confirmed)+' en cours / annoncé(s)'}
function clipboard(str){if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(str).catch(()=>prompt('Copie ce texte :',str));prompt('Copie ce texte :',str);return Promise.resolve()}
function exportJSON(){
 const data={format:'la-binch-guild-planner-v1',exportedAt:new Date().toISOString(),data:state};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='la-binch-guild-planner.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function createRequest(form){
 const title=clean(form.elements.namedItem('item')?.value,90),quantity=Number(form.elements.quantity.value),creator=clean(form.elements.creator.value,40)||profile()||'Membre';
 const deadlineValue=form.elements.deadline.value;
 if(title.length<2||!Number.isInteger(quantity)||quantity<1||quantity>99999){alert('Indique un objectif et une quantité valide.');return}
 if(deadlineValue&&(!Number.isFinite(+new Date(deadlineValue)))){alert('Date invalide.');return}
 state.requests.push({id:id(),kind:form.elements.kind.value,title,quantity,deadline:deadlineValue?new Date(deadlineValue).toISOString():null,
 priority:form.elements.priority.value,creator,note:clean(form.elements.note.value,350),createdAt:new Date().toISOString(),closed:false,contributions:[]});
 save();form.reset();form.elements.creator.value=creator;
}
function contribution(r,action,quantity,person){
 if(r.closed)return;
 if(!person||person.length<2){alert('Renseigne ton nom de personnage.');return}
 const c=r.contributions.find(c=>c.character.toLocaleLowerCase('fr')===person.toLocaleLowerCase('fr'));
 if(action==='confirm'){
  if(!c||c.status!=='deposited'){alert('Il faut d’abord une déclaration de dépôt.');return}
  if(!confirm('Confirmer MANUELLEMENT que '+c.quantity+' × '+r.title+' sont bien dans le coffre ? Cette action ne vérifie pas WoW.'))return;
  c.status='confirmed';c.updatedAt=new Date().toISOString();
  save();
  document.dispatchEvent(new CustomEvent('binch:planner-deposit',{detail:{id:'guild-plan-'+r.id+'-'+c.id,item:r.title,quantity:c.quantity,owner:c.character,verified:'manually-confirmed',requestId:r.id}}));
  return;
 }
 if(!Number.isInteger(quantity)||quantity<1||quantity>r.quantity){alert('Quantité invalide.');return}
 if(c&&c.status==='confirmed'){alert('Ce dépôt a déjà été confirmé. Crée une nouvelle demande pour un nouvel apport.');return}
 if(c){c.status=action;c.quantity=quantity;c.updatedAt=new Date().toISOString()}
 else r.contributions.push({id:id(),character:person,status:action,quantity,updatedAt:new Date().toISOString()});
 save();
}
function card(r){
 const n=Number(r.quantity)||1,confirmed=count(r,'confirmed'),ready=count(r,'ready'),deposited=count(r,'deposited'),working=count(r,'working');
 const contributionRows=(r.contributions||[]).map(c=>'<li><span><b>'+esc(c.character)+'</b> · '+esc(statusLabel[c.status]||c.status)+'</span><strong>× '+Number(c.quantity)+'</strong></li>').join('');
 const open=!r.closed&&confirmed<n;
 const priority=r.priority==='urgent'?'Urgent':r.priority==='high'?'Importante':'Normale';
 const message=['LA BINCH · DEMANDE DE GUILDE',r.title+' · '+n+' × '+kindLabel[r.kind],r.deadline?'Échéance : '+deadline(r):'Date : à convenir','Priorité : '+priority,r.note||'',challenge(r),'Réponds : je suis sur le coup / je les ai / déposé au coffre'].filter(Boolean).join('\n');
 return '<article class="binch-planner-request '+(isLate(r)?'is-late ':'')+(r.closed?'is-closed ':'')+'" data-priority="'+esc(['urgent','high','normal'].includes(r.priority)?r.priority:'normal')+'" data-kind="'+esc(kindLabel[r.kind]?r.kind:'misc')+'" data-request="'+esc(r.id)+'"><header><div><small>'+esc(kindLabel[r.kind]||'Objectif')+' · '+esc(priority)+'</small><h3>'+esc(r.title)+'</h3><p>'+esc(r.note||'Aucune précision.')+'</p></div><div class="binch-planner-tally"><strong>'+confirmed+' / '+n+'</strong><span>réception(s) confirmée(s)</span></div></header>'+
 '<div class="binch-planner-deadline">'+(isLate(r)?'⚑ ÉCHÉANCE DÉPASSÉE · ':'')+esc(deadline(r))+' · par '+esc(r.creator)+(r.closed?' · clôturée':'')+'</div>'+
 '<div class="binch-planner-track" role="progressbar" aria-label="Ressources reçues" aria-valuemin="0" aria-valuemax="'+n+'" aria-valuenow="'+Math.min(n,confirmed)+'"><i style="width:'+Math.min(100,100*confirmed/n)+'%"></i></div>'+
 '<div class="binch-planner-counts"><span>⚒ En cours <b>'+working+'</b></span><span>✦ Disponibles <b>'+ready+'</b></span><span>▣ Dépôts annoncés <b>'+deposited+'</b></span><span>✓ Reçus <b>'+confirmed+'</b></span></div>'+
 (contributionRows?'<details class="binch-planner-contributors"><summary>Voir les engagements ('+r.contributions.length+')</summary><ul>'+contributionRows+'</ul></details>':'')+
 (r.closed?'':'<div class="binch-planner-respond"><label>Mon personnage<input data-answer-character maxlength="40" value="'+esc(profile())+'" placeholder="Nom du personnage"></label><label>Quantité<input data-answer-qty type="number" min="1" max="'+n+'" value="'+Math.max(1,Math.min(n,n-count(r)))+'"></label><button type="button" data-answer="working">⚒ Je suis sur le coup</button><button type="button" data-answer="ready">✦ Je les ai déjà</button><button type="button" data-answer="deposited">▣ Je les ai déposés</button><button type="button" data-answer="confirm">✓ Confirmer réception</button></div>')+
 '<footer><button type="button" class="binch-pin-external" data-route-pin-external="planner:'+esc(r.id)+'" data-route-title="'+esc(r.title)+'" data-route-description="'+esc(challenge(r))+' · '+esc(deadline(r))+'" data-route-category="Guilde" data-route-source="" aria-pressed="'+!!window.BinchPinned?.has('planner:'+r.id)+'">'+(window.BinchPinned?.has('planner:'+r.id)?'★ Épinglé':'☆ Épingler au carnet')+'</button><button type="button" data-request-copy="'+esc(r.id)+'">Copier pour Discord</button><button type="button" data-request-toggle="'+esc(r.id)+'">'+(r.closed?'Rouvrir':'Clôturer')+'</button><button type="button" data-request-delete="'+esc(r.id)+'">Supprimer</button></footer></article>';
}
function drawRequests(){
 const box=$('#binch-planner-requests');if(!box)return;
 const search=clean($('#binch-planner-search')?.value,90).toLocaleLowerCase('fr');
 const rows=state.requests.slice().filter(r=>(reqFilter==='all'||(reqFilter==='late'?isLate(r):reqFilter==='open'?!r.closed&&count(r,'confirmed')<r.quantity:!!r.closed||count(r,'confirmed')>=r.quantity))&&(!search||[r.title,r.kind,r.note,r.creator].join(' ').toLocaleLowerCase('fr').includes(search)));
 rows.sort((a,b)=>Number(isLate(b))-Number(isLate(a))||((b.priority==='urgent')-(a.priority==='urgent'))||new Date(a.deadline||'9999')-new Date(b.deadline||'9999'));
 box.innerHTML=rows.length?rows.map(card).join(''):'<div class="binch-planner-empty">Aucune demande dans cette sélection. Une nouvelle demande peut être préparée dans le formulaire ci-dessus.</div>';
 const total=$('#binch-planner-count');if(total)total.textContent=state.requests.filter(r=>!r.closed&&count(r,'confirmed')<r.quantity).length+' demandes ouvertes';
 document.querySelectorAll('#binch-planner-request-filters [data-request-filter]').forEach(b=>b.classList.toggle('active',b.dataset.requestFilter===reqFilter));
}
function charCard(c){
 const prefs=[c.prof1,c.prof2,c.prof3].filter(Boolean);
 return '<article class="binch-planner-character" data-char="'+esc(c.id)+'"><div><small>'+esc(c.main?'Main':'Reroll')+' · '+esc(c.className||'Classe non indiquée')+' · '+esc(c.availability||'À contacter')+'</small><h3>'+esc(c.character)+'</h3><p>'+prefs.map((v,i)=>esc(v)+' '+Number(c['skill'+(i+1)]||0)+'/300').join(' · ')+'</p><p class="binch-planner-recipes">'+(c.recipes?.length?'Recettes déclarées : '+c.recipes.map(esc).join(' · '):'Recettes non renseignées')+'</p></div><button type="button" data-char-remove="'+esc(c.id)+'">Retirer</button></article>';
}
function drawCharacters(){
 const box=$('#binch-planner-characters');if(!box)return;
 const search=clean($('#binch-prof-search')?.value,100).toLocaleLowerCase('fr');
 const list=state.characters.filter(c=>[c.character,c.className,c.prof1,c.prof2,c.prof3,...(c.recipes||[])].join(' ').toLocaleLowerCase('fr').includes(search));
 box.innerHTML=list.length?list.map(charCard).join(''):'<div class="binch-planner-empty">Aucun personnage renseigné pour cette recherche. Les mains et les rerolls peuvent être ajoutés volontairement.</div>';
 $('#binch-prof-count').textContent=state.characters.length+' personnages déclarés';
}
function independence(){
 const box=$('#binch-planner-independence');if(!box)return;
 const available=profs.filter(p=>state.characters.some(c=>[c.prof1,c.prof2,c.prof3].includes(p)));
 const missing=profs.filter(p=>!available.includes(p)&&!alertUnverified.has(p));
 const recipeGoals=state.requests.filter(r=>r.kind==='recipe');
 const recipeRows=recipeGoals.map(r=>{
  const known=state.characters.filter(c=>(c.recipes||[]).some(x=>x.toLocaleLowerCase('fr')===r.title.toLocaleLowerCase('fr')));
  return '<article><strong>'+esc(r.title)+'</strong><span>'+ (known.length?known.map(c=>esc(c.character)).join(', '):'Personne ne l’a déclarée')+'</span><small>Objectif '+(r.closed?'clôturé':'actif')+'</small></article>';
 });
 box.innerHTML='<div class="binch-planner-coverage"><strong>'+available.length+' / '+(profs.length-alertUnverified.size)+'</strong><span>métiers de référence représentés (déclaratif)</span></div><h3>Métiers non couverts</h3><p>'+(missing.length?missing.map(esc).join(' · '):'Tous les métiers de référence disposent d’au moins un personnage déclaré.')+'</p><h3>Recettes à acquérir</h3><div class="binch-planner-recipe-goals">'+(recipeRows.length?recipeRows.join(''):'<p>Ajoute une demande de type « Recette à apprendre » : elle apparaîtra ici et dans le tableau des missions.</p>')+'</div><p class="binch-planner-source-note">Les compétences et recettes sont déclarées manuellement. Leur compatibilité exacte avec Forever et la connaissance réelle des plans doivent être confirmées en jeu. Ce tableau n’invente aucune recette.</p><button type="button" id="binch-planner-open-recipes">Ouvrir l’Atlas des recettes ↗</button>';
 $('#binch-planner-open-recipes').onclick=()=>navigate('crafting');
}
function draw(){
 const section=$('#binch-guild-planner');if(!section)return;
 section.querySelectorAll('[data-planner-tab]').forEach(b=>b.classList.toggle('active',b.dataset.plannerTab===tab));
 section.querySelectorAll('[data-planner-view]').forEach(s=>s.hidden=s.dataset.plannerView!==tab);
 $('#binch-planner-total-missions').textContent=state.requests.length;
 $('#binch-planner-total-characters').textContent=state.characters.length;
 $('#binch-planner-total-urgent').textContent=state.requests.filter(isLate).length;
 drawRequests();drawCharacters();independence();
}
function navigate(dest){
 const button=document.querySelector('#app nav.nav [data-page="'+dest+'"]');if(button)button.click();
}
function mount(){
 const gm=$('#page-gm');if(!gm||$('#binch-guild-planner'))return;
 const section=document.createElement('details');section.id='binch-guild-planner';section.className='binch-guild-planner';section.open=false;
 section.innerHTML='<summary><span>⚑</span><span><strong>Guild Planner</strong><small>Demandes, métiers, recettes et autonomie de la guilde</small></span><span class="binch-planner-summary-count">Tableau local</span></summary><div class="binch-planner-body">'+
 '<div class="binch-planner-alert"><b>Prototype local non partagé.</b> Les demandes et réponses enregistrées ici ne sont visibles que dans ce navigateur. Les droits GM/officiers ne sont pas encore vérifiés. Ne confonds pas les engagements avec le stock réellement déposé. L’export JSON et Discord permettent un relais manuel provisoire.</div>'+
 '<div class="binch-planner-overview"><div><strong id="binch-planner-total-missions">0</strong><span>Missions</span></div><div><strong id="binch-planner-total-characters">0</strong><span>Personnages déclarés</span></div><div><strong id="binch-planner-total-urgent">0</strong><span>Échéances dépassées</span></div></div>'+
 '<nav class="binch-planner-tabs" aria-label="Guild Planner"><button type="button" data-planner-tab="requests" class="active">Demandes de guilde</button><button type="button" data-planner-tab="characters">Métiers des mains & rerolls</button><button type="button" data-planner-tab="independence">Autonomie & recettes</button></nav>'+
 '<section data-planner-view="requests"><details class="binch-planner-editor"><summary>＋ Préparer une demande GM / officier</summary><form id="binch-planner-request-form"><label>Objectif<input name="item" maxlength="90" placeholder="Ex. 50 Feuillerêves" required></label><label>Type<select name="kind"><option value="materials">Matériaux</option><option value="recipe">Recette à apprendre</option><option value="craft">Fabrication</option><option value="misc">Autre objectif</option></select></label><label>Quantité<input name="quantity" type="number" min="1" max="99999" value="50" required></label><label>Échéance<input name="deadline" type="datetime-local"></label><label>Priorité<select name="priority"><option value="normal">Normale</option><option value="high">Importante</option><option value="urgent">Urgente</option></select></label><label>Demandeur<input name="creator" maxlength="40" placeholder="Nom de personnage" required></label><label class="binch-planner-wide">Précisions<textarea name="note" rows="2" maxlength="350" placeholder="Pour quelle sortie ? Qui réceptionne ?"></textarea></label><button type="submit">Enregistrer cette demande locale</button></form></details><div class="binch-planner-views"><input id="binch-planner-search" type="search" placeholder="Rechercher une demande"><div id="binch-planner-request-filters"><button type="button" data-request-filter="open" class="active">À faire</button><button type="button" data-request-filter="late">En retard</button><button type="button" data-request-filter="all">Toutes</button><button type="button" data-request-filter="closed">Terminées</button></div></div><div id="binch-planner-count"></div><div id="binch-planner-requests"></div></section>'+
 '<section data-planner-view="characters" hidden><p>Chaque joueur peut préparer une fiche pour son main et ses rerolls. Les informations ne sont pas transmises automatiquement à d’autres joueurs.</p><details class="binch-planner-editor"><summary>＋ Déclarer un personnage et ses métiers</summary><form id="binch-prof-form"><label>Personnage<input name="character" maxlength="40" required></label><label>Rang<select name="rank"><option value="main">Main</option><option value="alt">Reroll</option></select></label><label>Classe<input name="className" maxlength="50" placeholder="Chaman, druide…"></label><label>Disponibilité<select name="availability"><option>À contacter</option><option>Disponible pour fabriquer</option><option>Indisponible</option></select></label><label>Métier principal<select name="prof1"><option value="">Non renseigné</option></select></label><label>Compétence<input name="skill1" type="number" min="0" max="300" value="1"></label><label>Métier secondaire<select name="prof2"><option value="">Non renseigné</option></select></label><label>Compétence<input name="skill2" type="number" min="0" max="300" value="1"></label><label>Métier supplémentaire / secondaire<select name="prof3"><option value="">Non renseigné</option></select></label><label>Compétence<input name="skill3" type="number" min="0" max="300" value="1"></label><label class="binch-planner-wide">Recettes clés déjà apprises<textarea name="recipes" rows="3" maxlength="1500" placeholder="Une recette par ligne"></textarea></label><button type="submit">Ajouter au registre local</button></form></details><input id="binch-prof-search" type="search" placeholder="Quel membre sait fabriquer cet objet ?"><div id="binch-prof-count"></div><div id="binch-planner-characters"></div></section>'+
 '<section data-planner-view="independence" hidden><div id="binch-planner-independence"></div></section>'+
 '<footer class="binch-planner-footer"><button type="button" id="binch-planner-export">Exporter le registre JSON</button><label class="binch-planner-import">Importer JSON <input type="file" id="binch-planner-import-input" accept=".json,application/json" hidden></label><button type="button" id="binch-planner-coffre">Ouvrir le coffre ↗</button><p>Pas de synchronisation inter-membres sans base de données et permissions officiers. Les données sont dans ce navigateur uniquement.</p></footer></div>';
 const hub=$('#binch-gm-hub');hub?.after(section);
 if(!hub)gm.prepend(section);
 const person=profile();
 const requestForm=$('#binch-planner-request-form');requestForm.elements.creator.value=person;
 const charForm=$('#binch-prof-form');charForm.elements.character.value=person;
 for(const name of ['prof1','prof2','prof3']){
  const select=charForm.elements[name];
  profs.filter(p=>!alertUnverified.has(p)).forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;select.append(o)});
 }
 section.querySelectorAll('[data-planner-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.plannerTab;draw()});
 requestForm.onsubmit=e=>{e.preventDefault();createRequest(requestForm)};
 charForm.onsubmit=e=>{
  e.preventDefault();
  const v=charForm.elements,character=clean(v.character.value,40);
  if(character.length<2)return alert('Il faut un nom de personnage.');
  const professions=[v.prof1.value,v.prof2.value,v.prof3.value].filter(Boolean);
  if(new Set(professions).size!==professions.length)return alert('Un même métier ne doit pas être inscrit deux fois.');
  const existing=state.characters.find(x=>x.character.toLocaleLowerCase('fr')===character.toLocaleLowerCase('fr'));
  const data={id:existing?.id||id(),character,main:v.rank.value==='main',className:clean(v.className.value,50),availability:v.availability.value,
   prof1:v.prof1.value,prof2:v.prof2.value,prof3:v.prof3.value,
   skill1:Math.min(300,Math.max(0,Number(v.skill1.value)||0)),skill2:Math.min(300,Math.max(0,Number(v.skill2.value)||0)),skill3:Math.min(300,Math.max(0,Number(v.skill3.value)||0)),
   recipes:clean(v.recipes.value,1500).split('\n').map(s=>clean(s,90)).filter(Boolean).slice(0,30)};
  if(existing)Object.assign(existing,data);else state.characters.push(data);
  save();charForm.reset();charForm.elements.character.value=person;
 };
 $('#binch-planner-search').oninput=drawRequests;$('#binch-prof-search').oninput=drawCharacters;
 section.querySelectorAll('[data-request-filter]').forEach(b=>b.onclick=()=>{reqFilter=b.dataset.requestFilter;drawRequests()});
 $('#binch-planner-coffre').onclick=()=>navigate('coffre');
 $('#binch-planner-export').onclick=exportJSON;
 $('#binch-planner-requests').addEventListener('click',async e=>{
  const box=e.target.closest('[data-request]');if(!box)return;
  const r=state.requests.find(x=>x.id===box.dataset.request);if(!r)return;
  if(e.target.closest('[data-route-pin-external]'))return;
  const ans=e.target.closest('[data-answer]');
  if(ans){const name=clean(box.querySelector('[data-answer-character]')?.value,40),qty=Number(box.querySelector('[data-answer-qty]')?.value);
   contribution(r,ans.dataset.answer,qty,name);return}
  if(e.target.closest('[data-request-copy]')){await clipboard(announceRequest(r));return}
  if(e.target.closest('[data-request-toggle]')){r.closed=!r.closed;save();return}
  if(e.target.closest('[data-request-delete]')&&confirm('Supprimer cette demande locale et ses réponses ?')){
   state.requests=state.requests.filter(x=>x!==r);save();
  }
 });
 $('#binch-planner-characters').addEventListener('click',e=>{
  const b=e.target.closest('[data-char-remove]');if(!b||!confirm('Retirer cette fiche du registre local ?'))return;
  state.characters=state.characters.filter(x=>x.id!==b.dataset.charRemove);save();
 });
 $('#binch-planner-import-input').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file||file.size>220000)return alert('Fichier absent ou volumineux.');
  try{const payload=JSON.parse(await file.text());const v=payload?.data;
   if(payload?.format!=='la-binch-guild-planner-v1'||!v||!Array.isArray(v.requests)||!Array.isArray(v.characters)||v.requests.length>200||v.characters.length>100)throw Error('Format inattendu.');
   const safeRequests=v.requests.filter(r=>r&&typeof r.title==='string'&&r.title.length<=90&&Number.isInteger(Number(r.quantity))&&Number(r.quantity)>=1&&Number(r.quantity)<=99999&&Array.isArray(r.contributions)&&r.contributions.length<=100).map(r=>({
    id:clean(r.id,100),kind:kindLabel[r.kind]?r.kind:'misc',title:clean(r.title,90),quantity:Number(r.quantity),deadline:r.deadline&&Number.isFinite(+new Date(r.deadline))?new Date(r.deadline).toISOString():null,priority:['normal','high','urgent'].includes(r.priority)?r.priority:'normal',
    creator:clean(r.creator,40),note:clean(r.note,350),createdAt:clean(r.createdAt,40),closed:!!r.closed,
    contributions:r.contributions.filter(c=>c&&statusLabel[c.status]&&typeof c.character==='string').map(c=>({id:clean(c.id,100),character:clean(c.character,40),status:c.status,quantity:Math.min(99999,Math.max(1,Number(c.quantity)||1)),updatedAt:clean(c.updatedAt,40)}))
   }));
   const safeCharacters=v.characters.filter(c=>c&&typeof c.character==='string').map(c=>({
    id:clean(c.id,100),character:clean(c.character,40),main:!!c.main,className:clean(c.className,50),availability:clean(c.availability,50),
    prof1:profs.includes(c.prof1)?c.prof1:'',prof2:profs.includes(c.prof2)?c.prof2:'',prof3:profs.includes(c.prof3)?c.prof3:'',
    skill1:Math.min(300,Math.max(0,Number(c.skill1)||0)),skill2:Math.min(300,Math.max(0,Number(c.skill2)||0)),skill3:Math.min(300,Math.max(0,Number(c.skill3)||0)),
    recipes:Array.isArray(c.recipes)?c.recipes.slice(0,30).map(s=>clean(s,90)):[]
   }));
   if(!confirm('Remplacer le registre LOCAL par '+safeRequests.length+' demandes et '+safeCharacters.length+' fiches métiers ?'))return;
   state={version:1,requests:safeRequests,characters:safeCharacters};save();
  }catch(error){alert('Import refusé : '+error.message)}
 });
 window.addEventListener('storage',e=>{if(e.key===KEY){state=read();draw()}});
 draw();
}
function announceRequest(r){
 return ['⚔ LA BINCH · APPEL AUX ARTISANS',r.title+' — '+r.quantity+' × '+(kindLabel[r.kind]||'Ressources'),'Échéance : '+deadline(r),'Demandé par '+r.creator,
 r.note||'',challenge(r),'Répondre au GM : je suis sur le coup / je les ai / dépôt prévu'].filter(Boolean).join('\n');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();