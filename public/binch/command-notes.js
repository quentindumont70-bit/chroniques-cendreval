/* La Binch · Notes de campagne personnalisées, locales, sans collecte de données. */
(()=>{'use strict';
const $=id=>document.getElementById(id),BASE='binch.command.notes.v1.',esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function key(){let p={};try{p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{}const n=String(p.data?.pseudo||'Aventurier').trim().toLowerCase();return BASE+n.replace(/[^a-z0-9_-]/g,'-')}
function get(){try{const v=JSON.parse(localStorage.getItem(key()));return Array.isArray(v)?v.slice(0,20):[]}catch{return []}}
function save(v){try{localStorage.setItem(key(),JSON.stringify(v.slice(0,20)))}catch{}draw()}
function draw(){
 const list=$('binch-command-notes-list');if(!list)return;const notes=get();list.textContent='';
 if(!notes.length){const p=document.createElement('p');p.className='binch-command-muted';p.textContent='Ajoute une quête à terminer, un objet à récupérer ou un rappel pour ta prochaine session.';list.append(p)}
 notes.forEach((n,i)=>{const item=document.createElement('div');item.className='binch-command-note';
 const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!n.done;cb.setAttribute('aria-label','Terminer '+n.text);cb.onchange=()=>{let v=get();if(v[i])v[i].done=cb.checked;save(v)};
 const label=document.createElement('span');label.textContent=n.text;if(n.done)label.className='done';
 const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Supprimer cet objectif';del.setAttribute('aria-label','Supprimer '+n.text);del.onclick=()=>save(get().filter((_,j)=>j!==i));
 item.append(cb,label,del);list.append(item)});
 const counter=$('binch-command-notes-count');if(counter)counter.textContent=notes.filter(n=>!n.done).length+' objectif(s) à faire';
}
function mount(){
 const host=$('page-command')?.querySelector('.binch-command-pin-wrap');if(!host||$('binch-command-notes'))return;
 const section=document.createElement('section');section.id='binch-command-notes';section.innerHTML='<div class="binch-command-label">CARNET DE TERRAIN <span>QUÊTES & RAPPELS PERSONNELS</span></div><p class="binch-command-muted">En attendant un journal de quêtes fiable, conserve ici les trois choses à ne pas oublier.</p><form id="binch-command-notes-form"><input id="binch-command-notes-input" maxlength="140" required placeholder="Ex. Terminer la quête des harpies…" aria-label="Nouvel objectif"><button type="submit">+ Ajouter</button></form><div id="binch-command-notes-list"></div><small id="binch-command-notes-count"></small>';
 host.after(section);
 $('binch-command-notes-form').addEventListener('submit',e=>{e.preventDefault();const input=$('binch-command-notes-input'),t=input.value.trim();if(!t)return;const v=get();if(v.length>=20){$('binch-command-notes-count').textContent='20 objectifs maximum : supprime les anciens.';return}v.push({text:t,done:false});save(v);input.value='';input.focus()});
 window.addEventListener('storage',e=>{if(e.key?.startsWith(BASE)||e.key==='grimoire.hub.v3')draw()});
 document.addEventListener('grimoire:sync',draw);
 draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();