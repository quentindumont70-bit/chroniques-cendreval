/* La Binch — Intendant universel V1.
   Moteur local déterministe, sans modèle IA, sans appel réseau ni secret.
   N'effectue aucune action Discord/WoW à la place de l'utilisateur. */
(()=>{'use strict';
const KEY='binch.intendant.local.v1', TONE='binch.intendant.faith.tone', LEGACY_TONE='binch.intendant.brog.tone', $=s=>document.querySelector(s);
/* Faith — personnage original de fan-fiction La Binch.
   Esprit d'un troll chaman tombé au combat, ancien porteur de Sulfuras.
   Lore inventé du projet : PAS un personnage Warcraft officiel/canon. */
const FAITH={name:'Faith',title:'Esprit-guide de La Binch',motto:'Un esprit passe. La parole reste.'};
const voice={
 gm:['Même d’outre-tombe, j’entends quand un raid manque de soigneurs.','À quoi sert une hache légendaire si personne n’a préparé les bandages ?'],
 lfg:['Rassemble les vivants, camarade. Je connais déjà trop de fantômes.','La taverne est pleine d’histoires. Trouvons des compagnons pour la prochaine.'],
 sync:['Les esprits gardent la mémoire. Ton fichier, lui, reste sur ton ordinateur.','Sulfuras faisait du bruit. Une sauvegarde bien faite demande moins de cérémonies.'],
 progression:['J’ai traversé les terres des morts. Quelques chemins d’Azeroth méritent encore qu’on s’y perde.','Le chemin du guerrier ne se lit pas seulement sur une carte. Mais la carte aide bien.'],
 metiers:['Le feu de la forge me rappelle mon vieux marteau.','Même une arme mythique commence dans les mains d’un artisan.'],
 evenements:['Le voile est mince aujourd’hui. Une histoire cherche à se raconter.','Ces apparitions sont celles de La Binch, pas des dons du destin en jeu.'],
 general:['Les ancêtres écoutent. Moi aussi.','Le vent porte ta question jusqu’à moi, camarade.']
};
function nudge(query,pageName){let h=0;for(const x of query)h=(h*31+x.charCodeAt(0))>>>0;const lines=voice[pageName]||voice.general;return lines[h%lines.length]}
function tone(){try{const preference=localStorage.getItem(TONE)||localStorage.getItem(LEGACY_TONE);return preference!=='sobre'}catch{return true}}
function setTone(taquin){try{localStorage.setItem(TONE,taquin?'taquin':'sobre')}catch{}}

const tabs={hub:'Quartier général',progression:'Carte d’expédition',metiers:'Métiers',gm:'Mode GM',sync:'Synchronisation',lfg:'LFG & Rendez-vous',crafting:'Atlas des recettes',loot:'Loot',macros:'Macros',bibliotheque:'Bibliothèque',discoveries:'Secrets',treasures:'Trésors',evenements:'Vrais procs'};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const initial=[{who:'intendant',text:'Je suis Faith, l’écho d’un chaman troll tombé au combat. Sulfuras a jadis répondu à mon appel. Maintenant, je veille sur les vivants depuis le voile des esprits.\nJe connais les chemins de La Binch, les préparatifs de guilde et les annonces à rédiger. Mon pouvoir est local : aucune IA payante, et je n’invente pas ce que je ne sais pas.'}];
const read=()=>{try{
 const v=JSON.parse(localStorage.getItem(KEY));
 if(!Array.isArray(v)||!v.length)return initial.slice();
 const out=v.slice(-30);
 // Un ancien échange Brog reste consultable mais s'affiche sous son identité historique.
 // La nouvelle identité Faith est annoncée une seule fois lors de la migration.
 const hasBrog=out.some(e=>e.who==='intendant'&&/\bBrog\b/.test(e.text||''));
 if(hasBrog&&!out.some(e=>e.persona==='Faith'))out.push({who:'intendant',persona:'Faith',text:'Le vent a tourné. Je suis Faith, esprit troll et nouveau gardien de La Binch. Tes anciennes conversations sont préservées.'});
 return out.slice(-30);
}catch{return initial.slice()}};
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
   // Modèle de message déterministe : une absence d'information reste explicitement inconnue.
   const day=q.match(/\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd'hui)\b/);
   const hour=q.match(/\b([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)?\b/);
   const time=hour?String(hour[1]).padStart(2,'0')+':'+(hour[2]||'00'):'horaire à confirmer';
   const role=/\b(tank|tanker)\b/.test(q)?'tank':/\b(heal|soign|soin)/.test(q)?'soigneur':/\bdps\b/.test(q)?'DPS':'rôles à confirmer';
   const channel=(query.match(/#([\p{L}\p{N}_-]+)/u)||[])[1]||'général';
   const extract=query.match(/(?:\bpour\b|\bfaire\b|\borganiser\b)\s+(.+?)(?=\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd'hui|à\s+\d|a\s+\d|dans\s+#|sur\s+#|et\s+(?:poste|publie|envoie))|$)/i);
   const activity=extract?extract[1].replace(/^(?:un|une|des|les)\s+/i,'').replace(/[\s,.;]+$/,'').slice(0,130):'activité à préciser';
   const date=day?day[1]+' (date exacte à confirmer)':'date à confirmer';
   const message=['⚔ LA BINCH — Rendez-vous de guilde',
     'Activité : '+activity,
     'Quand : '+date+' · '+time+' (heure locale de la guilde)',
     'Rôles recherchés : '+role,
     'Merci de répondre : ✅ présent · ❔ peut-être · ❌ absent.'].join('\n');
   return {text:'J’ai préparé un brouillon à copier dans #'+channel+'. Vérifie les informations avant publication : je ne peux pas poster directement sur Discord. Le jour et l’heure ne sont pas reliés à un événement réel.',
     draft:message,activity,roleNeeded:role,channel,dayLabel:date,timeLabel:time,buttons:[{label:'Ouvrir LFG',page:'lfg'},{label:'Ouvrir le Mode GM',page:'gm'}]};
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
   return {text:'Le théâtre des vrais procs possède sa propre table de déclencheurs, ses probabilités et ses mini-scènes originales. Ces événements sont uniquement cosmétiques dans La Binch et ne représentent pas les chances de proc du jeu. Le Cabinet et les Trésors restent séparés.',buttons:[{label:'Voir les vrais procs',page:'evenements'},{label:'Voir Secrets',page:'discoveries'}]};
 for(const [name,title] of names)if(q.includes(normalize(title))||q.includes(name))return {text:'Je peux t’ouvrir « '+title+' ».',buttons:[{label:'Ouvrir '+title,page:name}]};
 return {text:'Je n’ai pas compris cette demande avec mes règles locales. Essaie « Mes prochaines étapes », « Prépare une annonce pour #général », « Comment synchroniser ? », « Ouvre LFG » ou « Mes métiers ». Je ne vais pas inventer de réponse sur Forever.'};
}
function render(){
 list.replaceChildren();history.forEach(entry=>{
  const article=document.createElement('article');article.className='binch-intendant-msg '+(entry.who==='user'?'user':'assistant');
  const label=document.createElement('small');label.textContent=entry.who==='user'?'Vous':entry.persona==='Brog'||(!entry.persona&&/\bBrog\b/.test(entry.text||''))?'Brog · Archives':'Faith · Esprit-guide';
  const body=document.createElement('p');body.textContent=entry.text;article.append(label,body);
  if(entry.draft){const text=document.createElement('textarea');text.className='binch-intendant-draft';text.value=entry.draft;text.rows=5;text.setAttribute('aria-label','Brouillon Discord');text.addEventListener('change',()=>{entry.draft=text.value;save()});article.append(text);
   const copy=document.createElement('button');copy.type='button';copy.textContent='Copier ce brouillon';copy.onclick=async()=>{try{await navigator.clipboard.writeText(text.value);copy.textContent='Copié ✓'}catch{prompt('Copie ce texte :',text.value)}};article.append(copy);
   const form=document.createElement('button');form.type='button';form.textContent='Préremplir une annonce LFG';
   form.onclick=()=>{
    if(!page('lfg')){say('L’onglet LFG n’est pas accessible.','intendant');return}
    const dungeon=$('#binch-lfg-dungeon'),note=$('#binch-lfg-note');
    if(!dungeon||!note){say('La Taverne LFG n’est pas encore chargée.','intendant');return}
    if(entry.activity&&entry.activity!=='activité à préciser')dungeon.value=entry.activity;
    const details=['Préparé avec Faith, à confirmer avant publication.'];
    if(entry.roleNeeded&&entry.roleNeeded!=='rôles à confirmer')details.push('Rôle recherché : '+entry.roleNeeded+'.');
    if(entry.dayLabel)details.push('Jour mentionné : '+entry.dayLabel+'.');
    if(entry.timeLabel&&entry.timeLabel!=='horaire à confirmer')details.push('Heure indicative : '+entry.timeLabel+'.');
    note.value=details.join(' ');
    dungeon.scrollIntoView({block:'center',behavior:'smooth'});dungeon.focus({preventScroll:true});
   };
   article.append(form);
  }
  (entry.buttons||[]).forEach(btn=>{const b=document.createElement('button');b.type='button';b.textContent=btn.label;b.onclick=()=>{if(!page(btn.page))say('Cette rubrique n’est pas disponible dans la version actuelle.','intendant')};article.append(b)});
  list.append(article)
 });list.scrollTop=list.scrollHeight;
}
function say(text,who='user'){history.push({who,text});history=history.slice(-30);save();render()}
function submit(question){
 const s=String(question||'').trim();if(!s)return;
 const answer=response(s),name=current();
 if(tone() && !/incompris|pas compris|impossible|ne pourrai|pas connecté|n'est pas encore/i.test(answer.text) && history.length%3===1)
   answer.text=nudge(s,name)+'\n\n'+answer.text;
 history.push({who:'user',text:s});
 history.push({who:'intendant',persona:'Faith',...answer});
 history=history.slice(-30);save();render();input.value='';
}
function mount(){
 if($('#binch-intendant-launcher'))return;
 const btn=document.createElement('button');btn.id='binch-intendant-launcher';btn.type='button';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','binch-intendant-panel');btn.innerHTML='<span aria-hidden="true">✧</span> Invoquer Faith';
 panel=document.createElement('aside');panel.id='binch-intendant-panel';panel.hidden=true;panel.setAttribute('aria-label','Intendant de La Binch');
 panel.innerHTML='<div class="binch-intendant-header"><span class="binch-faith-portrait" aria-hidden="true"><span class="binch-faith-mask"><i class="binch-faith-eye left"></i><i class="binch-faith-eye right"></i><i class="binch-faith-tusk left"></i><i class="binch-faith-tusk right"></i></span><span class="binch-faith-wisp">✧</span></span><div class="binch-brog-name"><small>LA BINCH · CONSEILLER SPECTRAL</small><h2>Faith <span class="binch-brog-online">● Disponible</span></h2><span class="binch-brog-motto">« Un esprit passe. La parole reste. »</span></div><button type="button" id="binch-intendant-close" aria-label="Fermer">✕</button></div><div class="binch-brog-toolbar"><span>Esprit-guide · local · sans crédits</span><button type="button" id="binch-brog-tone" aria-pressed="true" title="Activer ou réduire les répliques de Faith">Répliques : actives</button></div><p class="binch-intendant-note">Faith est un personnage imaginaire de La Binch, pas un héros officiel de WoW ni une véritable IA connectée. Aucun message Discord n’est envoyé sans toi.</p><div id="binch-intendant-messages" aria-live="polite"></div><div class="binch-intendant-suggestions"><button type="button">Mes prochaines étapes</button><button type="button">Comment synchroniser ?</button><button type="button">Prépare une annonce pour #général</button><button type="button">Ouvre LFG</button></div><form id="binch-intendant-form"><label for="binch-intendant-query">Ta demande</label><div><input id="binch-intendant-query" autocomplete="off" maxlength="1000" placeholder="Faith, prépare une annonce de donjon…"><button type="submit">Envoyer</button></div></form>';
 document.body.append(btn,panel);list=$('#binch-intendant-messages');input=$('#binch-intendant-query');
 const toneButton=$('#binch-brog-tone');
 function paintTone(){toneButton.textContent=tone()?'Répliques : actives':'Répliques : discrètes';toneButton.setAttribute('aria-pressed',String(tone()))}
 toneButton.onclick=()=>{setTone(!tone());paintTone()};paintTone();
 const toggle=()=>{panel.hidden=!panel.hidden;btn.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){render();input.focus()}else btn.focus()};
 btn.onclick=toggle;$('#binch-intendant-close').onclick=toggle;
 panel.querySelector('form').onsubmit=e=>{e.preventDefault();submit(input.value)};
 panel.querySelectorAll('.binch-intendant-suggestions button').forEach(b=>b.onclick=()=>submit(b.textContent));
 const pageChips={gm:['Préparer un briefing','Ouvre LFG','Prépare une annonce pour #général'],
 lfg:['Prépare une annonce pour #général','Ouvre le mode GM','Comment synchroniser ?'],
 sync:['Comment synchroniser ?','Mon profil','Mes prochaines étapes'],
 metiers:['Mes métiers','Mes prochaines étapes','Ouvre LFG'],
 progression:['Mes prochaines étapes','Mon profil','Mes métiers']};
 function contextual(){
  const suggestions=panel.querySelector('.binch-intendant-suggestions');
  const xs=pageChips[current()]||['Mes prochaines étapes','Comment synchroniser ?','Prépare une annonce pour #général','Ouvre LFG','Voir les vrais procs'];
  suggestions.replaceChildren();
  xs.forEach(text=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>submit(text);suggestions.append(b)});
 }
 btn.addEventListener('click',contextual);
 document.addEventListener('click',e=>{if(e.target.closest('#app nav.nav button[data-page]')&&!panel.hidden)contextual()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();toggle()}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();