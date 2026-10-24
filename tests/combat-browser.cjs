const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve('pages-dist'),errors=[];
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;const f=path.join(root,pathname==='/'?'index.html':pathname);if(!f.startsWith(root)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(f))});
 await new Promise(r=>server.listen(4178,'127.0.0.1',r));let browser;
 try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4178');await page.evaluate(()=>{localStorage.setItem('cendreval-gestures-seen','1');localStorage.setItem('cendreval-render-quality','classic')});
 await page.getByText('NOUVELLE PARTIE',{exact:true}).click();await page.locator('.spec-cards button').filter({hasText:'LAME'}).click();
 const save=async()=>{await page.getByText('Sauvegarder',{exact:true}).evaluate(b=>b.click());return page.evaluate(()=>JSON.parse(localStorage.getItem('cendreval-save')))};
 const initial=await save();
 const load=async(extra={})=>{await page.reload();await page.evaluate(({initial,extra})=>{localStorage.setItem('cendreval-bindings',JSON.stringify({spell:'KeyX'}));localStorage.setItem('cendreval-save',JSON.stringify({...initial,x:10.5,y:12.5,a:-Math.PI/2,quest:2,enemyHp:0,shrines:7,stamina:100,mana:100,...extra}))},{initial,extra});await page.reload();await page.getByText('CONTINUER',{exact:true}).click();};
 // Direction includes keyboard forward, defaults backward, and cannot be restarted mid-evade.
 for(const [key,sign]of [['z',-1],['s',1],[null,1]]){await load();const a=await save();if(key)await page.keyboard.down(key);await page.keyboard.press('Shift');if(key)await page.keyboard.up(key);await page.waitForTimeout(220);const b=await save();assert((b.y-a.y)*sign>.65,'dodge direction '+key);assert(b.stamina>75&&b.stamina<77,'single dodge costs 24');}
 await load();await page.keyboard.press('Shift');await page.waitForTimeout(70);await page.keyboard.press('Shift');await page.waitForTimeout(130);let s=await save();assert(s.stamina>75,'repeat evade cannot spend stamina or extend protection');
 // Different basic weapon inputs share one recovery; an early command does not fire later.
 await load();await page.evaluate(()=>{for(let i=0;i<3;i++){window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyR'}))}});await page.waitForTimeout(330);s=await save();assert.equal(s.arrows,initial.arrows-1,'early bow spam never queues a delayed shot');
 await load();await page.evaluate(()=>{for(const code of ['KeyR','KeyX']){window.dispatchEvent(new KeyboardEvent('keydown',{code}));window.dispatchEvent(new KeyboardEvent('keyup',{code}))}});s=await save();assert(s.mana>99,'switching weapon cannot bypass recovery');
 // Late bow command is retained once, then nothing else fires without input.
 await load({classId:'bow',spec:'bow'});await page.keyboard.press('r');await page.waitForTimeout(250);await page.keyboard.press('r');await page.waitForTimeout(190);s=await save();assert.equal(s.arrows,initial.arrows-2,'late bow queues exactly one shot');await page.waitForTimeout(420);assert.equal((await save()).arrows,s.arrows,'buffer is consumed once');
 // A queued dodge remembers forward intent even when the key is released before recovery.
 await load();await page.keyboard.press('r');await page.waitForTimeout(150);await page.keyboard.down('z');await page.keyboard.press('Shift');await page.keyboard.up('z');await page.waitForTimeout(300);s=await save();assert(s.y<11.75,'queued dodge retains keyboard forward intent');
 // Pause clears pending commands and freezes resource recovery.
 await load({classId:'bow',spec:'bow'});await page.keyboard.press('r');await page.waitForTimeout(250);await page.keyboard.press('r');await page.getByText('Pause',{exact:true}).evaluate(b=>b.click());const before=await save();await page.waitForTimeout(350);assert.equal((await save()).stamina,before.stamina);await page.getByText('REPRENDRE',{exact:true}).click();await page.waitForTimeout(400);assert.equal((await save()).arrows,before.arrows,'resume never replays queued shot');
 assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/cendreval-combat-desktop.png'});console.log(JSON.stringify({pass:true,directions:3,sharedRecovery:true,earlyInputIgnored:true,lateBowBuffered:true,queuedDirection:true,pauseClearsBuffer:true,errors}));
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
