import { test, expect, type Locator } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const wp = process.env.CFF_FIELDS_WP_PATH ?? '/home/hermes/chatflow-qa/iteration-2/wp-fields';
const results = process.env.CFF_FIELDS_RESULTS_DIR ?? '/home/hermes/chatflow-qa/iteration-2';
const types = ['short_text','long_text','email','phone','number','date','single_choice','multi_choice','yes_no','consent','hidden','statement','summary','rating','scale','nps','slider','address','media','file_upload','calculated'];
const php = (code: string) => JSON.parse(execFileSync('wp', ['--path='+wp, 'eval', `if (home_url() !== 'http://localhost:8892' || DB_NAME !== 'chatflow_fields_test') throw new RuntimeException('Not the isolated fields database.'); `+code], {encoding:'utf8'}));
const next = (chat: Locator) => chat.locator('.active').getByRole('button', {name:/^Continue$/, exact:true}).click();

test.beforeEach(async ({page, baseURL}) => {
  expect(baseURL).toBe('http://localhost:8892');
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['localhost','127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
  });
});
test.afterEach(async ({page}, info) => {
  fs.mkdirSync(results, {recursive:true});
  if (info.status !== info.expectedStatus) await info.attach('chat-dom', {body:await page.locator('cff-chat').innerText().catch(()=>''), contentType:'text/plain'});
  fs.appendFileSync(path.join(results,'fields-runs.jsonl'), JSON.stringify({name:info.title,project:info.project.name,status:info.status,level:'browser + persisted DB',error:info.error?.message})+'\n');
});

for (const type of types) test(`fields ${type}: real visitor validation and persisted completion`, async ({page}, info) => {
  await page.goto('/qa-fields-'+type+'/');
  const chat=page.locator('cff-chat');
  const active=chat.locator('.active');
  let expected: unknown;
  if (['short_text','long_text','email','phone','number','date','calculated'].includes(type)) {
    const input=active.locator('input:not([type=hidden]),textarea').last();
    await expect(input).toBeVisible();
    await next(chat);
    await expect(active.locator('[role=alert]')).toBeVisible();
    const invalid: Record<string,string>={short_text:'x',long_text:'x',email:'not-email',phone:'123',number:'9',date:'2025-12-31'};
    if (invalid[type]) { for (const value of type==='number'?['9','31','12']:type==='date'?['2025-12-31','2027-01-01']:[invalid[type]]) { await input.fill(value); await next(chat); await expect(active.locator('[role=alert]')).toBeVisible(); } }
    const values: Record<string,string>={short_text:'QA visitor',long_text:'QA multiline\nlocal example.test',email:'qa@example.test',phone:'081234567890',number:'20',date:'2026-06-15',calculated:'7'};
    await input.fill(values[type]); await next(chat);
    expected=type==='phone'?'+6281234567890':type==='number'?20:type==='calculated'?15:values[type];
  } else if (type==='single_choice') {
    await active.getByRole('button',{name:'Other',exact:true}).click();
    await expect(active.getByRole('button',{name:'Continue',exact:true})).toBeDisabled();
    await active.getByRole('textbox').fill('Local alternative'); await next(chat);
    expected={value:'other',other:'Local alternative'};
  } else if (type==='multi_choice') {
    await next(chat); await expect(active.locator('[role=alert]')).toBeVisible();
    await active.getByRole('button',{name:'Alpha',exact:true}).click(); await next(chat);
    await expect(active.locator('[role=alert]')).toBeVisible();
    await active.getByRole('button',{name:'Beta',exact:true}).click();
    await active.getByRole('button',{name:'Other',exact:true}).click(); await next(chat);
    await expect(active.locator('[role=alert]')).toBeVisible();
    await active.getByRole('button',{name:'Other',exact:true}).click(); await next(chat);
    expected=['alpha','beta'];
  } else if (type==='yes_no') { await active.getByRole('button',{name:'No',exact:true}).click(); expected=false;
  } else if (type==='consent') {
    await next(chat); await expect(active.locator('[role=alert]')).toBeVisible();
    await active.getByRole('checkbox').check(); await next(chat); expected=true;
  } else if (['rating','scale','nps'].includes(type)) {
    expected=type==='rating'?5:type==='scale'?8:0;
    await active.getByRole('button',{name:`${expected} / ${type==='rating'?5:10}`,exact:true}).click();
  } else if (type==='slider') {
    const slider=active.getByRole('slider'); await expect(slider).toHaveAttribute('min','10'); await expect(slider).toHaveAttribute('max','30'); await expect(slider).toHaveAttribute('step','5');
    await slider.focus(); await slider.press('Home'); await slider.press('ArrowRight'); await slider.press('ArrowRight'); await expect(slider).toHaveValue('20'); await next(chat); expected=20;
  } else if (type==='address') {
    await next(chat); await expect(active).toBeVisible();
    for (const [key,value] of Object.entries({street:'1 Example Street',city:'Example City',postcode:'12345',country:'Indonesia'})) await active.locator('[id$="-'+key+'"]').fill(value);
    expected={street:'1 Example Street',city:'Example City',postcode:'12345',country:'Indonesia'}; await next(chat);
  } else if (type==='file_upload') {
    await active.locator('input[type=file]').setInputFiles({name:'too-large.txt',mimeType:'text/plain',buffer:Buffer.alloc(2049,'a')}); await expect(active.getByRole('alert')).toBeVisible();
    await active.locator('input[type=file]').setInputFiles({name:'qa-fields.txt',mimeType:'text/plain',buffer:Buffer.from('Local QA fixture example.test\n')});
  } else {
    if (type==='media') { const image=chat.getByAltText('Local QA pixel'); await expect(image).toBeVisible(); await expect.poll(()=>image.evaluate((img: HTMLImageElement)=>img.naturalWidth)).toBe(1); await next(chat); }
    if (type==='statement') await expect(chat.getByText('Question statement', {exact:true}).first()).toBeVisible();
    if (type==='summary') { await expect(chat.getByText('Question summary', {exact:true}).first()).toBeVisible(); await active.getByRole('button',{name:'Submit',exact:true}).click(); }
    await active.getByRole('textbox',{name:'Confirm',exact:true}).fill('Confirmed'); await next(chat);
    if (type==='hidden') expected='private-fixture';
  }
  await expect(chat.getByRole('button',{name:'Submit',exact:true})).toBeVisible();
  if (['address','media','single_choice','rating'].includes(type)) await page.screenshot({path:path.join(results,`fields-${type}-${info.project.name}.png`),fullPage:true});
  await chat.getByRole('button',{name:'Submit',exact:true}).click();
  await expect(chat.getByText('Fields saved.',{exact:true})).toBeVisible();
  // Read back exact persisted target from this disposable local WordPress, not a mocked response.
  const row=php(`global $wpdb; $m=get_option('qa_fields_manifest'); echo wp_json_encode($wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND status='completed' ORDER BY id DESC LIMIT 1",$m['${type}']['id']),ARRAY_A));`);
  expect(row?.status).toBe('completed');
  const answers=JSON.parse(row.answers);
  if (expected!==undefined) expect(answers[type]).toEqual(expected);
  if (['statement','summary','media'].includes(type)) expect(answers).not.toHaveProperty(type);
  if (type==='file_upload') {
    expect(answers[type]).toMatch(/^[0-9a-f-]{36}$/i);
    const stored=php(`global $wpdb;$u=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}cff_uploads WHERE uuid=%s",'${answers[type]}'),ARRAY_A);$p=(new \\ChatFlow\\Privacy\\PrivateFiles())->path($u['storage_key']);echo wp_json_encode(['submission_id'=>$u['submission_id'],'name'=>$u['original_name'],'contents'=>file_get_contents($p),'private'=>!str_starts_with(realpath($p),realpath(ABSPATH).'/')]);`);
    expect(Number(stored.submission_id)).toBe(Number(row.id)); expect(stored.name).toBe('qa-fields.txt'); expect(stored.contents).toBe('Local QA fixture example.test\n'); expect(stored.private).toBe(true);
  }
});

