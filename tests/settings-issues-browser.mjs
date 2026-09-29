import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.TEST_URL||'http://localhost:4173/';
const channel=process.env.TEST_CHANNEL||'unstable';
assert.ok(['unstable','betha'].includes(channel));
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.setFixedTime(new Date('2026-09-06T08:00:00Z'));
await mkdir('artifacts',{recursive:true});
const noOverlap=async()=>{
  const result=await page.evaluate(()=>{
    const panels=[...document.querySelectorAll('.settings-panel')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
    const overlaps=[];
    for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){
      const a=panels[i],b=panels[j];
      if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>2)overlaps.push([a.id,b.id]);
    }
    return {width:document.documentElement.scrollWidth,innerWidth,panels,overlaps};
  });
  assert.ok(result.width<=result.innerWidth,`horizontal overflow at ${result.innerWidth}: ${result.width}`);
  assert.deepEqual(result.overlaps,[],`settings panels overlap at ${result.innerWidth}`);
  return result;
};
try{
  await page.goto(base);
  if(await page.locator('#dialog[open]').count())await page.locator('#dialog [data-action=close]').click();
  await page.locator('.sidebar [data-nav=more]').click();
  await page.locator('#settings-schedule').waitFor();
  const search=page.locator('#settings-search');
  if(channel==='unstable')assert.equal(await search.count(),0,'Unstable must not expose the Betha settings search');
  else assert.equal(await search.count(),1,'Betha must expose settings search');
  for(const [width,height] of [[1440,1000],[1024,900],[320,780],[390,844],[844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    const layout=await noOverlap();
    assert.ok(layout.panels.length>0);
    await page.screenshot({path:`artifacts/settings-${channel}-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  if(channel==='betha'){
    await search.fill('тихие часы');
    assert.ok(await page.locator('#settings-notifications').isVisible(),'quiet-hours search should find Notifications');
    const visiblePanels=()=>page.locator('.settings-panel:visible').count();
    assert.equal(await visiblePanels(),1,'Betha settings navigation shows only the selected panel');
    await search.fill('этого нет в настройках');
    assert.equal(await visiblePanels(),0,'unmatched search hides settings panels');
    assert.ok(await page.getByText(/ничего не найдено|нет совпадений|не найдено/i).count()>0,'no-results message is shown');
    await search.fill('');
    await page.locator('.settings-nav a[href="#settings-notifications"]').click();
    await page.locator('#settings-notifications').waitFor({state:'visible'});
    assert.equal(await visiblePanels(),1,'clearing search restores the selected panel');
    await page.locator('#settings-notifications input[type=time]').first().fill('21:45');
    await page.locator('.settings-nav a[href="#settings-rhythm"]').click();
    await page.locator('#settings-rhythm').waitFor({state:'visible'});
    await page.locator('.settings-nav a[href="#settings-notifications"]').click();
    assert.equal(await page.locator('#settings-notifications input[type=time]').first().inputValue(),'21:45','switching sections preserves unsaved time draft');
    await page.locator('.settings-nav a[href="#settings-rhythm"]').click();
    await page.locator('#settings-rhythm').waitFor({state:'visible'});
    const bounds=page.locator('#bounds-form');
    await bounds.locator('[name=start]').fill('09:15');
    await bounds.locator('[name=end]').fill('20:00');
    await bounds.locator('[name=minimum]').fill('35');
    const beforeBounds=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), 'setka.betha.v1');
    await page.locator('.settings-nav a[href="#settings-followups"]').click();
    await page.locator('#settings-followups [data-rule]').first().click();
    await page.locator('.settings-nav a[href="#settings-rhythm"]').click();
    await page.locator('#settings-rhythm').waitFor({state:'visible'});
    assert.equal(await page.locator('#bounds-form [name=start]').inputValue(),'09:15','an app rerender preserves an unsaved bounds draft');
    assert.equal(await page.locator('#bounds-form [name=end]').inputValue(),'20:00');
    assert.equal(await page.locator('#bounds-form [name=minimum]').inputValue(),'35');
    const afterToggle=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), 'setka.betha.v1');
    assert.equal(afterToggle.settings.dayStart,beforeBounds.settings.dayStart,'rule toggle persists independently of an unsaved bounds draft');
    await bounds.locator('button[type=submit]').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('setka.betha.v1')||'null')?.settings?.dayStart===555);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')).settings.minimumWindow),35,'submitting bounds persists the draft');
  }

  const storageKey=channel==='unstable'?'setka.unstable.v1':'setka.betha.v1';
  if(channel==='betha')await page.locator('.settings-nav a[href="#settings-notifications"]').click();
  const quietStart=page.locator('#settings-notifications input[type=time]').first();
  assert.equal(await quietStart.getAttribute('aria-label')!==null,true,'native time input remains labelled');
  const opener=page.locator('#settings-notifications .time-picker-button').first();
  assert.equal(await opener.count(),1,'time input has an adjacent wheel button');
  const savedBefore=await page.evaluate(key=>localStorage.getItem(key),storageKey);
  const original=await quietStart.inputValue();
  const originalInput=await quietStart.elementHandle();
  await opener.focus();await page.keyboard.press('Space');
  const wheelDialog=page.locator('dialog.time-picker-dialog');await wheelDialog.waitFor({state:'visible'});
  await page.clock.runFor(61_000);
  assert.equal(await originalInput.evaluate(e=>e.isConnected),true,'background refresh retains the original native time input while the standalone wheel is open');
  assert.equal(await quietStart.inputValue(),original,'background refresh preserves the open time-picker draft');
  if(page.viewportSize().width===1440){
    const wheelLayout=await wheelDialog.evaluate(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth}));
    assert.ok(wheelLayout.height<650,`wheel dialog should stay compact at desktop: ${wheelLayout.height}px`);
    assert.ok(wheelLayout.documentWidth<=wheelLayout.viewportWidth,`wheel dialog causes horizontal overflow: ${wheelLayout.documentWidth}/${wheelLayout.viewportWidth}`);
    await page.screenshot({path:`artifacts/time-wheel-${channel}.png`,fullPage:true});
  }
  const hours=wheelDialog.getByRole('listbox',{name:'Часы'}),minutes=wheelDialog.getByRole('listbox',{name:'Минуты'});
  await hours.focus();await page.keyboard.press('End');
  assert.equal(await hours.getAttribute('aria-activedescendant'),'wheel-0-23');
  await page.keyboard.press('Home');assert.equal(await hours.getAttribute('aria-activedescendant'),'wheel-0-0');
  await page.keyboard.press('ArrowDown');assert.equal(await hours.getAttribute('aria-activedescendant'),'wheel-0-1');
  const oldScroll=await hours.evaluate(e=>e.scrollTop);const bounds=await hours.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.wheel(0,44);
  await page.waitForFunction(()=>{const e=document.querySelector('dialog.time-picker-dialog [aria-label="Часы"]');return e?.getAttribute('aria-activedescendant')==='wheel-0-2';});
  assert.ok(await hours.evaluate(e=>e.scrollTop)>oldScroll,'real wheel scroll moves the wheel');
  assert.equal(await wheelDialog.locator('.wheel-value').innerText(),`02:${original.slice(3)}`,'wheel scroll and selected time stay synchronized');
  await page.keyboard.press('Escape');await wheelDialog.waitFor({state:'detached'});
  assert.equal(await quietStart.inputValue(),original,'Escape cancels without changing the native input');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),storageKey),savedBefore,'Escape does not write local storage');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('time-picker-button')),true,'focus returns to the wheel button after cancel');

  await opener.click();await wheelDialog.waitFor({state:'visible'});
  await wheelDialog.getByRole('listbox',{name:'Часы'}).getByRole('option',{name:'09',exact:true}).click();
  await wheelDialog.getByRole('listbox',{name:'Минуты'}).getByRole('option',{name:'37',exact:true}).click();
  await wheelDialog.getByRole('button',{name:'Выбрать',exact:true}).click();await wheelDialog.waitFor({state:'detached'});
  assert.equal(await quietStart.inputValue(),'09:37','accept updates the form input');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),storageKey),savedBefore,'accept updates only the input until form submission');
  await page.locator('#notification-form button.secondary:not(.time-picker-button)').click();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.notifications?.quietStart===577,storageKey);

  await page.locator('.sidebar [data-nav=today]').click();
  await page.locator('[data-action=add-event]').click();
  const parent=page.locator('#dialog[open]'),eventTitle=page.locator('#event-form [name=title]');
  await eventTitle.fill('Disposable nested picker event');
  const eventTime=page.locator('#event-form input[type=time]').first(),eventOriginal=await eventTime.inputValue();
  const eventPicker=page.locator('#event-form .time-picker-button').first();await eventPicker.click();
  await page.locator('dialog.time-picker-dialog').waitFor({state:'visible'});
  await page.keyboard.press('Escape');await page.locator('dialog.time-picker-dialog').waitFor({state:'detached'});
  assert.equal(await parent.count(),1,'cancel closes nested wheel only and keeps event dialog open');
  assert.equal(await eventTitle.inputValue(),'Disposable nested picker event','nested cancel retains parent form title');
  assert.equal(await eventTime.inputValue(),eventOriginal,'nested cancel preserves parent time input');
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('time-picker-button')),true,'nested cancel restores focus to its opener');
  await parent.locator('[data-action=close]').click();
  assert.deepEqual(errors,[]);
  console.log(`PASS ${channel} settings issue workflow: layout, time wheel keyboard/scroll/cancel/accept/persistence, nested event cancel and focus return.`);
}finally{await browser.close();}
