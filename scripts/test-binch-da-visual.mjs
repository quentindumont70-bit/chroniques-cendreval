// Visual regression smoke for the isolated La Binch art lab. Saves screenshots as CI artifacts.
// Run: BINCH_PLAYWRIGHT_PATH=/tmp/binch-browser/node_modules/playwright/index.mjs node scripts/test-binch-da-visual.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname,join} from 'node:path';

const root=resolve('public/binch');
const out=resolve('artifacts/binch-da-visual');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const name=decodeURIComponent(url.pathname);
  const full=resolve(root,'.'+name);
  if(!full.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(full);
  res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream','cache-control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('Not found');}
});
const open=()=>new Promise(r=>server.listen(0,'127.0.0.1',r));
const close=()=>new Promise(r=>server.close(r));
// Text is verified on actual opaque reading plates, not sampled against a guessed gradient.
async function measureTextContrast(page){
 return page.evaluate(()=>{
  const rgb=(value)=>{
   const match=value.match(/^rgba?\(([^)]+)\)$/);
   return match?match[1].split(/[\s,\/]+/).filter(Boolean).map(Number):null;
  };
  const luminance=(color)=>{
   const c=color.slice(0,3).map(x=>{const v=x/255;return v<=0.04045?v/12.92:((v+.055)/1.055)**2.4;});
   return c[0]*.2126+c[1]*.7152+c[2]*.0722;
  };
  const selectors=['.hero h1','.hero p','.hero .eyebrow','.signature strong','aside h2','aside p','.module h3','.module p'];
  return selectors.map(selector=>{
   const element=document.querySelector('#stage '+selector);
   if(!element)return {selector,error:'missing reading plate'};
   const style=getComputedStyle(element),fg=rgb(style.color),bg=rgb(style.backgroundColor);
   if(!fg||!bg||bg.length>3&&bg[3]<.999)return {selector,error:'reading plate must be opaque'};
   const a=luminance(fg),b=luminance(bg);
   return {selector,ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2))};
  });
 });
}
let browser;
try{
 const modulePath=process.env.BINCH_PLAYWRIGHT_PATH;
 if(!modulePath)throw Error('BINCH_PLAYWRIGHT_PATH required');
 const {chromium}=await import(modulePath);
 await open();
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const origin='http://127.0.0.1:'+server.address().port+'/da-lab.html';
 const themes=['tauren-druid','troll-shaman','orc-warrior','elf-druid','undead-warlock','gnome-mage','neutral'];
 const devices=[
  {name:'mobile-360',width:360,height:780,touch:true},
  {name:'mobile-390',width:390,height:844,touch:true},
  {name:'desktop-1440',width:1440,height:900,touch:false}
 ];
 const failures=[],manifest=[],contrastMeasurements=[];
 for(const device of devices){
  const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.touch,hasTouch:device.touch,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:'))errors.push('External request: '+req.url());});
  await page.goto(origin,{waitUntil:'load'});
  await assert.equal(await page.locator('[data-choice]').count(),6);
  for(const id of themes){
   const selector=id==='neutral'?'#neutral':'[data-choice="'+id+'"]';
   await page.locator(selector).click();
   assert.equal(await page.locator('#stage').getAttribute('data-pair'),id);
   assert.equal(await page.locator(selector).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#headline').isVisible(),true);
   const geometry=await page.evaluate(()=>{
    const screenWidth=document.documentElement.clientWidth;
    const boxes=['.layout','#stage','.hero','aside','.modules','.choices'];
    const overflow=boxes.filter(s=>{
      const r=document.querySelector(s).getBoundingClientRect();
      return r.right>screenWidth+3||r.left< -3;
    });
    const button=document.querySelector('#primary').getBoundingClientRect();
    return {viewport:screenWidth,scrollWidth:document.documentElement.scrollWidth,overflow,
      buttonWidth:button.width,buttonHeight:button.height,
      scene:window.getComputedStyle(document.querySelector('.binch-da-scenery__orb')).backgroundImage,
      accent:window.getComputedStyle(document.querySelector('#stage')).getPropertyValue('--accent').trim()};
   });
   if(geometry.scrollWidth>device.width+3||geometry.overflow.length)failures.push(device.name+'/'+id+' horizontal overflow '+JSON.stringify(geometry));
   if(geometry.buttonHeight<44||geometry.buttonWidth<44)failures.push(device.name+'/'+id+' primary action too small');
   if(!geometry.scene.includes('gradient')||!geometry.accent)failures.push(device.name+'/'+id+' missing scene/tokens');
   // WCAG contrast for opaque interactive controls: calculate from rendered CSS colors,
   // not from artistic palette guesses. Background scenery and translucent panels
   // still require a separate visual/accessibility review.
   const ratios=await page.evaluate(()=>{
     function channels(css){
       const m=css.match(/^rgba?\(([^)]+)\)$/);
       if(!m)return null;
       const a=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
       return a.length>=3?a:null;
     }
     function luminance(channels){
       const linear=channels.slice(0,3).map(x=>{
         const v=x/255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);
       });
       return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
     }
     return ['#primary','.choices button[aria-pressed="true"]','.choices button[data-choice]:not([aria-pressed="true"])'].map(selector=>{
       const node=document.querySelector(selector);
       if(!node)return {selector,error:'missing button'};
       const styles=getComputedStyle(node),foreground=channels(styles.color),background=channels(styles.backgroundColor);
       if(!foreground||!background||background[3]===0)return {selector,error:'missing opaque colors'};
       const a=luminance(foreground),b=luminance(background);
       return {selector,ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2)),foreground:styles.color,background:styles.backgroundColor};
     });
   });
   for(const item of ratios){
     contrastMeasurements.push({device:device.name,theme:id,...item});
     if(item.error||item.ratio<4.5)failures.push(device.name+'/'+id+' contrast below 4.5: '+JSON.stringify(item));
   }
   const textRatios=await measureTextContrast(page);
   for(const item of textRatios){
    contrastMeasurements.push({device:device.name,theme:id,mode:'normal',kind:'text',...item});
    if(item.error||item.ratio<4.5)failures.push(device.name+'/'+id+' reading contrast '+JSON.stringify(item));
   }
   const shot=device.name+'-'+id+'.png';
   await page.screenshot({path:join(out,shot),fullPage:true,animations:'disabled'});
   manifest.push({device:device.name,theme:id,mode:'normal',shot,viewport:geometry.viewport,scrollWidth:geometry.scrollWidth,accent:geometry.accent});
  }
  // Cinematic toggle must preserve theme identity, responsive layout and 44px actions.
  await page.locator('#cinema').click();
  assert.equal(await page.locator('#cinema').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#stage').evaluate(el=>el.classList.contains('cinematic')),true);
  for(const id of themes){
    await page.locator(id==='neutral'?'#neutral':'[data-choice="'+id+'"]').click();
    assert.equal(await page.locator('#stage').getAttribute('data-pair'),id);
    const cine=await page.evaluate(()=>{
      const primary=document.querySelector('#primary').getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+3,
        width:primary.width,height:primary.height,
        background:getComputedStyle(document.querySelector('.hero')).backgroundImage};
    });
    if(cine.overflow||cine.width<44||cine.height<44||!cine.background.includes('gradient'))
      failures.push(device.name+'/'+id+' cinematic layout '+JSON.stringify(cine));
    const cinematicRatios=await measureTextContrast(page);
    for(const item of cinematicRatios){
     contrastMeasurements.push({device:device.name,theme:id,mode:'cinema',kind:'text',...item});
     if(item.error||item.ratio<4.5)failures.push(device.name+'/'+id+' cinema reading contrast '+JSON.stringify(item));
    }
    const shot=device.name+'-'+id+'-cinema.png';
    await page.screenshot({path:join(out,shot),fullPage:true,animations:'disabled'});
    manifest.push({device:device.name,theme:id,mode:'cinema',shot});
  }
  await page.locator('#cinema').click();
  assert.equal(await page.locator('#cinema').getAttribute('aria-pressed'),'false');
  // The art gallery must remain fully usable from a keyboard, even on touch-emulated viewports.
  await page.locator('#neutral').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#stage').getAttribute('data-pair'),'neutral','Enter selects neutral theme');
  await page.locator('[data-choice="troll-shaman"]').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#stage').getAttribute('data-pair'),'troll-shaman','Space selects race-class theme');
  assert.equal(await page.locator('[data-choice="troll-shaman"]').getAttribute('aria-pressed'),'true');
  await page.locator('#motion').click();
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#stage').evaluate(el=>el.classList.contains('reduced')),true);
  assert.deepEqual(errors,[],'browser errors on '+device.name);
  await ctx.close();
 }
 // Verify the REAL homepage in a synthetic, empty browser profile; the experiment
 // must be opt-in, non-persistent and must leave existing navigation functional.
 const liveChecks=[];
 for(const device of [devices[1],devices[2]]){
  for(const variant of [
   {name:'normal',query:'',enabled:false,pair:null},
   {name:'tauren',query:'?da-preview=1&da-pair=tauren-druid',enabled:true,pair:'tauren-druid'},
   {name:'troll',query:'?da-preview=1&da-pair=troll-shaman',enabled:true,pair:'troll-shaman'},
   {name:'fallback',query:'?da-preview=1&da-pair=not-a-real-pair',enabled:true,pair:'neutral'}
  ]){
   const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.touch,hasTouch:device.touch,reducedMotion:'reduce'});
   await ctx.addInitScript(()=>{
    localStorage.setItem('grimoire.hub.v3',JSON.stringify({
     step:2,onboarded:true,race:'Tauren',classe:'Druide',
     jobs:['Minage','Ingénierie'],data:{pseudo:'DA-QA',level:'34'}
    }));
   });
   const page=await ctx.newPage();
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html'+variant.query,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#binch-front .binch-front-hero').waitFor({state:'visible',timeout:30000});
   const result=await page.evaluate(()=>{
    const root=document.documentElement,hero=document.querySelector('#binch-front .binch-front-hero');
    return {enabled:root.classList.contains('binch-da-preview'),
      pair:root.dataset.binchDaPair||null,
      background:getComputedStyle(hero).backgroundImage,
      scrollWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
      buttons:document.querySelectorAll('#binch-front .binch-front-buttons button').length,
      syncButton:!!document.querySelector('#binch-front .binch-front-buttons [data-binch-target="sync"]')};
   });
   assert.equal(result.enabled,variant.enabled,device.name+'/'+variant.name+' opt-in');
   assert.equal(result.pair,variant.pair,device.name+'/'+variant.name+' whitelist');
   assert.ok(result.buttons>=2&&result.syncButton,device.name+'/'+variant.name+' functional actions retained');
   assert.ok(result.background.includes('gradient'),device.name+'/'+variant.name+' hero background');
   if(result.scrollWidth>result.viewport+3)failures.push(device.name+'/'+variant.name+' real homepage overflow');
   if(variant.enabled){
    await page.locator('#binch-front .binch-front-buttons [data-binch-target="sync"]').first().click();
    await page.locator('#page-sync').waitFor({state:'visible',timeout:10000});
   }
   const shot=device.name+'-real-'+variant.name+'.png';
   await page.screenshot({path:join(out,shot),fullPage:true,animations:'disabled'});
   liveChecks.push({device:device.name,variant:variant.name,shot,...result});
   await ctx.close();
  }
 }
 await writeFile(join(out,'manifest.json'),JSON.stringify({generatedAt:new Date().toISOString(),screenshots:manifest,liveChecks,contrastMeasurements,failures},null,2));
 assert.deepEqual(failures,[],'visual layout smoke detected overflow/touch problems');
 console.log('La Binch DA browser visual: '+manifest.length+' captures, '+devices.length+' viewports, '+themes.length+' visual themes; zero overflow or page errors');
}catch(e){console.error(e);process.exitCode=1;}
finally{if(browser)await browser.close();if(server.listening)await close();}
