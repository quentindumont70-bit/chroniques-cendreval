/** A quiet procedural sound bed; combat cues remain in front of it. */
export function createAmbience(audio:AudioContext){
 const master=audio.createGain();master.gain.value=0;master.connect(audio.destination);
 const noise=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),samples=noise.getChannelData(0);let seed=419;
 for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=(seed/4294967296*2-1)*.35}
 const wind=audio.createBufferSource(),filter=audio.createBiquadFilter(),windGain=audio.createGain();wind.buffer=noise;wind.loop=true;filter.type='lowpass';filter.frequency.value=650;windGain.gain.value=.045;wind.connect(filter);filter.connect(windGain);windGain.connect(master);wind.start();
 const drones=[98,146.832,196].map((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.value=i===0?.016:.006;osc.connect(gain);gain.connect(master);osc.start();return osc});
 let beat=0,note=0,step=0;const notes=[293.665,220,196,174.614,220,146.832];
 return {update(volume:number,paused:boolean,combat:boolean,dt:number,moving:boolean){master.gain.setTargetAtTime(paused?0:volume,audio.currentTime,.3);filter.frequency.setTargetAtTime(combat?450:750,audio.currentTime,1);if(paused)return;note+=dt;step+=dt;
  if(note>7){note=0;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=notes[beat++%notes.length]*(combat?.5:1);gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(.012,audio.currentTime+.2);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+2.7);osc.connect(gain);gain.connect(master);osc.start();osc.stop(audio.currentTime+2.8)}
  if(moving&&step>.48){step=0;const foot=audio.createBufferSource(),gain=audio.createGain();foot.buffer=noise;gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.06);foot.connect(gain);gain.connect(master);foot.start(0,0,.07)}
 },dispose(){wind.stop();drones.forEach(o=>o.stop());master.disconnect()}};
}
export function areaName(x:number,y:number){return y<7?'LES RUINES DU SERMENT':x>13?'LE BOIS DES VEILLEURS':y<12&&x>8?'LE CERCLE DES CENDRES':'LA ROUTE DES PÈLERINS'}
