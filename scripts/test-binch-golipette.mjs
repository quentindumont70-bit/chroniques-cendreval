// Golipette WoW Forever — run four focused checks plus global static check.
// From repository root: node scripts/test-binch-golipette.mjs
// No browser, no saved variables, no network and no dependencies.
import {spawnSync} from 'node:child_process';
const commands=[
 'public/binch/test-specs-route.cjs',
 'public/binch/test-ah-craft.cjs',
 'public/binch/test-ah-market-import.cjs',
 'public/binch/test-market-bridge.cjs',
 'scripts/check-binch.mjs'
];
let failures=0;
for(const file of commands){
 console.log('\n==> '+file);
 const r=spawnSync(process.execPath,[file],{stdio:'inherit',shell:false});
 if(r.error){console.error(r.error.message);failures++;continue;}
 if(r.status!==0){console.error('FAILED: '+file+' (status '+r.status+')');failures++;}
}
if(failures){console.error('\nGolipette: '+failures+' failed check(s).');process.exitCode=1;}
else console.log('\nGolipette: all five checks passed.');
