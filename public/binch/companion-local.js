/* La Binch - opt-in Windows loopback bridge. No implicit network polling. */
(()=>{'use strict';
const ENDPOINT='http://127.0.0.1:18764/grimoire';
let token='',timer=0,busy=false,lastSig='';
const $=id=>document.getElementById(id);
function status(text,error=false){const el=$('binch-companion-status');if(el){el.textContent=text;el.dataset.state=error?'error':'ok'}}
function stop(){if(timer){clearTimeout(timer);timer=0}}
function schedule(){stop();if(!token||document.visibilityState==='hidden')return;timer=setTimeout(async()=>{timer=0;await poll(true);schedule()},12000)}
async function poll(silent=false){
 if(!token||busy||document.visibilityState==='hidden')return;
 busy=true;
 try{
  const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),4000);
  let res;
  try{res=await fetch(ENDPOINT,{method:'GET',headers:{'X-Binch-Token':token},cache:'no-store',signal:ctl.signal,credentials:'omit'})}
  finally{clearTimeout(timeout)}
  if(!res.ok)throw Error('Relais local : HTTP '+res.status);
  const lua=await res.text();
  if(lua.length>10*1024*1024)throw Error('Fichier trop volumineux');
  // No unnecessary imports, writes or event storms when file is unchanged.
  if(lua===lastSig){if(!silent)status('Sauvegarde identique, aucun nouvel import.');return}
  if(!window.BinchSync?.parsePayload||!window.BinchSync?.importCharacter)throw Error('Module de synchronisation indisponible');
  const snapshot=window.BinchSync.parsePayload(lua);
  const imported=window.BinchSync.importCharacter(snapshot);
  if(imported===false)throw Error('Import refuse : profil conserve');
  lastSig=lua;
  status('Import local : '+snapshot.name+' · niveau '+snapshot.level+' · '+snapshot.zone);
 }catch(err){if(!silent)status('Connexion impossible : '+err.message+' (compagnon ouvert, jeton correct, autorisation Opera ?)',true)}
 finally{busy=false}
}
function mount(){
 const target=$('binch-easy-sync')||$('grimoire-bridge');if(!target||$('binch-companion'))return;
 const section=document.createElement('section');section.id='binch-companion';section.className='binch-companion';
 section.innerHTML='<h3>Compagnon Windows <small>prototype local · optionnel</small></h3><p>Ouvre le compagnon Windows, choisis <code>GrimoireSync.lua</code>, puis colle ici le jeton temporaire affiché dans sa fenêtre. Lecture locale uniquement, via 127.0.0.1. Aucun mot de passe WoW demandé.</p><div class="binch-companion-actions"><a href="./Compagnon-La-Binch.ps1" download>Télécharger le compagnon .ps1</a><label>Jeton de session <input id="binch-companion-token" type="password" autocomplete="off" spellcheck="false" placeholder="Jeton du compagnon"></label><button type="button" id="binch-companion-connect">Connecter</button><button type="button" id="binch-companion-stop">Déconnecter</button></div><p id="binch-companion-status" role="status">Déconnecté. Aucune lecture automatique sans action.</p><details><summary>Mode d’emploi et sécurité</summary><p>Depuis Windows : clic droit sur le .ps1 → Exécuter avec PowerShell, ou lancer explicitement depuis PowerShell. Le compagnon ne s’installe pas en service, ne démarre pas avec Windows, n’écrit pas dans le dossier WoW et s’arrête en fermant sa console. La lecture se fait uniquement pendant que la page est visible et après saisie du jeton. Les restrictions de réseau local d’Opera peuvent bloquer la liaison ; l’import manuel reste disponible.</p></details>';
 target.after(section);
 $('binch-companion-connect').addEventListener('click',async()=>{const input=$('binch-companion-token').value.trim();if(!/^[A-Za-z0-9_-]{20,100}$/.test(input)){status('Jeton invalide : copie le jeton affiché par le compagnon.',true);return}token=input;lastSig='';await poll(false);schedule()});
 $('binch-companion-stop').addEventListener('click',()=>{stop();token='';lastSig='';$('binch-companion-token').value='';status('Déconnecté : aucune lecture locale en cours.')});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(token){poll(true).then(schedule)}}else stop()});
 window.addEventListener('pagehide',stop,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();