import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {storageKey,CHANNEL} from '../src/channel.js';
test('development storage is explicitly namespaced, including recovery and notification ledger',()=>{
  assert.equal(CHANNEL,'unstable');assert.equal(storageKey('v1'),'setka.unstable.v1');
  assert.equal(storageKey('notifications.delivered'),'setka.unstable.notifications.delivered');
  assert.ok(!readFileSync('src/app.js','utf8').includes("localStorage.getItem('setka.v1')"));
});
test('all three build identities have distinct storage keys',async()=>{
  const identities={};
  try{
    for(const channel of ['stable','unstable','betha']){
      globalThis.__SETKA_CHANNEL__=channel;
      const mod=await import(`../src/channel.js?channel=${channel}`);
      identities[channel]=[mod.storageKey('v1'),mod.storageKey('notifications.delivered'),mod.CHANNEL_LABEL];
    }
  }finally{delete globalThis.__SETKA_CHANNEL__;}
  assert.deepEqual(identities.stable,['setka.v1','setka.notifications.delivered','Stable']);
  assert.deepEqual(identities.unstable,['setka.unstable.v1','setka.unstable.notifications.delivered','Unstable']);
  assert.deepEqual(identities.betha,['setka.betha.v1','setka.betha.notifications.delivered','Betha']);
});
test('Unstable worker activation removes only obsolete Unstable caches',async()=>{
  const handlers={},removed=[];
  const source=readFileSync('sw.js','utf8').replaceAll('__CACHE_PREFIX__','setkaUnstable-').replace('__BUILD_VERSION__','new').replace('__BUILD_FILES__','[]');
  vm.runInNewContext(source,{self:{addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>['setka-stable','setkaUnstable-old','setkaUnstable-new','unrelated'],delete:async k=>removed.push(k)}});
  let done;handlers.activate({waitUntil:p=>done=p});await done;
  assert.deepEqual(removed,['setkaUnstable-old']);
});
test('Betha worker activation removes only obsolete Betha caches',async()=>{
  const handlers={},removed=[];
  const source=readFileSync('sw.js','utf8').replaceAll('__CACHE_PREFIX__','setkaBetha-').replace('__BUILD_VERSION__','new').replace('__BUILD_FILES__','[]');
  vm.runInNewContext(source,{self:{addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>['setka-stable','setkaUnstable-old','setkaBetha-old','setkaBetha-new'],delete:async k=>removed.push(k)}});
  let done;handlers.activate({waitUntil:p=>done=p});await done;
  assert.deepEqual(removed,['setkaBetha-old']);
});
