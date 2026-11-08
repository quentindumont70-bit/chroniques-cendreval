(()=>{
 'use strict';const API='https://forevercompanion.io/api/v1',TTL=21600000,$=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function profile(){try{return JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{return {}}}
 function faction(r){return ['Humain','Nain','Elfe','Gnome'].includes(r)?'alliance':['Orc','Tauren','Troll','MortVivant'].includes(r)?'horde':'alliance'}
 async function cached(path){const key='grimoire.api.'+path;try{const old=JSON.parse(localStorage.getItem(key));if(old&&Date.now()-old.time<TTL)return old.data}catch{}const res=await fetch(API+path);if(!res.ok)throw Error(res.status);const json=await res.json();try{localStorage.setItem(key,JSON.stringify({time:Date.now(),data:json.data}))}catch{}return json.data}
 function shell(){const page=$('page-progression');if(!page||$('journey-live'))return null;const s=document.createElement('section');s.id='journey-live';s.className='panel section journey-live';s.innerHTML='<div class="journey-head"><div><div class="eyebrow">Mon voyage · recommandations vivantes</div><h2 id="journey-title">Prochaine étape</h2></div><div id="journey-level" class="journey-level"></div></div><div class="journey-track"><i id="journey-progress"></i></div><div id="journey-categories" class="journey-categories"></div><div id="journey-grid" class="journey-grid"><article class="journey-step"><b>Préparation du voyage…</b><small>Les données utiles sont mises en cache sur cet appareil.</small></article></div><p class="journey-source">Données secondaires : <a href="https://forevercompanion.io/developers" target="_blank" rel="noopener">API publique Forever Companion</a>, avec ses sources et niveaux de vérification. Grimoire conserve ses propres profils, cartes et recommandations.</p>';page.prepend(s);return s}
 async function render(){
  if(!shell()&&!$('journey-live'))return;const p=profile(),lvl=Math.max(1,Math.min(60,+p.data?.level||1)),fac=faction(p.race),cls=String(p.classe||'').toLowerCase().replace('prêtre','priest').replace('guerrier','warrior').replace('voleur','rogue').replace('chasseur','hunter').replace('démoniste','warlock').replace('mage','mage').replace('druide','druid').replace('paladin','paladin').replace('chaman','shaman');
  $('journey-level').textContent='Niveau '+lvl;$('journey-progress').style.width=((lvl/60)*100)+'%';
  try{
   const [allZones,allDungeons,allRares,allClassQuests]=await Promise.all([cached('/zones'),cached('/dungeons'),cached('/rares'),cached('/class-quests')]);
   const compatible=x=>!x.faction||x.faction==='both'||x.faction===fac;
   const zones=(allZones||[]).filter(z=>compatible(z)&&z.minLevel<=lvl+5&&z.maxLevel>=Math.max(1,lvl-3));
   const dungeons=(allDungeons||[]).filter(d=>compatible(d)&&d.minLevel<=lvl+7);
   const rares=(allRares||[]).filter(compatible);
   const classQuests=(allClassQuests||[]).filter(q=>compatible(q)&&(!cls||q.class===cls));
   const zone=zones.sort((a,b)=>Math.abs(a.minLevel-lvl)-Math.abs(b.minLevel-lvl))[0],dungeon=dungeons.filter(d=>d.minLevel<=lvl+3).sort((a,b)=>Math.abs(a.minLevel-lvl)-Math.abs(b.minLevel-lvl))[0],cq=classQuests.filter(q=>q.level>=lvl-2).sort((a,b)=>a.level-b.level)[0],nearRares=rares.filter(r=>!zone||r.zone===zone.name).slice(0,3);
   $('journey-title').textContent=zone?'Cap sur '+zone.name:'Construis ta prochaine étape';
   $('journey-categories').innerHTML='<span>Zones '+(zones||[]).length+'</span><span>Donjons '+(dungeons||[]).length+'</span><span>Rares proches '+nearRares.length+'</span><span>Quêtes de classe '+(classQuests||[]).length+'</span>';
   const cards=[];if(zone)cards.push({kind:'Zone conseillée',name:zone.name,text:'Niveaux '+zone.minLevel+'–'+zone.maxLevel+(zone.isNew?' · Nouvelle dans Forever':'')});
   if(dungeon)cards.push({kind:'Donjon accessible',name:dungeon.name,text:'Niveaux '+dungeon.minLevel+'–'+dungeon.maxLevel+' · '+dungeon.questCount+' quêtes · '+dungeon.lootCount+' butins'});
   if(cq)cards.push({kind:'Quête de classe',name:cq.name,text:'Niveau '+cq.level+' · '+(cq.reward||'Récompense de classe')});
   nearRares.forEach(r=>cards.push({kind:r.elite?'Rare élite à surveiller':'Rare à surveiller',name:r.name,text:(r.levels?'Niveau '+r.levels+' · ':'')+(r.loot?.length||0)+' butins notables'}));
   $('journey-grid').innerHTML=cards.map((c,i)=>'<article class="journey-step '+(i===0?'current':'')+'"><span class="kind">'+esc(c.kind)+'</span><b>'+esc(c.name)+'</b><small>'+esc(c.text)+'</small></article>').join('')||'<article class="journey-step"><b>Données temporairement indisponibles</b><small>L’atlas local reste entièrement utilisable.</small></article>';
  }catch(e){$('journey-grid').innerHTML='<article class="journey-step"><b>Source externe indisponible</b><small>L’atlas local et tes données restent disponibles ; un nouvel essai aura lieu plus tard.</small></article>'}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();

