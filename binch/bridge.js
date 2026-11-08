(()=>{
'use strict';
const KEY='grimoire.hub.v3';
const RACE={Human:'Humain',Dwarf:'Nain',Gnome:'Gnome',NightElf:'Elfe',Scourge:'MortVivant',Undead:'MortVivant',Tauren:'Tauren',Troll:'Troll',Orc:'Orc'};
const CLASS={WARRIOR:'Guerrier',PALADIN:'Paladin',HUNTER:'Chasseur',ROGUE:'Voleur',PRIEST:'Prêtre',SHAMAN:'Chaman',MAGE:'Mage',WARLOCK:'Démoniste',DRUID:'Druide'};
const FLAG_TO_DISCOVERY={'79976':'bag-quest','6082':'hunter-pet','6085':'hunter-pet','6088':'hunter-pet','6102':'hunter-pet','94013':'hunter-pet','94864':'hunter-pet','6001':'druid-bear','6002':'druid-bear','94638':'druid-bear','1719':'warrior-berserk','1792':'warrior-whirlwind','1518':'shaman-earth','1521':'shaman-earth','92468':'shaman-earth','94375':'shaman-earth','1701':'warrior-firemail'};
const BAG_CHAIN=[['79008','Départ Alliance'],['79007','Départ Horde'],['79192','Stepping Stones'],['79980','Scramble'],['79974','Wet Job'],['79975','Eagle’s Fist'],['79976','This Must Be The Place']];
const $=id=>document.getElementById(id);
function decode(s){try{return decodeURIComponent(s)}catch{return s}}
function payloadFromLua(raw){const m=raw.match(/(?:\["payload"\]|payload)\s*=\s*"((?:\\.|[^"\\])*)"/);if(!m)throw Error('Aucun payload GrimoireSync reconnu. Mets à jour l’addon puis fais /reload ou déconnecte-toi.');return m[1].replace(/\\"/g,'"').replace(/\\\\/g,'\\')}
function parsePayload(raw){
 const payload=/^GF[345]\|/.test(raw)?raw:payloadFromLua(raw);
 if(!/^GF[345]\|/.test(payload))throw Error('Format non pris en charge');
 const chunks=Object.fromEntries(payload.split('|').slice(1).map(section=>[section.slice(0,section.indexOf(':')),section.slice(section.indexOf(':')+1)]));
 const fields=(chunks.C||'').split(',');if(fields.length<9)throw Error('Profil incomplet');
 const [name,realm,level,cls,race,faction,zone,,timestamp]=fields;
 const lvl=+level;if(!name||!Number.isInteger(lvl)||lvl<1||lvl>60)throw Error('Niveau ou personnage invalide');
 const skills={};for(const row of (chunks.P||'').split(';')){const [name,rank]=row.split(',');if(name&&Number.isFinite(+rank)&&+rank>=0&&+rank<=450)skills[decode(name)]=+rank}
 const questIds=[...new Set((chunks.Q||'').split(';').filter(x=>/^\d{1,8}$/.test(x)))].slice(0,10000);
 return {schema:payload.slice(0,3),name:decode(name),realm:decode(realm),level:lvl,cls:decode(cls),race:decode(race),faction:decode(faction),zone:decode(zone),timestamp:+timestamp||0,questIds,skills};
}
function renderStatus(text,isError=false){const el=$('grimoire-bridge-status');if(el){el.textContent=text;el.style.color=isError?'#ff9a89':'var(--gold)'}}
function importCharacter(snap){
 let state;try{state=JSON.parse(localStorage.getItem(KEY))||{}}catch{state={}}
 const newRace=RACE[snap.race],newClass=CLASS[snap.cls];
 if(!newRace||!newClass)throw Error('Race/classe inconnue du profil : '+snap.race+'/'+snap.cls+'. Données non modifiées.');
 const prev=state.data||{},before=String(prev.pseudo||''),next=snap.name;
 const changed=before.trim().toLowerCase()!==next.trim().toLowerCase();
 // Do not accidentally switch characters or destroy a manually chosen profile.
 if(changed&&before&&before!=='Aventurier'&&!confirm('Importer le personnage '+next+' à la place de '+before+' ? Les états de quête restent séparés par personnage.'))return false;
 state.onboarded=true;state.race=newRace;state.classe=newClass;state.data={...prev,pseudo:next,level:String(snap.level)};
 localStorage.setItem(KEY,JSON.stringify(state));
 const doneKey='grimoire.discovery.done.v1.'+next.trim().toLowerCase()+'.'+newRace+'.'+newClass;
 let done={};try{done=JSON.parse(localStorage.getItem(doneKey))||{}}catch{}
 let completed=0;
 for(const id of snap.questIds){const discovery=FLAG_TO_DISCOVERY[id];if(discovery&&!done[discovery]){done[discovery]=true;completed++}}
 localStorage.setItem(doneKey,JSON.stringify(done));
 const last={name:next,realm:snap.realm,level:snap.level,zone:snap.zone,questIds:snap.questIds.length,updated:new Date().toISOString(),completed};
 last.bagQuestStep=BAG_CHAIN.reduce((a,[id,label])=>snap.questIds.includes(id)?label:a,'Pas encore détectée');
 last.questIdList=snap.questIds;
 localStorage.setItem('grimoire.bridge.last',JSON.stringify(last));
 const craftKey='grimoire.craft.v1';let craft={};try{craft=JSON.parse(localStorage.getItem(craftKey))||{}}catch{}craft.imports=craft.imports||{};craft.imports=Object.assign(craft.imports,{[next.trim().toLowerCase()+'-'+newRace+'-'+newClass]:{skills:snap.skills||{},updated:new Date().toISOString()}});localStorage.setItem(craftKey,JSON.stringify(craft));
 renderStatus('Profil importé : '+next+' · niveau '+snap.level+' · '+snap.zone+' · '+completed+' quête(s) automatiquement validée(s) · '+Object.keys(snap.skills||{}).length+' métiers.');
 const name=$('pseudo'),level=$('level');if(name)name.value=next;if(level)level.value=snap.level;
 document.dispatchEvent(new CustomEvent('grimoire:sync',{detail:last}));
 // Original hub reads its own in-memory state and will reload it from localStorage at startup.
 setTimeout(()=>location.reload(),300);
 return true;
}
function mount(){
 const host=$('page-sync')||$('page-hub');if(!host||$('grimoire-bridge'))return;
 const section=document.createElement('section');section.id='grimoire-bridge';section.className='panel section';
 section.innerHTML='<div class="eyebrow">Pont WoW → Carnet de route</div><h2>Importer mon personnage</h2><p>Import local du fichier <code>WTF/Account/.../SavedVariables/GrimoireSync.lua</code> après <code>/reload</code> ou déconnexion. Aucune donnée envoyée à un serveur. Sur Windows, sélectionner le fichier sauvegardé après <code>/reload</code>.</p><label for="grimoire-bridge-file" style="display:inline-block;cursor:pointer;padding:12px;border:1px solid var(--gold);border-radius:6px">Choisir GrimoireSync.lua</label><input type="file" id="grimoire-bridge-file" accept=".lua,.txt" style="position:absolute;width:1px;height:1px;opacity:0"><p id="grimoire-bridge-status" role="status" aria-live="polite" class="muted">Synchronisation manuelle sécurisée. L’état des quêtes non reconnues reste inchangé.</p><div id="grimoire-last-import" class="muted"></div><p class="muted">Le navigateur ne peut pas lire en permanence le dossier WoW sans ton autorisation ; cet import se fait à chaque nouvelle sauvegarde. Les quêtes compatibles sont validées par identifiant, jamais par simple niveau.</p>';
 host.prepend(section);
 try{const last=JSON.parse(localStorage.getItem('grimoire.bridge.last'));if(last){$('grimoire-last-import').textContent='Dernier import : '+last.name+' · niveau '+last.level+' · '+(last.questIds||0)+' quêtes détectées · sac de couchage : '+(last.bagQuestStep||'Non détecté')}}catch{}
 $('grimoire-bridge-file').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>20*1024*1024){renderStatus('Fichier trop volumineux (20 Mo maximum).',true);return}
  try{const snap=parsePayload(await file.text());importCharacter(snap)}catch(err){renderStatus('Import impossible : '+err.message,true)}
  finally{e.target.value=''}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();