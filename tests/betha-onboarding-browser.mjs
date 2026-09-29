import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.TEST_URL||'http://localhost:4173/betha/';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
await mkdir('artifacts',{recursive:true});

async function freshContext(name,{permission='default',motion='no-preference'}={}){
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  if(permission==='granted')await context.grantPermissions(['notifications'],{origin:new URL(base).origin});
  await context.addInitScript(mode=>{
    Object.defineProperty(window,'__permissionRequests',{value:0,writable:true});
    if(mode==='unsupported'){try{delete window.Notification;}catch{Object.defineProperty(window,'Notification',{configurable:true,value:undefined});}}
    else if(mode==='denied'){
      window.__permissionMode='denied';
      Object.defineProperty(Notification,'permission',{configurable:true,get:()=>window.__permissionMode});
      Object.defineProperty(Notification,'requestPermission',{configurable:true,writable:true,value:()=>{window.__permissionRequests++;return Promise.resolve(window.__permissionMode);}});
    }else{
      const request=Notification.requestPermission.bind(Notification);
      Object.defineProperty(Notification,'requestPermission',{configurable:true,writable:true,value:(...args)=>{window.__permissionRequests++;return request(...args);}});
    }
  },permission);
  await context.setDefaultTimeout(8000);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:motion});
  await page.goto(base);
  await page.locator('#dialog.onboarding-flow .betha-intro').waitFor();
  return {context,page,errors};
}

async function layout(page,name,step,width,height){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{const d=document.querySelector('#dialog');if(d)d.scrollTop=0;window.scrollTo(0,0);});
  await page.waitForTimeout(80);
  const metrics=await page.evaluate(()=>{
    const dialog=document.querySelector('#dialog'),content=dialog?.querySelector('.betha-intro,#setup-form,#betha-notification-step');
    const d=dialog?.getBoundingClientRect(),c=content?.getBoundingClientRect();
    return {width:document.documentElement.scrollWidth,viewport:innerWidth,dialogWidth:d?.width,dialogLeft:d?.left,dialogScroll:dialog?.scrollWidth,dialogClient:dialog?.clientWidth,dialogHeight:dialog?.clientHeight,dialogScrollHeight:dialog?.scrollHeight,contentLeft:c?.left,contentRight:c?.right,contentWidth:c?.width};
  });
  assert.ok(metrics.width<=metrics.viewport,`${name}/${step} ${width}x${height} has document overflow: ${metrics.width}/${metrics.viewport}`);
  assert.ok(metrics.dialogScroll<=metrics.dialogClient+1,`${name}/${step} ${width}x${height} dialog overflows: ${metrics.dialogScroll}/${metrics.dialogClient}`);
  assert.ok(metrics.dialogScrollHeight>=metrics.dialogHeight,`${name}/${step} ${width}x${height} onboarding dialog has valid vertical scrolling`);
  assert.ok(metrics.contentLeft>=-1&&metrics.contentRight<=width+1,`${name}/${step} content is clipped at ${width}x${height}`);
  if(width===1440)assert.ok(Math.abs((metrics.contentLeft+metrics.contentRight)/2-width/2)<3,`desktop onboarding content should be centered: ${JSON.stringify(metrics)}`);
  await page.screenshot({path:`artifacts/betha-onboarding-${name}-${step}-${width}.png`,fullPage:false});
}

async function clickReachable(locator){await locator.scrollIntoViewIfNeeded();assert.ok(await locator.isVisible(),'onboarding action remains reachable by scrolling');await locator.click();}
async function openSetup(page){
  await clickReachable(page.locator('[data-action=setup-preferences]'));
  await page.locator('#setup-form').waitFor();
}
async function submitSetup(page){
  await clickReachable(page.locator('#setup-form button.primary'));
  await page.locator('#betha-notification-step').waitFor();
}
async function startSetup(page){await openSetup(page);await submitSetup(page);}
async function noPermissionRequest(page,label){
  assert.equal(await page.evaluate(()=>window.__permissionRequests),0,`${label}: permission must not be requested before explicit enable`);
}
async function close(context){await context.close();}

