/* La Binch — Intendant universel V1.
   Moteur local déterministe, sans modèle IA, sans appel réseau ni secret.
   N'effectue aucune action Discord/WoW à la place de l'utilisateur. */
(()=>{'use strict';
const KEY='binch.intendant.local.v1', $=s=>document.querySelector(s);
const tabs={hub:'Quartier général',progression:'Carte d’expédition',metiers:'Métiers',gm:'Mode GM',sync:'Synchronisation',lfg:'LFG & Rendez-vous',crafting:'Atlas des recettes',loot:'Loot',macros:'Macros',bibliotheque:'Bibliothèque',discoveries:'Secrets',treasures:'Trésors'};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const initial=[{who:'intendant',text:'À tes ordres ! Je fonctionne gratuitement dans ton navigateur. Je peux te guider dans La Binch, retrouver tes objectifs, préparer une annonce de guilde ou t’aider à synchroniser ton personnage. Je ne suis pas encore une IA conversationnelle.'}];
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)&&v.length?v.slice(-30):initial.slice()}catch{return initial.slice()}};
let history=read(), panel, input, list;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(history.slice(-30)))}catch{}};
function current(){return $('#app nav.nav button.active')?.dataset.page||'hub'}
function profile(){
 try{const v=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{};return {...(v.data||{}),classe:v.classe||v.data?.classe, race:v.race||v.data?.race,jobs:v.jobs||v.data?.jobs||[]}}
 catch{return {}}
}
function lastImport(){try{return JSON.parse(localStorage.getItem('grimoire.bridge.last'))||{}}catch{return {}}}
function page(name){const b=$('#app nav.nav [data-page="'+name+'"]');if(b){b.click();return true}return false}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const actions={
 gm:['Préparer un briefing','Ouvrir le mode GM'],
 lfg:['Créer une annonce LFG','Ouvrir la taverne'],
 sync:['Comment synchroniser ?','Ouvrir la synchronisation'],
 metiers:['Mes métiers','Ouvrir les métiers'],
 general:['Que peux-tu faire ?','Mes prochaines étapes']
};
function response(query){
 const q=normalize(query),p=profile(),last=lastImport(),lvl=Number(last.level||p.level)||0;
 const names=Object.entries(tabs);
 if(/^(?:aide|help)|que peux|comment tu|capacites|fonctionnalit/.test(q))
   return {text:'Je peux ouvrir les onglets, indiquer ton profil importé, expliquer la synchro, proposer une route indicative 1–60, préparer un message Discord et retrouver les outils du GM. Les données Forever non vérifiées ne seront pas inventées. Je ne publie pas sur Discord et je ne suis pas connecté à un modèle IA.'};
 if(/discord|annonce|publie|poster|post|recrut|reunion|raid.*soir|donjon.*vendredi|donjon.*samedi/.test(q)){
   const role=/tank/.test(q)?'tank':/heal|soign|soin/.test(q)?'soigneur':/dps/.test(q)?'DPS':'rôles à préciser';
   const hour=q.match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b/),time=hour?String(hour[1]).padStart(2,'0')+':'+(hour[2]||'00'):'horaire à confirmer';
   const place=(query.match(/#([a-zA-Z0-9_-]+)/)||[])[1]||'général';
   const message=['⚔ LA BINCH — Rendez-vous de guilde','Activité : '+query.replace(/\s+(?:et )?(?:poste|publie|envoie).*/i,'').slice(0,160),'Heure : '+time+' (date à confirmer)','Besoin : '+role,'Répondez avec ✅ présent / ❔ peut-être / ❌ absent.'].join('\n');
   return {text:'J’ai préparé un brouillon pour #'+place+'. Vérifie la date, les rôles et l’activité avant de le publier. Je ne peux pas envoyer directement sur Discord.',draft:message,buttons:[{label:'Ouvrir le mode GM',page:'gm'},{label:'Ouvrir LFG',page:'lfg'}]};
 }
 if(/synchro|addon|reload|personnage.*import|grimoire.?sync|saved.?variables/.test(q))
   return {text:'Installe GrimoireSync, active-le dans WoW Forever, fais /reload, puis ouvre Synchronisation. Sélectionne GrimoireSync.lua et autorise sa lecture. Sur un navigateur compatible, le suivi des /reload peut être activé tant que l’onglet est ouvert. Aucun mot de passe n’est nécessaire.',buttons:[{label:'Ouvrir Synchronisation',page:'sync'}]};
 if(/quel (?:est )?mon|mon perso|mon niveau|ma classe|ma zone|mon profil/.test(q)){
   return {text:last.name?'Dernier profil importé : '+last.name+' — niveau '+last.level+(last.zone?' · '+last.zone:'')+'.':p.pseudo?'Profil du navigateur : '+p.pseudo+(lvl?' — niveau '+lvl:'')+(p.classe?' · '+p.classe:'')+'. Aucune synchronisation récente confirmée.':'Aucun personnage renseigné dans ce navigateur. Crée ton profil ou importe une sauvegarde GrimoireSync.',buttons:[{label:'Aller au profil',page:'hub'}]};
 }
 if(/metier|profession|forge|couture|ingenier|minage|herbor|depec|alchimi/.test(q))
   return {text:'Ouvre Métiers et l’Atlas des recettes pour tes jalons et matériaux. Les nouveautés Forever doivent être distinguées des données Vanilla non confirmées. '+(p.jobs?.length?'Métiers du profil : '+p.jobs.join(', ')+'.':''),buttons:[{label:'Voir mes métiers',page:'metiers'},{label:'Voir les recettes',page:'crafting'}]};
 if(/ou aller|quelle zone|pex|leveling|prochain|quete|xp|monter.*niveau/.test(q))
   return {text:lvl?'Tu es au niveau '+lvl+'. La Carte d’expédition propose les zones et objectifs correspondants. Vérifie les quêtes spécifiques à Forever avant un détour important.':'Renseigne ton niveau ou importe ton personnage pour obtenir une route indicative adaptée.',buttons:[{label:'Carte d’expédition',page:'progression'}]};
 if(/gm|maitre de guilde|officier|brief|effectif|organisation/.test(q))
   return {text:'Le Mode GM permet de planifier une sortie, suivre les rôles déclarés, organiser les délégations et copier un briefing officiers. Les effectifs sont locaux et non synchronisés.',buttons:[{label:'Ouvrir le QG',page:'gm'}]};
 if(/lfg|groupe|rdv|rendez.vous|calendrier/.test(q))
   return {text:'La Taverne LFG prépare des annonces, des réactions locales et des fichiers calendrier .ics avec rappel. Le chat partagé et les réactions interjoueurs nécessitent un service connecté.',buttons:[{label:'Ouvrir LFG',page:'lfg'}]};
 if(/proc|surprise|tresor|relique/.test(q))
   return {text:'Le Cabinet des surprises et les Trésors sont des collections cosmétiques. Les vrais événements de proc et leurs tables distinctes sont un chantier identifié : je ne prétends pas qu’ils sont déjà terminés.',buttons:[{label:'Voir Secrets',page:'discoveries'}]};
 for(const [name,title] of names)if(q.includes(normalize(title))||q.includes(name))return {text:'Je peux t’ouvrir « '+title+' ».',buttons:[{label:'Ouvrir '+title,page:name}]};
 return {text:'Je n’ai pas compris cette demande avec mes règles locales. Essaie « Mes prochaines étapes », « Prépare une annonce pour #général », « Comment synchroniser ? », « Ouvre LFG » ou « Mes métiers ». Je ne vais pas inventer de réponse sur Forever.'};
}
function render(){
 list.replaceChildren();history.forEach(entry=>{
  const article=document.createElement('article');article.className='binch-intendant-msg '+(entry.who==='user'?'user':'assistant');
  const label=document.createElement('small');label.textContent=entry.who==='user'?'Vous':'L’Intendant';
  const body=document.createElement('p');body.textContent=entry.text;article.append(label,body);
  if(entry.draft){const text=document.createElement('textarea');text.className='binch-intendant-draft';text.value=entry.draft;text.rows=5;text.setAttribute('aria-label','Brouillon Discord');article.append(text);
   const copy=document.createElement('button');copy.type='button';copy.textContent='Copier ce brouillon';copy.onclick=async()=>{try{await navigator.clipboard.writeText(text.value);copy.textContent='Copié ✓'}catch{prompt('Copie ce texte :',text.value)}};article.append(copy);
  }
  (entry.buttons||[]).forEach(btn=>{const b=document.createElement('button');b.type='button';b.textContent=btn.label;b.onclick=()=>{if(!page(btn.page))say('Cette rubrique n’est pas disponible dans la version actuelle.','intendant')};article.append(b)});
  list.append(article)
 });list.scrollTop=list.scrollHeight;
}
function say(text,who='user'){history.push({who,text});history=history.slice(-30);save();render()}
function submit(question){const s=String(question||'').trim();if(!s)return;history.push({who:'user',text:s});history.push({who:'intendant',...response(s)});history=history.slice(-30);save();render();input.value=''}
function mount(){
 if($('#binch-intendant-launcher'))return;
 const btn=document.createElement('button');btn.id='binch-intendant-launcher';btn.type='button';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','binch-intendant-panel');btn.innerHTML='<span aria-hidden="true">✧</span> Intendant';
 panel=document.createElement('aside');panel.id='binch-intendant-panel';panel.hidden=true;panel.setAttribute('aria-label','Intendant de La Binch');
 panel.innerHTML='<div class="binch-intendant-header"><div><small>LA BINCH · ASSISTANT LOCAL</small><h2>L’Intendant</h2></div><button type="button" id="binch-intendant-close" aria-label="Fermer">✕</button></div><p class="binch-intendant-note">Gratuit, sans crédits, sans vraie IA. Il utilise les informations et outils disponibles localement dans La Binch.</p><div id="binch-intendant-messages" aria-live="polite"></div><div class="binch-intendant-suggestions"><button type="button">Mes prochaines étapes</button><button type="button">Comment synchroniser ?</button><button type="button">Prépare une annonce pour #général</button><button type="button">Ouvre LFG</button></div><form id="binch-intendant-form"><label for="binch-intendant-query">Ta demande</label><div><input id="binch-intendant-query" autocomplete="off" maxlength="1000" placeholder="Ex. Prépare une annonce de donjon…"><button type="submit">Envoyer</button></div></form>';
 document.body.append(btn,panel);list=$('#binch-intendant-messages');input=$('#binch-intendant-query');
 const toggle=()=>{panel.hidden=!panel.hidden;btn.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){render();input.focus()}else btn.focus()};
 btn.onclick=toggle;$('#binch-intendant-close').onclick=toggle;
 panel.querySelector('form').onsubmit=e=>{e.preventDefault();submit(input.value)};
 panel.querySelectorAll('.binch-intendant-suggestions button').forEach(b=>b.onclick=()=>submit(b.textContent));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();toggle()}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();