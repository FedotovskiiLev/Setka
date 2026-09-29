import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.TEST_URL||'http://localhost:4173/';
const channel=process.env.TEST_CHANNEL||'unstable';
assert.ok(['unstable','betha'].includes(channel));
const storageKey=channel==='unstable'?'setka.unstable.v1':'setka.betha.v1';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage(),errors=[],forbidden=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{const u=new URL(r.url());if(/mipt\.ru|materials/i.test(u.hostname+u.pathname))forbidden.push(r.url());});
await page.clock.setFixedTime(new Date('2026-09-10T09:00:00+03:00'));
await mkdir('artifacts',{recursive:true});
async function createRecord({subject,minutes,note,progress,unit}){
  await page.locator('[data-study=start]').first().click();
  await page.locator('#study-start [name=subject]').fill(subject);
  await page.locator('#study-start button.primary').click();
  await page.locator('#dialog[open]').waitFor({state:'detached'});
  await page.locator('[data-study=finish]').click();
  await page.locator('#study-finish [name=minutes]').fill(String(minutes));
  await page.locator('#study-finish details summary').click();
  await page.locator('#study-finish [name=progress]').fill(String(progress));
  await page.locator('#study-finish [name=unit]').fill(unit);
  await page.locator('#study-finish [name=note]').fill(note);
  await page.locator('#study-finish button.primary').click();
  await page.locator('#dialog[open]').waitFor({state:'detached'});
}
async function openDashboard(){await page.locator('.study-panel [data-study=stats]').click();await page.locator('#dialog.study-dashboard-dialog').waitFor();}
function metric(index){return page.locator('#dialog .study-metrics > div').nth(index).locator('strong').innerText();}
try{
  await page.goto(base);
  if(await page.locator('#dialog[open]').count())await page.locator('#dialog [data-action=close]').click();
  await page.locator('.study-panel [data-study=start]').waitFor();
  await createRecord({subject:'Линейная алгебра',minutes:12,note:'Chapter three: vectors',progress:3,unit:'задач'});
  await page.clock.setFixedTime(new Date('2026-09-11T09:00:00+03:00'));
  await createRecord({subject:'Теория вероятностей',minutes:8,note:'Review <img src=x onerror=alert(1)> chapter',progress:2,unit:'тем'});
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  assert.equal(saved.measurements.length,2);
  assert.deepEqual(saved.measurements.map(x=>x.date),['2026-09-10','2026-09-11']);
  await openDashboard();
  assert.equal(await metric(0),'20');assert.equal(await metric(1),'2');
  assert.equal(await page.locator('#dialog .study-day[role=img]').count(),7);
  const activeDays=await page.locator('#dialog .study-day[role=img][aria-label*="12 мин"],#dialog .study-day[role=img][aria-label*="8 мин"]').count();
  assert.equal(activeDays,2,'daily bars reflect both measured sessions');
  assert.equal(await page.locator('#dialog .study-record').count(),2);
  await page.locator('#study-subject-filter').selectOption({label:'Линейная алгебра'});
  assert.equal(await metric(0),'12');assert.equal(await page.locator('#dialog .study-record').count(),1);
  await page.locator('#study-subject-filter').selectOption('');
  await page.locator('#study-record-search').fill('onerror');
  assert.equal(await page.locator('#dialog .study-record').count(),1,'note text participates in search');
  assert.equal(await page.locator('#dialog .study-record-note').innerText(),'Review <img src=x onerror=alert(1)> chapter');
  assert.equal(await page.locator('#dialog .study-record-note img, #dialog .study-record-note script').count(),0,'note is rendered as safe text');
  await page.locator('#study-record-search').fill('');
  await page.locator('#dialog .study-period-arrows [aria-label="Предыдущий период"]').click();
  assert.equal(await metric(0),'0');assert.equal(await metric(1),'0');assert.equal(await page.locator('#dialog .study-record').count(),0,'previous period is empty');
  await page.locator('#dialog .study-period-arrows').getByRole('button',{name:'К текущему'}).click();
  assert.equal(await metric(0),'20');assert.equal(await page.locator('#dialog .study-record').count(),2,'return action restores current period');
  await page.locator('#dialog [data-study=stats][data-days="30"]').click();
  assert.equal(await page.locator('#dialog .study-day[role=img]').count(),30);
  await page.locator('#dialog [data-study=stats][data-days="7"]').click();
  await page.locator('#dialog .study-record').filter({hasText:'Линейная алгебра'}).click();
  await page.locator('#study-finish [name=minutes]').fill('15');
  await page.locator('#study-finish [name=note]').fill('Edited after review');
  await page.locator('#study-finish button.primary').click();
  await page.locator('#dialog[open]').waitFor({state:'detached'});
  await openDashboard();
  assert.equal(await metric(0),'23');
  assert.equal(await page.locator('#dialog .study-record').filter({hasText:'Edited after review'}).count(),1,'edit updates history');
  const subjectActions=page.locator('#dialog [data-study=start-subject]');
  if(channel==='betha'){
    assert.equal(await subjectActions.count(),2,'Betha exposes a start action for each subject summary');
    const selectedSubject=await subjectActions.first().getAttribute('data-subject');
    await subjectActions.first().click();
    await page.locator('#dialog[open]').waitFor({state:'detached'});
    await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.activeStudy?.subject!==undefined,storageKey);
    const active=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activeStudy,storageKey);
    assert.equal(active.subject,selectedSubject,'subject summary starts a timer for the selected subject');
    await openDashboard();
    assert.equal(await page.locator('#dialog [data-study=start-subject]:not([disabled])').count(),0,'an active timer disables duplicate subject-start actions');
  }else{
    assert.equal(await subjectActions.count(),0,'Unstable does not expose Betha subject-start actions');
  }
  const checkViewport=async(width,height)=>{
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    const result=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,inner:innerWidth,dialog:document.querySelector('#dialog').getBoundingClientRect(),client:document.querySelector('#dialog').clientWidth,scroll:document.querySelector('#dialog').scrollWidth}));
    assert.ok(result.doc<=result.inner,`document overflows ${width}x${height}: ${result.doc}`);
    assert.ok(result.scroll<=result.client+1,`dashboard dialog overflows horizontally ${width}x${height}: ${result.scroll}/${result.client}`);
  };
  await page.setViewportSize({width:1440,height:1000});await checkViewport(1440,1000);
  await page.screenshot({path:`artifacts/study-dashboard-${channel}-1440.png`,fullPage:true});
  for(const [width,height] of [[320,780],[390,844],[844,390]]){
    await checkViewport(width,height);
    await page.screenshot({path:`artifacts/study-dashboard-${channel}-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[],'no external MIPT/materials requests are made');
  console.log(`PASS ${channel} study dashboard: timer records, daily totals, filters/search, previous/return, 30 days, safe notes, edit, responsive layout and no external source requests.`);
}finally{await browser.close();}
