/* La Binch · client LFG partagé facultatif (REST Supabase, sans SDK).
 * Une clé publishable/anon n'est pas secrète ; ne jamais fournir de service_role.
 * Tant que config URL + key ne sont pas renseignées, ce module reste inactif.
 */
(()=>{
'use strict';
const AUTH='binch.lfg.cloud.session.v1';
const uid=s=>/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(String(s||''));
const value=s=>String(s??'').trim();
const clamp=(s,n)=>value(s).slice(0,n);
let configured=false,base='',key='',session=null,sessionPromise=null;
const json=(response)=>response.text().then(t=>{if(!t)return null;try{return JSON.parse(t)}catch{throw Error('Réponse du serveur illisible')}});
async function request(path,{method='GET',body,auth=true,prefer}={}){
 if(auth)await ensure();
 const headers={'apikey':key,'Accept':'application/json'};
 if(auth)headers.Authorization='Bearer '+session.access_token;
 if(body!==undefined)headers['Content-Type']='application/json';
 if(prefer)headers.Prefer=prefer;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),13000);
 try{
  const res=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
  const response=await json(res);
  if(!res.ok)throw Error(response?.message||response?.msg||response?.error_description||response?.error||'Service distant : erreur '+res.status);
  return response;
 }finally{clearTimeout(timeout)}
}
function record(data){
 const token=data?.session?.access_token?data.session:data;
 const userId=data?.user?.id||token?.user?.id||session?.userId;
 if(!token?.access_token||!token.refresh_token||!uid(userId))throw Error('Réponse de connexion anonyme incomplète');
 const expiresAt=Number(token.expires_at)||Math.floor(Date.now()/1000)+Number(token.expires_in||3600);
 session={access_token:token.access_token,refresh_token:token.refresh_token,userId,expiresAt};
 try{localStorage.setItem(AUTH,JSON.stringify(session))}catch{}
}
async function ensure(){
 if(!configured)throw Error('LFG partagé non configuré');
 if(session?.access_token&&session.expiresAt>Date.now()/1000+90)return;
 if(sessionPromise)return sessionPromise;
 sessionPromise=(async()=>{
  if(!session){try{const v=JSON.parse(localStorage.getItem(AUTH));if(v?.access_token&&v?.refresh_token&&uid(v.userId))session=v}catch{}}
  if(session?.access_token&&session.expiresAt>Date.now()/1000+90)return;
  if(session?.refresh_token){
   try{record(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:session.refresh_token}}));return}
   catch{session=null;try{localStorage.removeItem(AUTH)}catch{}}
  }
  record(await request('/auth/v1/signup',{method:'POST',auth:false,body:{}}));
 })();
 try{await sessionPromise}finally{sessionPromise=null}
}
async function init(){
 const response=await fetch('./lfg-cloud-config.json',{cache:'no-store'});
 if(!response.ok)return false;
 const conf=await response.json();const url=value(conf.supabaseUrl).replace(/\/+$/,'');
 const pub=value(conf.supabasePublishableKey||conf.supabaseAnonKey);
 if(!url&&!pub)return false;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))throw Error('URL Supabase invalide');
 if(pub.length<20||/service_role|sb_secret_/i.test(pub))throw Error('Clé invalide : seule une clé publique est autorisée');
 base=url;key=pub;configured=true;await ensure();return true;
}
async function list(){
 const [posts,reactions]=await Promise.all([
  request('/rest/v1/binch_lfg_posts?select=id,owner_id,character_name,activity,role,slots,starts_at,note,is_closed,created_at&order=created_at.desc&limit=150'),
  request('/rest/v1/binch_lfg_reactions?select=post_id,user_id,character_name,kind&limit=3000')
 ]);
 return {posts:Array.isArray(posts)?posts:[],reactions:Array.isArray(reactions)?reactions:[]};
}
async function publish(e){
 await ensure();
 return request('/rest/v1/binch_lfg_posts',{method:'POST',prefer:'return=representation',body:{
  owner_id:session.userId,character_name:clamp(e.author,40),activity:clamp(e.dungeon,90),
  role:e.role,slots:Math.max(1,Math.min(40,Number(e.places)||4)),
  starts_at:e.when?new Date(e.when).toISOString():null,note:clamp(e.note,350)
 }});
}
async function react(postId,kind,character){
 await ensure();if(!uid(postId))throw Error('Identifiant annonce invalide');
 const endpoint='/rest/v1/binch_lfg_reactions?post_id=eq.'+encodeURIComponent(postId)+'&user_id=eq.'+encodeURIComponent(session.userId);
 if(!kind)return request(endpoint,{method:'DELETE'});
 if(!['yes','maybe','no'].includes(kind))throw Error('Réaction inconnue');
 return request('/rest/v1/binch_lfg_reactions?on_conflict=post_id,user_id',{
  method:'POST',prefer:'resolution=merge-duplicates,return=minimal',
  body:{post_id:postId,user_id:session.userId,kind,character_name:clamp(character,40)}
 });
}
async function remove(postId){await ensure();return request('/rest/v1/binch_lfg_posts?id=eq.'+encodeURIComponent(postId)+'&owner_id=eq.'+encodeURIComponent(session.userId),{method:'DELETE'})}
window.BinchLFGCloud={init,list,publish,react,remove,get userId(){return session?.userId||null},get enabled(){return configured}};
})();
