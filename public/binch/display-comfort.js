/* La Binch — mobile comfort/performance preferences.
   Opt-in UI, no forced layout resets. No analytics. */
(()=>{'use strict';
const KEY='binch.display.comfort.v1',ROOT=document.documentElement;
const $=id=>document.getElementById(id);
function read(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'?v:{}}catch{return {}}}
let setting=read();setting.effects=setting.effects==='reduced'?'reduced':'standard';
setting.scroll=setting.scroll==='native'?'native':'assisted';
const apply=()=>{ROOT.dataset.binchEffects=setting.effects;ROOT.dataset.binchScroll=setting.scroll};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(setting))}catch{}apply();document.dispatchEvent(new CustomEvent('binch:display-preferences',{detail:{...setting}}))};
apply();
function mount(){
 if($('binch-display-comfort'))return;
 const app=$('app');if(!app)return;
 const panel=document.createElement('details');panel.id='binch-display-comfort';panel.className='binch-display-comfort';
 panel.innerHTML='<summary>Affichage & confort</summary><div class="binch-comfort-inner"><strong>Réglages de fluidité</strong><p>Sur Opera et mobile, le mode léger désactive les animations décoratives et les flous lourds pour favoriser le défilement.</p><fieldset><legend>Effets de l’interface</legend><label><input type="radio" name="binch-effects" value="standard"> Effets standard</label><label><input type="radio" name="binch-effects" value="reduced"> Mode léger</label></fieldset><fieldset><legend>Défilement</legend><label><input type="radio" name="binch-scroll-pref" value="assisted"> Assistance au défilement</label><label><input type="radio" name="binch-scroll-pref" value="native"> Défilement natif uniquement</label></fieldset><p id="binch-comfort-message" role="status">Ces réglages sont sauvegardés uniquement sur cet appareil.</p></div>';
 const nav=app.querySelector('nav.nav');if(nav)nav.after(panel);else app.prepend(panel);
 panel.querySelectorAll('input').forEach(input=>{
  if(input.name==='binch-effects')input.checked=input.value===setting.effects;
  else input.checked=input.value===setting.scroll;
  input.addEventListener('change',()=>{if(input.name==='binch-effects')setting.effects=input.value;else setting.scroll=input.value;persist();$('binch-comfort-message').textContent='Préférences appliquées sur cet appareil.'});
 });
 window.addEventListener('storage',e=>{if(e.key===KEY){setting=read();apply()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();