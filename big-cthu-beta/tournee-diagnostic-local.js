/* Diagnostic passif des stockages Tournée. Aucun patient, secret ou contenu chiffré exporté. */
(function(root){
'use strict';
const VAULTS={
 original:'bigcthu_tournee_full_encrypted_v1',
 appareil:'bigcthu_tournee_auto_encrypted_v1',
 precedent:'bigcthu_tournee_encrypted_v1'
};
function probe(storage){
 const result={localStorage:'ok',legacy:{status:'absent',count:null},vaults:{},otherKeys:0};
 let names=[];
 try{
  const n=storage.length;
  for(let i=0;i<Math.min(n,50000);i++){const k=storage.key(i);if(typeof k==='string')names.push(k);}
  result.otherKeys=names.filter(k=>k.startsWith('tidel_')).length;
  const raw=storage.getItem('tidel_Pl');
  if(raw!==null){
   try{
    const list=JSON.parse(raw);
    if(Array.isArray(list))result.legacy={status:'present',count:list.length};
    else result.legacy={status:'incompatible',count:null};
   }catch(e){result.legacy={status:'illisible',count:null}}
  }
  for(const [label,key] of Object.entries(VAULTS)){
   const rawVault=storage.getItem(key);
   result.vaults[label]=rawVault===null?'absent':'present-contenu-inconnu';
  }
 }catch(e){
  result.localStorage='inaccessible';
  result.legacy={status:'inconnu',count:null};
  for(const name of Object.keys(VAULTS))result.vaults[name]='inconnu';
 }
 return result;
}
function summarize(p){
 const count=p.legacy.status==='present'?String(p.legacy.count):p.legacy.status;
 return [
  'Diagnostic Tournée — sans données patients',
  'Ancienne liste locale : '+count,
  'Coffre chiffré historique : '+(p.vaults.original||'inconnu'),
  'Coffre chiffré actuel : '+(p.vaults.appareil||'inconnu'),
  'Autre coffre précédent : '+(p.vaults.precedent||'inconnu'),
  'Autres clés Tournée : '+p.otherKeys,
  'Stockage accessible : '+(p.localStorage==='ok'?'oui':'non')
 ].join('\n');
}
const api={VAULTS,probe,summarize};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.TOURNEE_RECOVERY_PROBE=api;
})(typeof window!=='undefined'?window:null);