try{
  // Skip remains a real choice and the notification step is recoverable later.
  {
    const {context,page,errors}=await freshContext('skip');
    await noPermissionRequest(page,'welcome');
    const body=page.locator('body');
    assert.ok(await body.evaluate(e=>e.classList.contains('betha-motion')),'Betha motion hooks are mounted');
    assert.notEqual(await page.locator('.betha-intro').evaluate(e=>getComputedStyle(e).animationName),'none','normal motion animates onboarding');
    for(const [w,h] of [[1440,1000],[320,780],[390,844],[844,390]])await layout(page,'skip','welcome',w,h);
    await page.setViewportSize({width:1440,height:1000});
    await openSetup(page);await noPermissionRequest(page,'setup preferences');
    for(const [w,h] of [[1440,1000],[320,780],[390,844],[844,390]])await layout(page,'skip','setup',w,h);
    await page.setViewportSize({width:1440,height:1000});
    await submitSetup(page);await noPermissionRequest(page,'setup submission');
    await noPermissionRequest(page,'notification step before enable');
    for(const [w,h] of [[1440,1000],[320,780],[390,844],[844,390]])await layout(page,'skip','notifications',w,h);
    await page.setViewportSize({width:1440,height:1000});
    await clickReachable(page.locator('#onboarding-later'));
    await page.locator('#dialog[open]').waitFor({state:'detached'});
    await noPermissionRequest(page,'skip action');
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')));
    assert.equal(saved.notifications.enabled,false,'skip leaves notifications disabled');
    assert.equal(saved.settings.onboarded,true,'setup preferences are retained after skipping notifications');
    await page.reload();
    assert.equal(await page.locator('#dialog.onboarding-flow').count(),0,'completed onboarding does not repeat on reload');
    await page.locator('.sidebar [data-nav=more]').click();
    await page.locator('.settings-nav a[href="#settings-data"]').click();
    await page.locator('#settings-data').waitFor();
    await page.locator('#settings-data [data-action=welcome]').click();
    await page.locator('#dialog .betha-intro').waitFor();
    assert.ok(await page.locator('#dialog [data-action=setup-preferences]').isVisible(),'settings provide a useful way to revisit setup');
    assert.deepEqual(errors,[],`skip flow browser errors: ${errors.join('; ')}`);
    await close(context);
  }

  // A previously granted browser permission is persisted only after the explicit enable action.
  {
    const {context,page,errors}=await freshContext('grant',{permission:'granted'});
    await startSetup(page);await noPermissionRequest(page,'grant flow before enable');
    await clickReachable(page.locator('#onboarding-enable'));
    await page.locator('#onboarding-done').waitFor({state:'visible'});
    assert.match(await page.locator('#onboarding-notification-result').innerText(),/Уведомления включены/);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')).notifications.enabled),true,'explicit grant persists enabled notifications');
    await clickReachable(page.locator('#onboarding-done'));
    await page.locator('#dialog[open]').waitFor({state:'detached'});
    await page.reload();
    assert.equal(await page.locator('#dialog.onboarding-flow').count(),0,'grant survives reload without reopening onboarding');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')).notifications.enabled),true);
    assert.deepEqual(errors,[],`grant flow browser errors: ${errors.join('; ')}`);
    await close(context);
  }

  // Denial gives a recovery path; a later retry can succeed without data loss.
  {
    const {context,page,errors}=await freshContext('denied',{permission:'denied'});
    await startSetup(page);await noPermissionRequest(page,'denied flow before enable');
    await page.locator('#onboarding-enable').click();
    await page.locator('#onboarding-notification-result').getByText(/Разрешение не выдано/).waitFor();
    assert.ok(await page.locator('#onboarding-notification-result').innerText().then(t=>/настройках браузера|Android/i.test(t)),'denial explains how to recover');
    assert.equal(await page.locator('#onboarding-enable').innerText(),'Попробовать снова');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')).notifications.enabled),false,'denial does not enable notifications');
    await page.evaluate(()=>{window.__permissionMode='granted';});
    await page.locator('#onboarding-enable').click();
    await page.locator('#onboarding-done').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')).notifications.enabled),true,'retry after permission changes succeeds');
    assert.deepEqual(errors,[],`denied flow browser errors: ${errors.join('; ')}`);
    await close(context);
  }

  // Setup preferences stay editable when local storage rejects the save.
  {
    const {context,page,errors}=await freshContext('save-failure');
    await page.locator('[data-action=setup-preferences]').click();
    await page.locator('#setup-form').waitFor();
    await page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){if(key==='setka.betha.v1')throw new Error('test storage unavailable');return original.call(this,key,value);};
    });
    await page.locator('#setup-form button.primary').click();
    await page.locator('#setup-form').waitFor({state:'visible'});
    assert.equal(await page.locator('#betha-notification-step').count(),0,'failed setup persistence must not advance to step three');
    assert.equal(await page.locator('#toast').innerText(),'test storage unavailable','the injected setup persistence error is surfaced');
    await noPermissionRequest(page,'failed setup save');
    assert.deepEqual(errors,[],`save-failure flow browser errors: ${errors.join('; ')}`);
    await close(context);
  }

  // Unsupported Notification APIs report a useful next step and never persist a false success.
  {
    const {context,page,errors}=await freshContext('unsupported',{permission:'unsupported',motion:'reduce'});
    await startSetup(page);await noPermissionRequest(page,'unsupported flow');
    assert.equal(await page.locator('#betha-notification-step').evaluate(e=>getComputedStyle(e).animationName),'none','reduced motion disables onboarding animation');
    const button=page.locator('#onboarding-enable');
    await button.hover();assert.equal(await button.evaluate(e=>getComputedStyle(e).transform),'none','reduced motion disables hover transforms');
    await page.mouse.down();assert.equal(await button.evaluate(e=>getComputedStyle(e).transform),'none','reduced motion disables pressed transforms');await page.mouse.up();
    await button.click();
    await page.locator('#onboarding-notification-result').getByText(/не поддерживает уведомления/i).waitFor();
    assert.ok(await page.locator('#onboarding-notification-result').innerText().then(t=>/Android-приложении/i.test(t)),'unsupported case offers a useful Android recovery path');
    assert.equal(await page.locator('#onboarding-enable').innerText(),'Попробовать снова');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('setka.betha.v1')).notifications.enabled),false,'unsupported browser does not persist an enabled state');
    assert.deepEqual(errors,[],`unsupported flow browser errors: ${errors.join('; ')}`);
    await close(context);
  }
  console.log('PASS Betha onboarding: welcome/setup/notifications, skip/recovery, grant/reload, denied retry, unsupported browser, reduced motion and responsive layouts.');
}finally{await browser.close();}
