/* La Binch — mode jeu : accès direct aux actions utiles, sans attendre l'IA. */
(()=>{'use strict';
const $=id=>document.getElementById(id), STORE='binch.play-session.v1';
function read(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function profile(){const state=read('grimoire.hub.v3')||{},last=read('grimoire.bridge.last')||{},d=state.data||{};const name=String(d.pseudo||last.name||'Aventurier');const matching=name.toLowerCase()===String(last.name||'').toLowerCase();return {name,level:Math.max(1,Math.min(60,Number(d.level)||Number(last.level)||1)),zone:matching?last.zone||d.zone||'Zone inconnue':d.zone||'Zone inconnue',synced:Boolean(matching&&last.updated),updated:matching?last.updated:null};}
function html(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]))}
function go(page){const button=document.querySelector('#app nav.nav [data-page="'+page+'"]');if(button){button.click();window.scrollTo({top:0,behavior:'auto'});return true}return false}
function get(){const p=profile(),s=read(STORE)||{};return s.character===p.name&&s.level===p.level?s:{character:p.name,level:p.level,done:{}}}
function save(id,done){const s=get();s.done[id]=done;try{localStorage.setItem(STORE,JSON.stringify(s))}catch{}paint()}
function paint(){
 const p=profile(),panel=$('binch-play-today');if(!panel)return;
 $('binch-play-title').textContent='Prêt pour le niveau '+p.level+' → '+Math.min(60,p.level+1)+' ?';
 $('binch-play-character').textContent=p.name+' · '+p.zone;
 const status=$('binch-play-status'),date=p.updated?new Date(p.updated):null;
 status.textContent=p.synced&&date&&!isNaN(+date)?'Dernier import '+date.toLocaleString('fr-FR')+' — le suivi automatique reste à confirmer.':'Pas de sauvegarde importée pour ce personnage : le mode jeu fonctionne aussi sans synchronisation.';
 const state=get(),items=[['route','Consulter ma route de progression','progression'],['jobs','Choisir un objectif de métier','metiers'],['sync','Mettre à jour mes données après /reload','sync']];
 const tasks=$('binch-play-steps');tasks.textContent='';
 for(const [key,label,page] of items){
  const wrap=document.createElement('div');wrap.className='binch-play-task';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!state.done[key];checkbox.id='binch-play-'+key;checkbox.addEventListener('change',()=>save(key,checkbox.checked));
  const title=document.createElement('label');title.htmlFor=checkbox.id;title.textContent=label;
  const open=document.createElement('button');open.type='button';open.textContent='Ouvrir';open.setAttribute('aria-label','Ouvrir '+label);open.addEventListener('click',()=>go(page));
  wrap.append(checkbox,title,open);tasks.append(wrap);
 }
}
function mount(){
 const hub=$('page-hub');if(!hub||$('binch-play-today'))return;
 const panel=document.createElement('section');panel.id='binch-play-today';panel.className='panel section';panel.setAttribute('aria-label','Mode jeu');
 panel.innerHTML='<div class="eyebrow">MODE JEU · SANS CONFIGURATION SUPPLÉMENTAIRE</div><h2 id="binch-play-title">Prêt pour ton prochain niveau ?</h2><p id="binch-play-character"></p><p id="binch-play-status" role="status"></p><div class="binch-play-actions"><button id="binch-play-route" type="button">▶ Jouer : ouvrir mon carnet de route</button><button id="binch-play-sync" type="button">↻ Actualiser après /reload</button></div><details><summary>Ma checklist de session (facultative)</summary><div id="binch-play-steps"></div><p class="muted">La checklist est enregistrée localement pour ce personnage et ce niveau.</p></details>';
 const hero=hub.querySelector('#binch-front')||hub.firstElementChild;
 if(hero)hero.before(panel);else hub.append(panel);
 $('binch-play-route').addEventListener('click',()=>go('progression'));
 $('binch-play-sync').addEventListener('click',()=>go('sync'));
 window.addEventListener('storage',e=>{if([STORE,'grimoire.hub.v3','grimoire.bridge.last'].includes(e.key))paint()});
 document.addEventListener('grimoire:sync',paint);
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();