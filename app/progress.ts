export function writeProgress(value:unknown){try{const previous=localStorage.getItem('cendreval-save');if(previous){try{const old=JSON.parse(previous);if(old&&typeof old==='object'&&Number.isFinite(old.x)&&Number.isFinite(old.y)&&Number.isFinite(old.quest))localStorage.setItem('cendreval-save-backup',previous)}catch{}}localStorage.setItem('cendreval-save',JSON.stringify(value));return true}catch{return false}}

export const storage={getItem(key:string){try{return localStorage.getItem(key)}catch{return null}},setItem(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}};
