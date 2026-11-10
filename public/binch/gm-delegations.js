/* La Binch — Delegation desk V1. All assignments local, explicit and editable. */
(()=>{'use strict';
const STORE='binch.guild.delegations.v1',MAX=120;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=100)=>String(s??'').trim().slice(0,n);
const statuses=['todo','doing','done','blocked'],labels={todo:'À attribuer',doing:'En cours',done:'Terminé',blocked:'Bloqué'};
const priorities=['normal','high','urgent'],id=()=>window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function read(){try{const v=JSON.parse(localStorage.getItem(STORE));return Array.isArray(v)?v.filter(x=>x&&typeof x==='object').slice(-MAX):[]}catch{return []}}
let assignments=read(),filter='open';
function save(){try{localStorage.setItem(STORE,JSON.stringify(assignments));document.dispatchEvent(new Event('binch:delegations-change'));return true}catch{return false}}
function validDate(str){if(!str)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(str))return false;const d=new Date(str+'T12:00:00');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===str}
const late=x=>!!x.due&&validDate(x.due)&&x.due<new Date().toLocaleDateString('en-CA')&&x.status!=='done';
function summary(){
 const active=assignments.filter(x=>x.status!=='done');
 return {active:active.length,urgent:active.filter(x=>x.priority==='urgent').length,overdue:active.filter(late).length,blocked:active.filter(x=>x.status==='blocked').length};
}
function render(){
 const page=$('binch-gm-delegations');if(!page)return;
 const s=summary();$('binch-gm-delegations-summary').textContent=s.active+' mission(s) ouvertes · '+s.urgent+' urgente(s) · '+s.overdue+' en retard · '+s.blocked+' bloquée(s) — registre uniquement local';
 const q=clean($('binch-gm-delegations-query')?.value||'',120).toLocaleLowerCase('fr');
 const rows=assignments.filter(x=>(filter==='all'||filter==='open'&&x.status!=='done'||filter===x.status)&&(!q||[x.title,x.owner,x.note].join(' ').toLocaleLowerCase('fr').includes(q))).sort((a,b)=>Number(b.priority==='urgent')-Number(a.priority==='urgent')||Number(late(b))-Number(late(a))||String(a.due||'9999').localeCompare(String(b.due||'9999')));
 $('binch-gm-delegations-list').innerHTML=rows.length?rows.map(x=>'<article class="binch-delegation-card'+(late(x)?' is-overdue':'')+'"><header><div><small>'+esc(x.priority==='urgent'?'URGENT':x.priority==='high'?'Important':'Normal')+(late(x)?' · ÉCHÉANCE DÉPASSÉE':'')+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.note||'Aucune consigne ajoutée.')+'</p></div><button type="button" data-delegation-remove="'+esc(x.id)+'" aria-label="Supprimer la mission">×</button></header><div class="binch-delegation-meta"><span>Responsable : <strong>'+esc(x.owner||'À attribuer')+'</strong></span><span>Échéance : '+esc(x.due||'À définir')+'</span></div><label>État<select data-delegation-status="'+esc(x.id)+'">'+statuses.map(status=>'<option value="'+status+'"'+(x.status===status?' selected':'')+'>'+labels[status]+'</option>').join('')+'</select></label><button type="button" data-delegation-copy="'+esc(x.id)+'">Copier la mission</button></article>').join(''):'<p>Aucune mission pour cette sélection. Crée une délégation au-dessus.</p>';
}
async function copy(value){try{if(!navigator.clipboard?.writeText)throw Error('Clipboard');await navigator.clipboard.writeText(value);$('binch-gm-delegations-message').textContent='Copié pour Discord.'}catch{window.prompt('Copier',value)}}
function description(x){return ['LA BINCH · MISSION DE GUILDE',x.title,'Responsable : '+(x.owner||'À attribuer'),'Échéance : '+(x.due||'À convenir'),'Priorité : '+(x.priority==='urgent'?'URGENTE':x.priority==='high'?'Importante':'Normale'),'État : '+(labels[x.status]||'À attribuer'),x.note||'','Déclaration locale : confirmer les mises à jour avec le responsable.'].filter(Boolean).join('\n')}
function exportData(){
 const data={format:'binch-guild-delegations-v1',exportedAt:new Date().toISOString(),assignments};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='la-binch-delegations.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1300);
}
async function importData(file){
 if(!file||file.size===0||file.size>180000)throw Error('Fichier absent ou trop volumineux (180 Ko maximum)');
 const payload=JSON.parse(await file.text());
 if(payload?.format!=='binch-guild-delegations-v1'||!Array.isArray(payload.assignments)||payload.assignments.length>MAX)throw Error('Format ou nombre de missions invalide');
 const safe=payload.assignments.map(x=>{
  if(!x||typeof x!=='object'||!x.id||!clean(x.title)||!statuses.includes(x.status)||!priorities.includes(x.priority)||!validDate(x.due||''))throw Error('Mission invalide');
  return {id:clean(x.id,100),title:clean(x.title),owner:clean(x.owner,50),note:clean(x.note,350),due:clean(x.due,10),priority:x.priority,status:x.status,createdAt:clean(x.createdAt,40)};
 });
 if(new Set(safe.map(x=>x.id)).size!==safe.length)throw Error('Identifiants répétés dans le fichier');
 if(!confirm('Fusionner '+safe.length+' missions au registre local ? Les missions existantes restent inchangées.'))return;
 const ids=new Set(assignments.map(x=>x.id));let added=0;
 for(const x of safe){if(ids.has(x.id)||assignments.length>=MAX)continue;assignments.push(x);ids.add(x.id);added++}
 if(!save())throw Error('Écriture locale refusée');
 render();$('binch-gm-delegations-message').textContent=added+' mission(s) importée(s) ; doublons ignorés.';
}
function mount(){
 const home=$('binch-gm-hub');if(!home||$('binch-gm-delegations'))return false;
 const section=document.createElement('section');section.id='binch-gm-delegations';section.className='binch-gm-delegations';
 section.innerHTML='<header><div><div class="eyebrow">ÉTAT-MAJOR / DÉLÉGATION</div><h2>Ordres de mission</h2><p>Qui fait quoi et pour quand ? Assigne des tâches, suis les blocages et prépare des messages Discord. Rien n’est transmis automatiquement.</p></div></header><form id="binch-delegation-form"><label>Mission<input name="title" maxlength="100" required placeholder="Ex. Préparer les consommables du raid"></label><label>Responsable<input name="owner" maxlength="50" placeholder="Personnage ou officier"></label><label>Échéance<input name="due" type="date"></label><label>Priorité<select name="priority"><option value="normal">Normale</option><option value="high">Importante</option><option value="urgent">Urgente</option></select></label><label class="binch-delegation-wide">Consignes<textarea name="note" rows="2" maxlength="350" placeholder="Préparation et contexte"></textarea></label><button type="submit">Créer une mission</button></form><p id="binch-gm-delegations-summary" role="status"></p><div class="binch-delegation-toolbar"><input type="search" id="binch-gm-delegations-query" placeholder="Rechercher une mission"><select id="binch-gm-delegations-filter" aria-label="Filtrer les missions"><option value="open">Ouvertes</option><option value="todo">À attribuer</option><option value="doing">En cours</option><option value="blocked">Bloquées</option><option value="done">Terminées</option><option value="all">Toutes</option></select><button type="button" id="binch-delegations-copy">Copier le briefing</button><button type="button" id="binch-delegations-export">Exporter JSON</button><label>Importer JSON<input id="binch-delegations-import" type="file" accept=".json,application/json"></label></div><div id="binch-gm-delegations-list"></div><p id="binch-gm-delegations-message" role="status" aria-live="polite"></p>';
 home.querySelector('#binch-gm-watch')?.after(section)||home.append(section);
 section.querySelector('#binch-delegation-form').onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target),title=clean(f.get('title')),due=clean(f.get('due'),10);
  if(title.length<2||!validDate(due)||assignments.length>=MAX){$('binch-gm-delegations-message').textContent='Mission invalide ou plafond de 120 atteint.';return}
  assignments.push({id:id(),title,owner:clean(f.get('owner'),50),due,priority:priorities.includes(f.get('priority'))?f.get('priority'):'normal',note:clean(f.get('note'),350),status:'todo',createdAt:new Date().toISOString()});
  if(save()){e.target.reset();render()}else $('binch-gm-delegations-message').textContent='Stockage local indisponible.';
 };
 $('binch-gm-delegations-query').oninput=render;
 $('binch-gm-delegations-filter').onchange=e=>{filter=e.target.value;render()};
 section.addEventListener('change',e=>{const sel=e.target.closest('[data-delegation-status]');if(!sel)return;const x=assignments.find(a=>a.id===sel.dataset.delegationStatus);if(!x)return;x.status=statuses.includes(sel.value)?sel.value:'todo';save();render()});
 section.addEventListener('click',e=>{const remove=e.target.closest('[data-delegation-remove]');if(remove){const x=assignments.find(a=>a.id===remove.dataset.delegationRemove);if(x&&confirm('Supprimer la mission '+x.title+' ?')){assignments=assignments.filter(a=>a.id!==x.id);save();render()}return}
 const button=e.target.closest('[data-delegation-copy]');if(button){const x=assignments.find(a=>a.id===button.dataset.delegationCopy);if(x)copy(description(x))}});
 $('binch-delegations-copy').onclick=()=>copy(['LA BINCH · BRIEFING DES DÉLÉGATIONS','Données locales, non partagées.',...assignments.filter(x=>x.status!=='done').map(description)].join('\n\n'));
 $('binch-delegations-export').onclick=exportData;
 $('binch-delegations-import').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{await importData(file)}catch(error){$('binch-gm-delegations-message').textContent='Import refusé : '+String(error.message||error)}};
 document.querySelector('#app nav.nav [data-page="gm"]')?.addEventListener('click',render);
 window.addEventListener('storage',e=>{if(e.key===STORE){assignments=read();render()}});
 render();return true;
}
function start(){if(mount())return;const root=$('app');if(!root)return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(root,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();