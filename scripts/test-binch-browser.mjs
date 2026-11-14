// Browser smoke test for the WoW Forever companion, run with:
// BINCH_PLAYWRIGHT_PATH=/tmp/binch-browser/node_modules/playwright/index.mjs node scripts/test-binch-browser.mjs
// Uses an ephemeral HTTP server, empty browser profile and no real player data.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';

const root=resolve('public/binch');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.lua':'text/plain'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    const candidate=resolve(root,'.'+pathname,(pathname.endsWith('/')?'index.html':''));
    if(candidate!==root&&!candidate.startsWith(root+sep)){res.writeHead(403).end();return}
    const data=await readFile(candidate);
    res.writeHead(200,{'content-type':types[extname(candidate)]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  }catch(e){res.writeHead(404).end('Not found')}
});
const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=()=>new Promise(resolve=>server.close(resolve));
let browser;
try{
  const playwrightPath=process.env.BINCH_PLAYWRIGHT_PATH;
  if(!playwrightPath)throw new Error('BINCH_PLAYWRIGHT_PATH is required (Playwright must be installed separately)');
  const {chromium}=await import(playwrightPath);
  await listen();
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const base='http://127.0.0.1:'+server.address().port+'/';
  let checks=0;
  for(const device of [
    {name:'desktop',viewport:{width:1440,height:900}},
    {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}
  ]){
    const context=await browser.newContext({viewport:device.viewport,isMobile:!!device.isMobile,hasTouch:!!device.hasTouch});
    const page=await context.newPage();
    // Each scenario starts with a synthetic, opted-in profile: test-only browser context.
    await page.addInitScript(()=>{
      if(!localStorage.getItem('grimoire.hub.v3')){
        localStorage.setItem('grimoire.hub.v3',JSON.stringify({
          step:2,onboarded:true,race:'Tauren',classe:'Druide',
          jobs:['Minage','Ingénierie'],data:{pseudo:'Golipette-QA',level:'34'}
        }));
      }
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#binch-specs').waitFor({state:'attached',timeout:30000});
    // Programmatic navigation is intentional: the mobile nav is collapsible.
    await page.locator('#app nav.nav [data-page="specs"]').evaluate(el=>el.click());
    await assertVisible(page,'#binch-specs',device.name+' Specs');
    checks++;
    const classControl=page.locator('#binch-specs-class');
    await classControl.selectOption({label:'Mage'});
    assert.match(await page.locator('#binch-specs-selection').innerText(),/Mage.*Givre/);
    checks++;
    assert.equal(await page.locator('#binch-spec-card-does-not-exist').count(),0);
    // Test a different class while retaining a pinned build.
    // Verify actual touch events on mobile and real pointer clicks on desktop.
    await page.locator('#binch-specs-pin').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    if(device.isMobile)await page.locator('#binch-specs-pin').tap({timeout:7000});
    else await page.locator('#binch-specs-pin').click({timeout:7000});
    assert.equal(await page.locator('#binch-specs-pinned').isVisible(),true);
    checks++;
    await classControl.selectOption({label:'Chasseur'});
    assert.match(await page.locator('#binch-specs-pin-content').innerText(),/Chasseur/);
    checks++;
    assert.equal(await page.locator('#binch-specs-pin').getAttribute('aria-pressed'),'true');
    checks++;
    await classControl.selectOption({label:'Druide'});
    await page.locator('[data-spec-id="druid-feral"]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    if(device.isMobile)await page.locator('[data-spec-id="druid-feral"]').tap({timeout:7000});
    else await page.locator('[data-spec-id="druid-feral"]').click({timeout:7000});
    await page.locator('#binch-specs-level').fill('34');
    await page.locator('#binch-specs-level').dispatchEvent('change');
    assert.match(await page.locator('#binch-specs-route').innerText(),/25\s*\/\s*51/);
    checks++;
    assert.match(await page.locator('#binch-specs-route').innerText(),/Prochain point au niveau 35/);
    checks++;
    const labels=await page.locator('.binch-specs-step .binch-specs-range').allInnerTexts();
    assert.ok(labels.some(x=>x.includes('29')&&x.includes('33')),'noncontiguous sourced talent ranks');
    checks++;
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#binch-specs').waitFor({state:'attached'});
    await page.locator('#app nav.nav [data-page="specs"]').evaluate(el=>el.click());
    await assertVisible(page,'#binch-specs',device.name+' Specs after reload');
    assert.equal(await page.locator('#binch-specs-level').inputValue(),'34','persisted manual level');
    checks++;
    assert.equal(await page.locator('#binch-specs-pinned').isVisible(),true,'persisted pin');
    checks++;
    await page.locator('#binch-specs-level').fill('60');
    await page.locator('#binch-specs-level').dispatchEvent('change');
    assert.match(await page.locator('#binch-specs-route').innerText(),/Build complet.*51 points/);
    checks++;
    if(device.isMobile)await page.locator('#binch-specs-pin-close').tap({timeout:7000});
    else await page.locator('#binch-specs-pin-close').click({timeout:7000});
    assert.equal(await page.locator('#binch-specs-pinned').isVisible(),false);
    checks++;
    // Smoke the AH craft workflow without injecting made-up market prices.
    await page.locator('#app nav.nav [data-page="market"]').evaluate(el=>el.click());
    await page.locator('#binch-ah-craft-form').waitFor({state:'attached',timeout:10000});
    assert.equal(await page.locator('#binch-ah-craft-form').isVisible(),true);
    checks++;
    await page.locator('#binch-ah-craft-form').evaluate(form=>{
      form.elements.namedItem('output').value='Armure Golipette QA';
      form.querySelector('[data-craft-name="0"]').value='Barre Golipette QA';
      form.querySelector('[data-craft-count="0"]').value='2';
      form.requestSubmit();
    });
    assert.match(await page.locator('#binch-ah-craft-list').innerText(),/Armure Golipette QA/);
    assert.match(await page.locator('#binch-ah-craft-list').innerText(),/incomplet|non renseigné/i);
    checks++;
    // True GrimoireSync.lua upload in a blank, synthetic browser profile.
    await page.locator('#app nav.nav [data-page="sync"]').evaluate(el=>el.click());
    await page.locator('#grimoire-bridge-file').waitFor({state:'attached',timeout:10000});
    // A rejected/invalid import must not replace an existing character or metadata.
    const testFile=async content=>page.locator('#grimoire-bridge-file').setInputFiles({
      name:'GrimoireSync.lua',mimeType:'text/plain',buffer:Buffer.from(content,'utf8')
    });
    const startingProfile=await page.evaluate(()=>localStorage.getItem('grimoire.hub.v3'));
    await testFile('GrimoireSyncDB = { ["payload"] = "GF7|C:Bad" }');
    await page.waitForFunction(()=>document.querySelector('#grimoire-bridge-status')?.textContent?.includes('Import impossible'));
    assert.match(await page.locator('#grimoire-bridge-status').textContent(),/Import impossible/i);
    assert.equal(await page.evaluate(()=>localStorage.getItem('grimoire.hub.v3')),startingProfile);
    assert.equal(await page.evaluate(()=>localStorage.getItem('grimoire.bridge.last')),null);
    checks++;
    // Valid GF6 syntax but unsupported class: do not mutate the existing profile.
    const badClass='GF6|C:Golipette-QA,Forever,34,DEATHKNIGHT,Tauren,Horde,Zone,0,1700000000,0,0,0|P:|Q:';
    await testFile('GrimoireSyncDB = { ["payload"] = "'+badClass+'" }');
    await page.waitForFunction(()=>document.querySelector('#grimoire-bridge-status')?.textContent?.includes('Race/classe inconnue'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('grimoire.hub.v3')),startingProfile);
    assert.equal(await page.evaluate(()=>localStorage.getItem('grimoire.bridge.last')),null);
    checks++;
    const foreign='GF6|C:Autre-QA,Forever,35,DRUID,Tauren,Horde,Les%20Tarides,100,1700000000,2500,4000,500|P:|Q:';
    let dialogCount=0;
    let resolvePrompt;
    const promptHandled=new Promise(resolve=>{resolvePrompt=resolve});
    page.once('dialog',async dialog=>{dialogCount++;await dialog.dismiss();resolvePrompt()});
    await testFile('GrimoireSyncDB = { ["payload"] = "'+foreign+'" }');
    await Promise.race([promptHandled,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Missing character-switch dialog')),5000))]);
    assert.equal(dialogCount,1,'foreign character triggers explicit confirmation');
    await page.waitForFunction(()=>document.querySelector('#grimoire-bridge-status')?.textContent?.includes('Import annulé'));
    assert.match(await page.locator('#grimoire-bridge-status').textContent(),/profil Golipette-QA est conservé/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('grimoire.hub.v3')),startingProfile);
    assert.equal(await page.evaluate(()=>localStorage.getItem('grimoire.bridge.last')),null);
    checks++;
    const luaPayload='GF6|C:Golipette-QA,Forever,34,DRUID,Tauren,Horde,Les%20Tarides,100,1700000000,2000,4000,500|P:Minage,180,225|Q:79976|L:79192,Stepping%20Stones,0|LS:QuestLogAPI|I:6948,1,0,1,1,0,Pierre%20de%20foyer|E:|AH:Forever,Horde,1700000000,0|A:';
    const lua='GrimoireSyncDB = { ["payload"] = "'+luaPayload+'" }';
    await page.locator('#grimoire-bridge-file').setInputFiles({
      name:'GrimoireSync.lua',
      mimeType:'text/plain',
      buffer:Buffer.from(lua,'utf8')
    });
    await page.waitForFunction(()=>{
      try{return JSON.parse(localStorage.getItem('grimoire.bridge.last')||'{}').name==='Golipette-QA'}catch{return false}
    },{timeout:8000});
    const imported=await page.evaluate(()=>JSON.parse(localStorage.getItem('grimoire.bridge.last')));
    assert.equal(imported.level,34,'GF6 level imported');
    assert.equal(imported.questLog[0].title,'Stepping Stones','active quest imported');
    assert.equal(imported.inventory[0].id,6948,'bag item imported');
    checks++;
    const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('grimoire.hub.v3')));
    assert.equal(profile.classe,'Druide','browser class preserved after import');
    assert.equal(profile.data.pseudo,'Golipette-QA','no character switch');
    checks++;
    if(errors.length)throw new Error(device.name+' page errors: '+errors.slice(0,5).join(' | '));
    console.log('Browser '+device.name+': 19 checks passed');
    await context.close();
  }
  console.log('Browser Specs + AH + GrimoireSync: '+checks+' checks passed');
}catch(error){
  console.error(error);
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  if(server.listening)await close();
}
async function assertVisible(page,selector,description){
  assert.equal(await page.locator(selector).isVisible(),true,description);
}
