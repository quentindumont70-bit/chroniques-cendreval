/* La Binch — Phase 3: GM tactical board, LFG staging and promise ledger.
   All records are local to this browser; never represent WoW or a shared backend. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.guild.operations.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=120)=>String(s??'').trim().slice(0,n),now=()=>new Date().toISOString();
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
const fresh=()=>({version:1,briefing:'',checklist:{},responses:[],promises:[]});
let data=read(KEY,fresh());if(data?.version!==1||!Array.isArray(data.responses)||!Array.isArray(data.promises))data=fresh();
const id=()=>crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function save(){data.responses=data.responses.slice(-150);data.promises=data.promises.slice(-250);try{localStorage.setItem(KEY,JSON.stringify(data))}catch{};document.dispatchEvent(new Event('binch:operations-change'))}
function navigate(slug,target){const tab=document.querySelector('#app nav.nav [data-page="'+slug+'"]');tab?.click();const el=target?$(target):null;if(el){el.closest('details')?.setAttribute('open','');el.scrollIntoView({block:'start',behavior:'auto'})}}
function exportOperations(){const content=JSON.stringify({format:'binch-guild-operations-v1',exportedAt:now(),operations:data},null,2);const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='la-binch-operations-guilde.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function importOperations(file){
 if(!file||file.size>180000)throw Error('Fichier absent ou trop volumineux');
 const payload=JSON.parse(await file.text()),v=payload?.operations;
 if(payload.format!=='binch-guild-operations-v1'||v?.version!==1||!Array.isArray(v.responses)||!Array.isArray(v.promises)||v.responses.length>150||v.promises.length>250)throw Error('Format de registre incompatible');
 const responses=v.responses.map(x=>{if(!x||!x.id||!x.postId||!x.name||!['Tank','Soigneur','DPS','Flexible'].includes(x.role)||!['yes','maybe','no'].includes(x.status))throw Error('Réponse invalide');return {id:clean(x.id,70),postId:clean(x.postId,70),name:clean(x.name,36),role:x.role,status:x.status,updatedAt:clean(x.updatedAt,40)}});
 const promises=v.promises.map(x=>{if(!x||!x.id||!x.item||!x.owner||!Number.isInteger(Number(x.qty))||Number(x.qty)<1||Number(x.qty)>99999||!['promised','ready','deposited','received'].includes(x.status))throw Error('Promesse invalide');return {id:clean(x.id,70),item:clean(x.item,90),owner:clean(x.owner,40),qty:Number(x.qty),deadline:clean(x.deadline,10),note:clean(x.note,240),status:x.status,createdAt:clean(x.createdAt,40),updatedAt:clean(x.updatedAt,40)}});
 const distinct=arr=>new Set(arr.map(x=>x.id)).size===arr.length;
 if(!distinct(responses)||!distinct(promises))throw Error('Identifiants en double');
 if(!confirm('Remplacer le registre local (promesses et réponses LFG) par '+promises.length+' promesses et '+responses.length+' réponses ?'))return false;
 data={version:1,briefing:clean(v.briefing,1600),checklist:{},responses,promises};
 for(const [k] of checks)data.checklist[k]=v.checklist?.[k]===true;
 save();gmRender();lfgRender();promiseRender();return true;
}
function copy(value){if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(value).catch(()=>window.prompt('Copier',value));window.prompt('Copier',value);return Promise.resolve()}
function profile(){return clean(read('grimoire.hub.v3',{}).data?.pseudo||'',40)}
function events(){const list=read('binch.guild.events.v1',[]);return Array.isArray(list)?list.filter(x=>x&&!x.done).slice(0,100):[]}
function members(){const list=read('binch.guild.roster.v1',{}).members;return Array.isArray(list)?list.slice(0,100):[]}
function requests(){const list=read('binch.guild.planner.v1',{}).requests;return Array.isArray(list)?list.filter(x=>!x.closed).slice(0,200):[]}
function bank(){const list=read('binch.guild.bank.v1',[]);return Array.isArray(list)?list.slice(0,1000):[]}
function drafts(){const list=read('binch.lfg.local.v1',[]);return Array.isArray(list)?list.slice(-100):[]}
function amount(x){return Number.isFinite(Number(x))?Math.max(0,Number(x)):0}
function textRow(label,value){return '<article class="binch-ops-stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></article>'}
const checks=[['announcement','Annonce de sortie préparée'],['group','Composition et rôles confirmés'],['consumables','Consommables et réparations rappelés'],['strategy','Stratégie / mécaniques communiquées'],['summon','Point de rassemblement défini'],['loot','Règles de butin expliquées']];
function gmRender(){
 const host=$('binch-ops-gm');if(!host||!host.isConnected)return;
 const up=events().filter(x=>!x.date||new Date(x.date+'T23:59:59')>=new Date()).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,4),roster=members(),confirmed=roster.filter(x=>x.status==='Confirmé'),plans=requests(),urgent=plans.filter(x=>x.priority==='urgent'),replies=data.responses.filter(x=>x.status==='yes').length;
 $('binch-ops-stats').innerHTML=textRow('Sorties à venir',up.length)+textRow('Effectifs confirmés',confirmed.length)+textRow('Demandes actives',plans.length)+textRow('Demandes urgentes',urgent.length)+textRow('Réponses LFG locales',replies);
 $('binch-ops-next').innerHTML=up.length?up.map(x=>'<div class="binch-ops-list-row"><strong>'+esc(x.title||'Sortie')+'</strong><span>'+esc(x.date||'Date libre')+' '+esc(x.time||'')+'</span><small>'+esc((x.attendees||[]).filter(a=>a.status==='Confirmé').length)+' confirmé(s) sur '+amount(x.size)+' places · '+((x.attendees||[]).filter(a=>a.status==='Confirmé'&&a.role==='Tank').length?'Tank présent':'Tank non confirmé')+' · '+((x.attendees||[]).filter(a=>a.status==='Confirmé'&&a.role==='Soigneur').length?'Soigneur présent':'Soigneur non confirmé')+'</small></div>').join(''):'<p>Aucune sortie planifiée dans le calendrier local.</p>';
 $('binch-ops-alerts').innerHTML=urgent.length?urgent.slice(0,5).map(x=>'<div class="binch-ops-list-row"><strong>'+esc(x.title||'Demande')+'</strong><small>Urgent · '+amount(x.quantity)+' demandé(s) · '+esc(x.creator||'Guilde')+'</small></div>').join(''):'<p>Pas de demande urgente déclarée.</p>';
 if(document.activeElement!==$('binch-ops-briefing'))$('binch-ops-briefing').value=data.briefing||'';
 $('binch-ops-checks').innerHTML=checks.map(([k,label])=>'<label><input type="checkbox" data-ops-check="'+k+'"'+(data.checklist?.[k]?' checked':'')+'><span>'+esc(label)+'</span></label>').join('');
 $('binch-ops-check-count').textContent=checks.filter(([k])=>data.checklist?.[k]).length+' / '+checks.length+' préparatifs cochés (manuellement)';
}
function gmMount(){
 const page=$('page-gm'),anchor=$('binch-gm-hub');if(!page||!anchor||$('binch-ops-gm'))return;
 const el=document.createElement('section');el.id='binch-ops-gm';el.className='binch-ops';
 el.innerHTML='<header><div><span class="eyebrow">ÉTAT-MAJOR · TABLEAU TACTIQUE</span><h2>Briefing du maître de guilde</h2><p>Synthèse des registres locaux. Aucune confirmation automatique depuis WoW ni Discord.</p></div><div class="binch-ops-head-actions"><button id="binch-ops-refresh" type="button">Actualiser les registres</button><button id="binch-ops-export" type="button">Exporter le registre</button><label class="binch-ops-import">Importer JSON<input id="binch-ops-import-file" type="file" accept=".json,application/json" hidden></label></div></header><div id="binch-ops-stats" class="binch-ops-stats"></div><div class="binch-ops-columns"><section><h3>Prochaines sorties</h3><div id="binch-ops-next"></div><button type="button" data-ops-go="calendar">Gérer les sorties</button></section><section><h3>Approvisionnement prioritaire</h3><div id="binch-ops-alerts"></div><button type="button" data-ops-go="planner">Ouvrir le Guild Planner</button></section></div><div class="binch-ops-columns"><section><h3>Checklist avant départ</h3><div id="binch-ops-checks" class="binch-ops-checks"></div><p id="binch-ops-check-count"></p><button type="button" id="binch-ops-check-reset">Réinitialiser la checklist</button></section><section><h3>Briefing GM</h3><textarea id="binch-ops-briefing" rows="5" maxlength="1600" placeholder="Objectif, composition, horaires, mécanique difficile, consommables…"></textarea><button type="button" id="binch-ops-briefing-copy">Copier briefing pour Discord</button><small>Enregistré uniquement sur cet appareil.</small></section></div>';
 anchor.insertAdjacentElement('afterend',el);
 $('binch-ops-refresh').addEventListener('click',gmRender);
 $('binch-ops-export').onclick=exportOperations;
 $('binch-ops-import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{await importOperations(file)}catch(error){alert('Import impossible : '+error.message)}});
 el.querySelectorAll('[data-ops-go]').forEach(b=>b.onclick=()=>{
  const kind=b.dataset.opsGo;if(kind==='calendar'){$('binch-guild-calendar')?.closest('details')?.setAttribute('open','');$('binch-guild-calendar')?.scrollIntoView({behavior:'auto'})}
  else {$('binch-guild-planner')?.setAttribute('open','');$('binch-guild-planner')?.scrollIntoView({behavior:'auto'})}
 });
 $('binch-ops-checks').addEventListener('change',e=>{const node=e.target.closest('[data-ops-check]');if(!node)return;data.checklist[node.dataset.opsCheck]=node.checked;save();$('binch-ops-check-count').textContent=checks.filter(([k])=>data.checklist[k]).length+' / '+checks.length+' préparatifs cochés (manuellement)'});
 $('binch-ops-check-reset').onclick=()=>{data.checklist={};save();gmRender()};
 $('binch-ops-briefing').addEventListener('input',e=>{data.briefing=e.target.value.slice(0,1600);save()});
 $('binch-ops-briefing-copy').onclick=()=>copy(['LA BINCH · BRIEFING GUILDE',data.briefing||'À renseigner',...checks.map(([k,v])=>(data.checklist[k]?'[x] ':'[ ] ')+v)].join('\n'));
 document.addEventListener('binch:roster-change',gmRender);
 document.addEventListener('binch:operations-change',()=>{if(page.classList.contains('active'))gmRender()});
 window.addEventListener('storage',e=>{if(['binch.guild.events.v1','binch.guild.planner.v1','binch.guild.roster.v1'].includes(e.key))gmRender()});
 gmRender();
}
function lfgRender(){
 const host=$('binch-ops-lfg');if(!host||!host.isConnected)return;
 const list=$('binch-ops-lfg-rows'),q=clean($('binch-ops-lfg-search').value,80).toLocaleLowerCase('fr');
 const posts=drafts().filter(x=>!q||String(x.dungeon||'').toLocaleLowerCase('fr').includes(q)||String(x.author||'').toLocaleLowerCase('fr').includes(q));
 const all=data.responses.filter(x=>posts.some(p=>p.id===x.postId));
 $('binch-ops-lfg-count').textContent=posts.length+' brouillon(s) locaux · '+all.filter(x=>x.status==='yes').length+' réponse(s) partant déclarée(s)';
 list.innerHTML=posts.length?posts.map(p=>{
  const people=data.responses.filter(x=>x.postId===p.id),yes=people.filter(x=>x.status==='yes'),maybe=people.filter(x=>x.status==='maybe');
  return '<article class="binch-ops-lfg-post"><header><div><h4>'+esc(p.dungeon||'Activité')+'</h4><small>'+esc(p.author||'Auteur')+' · '+esc(p.when?new Date(p.when).toLocaleString('fr-FR'):'Horaire à convenir')+'</small></div><span>'+yes.length+' partant(s) · '+maybe.length+' incertain(s) / '+amount(p.places)+' places recherchées</span></header><form data-ops-lfg-form="'+esc(p.id)+'"><input name="name" required maxlength="36" placeholder="Personnage" aria-label="Personnage"><select name="role" aria-label="Rôle"><option>Tank</option><option>Soigneur</option><option>DPS</option><option>Flexible</option></select><select name="status" aria-label="Disponibilité"><option value="yes">Partant</option><option value="maybe">Peut-être</option><option value="no">Absent</option></select><button type="submit">Enregistrer une réponse</button></form><div class="binch-ops-people">'+people.map(x=>'<div><span>'+esc(x.name)+' · '+esc(x.role)+' · '+esc({yes:'Partant',maybe:'Peut-être',no:'Absent'}[x.status]||'?')+'</span><button data-ops-lfg-remove="'+esc(x.id)+'" type="button" aria-label="Retirer la réponse de '+esc(x.name)+'">×</button></div>').join('')+'</div><button data-ops-lfg-copy="'+esc(p.id)+'" type="button">Copier l’état des réponses</button></article>';
 }).join(''):'<p>Aucun brouillon LFG local. Crée une annonce dans le formulaire LFG : elle apparaîtra ici. Les annonces cloud sont gérées séparément.</p>';
}
function lfgMount(){
 const page=$('page-lfg'),anchor=$('binch-lfg-cards');if(!page||!anchor||$('binch-ops-lfg'))return;
 const el=document.createElement('section');el.id='binch-ops-lfg';el.className='binch-ops';
 el.innerHTML='<header><div><span class="eyebrow">RECRUTEMENT / ORGANISATION LOCALE</span><h2>Réponses aux annonces</h2><p>Consigne les réponses reçues par message ou Discord pour tes <strong>brouillons locaux</strong>. Ce registre ne publie ni ne récupère les réponses en ligne.</p></div></header><input type="search" id="binch-ops-lfg-search" placeholder="Filtrer les activités et organisateurs"><p id="binch-ops-lfg-count"></p><div id="binch-ops-lfg-rows"></div>';
 anchor.after(el);
 $('binch-ops-lfg-search').oninput=lfgRender;
 el.addEventListener('submit',e=>{const form=e.target.closest('[data-ops-lfg-form]');if(!form)return;e.preventDefault();const fd=new FormData(form),name=clean(fd.get('name'),36),role=String(fd.get('role')),status=String(fd.get('status'));if(name.length<2||!['Tank','Soigneur','DPS','Flexible'].includes(role)||!['yes','maybe','no'].includes(status))return;
 const postId=form.dataset.opsLfgForm;if(!drafts().some(p=>p.id===postId))return;
 const record=data.responses.find(x=>x.postId===postId&&x.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'));
 if(record){record.role=role;record.status=status;record.updatedAt=now()}else data.responses.push({id:id(),postId,name,role,status,updatedAt:now()});
 save();lfgRender();
 });
 el.addEventListener('click',e=>{const remove=e.target.closest('[data-ops-lfg-remove]');if(remove){data.responses=data.responses.filter(x=>x.id!==remove.dataset.opsLfgRemove);save();lfgRender();return}
 const button=e.target.closest('[data-ops-lfg-copy]');if(!button)return;
 const post=drafts().find(p=>p.id===button.dataset.opsLfgCopy);if(!post)return;
 const rows=data.responses.filter(x=>x.postId===post.id);
 copy(['LA BINCH · RÉPONSES LOCALES',post.dungeon||'Activité',post.when||'Horaire à convenir',...rows.map(x=>x.name+' — '+x.role+' — '+({yes:'Partant',maybe:'Peut-être',no:'Absent'}[x.status])),'Réponses consignées manuellement, pas de synchronisation Discord.'].join('\n'));
 });
 const refreshLocal=()=>{const ids=new Set(drafts().map(p=>p.id));const retained=data.responses.filter(x=>ids.has(x.postId));if(retained.length!==data.responses.length){data.responses=retained;save()}lfgRender()};
 document.addEventListener('binch:lfg-local-change',refreshLocal);
 window.addEventListener('storage',e=>{if(e.key==='binch.lfg.local.v1')refreshLocal()});
 lfgRender();
}
function promiseRender(){
 const host=$('binch-ops-promises');if(!host||!host.isConnected)return;
 const query=clean($('binch-ops-promise-search').value,80).toLocaleLowerCase('fr'),filter=$('binch-ops-promise-filter').value;
 const rows=data.promises.filter(x=>(filter==='all'||x.status===filter)&&(!query||[x.item,x.owner,x.note].join(' ').toLocaleLowerCase('fr').includes(query)));
 const currentRequests=requests();const matchDemand=item=>currentRequests.filter(r=>String(r.title||'').toLocaleLowerCase('fr')===String(item).toLocaleLowerCase('fr')).length;
 const count=data.promises.filter(x=>x.status!=='received').length;
 $('binch-ops-promise-count').textContent=count+' engagement(s) à confirmer · '+data.promises.filter(x=>x.status==='received').length+' réception(s) déclarée(s) · registre distinct du coffre physique';
 $('binch-ops-promise-rows').innerHTML=rows.length?rows.slice().reverse().map(x=>'<article class="binch-ops-promise"><div><strong>'+esc(x.item)+'</strong><small>× '+x.qty+' · '+esc(x.owner)+' · '+esc(x.deadline||'Sans échéance')+' · '+matchDemand(x.item)+' demande(s) Guild Planner portant exactement ce nom</small><p>'+esc(x.note||'')+'</p></div><select data-ops-promise-status="'+esc(x.id)+'" aria-label="État de la promesse"><option value="promised"'+(x.status==='promised'?' selected':'')+'>Promis</option><option value="ready"'+(x.status==='ready'?' selected':'')+'>Disponible</option><option value="deposited"'+(x.status==='deposited'?' selected':'')+'>Dépôt annoncé</option><option value="received"'+(x.status==='received'?' selected':'')+'>Réception confirmée manuellement</option></select><button type="button" data-ops-promise-delete="'+esc(x.id)+'">Supprimer</button></article>').join(''):'<p>Aucun engagement dans cette sélection.</p>';
}
function promiseMount(){
 const page=$('page-coffre'),anchor=$('binch-chest-physical-items');if(!page||!anchor||$('binch-ops-promises'))return;
 const section=document.createElement('section');section.id='binch-ops-promises';section.className='binch-ops';
 section.innerHTML='<header><div><span class="eyebrow">COFFRE DES PROMESSES / REGISTRE LOCAL</span><h2>Les engagements des membres</h2><p>Un objet promis n’est jamais compté comme stock réel. « Réception confirmée » signifie seulement qu’un officier l’a déclaré manuellement.</p></div><button type="button" id="binch-ops-promise-copy">Copier pour Discord</button></header><form id="binch-ops-promise-form"><label>Objet<input name="item" required maxlength="90" placeholder="Ex. Feuillerêve"></label><label>Quantité<input name="qty" type="number" required min="1" max="99999" value="1"></label><label>Personnage<input name="owner" maxlength="40" required placeholder="Nom en jeu"></label><label>Échéance<input name="deadline" type="date"></label><label>Précisions<input name="note" maxlength="240" placeholder="Pour quelle sortie ?"></label><button type="submit">Enregistrer la promesse</button></form><div class="binch-ops-promise-controls"><input id="binch-ops-promise-search" type="search" placeholder="Chercher un objet / membre"><select id="binch-ops-promise-filter"><option value="all">Tous les statuts</option><option value="promised">Promis</option><option value="ready">Disponible</option><option value="deposited">Dépôt annoncé</option><option value="received">Réception confirmée</option></select></div><p id="binch-ops-promise-count"></p><div id="binch-ops-promise-rows"></div>';
 const host=anchor.closest('.binch-chest-physical');if(host)host.insertAdjacentElement('afterend',section);else page.append(section);
 $('binch-ops-promise-form').addEventListener('submit',e=>{
  e.preventDefault();const form=e.target,fd=new FormData(form),item=clean(fd.get('item'),90),owner=clean(fd.get('owner'),40),qty=Number(fd.get('qty')),deadline=String(fd.get('deadline')||'');
  if(item.length<2||owner.length<2||!Number.isInteger(qty)||qty<1||qty>99999||data.promises.length>=250)return;
  if(deadline&&!/^\d{4}-\d{2}-\d{2}$/.test(deadline))return;
  data.promises.push({id:id(),item,owner,qty,deadline,note:clean(fd.get('note'),240),status:'promised',createdAt:now()});save();form.reset();promiseRender();
 });
 $('binch-ops-promise-search').oninput=promiseRender;$('binch-ops-promise-filter').onchange=promiseRender;
 $('binch-ops-promise-rows').addEventListener('change',e=>{const select=e.target.closest('[data-ops-promise-status]');if(!select)return;const x=data.promises.find(x=>x.id===select.dataset.opsPromiseStatus);if(!x)return;
  if(select.value==='received'&&x.status!=='received'&&!confirm('Confirmer MANUELLEMENT la réception de '+x.qty+' × '+x.item+' ? Aucune vérification en jeu.')){promiseRender();return}
  if(!['promised','ready','deposited','received'].includes(select.value))return;x.status=select.value;x.updatedAt=now();save();promiseRender();
 });
 $('binch-ops-promise-rows').addEventListener('click',e=>{const b=e.target.closest('[data-ops-promise-delete]');if(!b)return;const x=data.promises.find(x=>x.id===b.dataset.opsPromiseDelete);if(x&&confirm('Supprimer cette promesse ?')){data.promises=data.promises.filter(y=>y!==x);save();promiseRender()}});
 $('binch-ops-promise-copy').onclick=()=>copy(['LA BINCH · COFFRE DES PROMESSES','Registre déclaré sur un seul appareil · à confirmer en jeu',...data.promises.filter(x=>x.status!=='received').map(x=>x.item+' × '+x.qty+' — '+x.owner+' — '+({promised:'Promis',ready:'Disponible',deposited:'Dépôt annoncé'}[x.status])+(x.deadline?' — '+x.deadline:''))].join('\n'));
 promiseRender();
}
function mount(){gmMount();lfgMount();promiseMount()}
const start=()=>setTimeout(mount,0); // Other deferred modules finish mounting first.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();