test('fields navigation: resume, back, edit and restart discard visitor answers',async ({page})=>{
 await page.goto('/qa-fields-calculated/'); const chat=page.locator('cff-chat');
 await chat.getByRole('spinbutton',{name:'Quantity',exact:true}).fill('7'); await next(chat);
 await page.reload(); await expect(chat.getByText('Welcome back. Continue where you left off?',{exact:true})).toBeVisible();
 await chat.locator('.notice').getByRole('button',{name:'Continue',exact:true}).click();
 await chat.getByRole('button',{name:/^Edit: Quantity/}).first().click();
 await expect(chat.locator('.active').getByRole('spinbutton')).toHaveValue('7');
 await chat.locator('.active').getByRole('spinbutton').fill('8'); await next(chat);
 await chat.getByRole('button',{name:'Back',exact:true}).click();
 await expect(chat.locator('.active').getByRole('spinbutton')).toHaveValue('8');
 await next(chat);
 await chat.getByRole('button',{name:'Start over',exact:true}).click();
 await chat.getByRole('alertdialog').getByRole('button',{name:'Start over',exact:true}).click();
 await expect(chat.locator('.active').getByRole('spinbutton')).toHaveValue('');
});

// The old visitor session must remain immutable while the same form is republished.
test('fields pinned versions: resume and submit the original published schema',async ({page})=>{
 const current=php(`$r=new \\ChatFlow\\Forms\\FormRepository();$id=(int)get_option('qa_fields_pinned');$f=$r->getDraft($id);echo wp_json_encode(['id'=>$id,'version'=>$f->version(),'label'=>$f->schema()['steps'][1]['label']]);`);
 await page.goto('/qa-fields-pinned/'); const chat=page.locator('cff-chat');
 await chat.getByRole('textbox',{name:'Pinned name',exact:true}).fill('Old version visitor'); await next(chat);
 await expect(chat.locator('.active').getByRole('textbox',{name:current.label,exact:true})).toBeVisible();
 php(`$r=new \\ChatFlow\\Forms\\FormRepository();$f=$r->getDraft(${current.id});$s=$f->schema();$s['steps'][1]['label']='Latest second v'.($f->version()+1);$d=$r->saveDraft($f->id(),$s,$f->settings(),$f->draftRevision());if(is_wp_error($d))throw new RuntimeException($d->get_error_message());$p=$r->publish($d->id(),$d->draftRevision());if(is_wp_error($p))throw new RuntimeException($p->get_error_message());echo wp_json_encode($p->version());`);
 await page.reload(); await expect(chat.getByText(/A new version is available/)).toBeVisible();
 await chat.locator('.notice').getByRole('button',{name:/Continue/}).click();
 await chat.locator('.active').getByRole('textbox',{name:current.label,exact:true}).fill('Original schema answer'); await next(chat);
 await chat.getByRole('button',{name:'Submit',exact:true}).click(); await expect(chat.getByText('Fields saved.',{exact:true})).toBeVisible();
 const row=php(`global $wpdb;echo wp_json_encode($wpdb->get_row("SELECT form_version,answers FROM {$wpdb->prefix}cff_submissions WHERE form_id=${current.id} AND status='completed' ORDER BY id DESC LIMIT 1",ARRAY_A));`);
 expect(Number(row.form_version)).toBe(current.version); expect(JSON.parse(row.answers).second).toBe('Original schema answer');
});

