/* La Binch — Artisan-boursier: bill of materials versus sale price.
 No prices are invented; unknown ingredients make a quotation incomplete. */
(()=>{'use strict';
const KEY='binch.ah.craft.v1',MARKET='binch.ah.market.v1',$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').trim().slice(0,90),norm=s=>clean(s).toLocaleLowerCase('fr'),id=()=>crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
const read=(key,f)=>{try{return JSON.parse(localStorage.getItem(key))??f}catch{return f}};
let recipes=read(KEY,[]);if(!Array.isArray(recipes))recipes=[];
const market=()=>read(MARKET,{});
const scope=()=>{const x=read('binch.ah.scope.v1',null);return x?.realm&&['Horde','Alliance'].includes(x.faction)?String(x.realm).trim().toLocaleLowerCase('fr')+'|'+x.faction:'legacy'};
// Real, scoped observations only. Preserve the two ledgers without rewriting either one.
const priceOf=item=>{
 const target=norm(item),marketData=market(),marketScope=scope();
 if(marketScope==='legacy')return null; // unknown realm or faction must never become a quote
 const matches=Array.isArray(marketData.items)?marketData.items.filter(x=>x.scope===marketScope&&x.name&&norm(x.name)===target&&Number.isSafeInteger(Number(x.last))&&Number(x.last)>0&&Number.isFinite(Date.parse(x.observedAt))&&Date.parse(x.observedAt)<=Date.now()):[];
 matches.sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 if(matches.length)return matches[0];
 const x=read('binch.ah.scope.v1',null),legacy=read('binch.market.v1',{});
 const bridge=window.BinchMarketBridge?.snapshot(legacy,marketData,x);
 const observed=window.BinchMarketBridge?.latestFor(bridge,item);
 if(!observed)return null;
 return {name:observed.name,last:observed.price,observedAt:observed.observedAt,source:observed.source+' · '+observed.store,scope:marketScope};
};
const money=n=>{n=Math.round(n);let sign=n<0?'-':'';n=Math.abs(n);return sign+Math.floor(n/10000)+'o '+Math.floor(n%10000/100)+'a '+n%100+'c'};
const gold=n=>{const x=Number(String(n).replace(',','.'));return Number.isFinite(x)&&x>=0&&x<1e9?Math.round(x*10000):null};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(recipes.slice(-100)))}catch{}};
function ingredientRows(){const list=$('binch-ah-craft-ingredients');if(!list)return;list.innerHTML=Array.from({length:6},(_,i)=>'<label>Composant '+(i+1)+'<input data-craft-name="'+i+'" maxlength="90" placeholder="Nom exact"></label><label>Quantité<input data-craft-count="'+i+'" type="number" min="1" max="99999" value="1"></label>').join('')}
function estimate(recipe){
 const m=market(),rawFee=Number(m.fee??5),fee=Number.isFinite(rawFee)?Math.max(0,Math.min(20,rawFee)):5,rows=recipe.ingredients.map(x=>{
  const v=priceOf(x.name),age=v?.observedAt?Date.now()-new Date(v.observedAt):Infinity;
  const price=Number(v?.last);
  return {...x,price:Number.isSafeInteger(price)&&price>0?price:null,old:!Number.isFinite(age)||age<0||age>24*60*60*1000,source:v?.source||'',at:v?.observedAt||''};
 });
 const known=rows.every(x=>x.price!=null&&Number.isSafeInteger(x.qty)&&x.qty>0);
 let cost=known?0:null;
 if(known)for(const x of rows){const line=x.price*x.qty;if(!Number.isSafeInteger(line)||!Number.isSafeInteger(cost+line)){cost=null;break}cost+=line}
 const output=priceOf(recipe.output),raw=Number(output?.last),sale=Number.isSafeInteger(raw)&&raw>0?raw:null,yieldCount=Number(recipe.yield);
 const gross=sale!=null&&Number.isSafeInteger(yieldCount)&&yieldCount>0?sale*yieldCount:null;
 const net=gross!=null&&Number.isSafeInteger(gross)?Math.floor(gross*(1-fee/100)):null;
 const margin=net!=null&&cost!=null?net-cost:null;
 const componentsNet=cost==null?null:Math.floor(cost*(1-fee/100));
 const advantage=net==null||componentsNet==null?null:net-componentsNet;
 const stale=rows.some(x=>x.old)||!output?.observedAt||!Number.isFinite(Date.parse(output.observedAt))||Date.now()-Date.parse(output.observedAt)>86400000||Date.now()<Date.parse(output.observedAt);
 return {rows,known,cost,sale,net,margin,componentsNet,advantage,fee,stale};
}
function draw(){
 if(!$('binch-ah-craft-list'))return;
 $('binch-ah-craft-count').textContent=recipes.length+' recette(s) personnelles · calcul à partir du carnet de prix de La Binch';
 const rows=recipes.slice().reverse();
 $('binch-ah-craft-list').innerHTML=rows.length?rows.map(r=>{
  const x=estimate(r),sign=x.advantage==null?'Comparaison incomplète':x.stale?'Comparaison indicative : relevés anciens ou incomplets':x.advantage>0?'Fabriquer : revente théorique supérieure aux composants':x.advantage<0?'Revendre les composants : valeur nette théorique supérieure':'Deux voies équivalentes hors coûts supplémentaires';
  return '<article class="binch-ah-craft-result"><div><strong>'+esc(r.output)+'</strong><small>'+esc(r.profession||'Métier non précisé')+' · production × '+r.yield+' · '+r.ingredients.length+' composant(s)</small><small>Prix de vente observé : '+(x.sale?money(x.sale):'non renseigné')+' · coût matières : '+(x.known?money(x.cost):'incomplet')+'</small><small>'+esc(sign)+(x.stale?' · données anciennes ou non datées':'')+'</small></div><strong>'+(x.margin==null?'—':money(x.margin))+'</strong><button type="button" data-craft-detail="'+esc(r.id)+'">Détails</button><button type="button" data-craft-remove="'+esc(r.id)+'" aria-label="Supprimer la recette">×</button></article>';
 }).join(''):'<p>Ajoute une recette personnelle pour calculer la rentabilité à partir des prix observés.</p>';
}
function detail(recipe){
 const d=estimate(recipe),fmt=n=>n==null?'inconnu':money(n);
 $('binch-ah-craft-detail').innerHTML='<h3>'+esc(recipe.output)+'</h3>'+
 d.rows.map(x=>'<p>'+esc(x.name)+' × '+x.qty+' · '+(x.price!=null?money(x.price)+' / unité':'Prix inconnu')+(x.old?' · relevé ancien ou non daté':'')+' · '+esc(x.source||'source inconnue')+'</p>').join('')+
 '<p>Coût d’achat des matières : '+fmt(d.cost)+'</p>'+
 '<p>Produit fini × '+recipe.yield+' après commission ('+d.fee+' %) : '+fmt(d.net)+'</p>'+
 '<p>Composants revendus séparément après commission ('+d.fee+' %) : '+fmt(d.componentsNet)+'</p>'+
 '<strong>Avantage théorique de la fabrication : '+fmt(d.advantage)+'</strong>'+
 '<p>Marge brute de fabrication vs achat des matières : '+fmt(d.margin)+'</p>'+
 (d.stale?'<p><strong>Attention :</strong> au moins un relevé manque de fraîcheur (24 h), de date valide ou se situe dans le futur.</p>':'')+
 '<p>Comparaison à quantités de composants identiques ; suppose ventes intégrales au dernier prix saisi, commission identique et coût nul de fabrication. Dépôts, temps de farm, liquidité et pertes exclus. Aucune recommandation automatique d’achat.</p>';
}
function mount(){
 const page=$('page-market');if(!page||$('binch-ah-craft'))return;
 const section=document.createElement('section');section.id='binch-ah-craft';section.className='binch-ah-craft';
 section.innerHTML='<header><div><div class="eyebrow">LA BINCH / ATELIER ÉCONOMIQUE</div><h2>Fabriquer ou revendre les composants ?</h2><p>Calcule le coût des matériaux et la revente potentielle d’une recette. Les prix sont ceux du carnet AH, avec alerte sur les données manquantes.</p></div></header><form id="binch-ah-craft-form"><div class="binch-ah-craft-header"><label>Objet fabriqué<input name="output" required maxlength="90" placeholder="Nom exact du produit"></label><label>Métier<input name="profession" maxlength="70" placeholder="Ex. Ingénierie"></label><label>Quantité produite<input name="yield" type="number" min="1" max="999" value="1" required></label></div><h3>Ingrédients nécessaires</h3><div id="binch-ah-craft-ingredients"></div><button type="submit">Enregistrer la recette et calculer</button></form><div id="binch-ah-craft-count"></div><div id="binch-ah-craft-list"></div><div id="binch-ah-craft-detail"></div>';
 const footer=page.querySelector('.binch-ah > footer'),ledger=page.querySelector('.binch-ah');if(footer)footer.before(section);else if(ledger)ledger.append(section);else page.append(section);
 ingredientRows();
 $('binch-ah-craft-form').onsubmit=e=>{
  e.preventDefault();const f=e.target,fd=new FormData(f),output=clean(fd.get('output')),profession=clean(fd.get('profession')),yieldCount=Number(fd.get('yield'));
  const ingredients=[];for(let i=0;i<6;i++){const name=clean(f.querySelector('[data-craft-name="'+i+'"]')?.value),qty=Number(f.querySelector('[data-craft-count="'+i+'"]')?.value);if(!name)continue;if(!Number.isInteger(qty)||qty<1||qty>99999)return;ingredients.push({name,qty})}
  if(output.length<2||!ingredients.length||!Number.isInteger(yieldCount)||yieldCount<1||yieldCount>999)return;
  if(recipes.length>=100)return alert('Limite de 100 recettes personnelles atteinte.');
  const r={id:id(),output,profession,yield:yieldCount,ingredients};
  recipes.push(r);persist();f.reset();detail(r);draw();
 };
 $('binch-ah-craft-list').onclick=e=>{
  const detailButton=e.target.closest('[data-craft-detail]');if(detailButton){const r=recipes.find(x=>x.id===detailButton.dataset.craftDetail);if(r)detail(r);return}
  const del=e.target.closest('[data-craft-remove]');if(del&&confirm('Supprimer cette recette personnelle ?')){recipes=recipes.filter(x=>x.id!==del.dataset.craftRemove);persist();draw()}
 };
 document.querySelector('#app nav.nav [data-page="market"]')?.addEventListener('click',draw);
 document.querySelector('#binch-ah-scope-form')?.addEventListener('submit',()=>setTimeout(draw,0));
 document.querySelector('#binch-ah-scope-legacy')?.addEventListener('click',()=>setTimeout(draw,0));
 window.addEventListener('storage',e=>{if(e.key===KEY){recipes=read(KEY,[]);draw()}else if(e.key===MARKET||e.key==='binch.ah.scope.v1')draw()});
 draw();
}
const start=()=>setTimeout(mount,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();