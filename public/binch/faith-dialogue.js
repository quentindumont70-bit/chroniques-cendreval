/* Faith · tactical local conversation, not a remote generative model. */
(()=>{'use strict';
const KEY='binch.faith.dialogue.v1',MAX=35,$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=350)=>String(s??'').trim().slice(0,n);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
let knowledgeRows=[],knowledgeStatus='loading';
async function loadKnowledge(){
 try{
  knowledgeRows=await window.BinchFaithKnowledgeCatalog.load(fetch.bind(window),window.BinchFaithKnowledgeValidator);
  knowledgeStatus='ready';
 }catch{knowledgeRows=[];knowledgeStatus='unavailable'}
 const e=$('binch-faith-knowledge-state');
 if(e)e.textContent=knowledgeStatus==='ready'?'Savoir sourcé : '+knowledgeRows.length+' fiches locales vérifiées.':'Savoir sourcé indisponible. Faith reste en mode local.';
}

function context(){
 const p=read('grimoire.hub.v3',{}),last=read('grimoire.bridge.last',{}),d=p.data||{},name=clean(d.pseudo||'',40),same=!!name&&name.toLocaleLowerCase('fr')===String(last.name||'').trim().toLocaleLowerCase('fr');
 const level=Number(same?last.level:d.level);
 const roster=read('binch.guild.delegations.v1',[]);
 const scope=read('binch.ah.scope.v1',{});
 const market=read('binch.ah.market.v1',{}),realm=String(scope.realm||'').trim().toLocaleLowerCase('fr'),faction=['Horde','Alliance'].includes(scope.faction)?scope.faction:'';
 const scoped=Array.isArray(market.items)?market.items.filter(x=>(x.scope||'legacy')===(realm&&faction?realm+'|'+faction:'legacy')):[];
 const manual=window.BinchMarketBridge?.snapshot(read('binch.market.v1',{}),market,{realm,faction});
 return {name:name||'Aventurier',className:clean(p.classe||'',40),spec:clean(d.spec||d.specialization||p.specialization||'',55),level:Number.isInteger(level)&&level>0&&level<=60?level:null,same,zone:clean(same?last.zone:d.zone||'',75),date:same?last.updated:null,realm,faction,prices:scoped,manualMarket:manual,quests:same&&Array.isArray(last.questLog)?last.questLog:[],tasks:Array.isArray(roster)?roster.filter(x=>x.status!=='done'):[],gear:same&&Array.isArray(last.equipment)?last.equipment:[]};
}
function reply(input,c){
 const q=input.toLocaleLowerCase('fr');
 // Single prioritization engine for Faith and the home briefing.
 if(/que faire|quoi faire|prochain(?:e)? (?:objectif|action|qu[êe]te)|priorit[ée]|par quoi commencer|ordre du jour|plan d.aventure|leveling maintenant/.test(q)){
  const p=read('grimoire.hub.v3',{}),discovery=window.BinchDiscoveries?.recommendations?.()||[];
  const jobs=Array.isArray(p.jobs)?p.jobs:Array.isArray(p.metiers)?p.metiers:[];
  const engine=window.BinchJourneyEngine;
  if(!engine?.generate)return 'Le planificateur local est indisponible. Consulte ton Carnet de route et les incontournables.';
  const settings=read('binch.ultimate.briefing.v1.'+[p.data?.pseudo||'aventurier',p.race||'',p.classe||''].map(x=>encodeURIComponent(String(x).trim().toLocaleLowerCase('fr'))).join('.'),{});
  const result=engine.generate({className:p.classe||'',race:p.race||'',level:c.level||Number(p.data?.level)||1,imported:c.same,mode:settings.mode||'balanced',discoveries:discovery,professions:jobs,completed:Array.isArray(settings.dismissed)?settings.dismissed:[]});
  return result.next?'Selon le carnet de route local : '+result.next.title+'. '+result.next.description+' Rubrique à ouvrir : '+result.next.page+'. Source : '+(result.next.origin||'profil local')+'. '+result.notice:'Aucune prochaine étape sourcée ne ressort du profil. Consulte les incontournables et synchronise ton personnage.';
 }

 const knowledge=window.BinchFaithKnowledge?.answer(input,knowledgeRows);
 if(knowledge?.found){
  const citations=knowledge.citations.map(x=>x.label+' ('+x.url+', consulté le '+x.checkedAt+')').join(' ; ');
  return 'Fiche Faith vérifiée '+knowledge.recordId+' : '+knowledge.text+' Sources : '+citations+'.';
 }
 const prof=c.name+(c.level?' · niv. '+c.level:'')+(c.className?' · '+c.className:'');
 if(/bonjour|salut|yo|faith/.test(q))return 'Les esprits sont de bonne humeur, '+prof+'. Je peux t’aider avec tes quêtes, ton équipement, la Bourse ou les missions de guilde. Mes réponses viennent uniquement des données présentes ici.';
 if(/march|bourse|ah|prix|vente|or\b|artisan|commerce/.test(q)){
  if(!c.realm||!c.faction)return 'Le marché n’est pas identifié. Renseigne ton royaume et ta faction dans la Bourse avant d’utiliser ses relevés comme référence. Aucune enchère en direct n’est consultée.';
  const latest=c.prices.filter(x=>Number(x.last)>0&&Number.isFinite(Date.parse(x.observedAt))).sort((a,b)=>String(b.observedAt).localeCompare(String(a.observedAt)))[0];
  if(!latest){const manual=c.manualMarket?.items?.[0];if(manual){const age=Math.max(0,Math.floor((Date.now()-Date.parse(manual.observedAt))/3600000));return 'Bourse '+c.realm+' / '+c.faction+' : '+c.manualMarket.items.length+' observation(s) locales, incluant le registre historique. Dernière observation '+clean(manual.name,75)+' : '+Number(manual.price).toLocaleString('fr-FR')+' cuivre il y a environ '+age+' h. Origine : '+manual.store+', '+clean(manual.source,50)+'. Ce n’est pas un prix live ni une transaction garantie.';}return 'Aucun prix observé sur '+c.realm+' / '+c.faction+'. Ajoute un relevé réel ou un import compatible. Aucun cours ne sera inventé.';}
  const age=Math.max(0,Math.floor((Date.now()-Date.parse(latest.observedAt))/3600000));
  return 'Marché '+c.realm+' / '+c.faction+' : '+c.prices.length+' objet(s) enregistrés. Dernier relevé : '+clean(latest.name,75)+' à '+Number(latest.last).toLocaleString('fr-FR')+' cuivre, il y a environ '+age+' h. Source déclarée : '+clean(latest.source||'inconnue',65)+'. Ne confonds pas observation et prix de vente garanti.';
 }
 if(/guilde|gm|mission|délégu|raid|groupe|sortie|donjon/.test(q)){
  const list=c.tasks.filter(x=>x&&x.title).sort((a,b)=>Number(b.priority==='urgent')-Number(a.priority==='urgent')).slice(0,3);
  return list.length?'Dans le registre local, '+c.tasks.length+' mission(s) restent ouvertes. Priorités : '+list.map(x=>clean(x.title,50)+' ('+clean(x.owner||'sans responsable',40)+', '+clean(x.status||'à faire',20)+')').join(' ; ')+'. Ce ne sont pas des confirmations du Discord.':'Aucune mission GM ouverte n’est enregistrée sur cet appareil. Crée une délégation dans le Hub GM, ou consulte le calendrier.';
 }
 if(/[ée]quip|armure|ours|tank|f[ée]lin|soin|heal|sp[ée]c/.test(q)){
  if(!c.same)return 'Je ne dispose pas d’un import correspondant au profil sélectionné. Les conseils d’équipement seraient une supposition. Importe ton personnage dans la synchronisation.';
  return prof+' : '+c.gear.length+' emplacement(s) équipés remontés au dernier import. '+(c.spec?'Spécialisation déclarée : '+c.spec+'. ':'Aucune spécialisation fiable renseignée. ')+'Compare tes ensembles ours, félin ou soins dans l’Arsenal. Je n’attribue pas de statistiques absentes du fichier.';
 }
 if(/qu[êe]te|xp|pex|level|niveau|zone|progres/.test(q)){
  if(!c.same)return 'Je peux proposer des parcours indicatifs, mais il faut importer le personnage pour connaître sa zone, son expérience et son journal réels.';
  const active=c.quests.filter(x=>x&&typeof x.title==='string').slice(0,3);
  return prof+' en '+(c.zone||'zone inconnue')+'. '+(active.length?'Le journal contient notamment : '+active.map(x=>clean(x.title,75)).join(' ; ')+'.':'Aucune quête exploitable n’a été remontée par cet import.')+' Les objectifs de quête et trajets ne sont pas confirmés par cet échange.';
 }
 if(/synchron|addon|grimoire|reload|sauvegarde/.test(q))return 'Le navigateur ne lit pas les fichiers WoW sans ton intervention. Lance /reload en jeu, puis importe volontairement le fichier SavedVariables dans la page Synchronisation. Le compagnon Windows reste un prototype à valider.';
 return 'Les esprits ont entendu : « '+clean(input,90)+' ». Pour une réponse fiable, précise quêtes, équipement, commerce, guilde ou synchronisation. Je suis un conseiller local à règles, pas une IA distante ; je ne fabrique pas de données.';
}
function identity(){const c=context();return encodeURIComponent(c.name.toLocaleLowerCase('fr')+'|'+c.className.toLocaleLowerCase('fr'))}
function history(){const all=read(KEY,{});const h=all?.[identity()];return Array.isArray(h)?h.filter(x=>x&&['user','faith'].includes(x.who)&&typeof x.text==='string').slice(-MAX):[]}
function persist(entries){const all=read(KEY,{}),id=identity();all[id]=entries.slice(-MAX);const keys=Object.keys(all);if(keys.length>12)delete all[keys[0]];try{localStorage.setItem(KEY,JSON.stringify(all))}catch{}}
function mount(){
 if($('binch-faith-dialogue'))return true;const host=$('binch-faith-advisor');if(!host)return false;
 const panel=document.createElement('section');panel.id='binch-faith-dialogue';panel.className='binch-faith-dialogue';
 panel.innerHTML='<details id="binch-faith-talk"><summary>Parler à Faith · conseiller local</summary><p>Faith, esprit d’un troll chaman. Les réponses suivent des règles locales et tes derniers imports. Aucune conversation n’est envoyée à une IA ou au Discord.</p><div id="binch-faith-dialogue-history" role="log" aria-live="polite" aria-label="Conversation avec Faith"></div><form id="binch-faith-dialogue-form"><label for="binch-faith-dialogue-input">Question</label><input id="binch-faith-dialogue-input" maxlength="350" required placeholder="Quelles missions de guilde sont urgentes ?"><button type="submit">Demander</button></form><div class="binch-faith-dialogue-actions"><button type="button" data-faith-suggest="Où en sont mes quêtes ?">Quêtes</button><button type="button" data-faith-suggest="Que sais-tu du marché AH ?">Commerce</button><button type="button" data-faith-suggest="Quelles missions de guilde sont urgentes ?">Guilde</button><button type="button" id="binch-faith-dialogue-clear">Effacer l’historique</button></div><small id="binch-faith-dialogue-state">Historique local du personnage. <span id="binch-faith-knowledge-state">Chargement des connaissances sourcées…</span></small></details>';
 document.body.append(panel);
 const launcher=document.createElement('button');launcher.type='button';launcher.id='binch-faith-dock';launcher.textContent='Faith · conseils';launcher.setAttribute('aria-controls','binch-faith-dialogue');launcher.setAttribute('aria-expanded','false');
 document.body.append(launcher);
 panel.hidden=true;
 const close=document.createElement('button');close.type='button';close.id='binch-faith-dock-close';close.textContent='Fermer';close.setAttribute('aria-label','Fermer Faith');panel.querySelector('summary')?.after(close);
 const toggle=show=>{panel.hidden=!show;launcher.setAttribute('aria-expanded',String(show));if(show){$('binch-faith-talk').open=true;$('binch-faith-dialogue-input')?.focus({preventScroll:true})}else launcher.focus({preventScroll:true})};
 launcher.onclick=()=>toggle(panel.hidden);
 close.onclick=()=>toggle(false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();toggle(false)}});

 let lastIdentity=identity();
 function draw(){
  const rows=history(),log=$('binch-faith-dialogue-history');log.replaceChildren();
  if(!rows.length){const p=document.createElement('p');p.textContent='Faith : « Parle, voyageur. Le savoir n’a pas besoin de te vendre une API. »';log.append(p);return}
  for(const msg of rows){const p=document.createElement('p');p.className='faith-line faith-'+msg.who;p.textContent=(msg.who==='user'?'Vous':'Faith')+' : '+msg.text;log.append(p)}
  log.scrollTop=log.scrollHeight;
 }
 function ask(value){const q=clean(value);if(!q)return;let rows=history();rows.push({who:'user',text:q},{who:'faith',text:reply(q,context())});persist(rows);draw()}
 $('binch-faith-dialogue-form').onsubmit=e=>{e.preventDefault();ask($('binch-faith-dialogue-input').value);e.target.reset()};
 panel.addEventListener('click',e=>{const b=e.target.closest('[data-faith-suggest]');if(b){$('binch-faith-talk').open=true;ask(b.dataset.faithSuggest)}});
 $('binch-faith-dialogue-clear').onclick=()=>{if(!confirm('Effacer les échanges Faith du personnage courant ?'))return;persist([]);draw()};
 function refresh(){if(lastIdentity!==identity()){lastIdentity=identity();draw()}}
 document.addEventListener('grimoire:sync',refresh);window.addEventListener('storage',e=>{if(e.key===KEY||e.key==='grimoire.hub.v3')draw()});
 draw();return true;
}
function start(){loadKnowledge();if(mount())return;const root=$('app');if(!root)return;const o=new MutationObserver(()=>{if(mount())o.disconnect()});o.observe(root,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();