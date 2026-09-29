import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {restoreFrozenStable,verifyFrozenStableTree} from '../scripts/frozen-stable.mjs';

test('frozen Stable restores the complete byte-checked web tree and ignores only child scopes',async()=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'setka-frozen-stable-'));
  try{
    const root=path.join(temp,'stable');
    await restoreFrozenStable(root);
    await verifyFrozenStableTree(root);
    await mkdir(path.join(root,'unstable'));
    await mkdir(path.join(root,'betha'));
    await writeFile(path.join(root,'unstable','channel.json'),'unstable child');
    await verifyFrozenStableTree(root,{allowChildChannels:true});
    await writeFile(path.join(root,'unexpected.txt'),'extra Stable file');
    await assert.rejects(verifyFrozenStableTree(root,{allowChildChannels:true}),/Stable file path set changed/);
    await rm(path.join(root,'unexpected.txt'));
    const worker=path.join(root,'sw.js');
    const original=await readFile(worker,'utf8');
    await writeFile(worker,`${original[0]==='/'?'!':'/'}${original.slice(1)}`);
    await assert.rejects(verifyFrozenStableTree(root,{allowChildChannels:true}),/sw\.js bytes changed/);
  }finally{
    await rm(temp,{recursive:true,force:true});
  }
});
