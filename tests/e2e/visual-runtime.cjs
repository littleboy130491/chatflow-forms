/* Live staging visual regression. Optional real dummy-session bootstrap is
 * explicitly enabled with CFF_VISUAL_BOOTSTRAP=1. Analytics POST, answer mutations
 * and final form submissions remain blocked; source injection is DEV only.
 * CFF_VISUAL_BOOTSTRAP=1 node tests/e2e/visual-runtime.cjs (deployed CSS)
 * CFF_VISUAL_BOOTSTRAP=1 CFF_VISUAL_SOURCE=1 node tests/e2e/visual-runtime.cjs (DEV)
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const out = process.env.CFF_VISUAL_OUTPUT || '/home/hermes/chatflow-qa/iteration-3';
const label = process.env.CFF_VISUAL_LABEL;
assert.ok(label === undefined || ['before', 'after', 'deployed'].includes(label), 'Invalid CFF_VISUAL_LABEL');
const mode = label || (process.env.CFF_VISUAL_SOURCE ? 'after' : 'before');
const css = fs.readFileSync('assets/src/runtime/styles.css', 'utf8');
const pixelScript = `import json,sys
from PIL import Image
p=json.load(sys.stdin); im=Image.open(p['path']).convert('RGB'); w,h=im.size
fg=p['foreground']; pts=[]
for y in range(h):
 for x in range(w):
  if (x+.5-w/2)**2+(y+.5-h/2)**2>(min(w,h)/2-2)**2: continue
  c=im.getpixel((x,y))
  if sum((c[i]-fg[i])**2 for i in range(3))<1800: pts.append((x,y))
assert pts,'No arrow ink found'
x0=min(x for x,y in pts); x1=max(x for x,y in pts); y0=min(y for x,y in pts); y1=max(y for x,y in pts)
print(json.dumps(dict(inkBounds=[x0,y0,x1,y1],dx=(x0+x1+1-w)/2,dy=(y0+y1+1-h)/2,pixels=len(pts))))`;
(async () => {
 fs.mkdirSync(out, { recursive: true });
 const browser = await chromium.launch({ headless: true });
 const results = [];
 try {
  // Real page bootstrap is explicitly allowed for dummy QA sessions. Analytics,
  // answers, final submit and every other mutation remain blocked; no fake API bodies.
  const newVisualPage = async () => {
   const page = await browser.newPage({ serviceWorkers: 'block' });
   await page.context().route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const bootstrap = process.env.CFF_VISUAL_BOOTSTRAP === '1' && request.method() === 'POST'
     && ['chatflow.stag.demo-ku.com', 'localhost', '127.0.0.1'].includes(url.hostname)
     && /^\/wp-json\/cff\/v1\/(forms\/\d+\/start-token|sessions)\/?$/.test(url.pathname);
    return ['GET', 'HEAD', 'OPTIONS'].includes(request.method()) || bootstrap ? route.continue() : route.abort('blockedbyclient');
   });
   return page;
  };
  if (process.env.CFF_VISUAL_FIELDS) {
   const cases = fs.readFileSync(`${out}/fields-before.jsonl`,'utf8').trim().split('\n').map(JSON.parse);
   const findings=[];const errors=[];
   for(const item of cases){
    const page=await newVisualPage();
    await page.setViewportSize({width:item.width,height:900});
    await page.goto(item.url);await page.locator('cff-chat .active').waitFor();
    if(process.env.CFF_VISUAL_SOURCE)await page.evaluate(css=>{document.querySelector('cff-chat').shadowRoot.querySelector('style').textContent=css;},css);
    const m=await page.locator('cff-chat .active').evaluate(e=>{
     const rect=x=>{let r=x.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
     const controls=[...e.querySelectorAll('button,input:not([type=checkbox]),textarea,select')].map(rect);
     const smallVerticalGaps=[];
     for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
      const a=controls[i],b=controls[j];const gap=b.y-a.bottom;
      if(Math.min(a.right,b.right)>Math.max(a.x,b.x)&&gap>=0&&gap<8)smallVerticalGaps.push(gap);
     }
     const s=e.querySelector('.summary');const b=e.querySelector('.summary + button');
     return {overflow:e.scrollWidth>e.clientWidth,smallVerticalGaps,controls,summaryGap:s&&b?rect(b).y-rect(s).bottom:null};
    });
    findings.push({kind:item.kind,width:item.width,...m});
    if(m.overflow||m.smallVerticalGaps.length||(m.summaryGap!==null&&m.summaryGap<12))errors.push(`${item.kind}/${item.width}: ${JSON.stringify(m)}`);
    await page.screenshot({path:`${out}/frontend-${mode}-field-${item.kind}-${item.width}.png`,fullPage:true});await page.close();
   }
   fs.writeFileSync(`${out}/frontend-${mode}-fields.json`,JSON.stringify(findings,null,2));
   assert.equal(findings.length,42);assert.equal(errors.length,0,errors.join('\n'));console.log(`42 classic field states passed (${mode})`);return;
  }
  for (const [theme, route] of [['light','chat/qa-chatflow-demo-kontak/'], ['dark','chat/qa-chatflow-demo-gelap/'], ['popup','uji-chatflow-popup/']]) {
   for (const width of [1280, 390]) {
    const page = await newVisualPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto('https://chatflow.stag.demo-ku.com/' + route);
    await page.locator('cff-chat').waitFor();
    if (theme === 'popup') await page.locator('cff-chat .launcher-toggle').click();
    await page.locator('cff-chat .active input').first().waitFor();
    if (process.env.CFF_VISUAL_SOURCE) await page.evaluate(css => {
     const root = document.querySelector('cff-chat').shadowRoot;
     root.querySelector('style').textContent = css;
    }, css);
    await page.waitForTimeout(300);
    const metrics = await page.evaluate(() => {
     const root = document.querySelector('cff-chat').shadowRoot;
     const rect = e => { const r = e.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right }; };
     const button = root.querySelector('.active button[type=submit]');
     const input = root.querySelector('.active input');
     const s = getComputedStyle(button), ps = getComputedStyle(button,'::before');
     const bubbles = [...root.querySelectorAll('.bubble.bot')];
     const note = bubbles[1], prompt = bubbles.at(-1), form = root.querySelector('.active form');
     const conversation = getComputedStyle(root.querySelector('.conversation'));
     return { button:rect(button), input:rect(input), accessibleText:button.textContent,
      foreground:s.color.match(/\d+/g).slice(0,3).map(Number),
      computed:{padding:s.padding,display:s.display,gridTemplateRows:s.gridTemplateRows,gridTemplateColumns:s.gridTemplateColumns,lineHeight:s.lineHeight,fontSize:s.fontSize,pseudoMargin:ps.marginInlineStart,pseudoPosition:ps.position},
      composerGap:rect(form).y-rect(prompt).bottom, noteGap:rect(prompt).y-rect(note).bottom,
      conversationPadding:conversation.padding, conversationPaddingInline:parseFloat(conversation.paddingInlineStart),
      inputButtonGap:rect(button).x-rect(input).right,
      help:[...root.querySelectorAll('.help, form > small')].map(e=>({text:e.textContent,box:rect(e)})) };
    });
    const name = `${mode}-${theme}-${width}`;
    await page.screenshot({ path:`${out}/${name}.png`,fullPage:true });
    const crop = `${out}/${name}-send.png`;
    await page.locator('cff-chat .active button[type=submit]').screenshot({path:crop});
    const measured = spawnSync('python3',['-c',pixelScript], {input:JSON.stringify({path:crop,foreground:metrics.foreground}),encoding:'utf8'});
    if(measured.status) throw new Error(measured.stderr);
    results.push({theme,width,...metrics,arrow:JSON.parse(measured.stdout)});
    await page.close();
   }
  }
  fs.writeFileSync(`${out}/${mode}-metrics.json`,JSON.stringify(results,null,2));
  const failures=[];
  for(const r of results){
   const check=(condition,message)=>{if(!condition)failures.push(`${r.theme}/${r.width}: ${message}`);};
   check(Math.abs(r.arrow.dx)<=1.5 && Math.abs(r.arrow.dy)<=1.5,`arrow not centered: ${JSON.stringify(r.arrow)}`);
   check(r.button.width>=44 && r.button.height>=44,'send touch target below 44px');
   check(r.accessibleText.trim().length>0,'accessible button name lost');
   check(r.composerGap>=12,`prompt/composer gap ${r.composerGap} <12`);
   check(r.noteGap>=8,`instruction note/prompt gap ${r.noteGap} <8`);
   check(r.conversationPaddingInline>=16,'conversation gutter below 16px');
  }
  console.log(JSON.stringify(results.map(r=>({theme:r.theme,width:r.width,arrow:r.arrow,composerGap:r.composerGap,noteGap:r.noteGap,computed:r.computed})),null,2));
  assert.equal(failures.length,0,failures.join('\n'));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
