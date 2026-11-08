/* La Binch — esquisse OST 100% originale, synthèse Web Audio chiptune/lofi.
 * Aucun extrait audio, motif ou mélodie de Blizzard. Pas de lecture automatique.
 * CPU : aucun timer lorsque coupé, suspension si onglet en arrière-plan.
 */
(()=>{'use strict';
const PREF='binch.soundscape.v1',$=s=>document.querySelector(s);
const modes={
 auto:{title:'Ambiance selon la page'},
 plains:{title:'Sables de Kalimdor',bpm:82,scale:[0,3,5,7,10],root:45,melody:[0,-1,3,-1,2,-1,4,-1,3,2,0,-1,1,-1,2,-1],bass:[0,-1,-1,-1,3,-1,-1,-1,2,-1,-1,-1,4,-1,-1,-1],wave:'triangle',filter:980},
 tavern:{title:'Le Dernier Feu',bpm:98,scale:[0,2,5,7,9],root:48,melody:[0,2,3,-1,4,3,2,-1,0,1,2,1,0,-1,3,-1],bass:[0,-1,-1,-1,4,-1,-1,-1,1,-1,-1,-1,3,-1,-1,-1],wave:'triangle',filter:1150},
 veil:{title:'La Veille de Faith',bpm:75,scale:[0,2,3,7,10],root:43,melody:[0,-1,-1,4,2,-1,1,-1,3,-1,4,-1,1,-1,0,-1],bass:[0,-1,-1,-1,3,-1,-1,-1,2,-1,-1,-1,1,-1,-1,-1],wave:'sine',filter:790},
 forge:{title:'Cendres et Orages',bpm:104,scale:[0,3,5,8,10],root:41,melody:[0,2,4,3,-1,2,1,0,4,-1,3,2,1,2,3,-1],bass:[0,-1,0,-1,3,-1,2,-1,0,-1,4,-1,1,-1,2,-1],wave:'square',filter:1250}
};
let ctx=null,master=null,timer=null,playing=false,step=0,next=0;
let prefs={mode:'auto',volume:0.15};
try{prefs={...prefs,...JSON.parse(localStorage.getItem(PREF)||'{}')}}catch{}
function save(){try{localStorage.setItem(PREF,JSON.stringify(prefs))}catch{}}
function currentMode(){
 if(prefs.mode!=='auto'&&modes[prefs.mode])return prefs.mode;
 const active=$('#app main .page.active')?.id||'';
 if(/lfg|gm/.test(active))return 'tavern';
 if(/craft|metiers|coffre|equipment/.test(active))return 'forge';
 if(/evenements|tresors|discoveries/.test(active))return 'veil';
 return 'plains';
}
const freq=midi=>440*Math.pow(2,(midi-69)/12);
function voice(midi,start,duration,wave,filterFrequency,amplitude){
 if(!ctx||!master||!playing)return;
 const osc=ctx.createOscillator(),low=ctx.createBiquadFilter(),gain=ctx.createGain();
 osc.type=wave;osc.frequency.setValueAtTime(freq(midi),start);
 low.type='lowpass';low.frequency.setValueAtTime(filterFrequency,start);low.Q.value=0.45;
 gain.gain.setValueAtTime(.0001,start);
 gain.gain.exponentialRampToValueAtTime(Math.max(.001,amplitude),start+.015);
 gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 osc.connect(low);low.connect(gain);gain.connect(master);
 osc.start(start);osc.stop(start+duration+.03);
 osc.onended=()=>{osc.disconnect();low.disconnect();gain.disconnect()};
}
function noteFor(v,pattern,octave=0){
 const base=pattern.scale[((v%pattern.scale.length)+pattern.scale.length)%pattern.scale.length];
 return pattern.root+base+octave;
}
function schedule(){
 if(!playing||!ctx)return;
 const mode=modes[currentMode()],beat=60/mode.bpm/2;
 while(next<ctx.currentTime+.18){
  const index=step%mode.melody.length;
  const a=mode.melody[index],b=mode.bass[index];
  if(a>=0)voice(noteFor(a,mode,24),next,beat*.83,mode.wave,mode.filter,mode.wave==='square'?.045:.072);
  if(b>=0)voice(noteFor(b,mode,-12),next,beat*1.6,'sine',600,.078);
  step++;next+=beat;
 }
}
function status(text){const node=$('#binch-ost-status');if(node)node.textContent=text}
function btn(){const el=$('#binch-ost-toggle');if(el){el.textContent=playing?'■ Couper l’OST':'♫ Écouter l’OST';el.setAttribute('aria-pressed',String(playing))}}
function stop(){
 playing=false;
 if(timer){clearInterval(timer);timer=null}
 if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.035);
 if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});
 btn();status('Musique coupée · aucun calcul audio en arrière-plan');
}
async function start(){
 if(document.hidden){status('Réactive cette page pour écouter.');return}
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio){status('Web Audio n’est pas pris en charge par ce navigateur.');return}
 try{
  if(!ctx){ctx=new Audio();master=ctx.createGain();master.connect(ctx.destination)}
  if(ctx.state==='suspended')await ctx.resume();
  master.gain.setTargetAtTime(Math.min(.27,Math.max(0,Number(prefs.volume)||0)),ctx.currentTime,.04);
  playing=true;step=0;next=ctx.currentTime+.08;
  timer=setInterval(schedule,110);schedule();btn();
  status('En lecture · '+modes[currentMode()].title+' · composition originale La Binch');
 }catch(error){stop();status('Lecture impossible : '+String(error.message||error))}
}
function lootChime(){
 if(!playing||!ctx)return;
 const now=ctx.currentTime+.03;
 [72,79,84].forEach((n,i)=>voice(n,now+i*.11,.4,'sine',1400,.06));
}
function mount(){
 const head=$('#app .app-head .app-tools')||$('#app .app-head');
 if(!head||$('#binch-ost'))return;
 const shell=document.createElement('details');shell.id='binch-ost';shell.className='binch-ost';
 shell.innerHTML='<summary>♫ OST <small>originale</small></summary><div class="binch-ost-body"><strong>La musique de La Binch</strong><p>Chiptune / lo-fi original : ambiances évoquant les voyages, tavernes, éléments et batailles d’Azeroth. Aucun enregistrement ou refrain de WoW n’est reproduit.</p><label>Thème<select id="binch-ost-mode"><option value="auto">Automatique selon l’onglet</option><option value="plains">Sables de Kalimdor</option><option value="tavern">Le Dernier Feu</option><option value="veil">La Veille de Faith</option><option value="forge">Cendres et Orages</option></select></label><label>Volume <input id="binch-ost-volume" type="range" min="0" max="27" step="1" value="15"></label><button id="binch-ost-toggle" type="button" aria-pressed="false">♫ Écouter l’OST</button><small id="binch-ost-status" role="status">Désactivée par défaut. Aucun son ne démarre sans ton clic.</small></div>';
 head.append(shell);
 $('#binch-ost-mode').value=modes[prefs.mode]?prefs.mode:'auto';
 $('#binch-ost-volume').value=Math.round((Number(prefs.volume)||0)*100);
 $('#binch-ost-mode').onchange=e=>{prefs.mode=e.target.value;save();step=0;status('Ambiance : '+modes[currentMode()].title)};
 $('#binch-ost-volume').oninput=e=>{prefs.volume=Number(e.target.value)/100;save();if(master&&playing)master.gain.setTargetAtTime(prefs.volume,ctx.currentTime,.045)};
 $('#binch-ost-toggle').onclick=()=>playing?stop():start();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop()});
 document.addEventListener('binch:treasure',lootChime);
 document.addEventListener('click',e=>{if(!shell.contains(e.target)&&shell.open)shell.open=false});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();