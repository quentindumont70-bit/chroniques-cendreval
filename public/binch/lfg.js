/* La Binch · LFG local avec partage Discord.
   Aucune donnée de groupe n'est partagée entre appareils dans cette version. */
(()=>{'use strict';
const KEY='binch.lfg.local.v1',DISCORD_KEY='binch.discord.url.v1';
const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=()=>{try{let x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:[]}catch{return []}};
const persist=x=>{try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}};
const dateLabel=x=>x&&Number.isFinite(+new Date(x))?new Date(x).toLocaleString('fr-FR',{dateStyle:'full',timeStyle:'short'}):'Dès que possible';
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:' && ['discord.com','discord.gg','www.discord.com','www.discord.gg'].includes(u.hostname)?u.href:''}catch{return ''}};
const escapeICS=s=>String(s??'').replace(/[\r\n]+/g,' ').replace(/([,;\\])/g,'\\$1');
function clipboard(s){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(s).then(()=>true).catch(()=>{prompt('Copie ce texte :',s);return false});prompt('Copie ce texte :',s);return Promise.resolve(false)}
const announce=e=>['⚔️ LA BINCH — GROUPE / DONJON','🏰 '+e.dungeon,'👤 '+e.author+' ('+e.role+')','📅 '+dateLabel(e.when),'👥 '+e.places+' place(s) recherchée(s)',e.note?'📝 '+e.note:'','Réagissez sur Discord : ✅ Partant / ❔ Peut-être / ❌ Pas disponible.'].filter(Boolean).join('\n');
function calendar(e){
 if(!e.when){alert('Choisis une date pour créer un rendez-vous.');return}
 const begin=new Date(e.when);if(!Number.isFinite(+begin))return;
 const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const parts=['BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN','PRODID:-//La Binch//LFG//FR','BEGIN:VEVENT','UID:'+e.id+'@la-binch','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(begin),'DTEND:'+stamp(new Date(+begin+90*60000)),'SUMMARY:'+escapeICS('WoW Forever — '+e.dungeon),'DESCRIPTION:'+escapeICS(e.note+' | Organisateur : '+e.author),'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-PT30M','DESCRIPTION:Rappel du donjon','END:VALARM','END:VEVENT','END:VCALENDAR'];
 const blob=new Blob([parts.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='binch-rdv-'+e.id+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function mount(){
 const nav=$('#app nav.nav'),app=$('#app'),main=$('#app main');if(!nav||!app||!main||$('#page-lfg'))return;
 const button=document.createElement('button');button.type='button';button.textContent='LFG & Rendez-vous';button.dataset.page='lfg';nav.insertBefore(button,nav.querySelector('[data-page="gm"]')||null);
 button.onclick=()=>{nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));app.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-lfg'));scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
 const page=document.createElement('section');page.id='page-lfg';page.className='page';
 page.innerHTML='<div class="binch-lfg-hero"><span class="binch-lfg-kicker">LA BINCH · TABLEAU DES AVENTURIERS</span><h1>La taverne des compagnons</h1><p>Une annonce en quelques secondes, un rendez-vous dans le calendrier et un message prêt pour Discord.</p><div class="binch-lfg-tags"><span>Donjons</span><span>Réactions</span><span>Agenda</span><span>Discord</span></div></div>'+
 '<div class="binch-lfg-columns"><section class="binch-lfg-form"><div class="eyebrow">CRÉER UNE ANNONCE</div><h2>Rassembler son groupe</h2><form id="binch-lfg-form"><label>Personnage organisateur<input id="binch-lfg-author" maxlength="40" placeholder="Pseudo" required></label><label>Donjon / activité<input id="binch-lfg-dungeon" maxlength="90" placeholder="Ex. Cavernes des Lamentations" required></label><div class="binch-lfg-pair"><label>Mon rôle<select id="binch-lfg-role"><option>Tank</option><option>Soin</option><option>DPS</option><option>Flexible</option></select></label><label>Places à pourvoir<input id="binch-lfg-places" type="number" min="1" max="40" value="4" required></label></div><label>Quand ? <small>Laisser vide pour « dès maintenant »</small><input id="binch-lfg-when" type="datetime-local"></label><label>Message facultatif<textarea id="binch-lfg-note" rows="3" maxlength="350" placeholder="Quêtes à faire, niveau, besoin d’un tank…"></textarea></label><button class="binch-lfg-primary" type="submit">Afficher mon annonce</button></form><div class="binch-lfg-discord"><h3>Passerelle Discord</h3><p>Configure le lien du salon LFG ou du serveur de ta guilde. Utilise d’abord « Copier pour Discord », puis « Ouvrir Discord » pour coller l’annonce. Le site ne publie rien lui-même.</p><label>Lien Discord (optionnel)<input id="binch-lfg-discord" type="url" placeholder="https://discord.com/channels/…"></label><button type="button" id="binch-lfg-save-discord">Enregistrer ce lien sur mon appareil</button><p class="binch-lfg-muted" id="binch-lfg-discord-status">Aucune publication automatique.</p></div></section>'+
 '<section class="binch-lfg-board"><div class="binch-lfg-board-heading"><div><div class="eyebrow">TABLEAU DES AVENTURIERS</div><h2>Mes annonces préparées</h2></div><span id="binch-lfg-count">0</span></div><p class="binch-lfg-clarity"><strong>Mode local :</strong> ces cartes ne sont visibles que dans ton navigateur. Pour recruter de vrais joueurs, clique « Copier pour Discord » puis colle ton annonce dans le salon de guilde. Les réactions ci-dessous sont un brouillon, pas des réponses reçues de Discord.</p><div class="binch-lfg-filters"><button type="button" data-lfg-filter="all" class="active">Toutes</button><button type="button" data-lfg-filter="now">Immédiates</button><button type="button" data-lfg-filter="scheduled">Planifiées</button></div><div id="binch-lfg-cards" aria-live="polite"></div></section></div>';
 main.append(page);
 const c=$('#binch-lfg-cards');let filter='all';const d=$('#binch-lfg-discord');d.value=localStorage.getItem(DISCORD_KEY)||'';
 $('#binch-lfg-save-discord').onclick=()=>{const s=d.value.trim();if(s&&!safeUrl(s)){$('#binch-lfg-discord-status').textContent='Lien refusé : seuls les liens HTTPS Discord sont acceptés.';return}localStorage.setItem(DISCORD_KEY,s);$('#binch-lfg-discord-status').textContent=s?'Lien enregistré sur cet appareil.':'Lien effacé.'};
 function paint(){
  let all=load();let rows=all.filter(e=>filter==='all'||(filter==='now'?!e.when:!!e.when));$('#binch-lfg-count').textContent=all.length+' brouillon(s)';
  c.replaceChildren();
  if(!rows.length){const empty=document.createElement('div');empty.className='binch-lfg-empty';empty.textContent=all.length?'Aucune annonce dans ce filtre.':'Ton panneau est encore vide. Prépare la première expédition !';c.append(empty);return}
  rows.slice().reverse().forEach(e=>{
   const card=document.createElement('article');card.className='binch-lfg-card';
   const votes=e.votes||{yes:0,maybe:0,no:0};
   card.innerHTML='<div class="binch-lfg-card-top"><span>'+(e.when?'Rendez-vous':'Dès maintenant')+'</span><small>'+escapeHTML(dateLabel(e.when))+'</small></div><h3>'+escapeHTML(e.dungeon)+'</h3><div class="binch-lfg-person"><b>'+escapeHTML(e.author)+'</b> · '+escapeHTML(e.role)+' · '+Number(e.places)+' place(s)</div><p>'+escapeHTML(e.note||'Aucune consigne particulière.')+'</p><div class="binch-lfg-reactions" aria-label="Réactions locales (brouillon)"><button data-action="yes">✅ '+votes.yes+'</button><button data-action="maybe">❔ '+votes.maybe+'</button><button data-action="no">❌ '+votes.no+'</button></div><div class="binch-lfg-card-actions"><button data-action="copy">Copier pour Discord</button><button data-action="discord">Ouvrir Discord</button>'+(e.when?'<button data-action="ics">Ajouter au calendrier</button>':'')+'<button data-action="remove" aria-label="Supprimer ce brouillon">Supprimer</button></div>';
   card.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{
    const action=b.dataset.action;
    if(['yes','maybe','no'].includes(action)){const list=load(),item=list.find(x=>x.id===e.id);if(item){item.votes=item.votes||{yes:0,maybe:0,no:0};item.votes[action]=(item.votes[action]||0)+1;persist(list);paint()}return}
    if(action==='copy'){await clipboard(announce(e));return}
    if(action==='discord'){const url=safeUrl(localStorage.getItem(DISCORD_KEY)||'');if(!url){alert('Ajoute d’abord un lien Discord dans la colonne de gauche.');return}window.open(url,'_blank','noopener,noreferrer');return}
    if(action==='ics'){calendar(e);return}
    if(action==='remove'&&confirm('Supprimer ce brouillon local ?')){persist(load().filter(x=>x.id!==e.id));paint()}
   });
   c.append(card)
  });
 }
 $('#binch-lfg-form').addEventListener('submit',event=>{
  event.preventDefault();const author=$('#binch-lfg-author').value.trim(),dungeon=$('#binch-lfg-dungeon').value.trim();if(!author||!dungeon)return;
  const id=String(Date.now())+'-'+Math.random().toString(36).slice(2,8);
  const item={id,author,dungeon,role:$('#binch-lfg-role').value,places:Math.max(1,Math.min(40,+$('#binch-lfg-places').value||1)),when:$('#binch-lfg-when').value,note:$('#binch-lfg-note').value.trim(),votes:{yes:0,maybe:0,no:0}};
  const items=load();items.push(item);persist(items.slice(-100));paint();
  $('#binch-lfg-dungeon').value='';$('#binch-lfg-note').value='';$('#binch-lfg-when').value='';
 });
 page.querySelectorAll('[data-lfg-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.lfgFilter;page.querySelectorAll('[data-lfg-filter]').forEach(x=>x.classList.toggle('active',x===b));paint()});
 try{const profile=JSON.parse(localStorage.getItem('grimoire.hub.v3'));const name=profile?.data?.pseudo;if(name)$('#binch-lfg-author').value=name}catch{}
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();