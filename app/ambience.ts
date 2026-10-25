/** A quiet procedural sound bed; combat cues remain in front of it. */
export function createAmbience(audio:AudioContext){
 const master=audio.createGain();master.gain.value=0;master.connect(audio.destination);
 const noise=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),samples=noise.getChannelData(0);let seed=419;
 for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=(seed/4294967296*2-1)*.35}
 const wind=audio.createBufferSource(),filter=audio.createBiquadFilter(),windGain=audio.createGain();wind.buffer=noise;wind.loop=true;filter.type='lowpass';filter.frequency.value=240;filter.Q.value=.5;windGain.gain.value=0;wind.connect(filter);filter.connect(windGain);windGain.connect(master);wind.start();
 const drones=[110,164.8138,220].map((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.value=i===0?.008:.0025;osc.connect(gain);gain.connect(master);osc.start();return osc});
 let beat=0,note=3,step=0,local=0,gust=0,gustRefresh=0,lastVolume=-1,lastFilter=-1;const notes=[220,261.626,329.628,293.665,261.626,196,164.814,196];
 return {update(volume:number,paused:boolean,combat:boolean,dt:number,moving:boolean,x=0,y=0){const targetVolume=paused?0:volume,targetFilter=combat?210:x>13?360:270;if(targetVolume!==lastVolume){master.gain.setTargetAtTime(targetVolume,audio.currentTime,.3);lastVolume=targetVolume}if(targetFilter!==lastFilter){filter.frequency.setTargetAtTime(targetFilter,audio.currentTime,1);lastFilter=targetFilter}if(paused)return;note+=dt;step+=dt;local+=dt;gust+=dt;gustRefresh+=dt;if(gustRefresh>.2){gustRefresh=0;windGain.gain.setTargetAtTime(0,audio.currentTime,.3)}
  if(!combat&&local>11){local=0;const nearWell=Math.hypot(x-13.4,y-14.4)<3,woods=x>13;if(nearWell||woods){const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(nearWell?980:1420,now);osc.frequency.exponentialRampToValueAtTime(nearWell?380:1850,now+.09);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(nearWell?.012:.006,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.18);osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+.2)}}
  if(note>1.7){note=0;const now=audio.currentTime,position=beat++%notes.length,pitch=notes[position]*(combat?.5:1);for(const [ratio,level,attack,decay] of [[1,.075,.07,1.5],[2,.014,.12,1.2],[.5,.026,.18,2.2]]){const osc=audio.createOscillator(),gain=audio.createGain(),tone=audio.createBiquadFilter();osc.type=ratio===2?'sine':'triangle';osc.frequency.value=pitch*ratio;tone.type='lowpass';tone.frequency.value=combat?650:1250;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(level,now+attack);gain.gain.exponentialRampToValueAtTime(.0001,now+decay);osc.connect(tone);tone.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+decay+.04)}
   // A restrained fifth answers the melody every fourth beat; no broadband noise.
   if(position%4===0){const harmony=audio.createOscillator(),envelope=audio.createGain();
    harmony.type='sine';harmony.frequency.value=pitch*1.5;
    envelope.gain.setValueAtTime(.0001,now);
    envelope.gain.exponentialRampToValueAtTime(.012,now+.3);
    envelope.gain.exponentialRampToValueAtTime(.0001,now+2.9);
    harmony.connect(envelope);envelope.connect(master);
    harmony.start(now);harmony.stop(now+3);
   }}
  if(moving&&step>.48){step=0;const foot=audio.createBufferSource(),gain=audio.createGain();foot.buffer=noise;gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.06);foot.connect(gain);gain.connect(master);foot.start(0,0,.07)}
 },dispose(){wind.stop();drones.forEach(o=>o.stop());master.disconnect()}};
}
export function areaName(x:number,y:number){return y<7?'LES RUINES DU SERMENT':x>13?'LE BOIS DES VEILLEURS':y<12&&x>8?'LE CERCLE DES CENDRES':'LA ROUTE DES PÈLERINS'}
