/* La Binch — Artisan-boursier: bill of materials versus sale price.
 No prices are invented; unknown ingredients make a quotation incomplete. */
(()=>{'use strict';
const KEY='binch.ah.craft.v1',MARKET='binch.ah.market.v1',$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').trim().slice(0,90),norm=s=>clean(s).toLocaleLowerCase('fr'),id=()=>crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
const read=(key,f)=>{try{return JSON.parse(localStorage.getItem(key))??f}catch{return f}};
let recipes=read(KEY,[]);if(!Array.isArray(recipes))recipes=[];
const market=()=>read(MARKET,{}),priceOf=item=>market().items?.find(x=>x.key===norm(item));
const money=n=>{n=Math.round(n);let sign=n<0?'-':'';n=Math.abs(n);return sign+Math.floor(n/10000)+'o '+Math.floor(n%10000/100)+'a '+n%100+'c'};
const gold=n=>{const x=Number(String(n).replace(',','.'));return Number.isFinite(x)&&x>=0&&x<1e9?Math.round(x*10000):null};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(recipes.slice(-100)))}catch{}};
function ingredientRows(){const list=$('binch-ah-craft-ingredients');if(!list)return;list.innerHTML=Array.from({length:6},(_,i)=>'<label>Composant '+(i+1)+'<input data-craft-name="'+i+'" maxlength="90" placeholder="Nom exact"></label><label>Quantité<input data-craft-count="'+i+'" type="number" min="1" max="99999" value="1"></label>').join('')}
function estimate(recipe){
 const m=market(),fee=Math.max(0,Math.min(20,Number(m.fee??5))),rows=recipe.ingredients.map(x=>{
  const v=priceOf(x.name),age=v?.observedAt?Date.now()-new Date(v.observedAt):Infinity;
  return {...x,price:Number(v?.last)||null,old:age>24*60*60*1000,source:v?.source||''};
 });
 const known=rows.every(x=>x.price!=null&&x.price>0),cost=rows.reduce((n,x)=>n+(x.price||0)*x.qty,0);
 const output=priceOf(recipe.output),sale=Number(output?.last)||null,yieldCount=recipe.yield||1,net=sale==null?null:Math.floor(sale*yieldCount*(1-fee/100)),margin=net!=null&&known?net-cost:null;
 return {rows,known,cost,sale,net,margin,fee,stale:rows.some(x=>x.old)||!output?.observedAt||Date.now()-new Date(output.observedAt)>24*60*60*1000};
}
function draw(){
 if(!$('binch-ah-craft-list'))return;
 $('binch-ah-craft-count').textContent=recipes.length+' recette(s) personnelles · calcul à partir du carnet de prix de La Binch';
 const rows=recipes.slice().reverse();
 $('binch-ah-craft-list').innerHTML=rows.length?rows.map(r=>{
  const x=estimate(r),sign=x.margin==null?'Calcul incomplet':x.margin>0?'Marge théorique positive':x.margin<0?'Marge théorique négative':'Équilibre théorique';
  return '<article class="binch-ah-craft-result"><div><strong>'+esc(r.output)+'</strong><small>'+esc(r.profession||'Métier non précisé')+' · production × '+r.yield+' · '+r.ingredients.length+' composant(s)</small><small>Prix de vente observé : '+(x.sale?money(x.sale):'non renseigné')+' · coût matières : '+(x.known?money(x.cost):'incomplet')+'</small><small>'+esc(sign)+(x.stale?' · données anciennes ou non datées':'')+'</small></div><strong>'+(x.margin==null?'—':money(x.margin))+'</strong><button type="button" data-craft-detail="'+esc(r.id)+'">Détails</button><button type="button" data-craft-remove="'+esc(r.id)+'" aria-label="Supprimer la recette">×</button></article>';
 }).join(''):'<p>Ajoute une recette personnelle pour calculer la rentabilité à partir des prix observés.</p>';
}
function detail(recipe){
 const d=estimate(recipe);
 $('binch-ah-craft-detail').innerHTML='<h3>'+esc(recipe.output)+'</h3>'+d.rows.map(x=>'<p>'+esc(x.name)+' × '+x.qty+' · '+(x.price!=null?money(x.price)+' / unité':'Prix inconnu')+(x.old?' · relevé ancien':'')+'</p>').join('')+'<p>Coût total des matières : '+(d.known?money(d.cost):'indisponible')+'</p><p>Revente après '+d.fee+' % de commission : '+(d.net!=null?money(d.net):'prix de l’objet fabriqué manquant')+'</p><strong>Résultat brut théorique : '+(d.margin!=null?money(d.margin):'impossible à calculer')+'</strong><p>Coût de mise en vente, variations de prix, taux de vente et temps de farm exclus. Un prix inconnu ne vaut jamais zéro.</p>';
}
function mount(){
 const page=$('page-market');if(!page||$('binch-ah-craft'))return;
 const section=document.createElement('section');section.id='binch-ah-craft';section.className='binch-ah-craft';
 section.innerHTML='<header><div><div class="eyebrow">LA BINCH / ATELIER ÉCONOMIQUE</div><h2>Fabriquer ou revendre les composants ?</h2><p>Calcule le coût des matériaux et la revente potentielle d’une recette. Les prix sont ceux du carnet AH, avec alerte sur les données manquantes.</p></div></header><form id="binch-ah-craft-form"><div class="binch-ah-craft-header"><label>Objet fabriqué<input name="output" required maxlength="90" placeholder="Nom exact du produit"></label><label>Métier<input name="profession" maxlength="70" placeholder="Ex. Ingénierie"></label><label>Quantité produite<input name="yield" type="number" min="1" max="999" value="1" required></label></div><h3>Ingrédients nécessaires</h3><div id="binch-ah-craft-ingredients"></div><button type="submit">Enregistrer la recette et calculer</button></form><div id="binch-ah-craft-count"></div><div id="binch-ah-craft-list"></div><div id="binch-ah-craft-detail"></div>';
 const footer=page.querySelector('.binch-ah > footer');if(footer)footer.before(section);else page.querySelector('.binch-ah')?.append(section);
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
 window.addEventListener('storage',e=>{if(e.key===KEY){recipes=read(KEY,[]);draw()}else if(e.key===MARKET)draw()});
 draw();
}
const start=()=>setTimeout(mount,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();