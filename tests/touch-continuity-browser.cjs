const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const root=path.resolve('pages-dist');const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))});await new Promise(r=>server.listen(4182,r));let browser;try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:4182');await p.evaluate(()=>{localStorage.setItem('cendreval-gestures-seen','1');localStorage.setItem('cendreval-loot-v1',JSON.stringify({version:1,items:{fang:1,oath:1,eclipse:1,iron:1},equipped:{weapon:'fang'}}))});await p.reload();await p.getByText('NOUVELLE PARTIE',{exact:true}).click();await p.locator('.spec-cards button').first().click();await p.getByText('Sauvegarder',{exact:true}).evaluate(b=>b.click());await p.reload();await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('cendreval-save'));s.level=4;s.talent=3;localStorage.setItem('cendreval-save',JSON.stringify(s))});await p.getByText('CONTINUER',{exact:true}).click();const cdp=await p.context().newCDPSession(p);await p.setViewportSize({width:844,height:390});
const save=async()=>{await p.getByText('Sauvegarder',{exact:true}).evaluate(b=>b.click());return p.evaluate(()=>JSON.parse(localStorage.getItem('cendreval-save')))};
const points=new Map();
const send=async(type,id,x,y)=>{if(type==='touchEnd'){const ended=points.get(id);points.delete(id);await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[ended]})}else{points.set(id,{id,x,y});await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...points.values()]})}};
// The left thumb remains held through repeated right-thumb landings and lifts.
await send('touchStart',1,145,265);await send('touchMove',1,145,220);
for(let n=0;n<8;n++){
 const a=await save();
 // Tap followed immediately by a horizontal drag used to latch a spell and stop yaw.
 await send('touchStart',2,620,235);await send('touchEnd',2);
 await send('touchStart',2,620,235);
 await send('touchMove',2,634,237);await send('touchMove',2,670,239);
 const b=await save();assert(b.a-a.a>.18,'camera tracks the entire second drag, iteration '+n);
 await send('touchEnd',2);
}
await send('touchEnd',1);
// Upper playfield also accepts simultaneous fingers, below the actual menu buttons.
await send('touchStart',1,140,270);await send('touchMove',1,140,220);
const before=await save();await send('touchStart',2,600,52);await send('touchMove',2,640,55);await send('touchEnd',2);
const after=await save();assert(after.a-before.a>.15,'upper camera area is not a separate input system');
await send('touchEnd',1);
// Start this collision-sensitive assertion at the known clear spawn.
await p.reload();await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('cendreval-save'));s.x=3.5;s.y=16.5;s.a=-Math.PI/2;localStorage.setItem('cendreval-save',JSON.stringify(s))});await p.getByText('CONTINUER',{exact:true}).click();
// Capture cancellation of one pointer does not strand the other pointer.
await send('touchStart',1,145,265);await send('touchMove',1,145,220);
await send('touchStart',2,620,235);
await p.locator('.thumb-surface').evaluate(el=>{const ids=[];el.addEventListener('pointermove',e=>ids.push(e.pointerId),{once:true});window.__touchIds=ids});
await send('touchMove',2,635,236);
await p.locator('.thumb-surface').evaluate(el=>el.releasePointerCapture(window.__touchIds[0]));
await send('touchEnd',2);const c=await save();await p.waitForTimeout(240);const d=await save();
assert(Math.hypot(d.x-c.x,d.y-c.y)>.12,'left thumb still moves after right capture loss');
await send('touchEnd',1);
await p.screenshot({path:'/tmp/touch-continuity.png'});assert.deepEqual(errors,[]);
console.log('PASS: eight tap/drag recontacts, two simultaneous thumbs, upper playfield, capture loss isolation');
}finally{await browser?.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
