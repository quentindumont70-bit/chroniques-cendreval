export function writeProgress(value:unknown){try{const previous=localStorage.getItem('cendreval-save');if(previous){try{const old=JSON.parse(previous);if(old&&typeof old==='object'&&Number.isFinite(old.x)&&Number.isFinite(old.y)&&Number.isFinite(old.quest))localStorage.setItem('cendreval-save-backup',previous)}catch{}}localStorage.setItem('cendreval-save',JSON.stringify(value));return true}catch{return false}}

export const storage={getItem(key:string){try{return localStorage.getItem(key)}catch{return null}},setItem(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}};

/** Portable files carry progression only; controls and device-specific graphics stay local. */
export function portableProgress(profile:unknown){return JSON.stringify({format:'cendreval-save',version:1,savedAt:new Date().toISOString(),profile},null,2)}
export function readPortableProgress(raw:string){if(raw.length>512000)throw Error('Fichier trop volumineux.');let input;try{input=JSON.parse(raw)}catch{throw Error('Fichier JSON illisible. Choisissez une sauvegarde Outbinched.')}if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Ce fichier ne contient pas de sauvegarde.');let profile=input;if(input.format!==undefined){if(input.format!=='cendreval-save'||input.version!==1)throw Error('Format de sauvegarde non pris en charge.');profile=input.profile}if(!profile||typeof profile!=='object'||Array.isArray(profile)||!['x','y','hp','quest'].every(key=>typeof profile[key]==='number'&&Number.isFinite(profile[key])))throw Error('Ce fichier ne contient pas une progression valide.');return JSON.stringify(profile)}

/** V2 portable profiles keep the player's equipment with the character, not with the device. */
export function portableAdventure(profile:unknown,inventory:unknown){
 return JSON.stringify({format:'cendreval-save',version:2,savedAt:new Date().toISOString(),profile,inventory},null,2);
}
export function readPortableAdventure(raw:string):{profile:string;inventory:unknown}{
 if(raw.length>512000)throw Error('Fichier trop volumineux.');
 let input:unknown;try{input=JSON.parse(raw)}catch{throw Error('Fichier JSON illisible.')}
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Sauvegarde invalide.');
 const obj=input as Record<string,unknown>;
 if(obj.format!==undefined&&obj.format!=='cendreval-save')throw Error('Format non pris en charge.');
 if(obj.version!==undefined&&obj.version!==1&&obj.version!==2)throw Error('Version non prise en charge.');
 const profile=obj.format===undefined?obj:obj.profile;
 if(!profile||typeof profile!=='object'||Array.isArray(profile))throw Error('Progression absente.');
 const data=profile as Record<string,unknown>;
 if(!['x','y','hp','quest'].every(key=>typeof data[key]==='number'&&Number.isFinite(data[key])))throw Error('Progression invalide.');
 return {profile:JSON.stringify(profile),inventory:obj.version===2?obj.inventory:undefined};
}
