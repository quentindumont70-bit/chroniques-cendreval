const buffers=new WeakMap<AudioContext,AudioBuffer>();
/** Short material transients add body without drowning out the timing chime. */
export function combatTexture(audio:AudioContext,volume:number,impact:boolean){
 if(volume<=.0001)return;
 let buffer=buffers.get(audio);if(!buffer){buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.2),audio.sampleRate);const data=buffer.getChannelData(0);let seed=913;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/4294967296*2-1}buffers.set(audio,buffer)}
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain(),now=audio.currentTime,duration=impact?.075:.11;source.buffer=buffer;filter.type='bandpass';filter.frequency.value=impact?1750:780;filter.Q.value=impact?1.7:.7;gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(volume*(impact?.1:.045),now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();source.stop(now+duration+.01);
 if(impact)for(const [pitch,level]of [[1320,.026],[2080,.012]]){const osc=audio.createOscillator(),bell=audio.createGain();osc.type='sine';osc.frequency.value=pitch;bell.gain.setValueAtTime(Math.max(.0001,volume*level),now);bell.gain.exponentialRampToValueAtTime(.0001,now+.105);osc.connect(bell);bell.connect(audio.destination);osc.start();osc.stop(now+.12)}
}
