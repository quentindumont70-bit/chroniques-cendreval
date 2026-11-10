/* La Binch — private guild cloud opt-in. Requires configured Supabase and SQL schema.
 * Cloud and local data remain distinct. NO automatic upload of player saves.
 * Tokens stay in this tab session and are never logged. */
(()=>{'use strict';
const $=id=>document.getElementById(id),STORE='binch.guild.cloud.session.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=120)=>String(s??'').trim().slice(0,n);
let cfg=null,session=null,guildId='',guilds=[],requests=[],promises=[],members=[],loading=false;
const status=(s)=>{if($('binch-gcloud-status'))$('binch-gcloud-status').textContent=s};
function username(){try{return clean(JSON.parse(localStorage.getItem('grimoire.hub.v3'))?.data?.pseudo,40)}catch{return ''}}
function saveSession(){try{if(session)sessionStorage.setItem(STORE,JSON.stringify(session));else sessionStorage.removeItem(STORE)}catch{}}
function parseTokens(){
 const hash=new URLSearchParams(location.hash.slice(1));
 if(!hash.has('access_token'))return;
 const token=hash.get('access_token'),refresh=hash.get('refresh_token');
 if(token&&refresh){session={access_token:token,refresh_token:refresh,expires:Date.now()+Math.max(300,Number(hash.get('expires_in'))||3600)*1000};saveSession()}
 hash.delete('access_token');hash.delete('refresh_token');hash.delete('expires_in');hash.delete('token_type');hash.delete('type');
 history.replaceState(null,'',location.pathname+location.search+(hash.size?'#'+hash.toString():''));
}
async function initConfig(){
 try{
  const response=await fetch('./guild-cloud-config.json',{cache:'no-store'});
  if(!response.ok)return false;
  const data=await response.json(),url=clean(data.supabaseUrl,180).replace(/\/+$/,''),
        key=clean(data.supabasePublishableKey,400);
  if(!url&&!key)return false;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||key.length<20||/service_role|sb_secret_/i.test(key))throw Error('Configuration cloud incorrecte');
  cfg={url,key};return true;
 }catch(error){status('Cloud non disponible : '+error.message);return false}
}
async function request(path,{method='GET',body,auth=true}={}){
 if(!cfg)throw Error('Cloud non configuré');
 if(auth)await ensureSession();
 const headers={apikey:cfg.key,Accept:'application/json'};
 if(auth)headers.Authorization='Bearer '+session.access_token;
 if(body!==undefined)headers['Content-Type']='application/json';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),13000);
 try{
  const response=await fetch(cfg.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
  const raw=await response.text();let value=null;
  try{value=raw?JSON.parse(raw):null}catch{throw Error('Réponse cloud incorrecte')}
  if(!response.ok)throw Error(value?.message||value?.error_description||value?.msg||('Erreur serveur '+response.status));
  return value;
 }finally{clearTimeout(timeout)}
}
async function ensureSession(){
 if(!session?.access_token)throw Error('Connecte-toi par email');
 if(session.expires>Date.now()+90000)return;
 if(!session.refresh_token)throw Error('Session expirée, reconnecte-toi');
 const r=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:session.refresh_token}});
 if(!r?.access_token||!r?.refresh_token)throw Error('Renouvellement refusé');
 session={access_token:r.access_token,refresh_token:r.refresh_token,expires:Date.now()+Math.max(300,Number(r.expires_in)||3600)*1000};saveSession();
}
const jurl=x=>encodeURIComponent(x);
function notice(message,error=false){const node=$('binch-gcloud-notice');if(node){node.textContent=message;node.dataset.error=error?'yes':'no'}}
async function sendLogin(){
 const email=clean($('binch-gcloud-email')?.value,200);
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return notice('Adresse email invalide',true);
 const redirect=location.origin+location.pathname;
 await request('/auth/v1/otp',{method:'POST',auth:false,body:{email,create_user:true,options:{email_redirect_to:redirect}}});
 notice('Lien de connexion demandé. Ouvre le message envoyé par Supabase ; vérifie les courriers indésirables.');
}
async function loadGuilds(){
 guilds=await request('/rest/v1/binch_guilds?select=id,name,owner_id,created_at&order=created_at.desc&limit=30')||[];
 if(!guilds.some(x=>x.id===guildId))guildId=guilds[0]?.id||'';
 $('binch-gcloud-guild-select').innerHTML=guilds.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
 $('binch-gcloud-guild-select').value=guildId;
 if(guildId)await loadData();else{members=[];requests=[];promises=[]}
 paint();
}
async function loadData(){
 if(!guildId)return;
 const suffix='?guild_id=eq.'+jurl(guildId);
 [members,requests,promises]=await Promise.all([
  request('/rest/v1/binch_guild_members'+suffix+'&select=user_id,character_name,role,joined_at&limit=100'),
  request('/rest/v1/binch_guild_requests'+suffix+'&select=id,title,quantity,deadline,priority,note,state,created_at,created_by&order=created_at.desc&limit=200'),
  request('/rest/v1/binch_guild_promises'+suffix+'&select=id,request_id,owner_id,item,quantity,status,note,created_at&order=created_at.desc&limit=250')
 ]);
}
async function rpc(name,body){return request('/rest/v1/rpc/'+name,{method:'POST',body})}
async function createGuild(){
 const name=clean($('binch-gcloud-new-name').value,80),character=clean($('binch-gcloud-character').value,40);
 if(name.length<3||character.length<2)throw Error('Nom de guilde ou personnage trop court');
 const id=await rpc('binch_create_guild',{p_name:name,p_character:character});guildId=id;await loadGuilds();notice('Guilde privée créée.');
}
async function joinGuild(){
 const code=clean($('binch-gcloud-invite').value,100),character=clean($('binch-gcloud-character').value,40);
 if(!/^[a-f0-9]{48}$/.test(code)||character.length<2)throw Error('Code d’invitation ou personnage invalide');
 guildId=await rpc('binch_join_guild',{p_code:code,p_character:character});await loadGuilds();notice('Invitation acceptée : accès accordé.');
}
async function invite(){
 if(!guildId)throw Error('Aucune guilde sélectionnée');
 const code=await rpc('binch_issue_invite',{p_guild:guildId});
 notice('Invitation à usage limité (10 accès, 48 h) : '+String(code)+'. Partage-la uniquement à tes guildmates, sans l’envoyer publiquement.');
}
async function postRequest(form){
 const fd=new FormData(form),title=clean(fd.get('title'),90),qty=Number(fd.get('quantity'));
 if(!guildId||title.length<2||!Number.isInteger(qty)||qty<1||qty>99999)throw Error('Demande invalide');
 const priority=String(fd.get('priority')),note=clean(fd.get('note'),350);
 if(!['normal','high','urgent'].includes(priority))throw Error('Priorité invalide');
 // RLS verifies author and guild membership independently.
 const user=await request('/auth/v1/user');
 await request('/rest/v1/binch_guild_requests',{method:'POST',body:{guild_id:guildId,created_by:user.id,title,quantity:qty,priority,note}});
 form.reset();await loadData();paint();notice('Demande publiée dans ta guilde privée.');
}
async function postPromise(form){
 const fd=new FormData(form),item=clean(fd.get('item'),90),qty=Number(fd.get('quantity'));
 if(!guildId||item.length<2||!Number.isInteger(qty)||qty<1||qty>99999)throw Error('Promesse invalide');
 const user=await request('/auth/v1/user'),requestId=String(fd.get('request')||'');
 if(requestId&&!requests.some(x=>x.id===requestId))throw Error('Demande liée indisponible');
 await request('/rest/v1/binch_guild_promises',{method:'POST',body:{guild_id:guildId,owner_id:user.id,item,quantity:qty,note:clean(fd.get('note'),240),request_id:requestId||null}});
 form.reset();await loadData();paint();notice('Promesse publiée (ce n’est pas un dépôt vérifié dans WoW).');
}
async function setPromise(id,value){
 await rpc('binch_set_promise_status',{p_id:id,p_status:value});
 await loadData();paint();notice('Statut modifié via les permissions du serveur.');
}
function paint(){
 const active=Boolean(session?.access_token);
 $('binch-gcloud-auth').hidden=active;$('binch-gcloud-private').hidden=!active;
 $('binch-gcloud-guild-select').disabled=!guilds.length;
 const role=members.find(x=>session?.userId&&x.user_id===session.userId)?.role||'membre';
 $('binch-gcloud-members').textContent=guildId?members.length+' membre(s) · rôle : '+role:'Aucune guilde sélectionnée';
 $('binch-gcloud-requests').innerHTML=requests.length?requests.map(x=>'<article><b>'+esc(x.title)+'</b><small>× '+x.quantity+' · '+esc(x.priority)+' · '+esc(x.state)+'</small><p>'+esc(x.note||'')+'</p></article>').join(''):'<p>Pas de demande partagée confirmée.</p>';
 $('binch-gcloud-promises').innerHTML=promises.length?promises.map(x=>'<article><b>'+esc(x.item)+'</b><small>× '+x.quantity+' · '+esc(x.status)+'</small><select data-gcloud-promise="'+esc(x.id)+'" aria-label="Modifier le statut"><option value="promised"'+(x.status==='promised'?' selected':'')+'>Promis</option><option value="ready"'+(x.status==='ready'?' selected':'')+'>Disponible</option><option value="deposited"'+(x.status==='deposited'?' selected':'')+'>Dépôt annoncé</option><option value="received"'+(x.status==='received'?' selected':'')+'>Réception officier</option></select></article>').join(''):'<p>Aucune promesse partagée.</p>';
 $('binch-gcloud-request-choose').innerHTML='<option value="">Aucune demande associée</option>'+requests.filter(x=>x.state==='open').map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join('');
}
async function run(fn){if(loading)return;loading=true;try{await fn()}catch(e){notice(String(e.message||e),true)}finally{loading=false}}
function mount(){
 const page=$('page-gm'),anchor=$('binch-gm-hub');if(!page||!anchor||$('binch-gcloud'))return;
 const el=document.createElement('section');el.id='binch-gcloud';el.className='binch-gcloud';
 el.innerHTML='<header><span class="eyebrow">LA BINCH · GUILDE CONNECTÉE</span><h2>Quartier général privé</h2><p>Ce module utilise des comptes email et des permissions contrôlées par la base de données. Il ne partage pas tes sauvegardes WoW. Les outils locaux restent séparés.</p><p id="binch-gcloud-status"></p><p id="binch-gcloud-notice" role="status"></p></header><div id="binch-gcloud-auth"><label>Email de connexion<input type="email" id="binch-gcloud-email" autocomplete="email" placeholder="Ton email"></label><button type="button" id="binch-gcloud-login">Recevoir un lien sécurisé</button></div><div id="binch-gcloud-private" hidden><button type="button" id="binch-gcloud-logout">Fermer la session</button><label>Personnage de guilde<input id="binch-gcloud-character" maxlength="40" placeholder="Nom en jeu"></label><div class="binch-gcloud-actions"><label>Créer ma guilde<input id="binch-gcloud-new-name" maxlength="80" placeholder="Nom de guilde"></label><button id="binch-gcloud-create" type="button">Créer</button><label>Rejoindre par invitation<input id="binch-gcloud-invite" maxlength="100" placeholder="Code remis par le GM"></label><button id="binch-gcloud-join" type="button">Rejoindre</button></div><div class="binch-gcloud-actions"><label>Guilde<select id="binch-gcloud-guild-select"></select></label><button type="button" id="binch-gcloud-refresh">Actualiser</button><button type="button" id="binch-gcloud-invite-btn">Créer une invitation</button></div><p id="binch-gcloud-members"></p><div class="binch-gcloud-columns"><section><h3>Demandes partagées</h3><form id="binch-gcloud-request-form"><input name="title" required maxlength="90" placeholder="Objet ou tâche"><input name="quantity" type="number" min="1" max="99999" value="1" required><select name="priority"><option value="normal">Normale</option><option value="high">Importante</option><option value="urgent">Urgente</option></select><input name="note" maxlength="350" placeholder="Précisions"><button type="submit">Publier la demande</button></form><div id="binch-gcloud-requests"></div></section><section><h3>Engagements partagés</h3><form id="binch-gcloud-promise-form"><input name="item" required maxlength="90" placeholder="Ressource promise"><input name="quantity" type="number" min="1" max="99999" value="1" required><select name="request" id="binch-gcloud-request-choose"></select><input name="note" maxlength="240" placeholder="Notes"><button type="submit">Publier l’engagement</button></form><div id="binch-gcloud-promises"></div></section></div></div>';
 anchor.insertAdjacentElement('afterend',el);
 $('binch-gcloud-login').onclick=()=>run(sendLogin);
 $('binch-gcloud-create').onclick=()=>run(createGuild);
 $('binch-gcloud-join').onclick=()=>run(joinGuild);
 $('binch-gcloud-refresh').onclick=()=>run(loadGuilds);
 $('binch-gcloud-invite-btn').onclick=()=>run(invite);
 $('binch-gcloud-guild-select').onchange=e=>run(async()=>{guildId=e.target.value;await loadData();paint()});
 $('binch-gcloud-logout').onclick=()=>{session=null;guilds=[];guildId='';members=[];requests=[];promises=[];saveSession();paint();notice('Session de cet onglet fermée.')};
 $('binch-gcloud-request-form').onsubmit=e=>{e.preventDefault();run(()=>postRequest(e.target))};
 $('binch-gcloud-promise-form').onsubmit=e=>{e.preventDefault();run(()=>postPromise(e.target))};
 el.addEventListener('change',e=>{const target=e.target.closest('[data-gcloud-promise]');if(target)run(()=>setPromise(target.dataset.gcloudPromise,target.value))});
 $('binch-gcloud-character').value=username();
 parseTokens();
 if(!session){try{session=JSON.parse(sessionStorage.getItem(STORE))||null}catch{}} 
 if(session?.access_token){
  // Identity is read from trusted Supabase user endpoint, not from user input.
  run(async()=>{const u=await request('/auth/v1/user');session.userId=u.id;saveSession();await loadGuilds();status('Connecté — guilde privée accessible selon tes permissions.')});
 }else{paint();status('Configuration active. Connecte-toi par email pour utiliser les espaces privés.')}
}
async function start(){
 if(!await initConfig())return;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0));else setTimeout(mount,0)
}
start();
})();