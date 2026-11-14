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
    await page.locator('#binch-specs-pin').click();
    assert.equal(await page.locator('#binch-specs-pinned').isVisible(),true);
    checks++;
    await classControl.selectOption({label:'Chasseur'});
    assert.match(await page.locator('#binch-specs-pin-content').innerText(),/Chasseur/);
    checks++;
    assert.equal(await page.locator('#binch-specs-pin').getAttribute('aria-pressed'),'true');
    checks++;
    await classControl.selectOption({label:'Druide'});
    await page.locator('[data-spec-id="druid-feral"]').click();
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
    assert.equal(await page.locator('#binch-specs-level').inputValue(),'34','persisted manual level');
    checks++;
    assert.equal(await page.locator('#binch-specs-pinned').isVisible(),true,'persisted pin');
    checks++;
    await page.locator('#binch-specs-level').fill('60');
    await page.locator('#binch-specs-level').dispatchEvent('change');
    assert.match(await page.locator('#binch-specs-route').innerText(),/Build complet.*51 points/);
    checks++;
    await page.locator('#binch-specs-pin-close').click();
    assert.equal(await page.locator('#binch-specs-pinned').isVisible(),false);
    checks++;
    if(errors.length)throw new Error(device.name+' page errors: '+errors.slice(0,5).join(' | '));
    console.log('Browser '+device.name+': 12 checks passed');
    await context.close();
  }
  console.log('Browser Specs: '+checks+' checks passed');
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
