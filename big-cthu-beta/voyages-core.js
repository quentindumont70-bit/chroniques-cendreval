/* Big Cthu Voyages: calculs purs, sans serveur ni données préremplies. */
(function(root){
'use strict';
const MAX=100000000;
function cents(value){
  const s=String(value).trim().replace(',','.');
  if(!/^(?:\d{1,9})(?:\.\d{1,2})?$/.test(s))throw Error('Montant invalide : deux décimales maximum');
  const [whole,fraction='']=s.split('.');
  const n=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(n)||n<=0||n>MAX)throw Error('Montant hors limites');
  return n;
}
function splitEqual(amount,people){
 if(!Number.isSafeInteger(amount)||amount<=0||!Array.isArray(people)||!people.length||new Set(people).size!==people.length)throw Error('Répartition invalide');
 const quotient=Math.floor(amount/people.length),extra=amount%people.length;
 return Object.fromEntries(people.map((p,i)=>[p,quotient+(i<extra?1:0)]));
}
function splitAmounts(amount,values){
 if(!Number.isSafeInteger(amount)||amount<=0||!values||typeof values!=='object'||Array.isArray(values)||!Object.keys(values).length)throw Error('Parts invalides');
 const result={};
 for(const [person,value] of Object.entries(values)){
  const str=String(value).trim().replace(',','.');
  if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(str))throw Error('Montant incorrect pour '+person);
  const [euros,sub='']=str.split('.');
  result[person]=Number(euros)*100+Number(sub.padEnd(2,'0'));
 }
 if(Object.values(result).reduce((a,b)=>a+b,0)!==amount)throw Error('La somme des parts doit égaler la dépense');
 return result;
}
function splitPercentages(amount,values){
 if(!Number.isSafeInteger(amount)||amount<=0||!values||typeof values!=='object'||Array.isArray(values)||!Object.keys(values).length)throw Error('Pourcentages invalides');
 const parts=Object.entries(values).map(([person,value],i)=>{
  const str=String(value).trim().replace(',','.');
  if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(str))throw Error('Pourcentage incorrect pour '+person);
  const [unit,decimal='']=str.split('.');
  const basis=Number(unit)*100+Number(decimal.padEnd(2,'0'));
  if(basis>10000)throw Error('Pourcentage supérieur à 100 %');
  return {person,basis,index:i,exact:amount*basis/10000};
 });
 if(parts.reduce((n,p)=>n+p.basis,0)!==10000)throw Error('La somme des pourcentages doit faire 100 %');
 const result=Object.fromEntries(parts.map(p=>[p.person,Math.floor(p.exact)]));
 const leftover=amount-Object.values(result).reduce((a,b)=>a+b,0);
 parts.sort((a,b)=>(b.exact-Math.floor(b.exact))-(a.exact-Math.floor(a.exact))||a.index-b.index);
 for(let i=0;i<leftover;i++)result[parts[i].person]++;
 return result;
}
function balances(trip){
 const people=trip?.people||[];
 if(!Array.isArray(people)||new Set(people).size!==people.length||!people.every(p=>typeof p==='string'&&p.length>0))throw Error('Participants invalides');
 const result=Object.fromEntries(people.map(p=>[p,0]));
 for(const x of trip.expenses||[]){
  if(!Number.isSafeInteger(x.cents)||x.cents<=0||x.cents>MAX||!Object.hasOwn(result,x.payer))throw Error('Dépense invalide');
  const shares=x.shares||splitEqual(x.cents,people);
  if(Object.keys(shares).some(p=>!Object.hasOwn(result,p))||Object.values(shares).some(v=>!Number.isSafeInteger(v)||v<0)||Object.values(shares).reduce((a,v)=>a+v,0)!==x.cents)throw Error('Parts incorrectes');
  result[x.payer]+=x.cents;
  for(const [p,v] of Object.entries(shares))result[p]-=v;
 }
 for(const payment of trip.reimbursements||[]){
  if(!payment||!Number.isSafeInteger(payment.cents)||payment.cents<=0||payment.cents>MAX||!Object.hasOwn(result,payment.from)||!Object.hasOwn(result,payment.to)||payment.from===payment.to)throw Error('Remboursement invalide');
  result[payment.from]+=payment.cents;
  result[payment.to]-=payment.cents;
 }
 if(Object.values(result).reduce((a,v)=>a+v,0)!==0)throw Error('Soldes incohérents');
 return result;
}
function transfers(result){
 const creditors=Object.entries(result).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).map(([name,amount])=>({name,amount}));
 const debtors=Object.entries(result).filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]).map(([name,amount])=>({name,amount:-amount}));
 const output=[];let i=0,j=0;
 while(i<debtors.length&&j<creditors.length){
  const amount=Math.min(debtors[i].amount,creditors[j].amount);
  if(amount>0)output.push({from:debtors[i].name,to:creditors[j].name,cents:amount});
  debtors[i].amount-=amount;creditors[j].amount-=amount;
  if(debtors[i].amount===0)i++;if(creditors[j].amount===0)j++;
 }
 return output;
}
function exportTripCsv(trip){
 const result=balances(trip);
 const clean=x=>{
  let text=String(x??'');
  if(/^[\s]*[=+\-@\t\r\n]/.test(text)&&!/^[-+]?\d+(?:\.\d+)?$/.test(text))text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
 };
 const eur=amount=>(amount/100).toFixed(2);
 const rows=[['type','date','libelle','source','destination_ou_parts','montant_eur']];
 for(const e of trip.expenses||[]){
  const date=typeof e.date==='string'?e.date:'';
  const people=Object.entries(e.shares||{}).map(([p,v])=>p+' : '+eur(v)+' €').join(' | ');
  rows.push(['dépense',date,e.title,e.payer,people,eur(e.cents)]);
 }
 for(const r of trip.reimbursements||[]){
  rows.push(['remboursement',typeof r.date==='string'?r.date:'','Remboursement',r.from,r.to,eur(r.cents)]);
 }
 for(const [person,net] of Object.entries(result))rows.push(['solde','','Après remboursements',person,'net à recevoir (+) / à régler (-)',eur(net)]);
 return rows.map(row=>row.map(clean).join(';')).join('\r\n')+'\r\n';
}
const BASE=['Pièce d’identité / documents de voyage à vérifier','Téléphone et chargeur','Sous-vêtements et chaussettes','Tenues pour la durée du séjour','Trousse de toilette','Chaussures confortables','Moyen de paiement','Réservations et billets à vérifier'];
const ACTIVITIES={
 plage:['Maillot de bain','Serviette de plage','Chapeau et protection solaire','Sandales'],
 randonnee:['Chaussures de marche','Gourde','Sac à dos léger','Vêtement de pluie'],
 montagne:['Couches chaudes','Coupe-vent','Chaussures adaptées au terrain'],
 ville:['Chaussures de ville confortables','Petit sac de journée'],
 neige:['Manteau chaud','Gants et bonnet','Chaussures adaptées à la neige']
};
function packing(activity,forecast,durationDays=0){
 const activities=Array.isArray(activity)?activity:[activity];
 let list=[...BASE];
 for(const name of activities)list.push(...(ACTIVITIES[name]||[]));
 if(Number.isInteger(durationDays)&&durationDays>1&&durationDays<=366){
  const count=Math.min(durationDays,7);
  list.push(count+' changes de vêtements (ou équivalent selon les besoins)');
  if(durationDays>7)list.push('Prévoir une lessive ou des tenues supplémentaires pour le séjour long');
 }
 if(Array.isArray(forecast)&&forecast.some(d=>Number(d.rain)>=40))list.push('Imperméable ou parapluie');
 if(Array.isArray(forecast)&&forecast.some(d=>Number(d.min)<=8))list.push('Veste chaude');
 if(Array.isArray(forecast)&&forecast.some(d=>Number(d.max)>=27))list.push('Vêtements légers et protection solaire');
 return [...new Set(list)];
}
function windowForTrip(start,end,today){
 if(!/^\d{4}-\d\d-\d\d$/.test(start)||!/^\d{4}-\d\d-\d\d$/.test(end)||end<start)throw Error('Dates du voyage invalides');
 const startToday=new Date(today+'T12:00:00Z'),last=new Date(startToday.getTime()+15*86400000).toISOString().slice(0,10);
 return {available:start<=last&&end>=today,from:start<today?today:start,to:end>last?last:end,complete:start>=today&&end<=last,horizon:last};
}
const api={cents,splitEqual,splitAmounts,splitPercentages,balances,transfers,exportTripCsv,packing,windowForTrip};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.BigCthuVoyages=api;
})(typeof window!=='undefined'?window:{});
