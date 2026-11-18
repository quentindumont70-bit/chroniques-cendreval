/* V218 — pinned action references only: no task body or duplicated business data. */
(function(){
'use strict';
const KEY='big-cthu-v2-action-favorites-v1';
const MAX=40;
const KINDS=new Set(['Stock','Agenda','Captures','Priorités','Maison','Musique','Jeux']);
function makeKey(kind,id){
 if(!KINDS.has(kind)||typeof id!=='string'||!id||id.length>120)return '';
 return kind+':'+id;
}
function valid(value){
 if(typeof value!=='string'||value.length>140)return false;
 const colon=value.indexOf(':');
 return colon>0&&makeKey(value.slice(0,colon),value.slice(colon+1))===value;
}
function validList(value){
 return Array.isArray(value)&&value.length<=MAX&&value.every(valid)&&new Set(value).size===value.length;
}
function read(){
 try{
  const raw=localStorage.getItem(KEY);
  const ids=raw===null?[]:JSON.parse(raw);
  if(!validList(ids))throw Error('invalid pinned references');
  return {ids,blocked:false};
 }catch(e){return {ids:[],blocked:true}}
}
function toggle(value){
 if(!valid(value))return {ok:false,message:'Action non identifiable, aucun favori modifié.'};
 const state=read();
 if(state.blocked)return {ok:false,message:'Favoris locaux illisibles ou indisponibles : aucune donnée écrasée.'};
 const present=state.ids.includes(value);
 if(!present&&state.ids.length>=MAX)return {ok:false,message:'Maximum de 40 actions épinglées.'};
 const next=present?state.ids.filter(x=>x!==value):[...state.ids,value];
 try{
  const raw=JSON.stringify(next);
  localStorage.setItem(KEY,raw);
  if(localStorage.getItem(KEY)!==raw)throw Error('write not confirmed');
  return {ok:true,ids:next,message:present?'Action retirée des favoris.':'Action épinglée sur cet appareil.'};
 }catch(e){return {ok:false,message:'Enregistrement des favoris non confirmé. Aucune modification affichée comme réussie.'}}
}
window.BigCthuActionFavorites={key:KEY,makeKey,read,toggle};
})();
