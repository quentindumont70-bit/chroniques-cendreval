/* La Binch — copilote local, sans service d'IA externe ni données inventées. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function skillList(state,last){
 const craft=read('grimoire.craft.v1')||{};
 const key=(last.name||'').trim().toLowerCase()+'-'+(state.race||'')+'-'+(state.classe||'');
 const found=craft.imports?.[key]?.skills;
 if(!found||typeof found!=='object')return [];
 return Object.entries(found).filter(([k,v])=>k&&Number.isFinite(+v)&&+v>=0).slice(0,20).sort((a,b)=>b[1]-a[1]);
}
function snapshot(){
 const state=read('grimoire.hub.v3')||{},last=read('grimoire.bridge.last'),data=state.data||{};
 if(!last?.name)return {ready:false};
 if(String(last.name).toLowerCase()!==String(data.pseudo||'').toLowerCase())return {ready:false,other:true};
 const level=Number(last.level);
 if(!Number.isInteger(level)||level<1||level>60)return {ready:false};
 return {ready:true,name:String(last.name),level,cls:state.classe||'inconnue',race:state.race||'',zone:String(last.zone||'inconnue'),xp:Number(last.xp),xpMax:Number(last.xpMax),questCount:Number(last.questIds)||0,updated:last.updated,skills:skillList(state,last)};
}
function advice(p){
 const ideas=[];
 if(p.level<10)ideas.push('Début de progression : privilégie les quêtes proches et récupère tes nouvelles compétences auprès du maître de classe.');
 else if(p.level<60)ideas.push('Pour progresser, regroupe les quêtes d’une même zone et évite les longs allers-retours inutiles.');
 else ideas.push('Niveau 60 : concentre-toi sur la préparation des donjons, l’équipement et les métiers.');
 if(p.xpMax>0&&Number.isFinite(p.xp)){
  const percent=Math.max(0,Math.min(100,Math.round(100*p.xp/p.xpMax)));
  if(percent>=85&&p.level<60)ideas.push('Tu es à '+percent+' % du niveau : anticipe ton prochain passage chez le maître de classe.');
 }
 if(p.skills.length){
  const under=p.skills.filter(([name,value])=>value>0&&value<75);
  if(under.length)ideas.push('Métiers à développer : '+under.slice(0,2).map(([name,v])=>name+' ('+v+')').join(', ')+'. Vérifie les recettes et composants disponibles.');
 }else ideas.push('Aucune valeur de métier confirmée dans le dernier import : les conseils restent généraux.');
 ideas.push('Les quêtes sont considérées accomplies uniquement lorsque leurs identifiants sont reconnus dans le catalogue Forever.');
 return ideas;
}
function brief(p){
 return ['BRIEFING LA BINCH — WoW Forever',
 'Personnage : '+p.name+' · '+p.race+' '+p.cls+' · niveau '+p.level,
 'Zone : '+p.zone,
 p.xpMax>0&&Number.isFinite(p.xp)?'XP : '+p.xp+'/'+p.xpMax:'',
 'Quêtes rendues enregistrées : '+p.questCount+' identifiants (ne représente pas les quêtes en cours).',
 'Métiers : '+(p.skills.length?p.skills.map(([name,rank])=>name+' '+rank).join(', '):'non renseignés'),
 'Dernier import : '+(p.updated||'date inconnue'),
 'Conseils :',...advice(p).map(x=>'- '+x),
 'Réponds à partir de ces données sans inventer mes quêtes actives, mon équipement ou les spécificités de Forever. Propose les trois prochaines actions de leveling, en signalant les informations manquantes.'
 ].filter(Boolean).join('\n');
}
function paint(){
 const panel=$('binch-copilot'),p=snapshot();if(!panel)return;
 const content=$('binch-copilot-content'),btn=$('binch-copilot-copy');
 if(!p.ready){
  content.innerHTML='<p>Aucun import actuel confirmé pour le personnage affiché. Importe <code>GrimoireSync.lua</code> pour débloquer un briefing personnel.</p>';
  btn.disabled=true;return;
 }
 btn.disabled=false;
 const stamp=p.updated?new Date(p.updated):null;
 content.innerHTML='<p><strong>'+safe(p.name)+'</strong> · niveau '+p.level+' · '+safe(p.cls)+' · '+safe(p.zone)+'</p>'+
 '<p class="binch-copilot-meta">Dernier import : '+(stamp&&!isNaN(+stamp)?safe(stamp.toLocaleString('fr-FR')):'date inconnue')+' · '+p.questCount+' identifiants de quêtes sauvegardés</p>'+
 '<ul>'+advice(p).map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul>'+
 '<p class="binch-copilot-meta">Conseils locaux indicatifs ; aucun accès en direct au jeu, aucune IA appelée automatiquement.</p>';
}
function mount(){
 const page=$('page-sync');if(!page||$('binch-copilot'))return;
 const box=document.createElement('section');box.id='binch-copilot';box.className='panel section';
 box.innerHTML='<div class="eyebrow">BROG · COPILOTE LOCAL</div><h2>Ton prochain objectif</h2><div id="binch-copilot-content" aria-live="polite"></div><div class="binch-copilot-actions"><button id="binch-copilot-copy" type="button">Copier mon briefing pour ChatGPT</button><button id="binch-copilot-refresh" type="button">Actualiser les conseils</button></div><p id="binch-copilot-status" role="status" aria-live="polite"></p>';
 const anchor=$('binch-direct-import');
 if(anchor)anchor.after(box);else page.prepend(box);
 $('binch-copilot-copy').addEventListener('click',async()=>{
  const p=snapshot();if(!p.ready)return;
  const txt=brief(p);
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(txt)}
  else{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();if(!document.execCommand('copy'))throw Error('copie refusée');ta.remove()}
   $('binch-copilot-status').textContent='Briefing copié. Colle-le dans ChatGPT pour recevoir des recommandations adaptées.';
  }catch(e){$('binch-copilot-status').textContent='Copie bloquée par le navigateur : réessaie depuis Opera, sur le site HTTPS.'}
 });
 $('binch-copilot-refresh').addEventListener('click',paint);
 document.addEventListener('grimoire:sync',paint);
 window.addEventListener('storage',e=>{if(['grimoire.bridge.last','grimoire.hub.v3','grimoire.craft.v1'].includes(e.key))paint()});
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();