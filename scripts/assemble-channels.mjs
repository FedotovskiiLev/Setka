// Build each channel from this checkout, then assemble one Pages artifact.
import {mkdtemp,readFile,rename,rm,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';

const root=process.cwd();
const stage=await mkdtemp(path.join(root,'.channel-stage-'));
const channels=JSON.parse(await readFile(path.join(root,'release-channels.json'),'utf8'));
const pinned=process.argv.slice(2);
assert.ok(pinned.length===0||pinned.length===2,'Supply both Stable and Betha built checkouts, or neither for a local preview');
try{
  if(pinned.length){
    // Publishing uses independent tagged checkouts. Main is only Unstable.
    const inputs={stable:path.resolve(pinned[0]),unstable:root,betha:path.resolve(pinned[1])};
    for(const channel of ['stable','unstable','betha']){
      const checkout=inputs[channel];
      const meta=JSON.parse(await readFile(path.join(checkout,'dist/channel.json'),'utf8'));
      assert.equal(meta.channel,channel);assert.equal(meta.version,channels[channel].version);
      if(channel!=='unstable'){
        const ref=execFileSync('git',['-C',checkout,'rev-parse',`v${channels[channel].version}^{commit}`],{encoding:'utf8'}).trim();
        assert.equal(meta.commit,ref,'Release build must come from its version tag');
        assert.equal(execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),ref);
      }
      await cp(path.join(checkout,'dist'),path.join(stage,channel),{recursive:true});
    }
    await rm(path.join(root,'dist'),{recursive:true,force:true});
  }else{
  for(const channel of ['stable','unstable','betha']){
    execFileSync(process.execPath,['scripts/build.mjs'],{
      cwd:root,env:{...process.env,SETKA_CHANNEL:channel},stdio:'inherit'
    });
    const meta=JSON.parse(await readFile(path.join(root,'dist/channel.json'),'utf8'));
    assert.equal(meta.channel,channel);
    assert.equal(meta.version,channels[channel].version);
    await rename(path.join(root,'dist'),path.join(stage,channel));
  }
  }
  const stableWorker=await readFile(path.join(stage,'stable/sw.js'),'utf8');
  assert.ok(stableWorker.includes("['unstable/','betha/']"),'Stable worker must exclude both child scopes');
  await rename(path.join(stage,'stable'),path.join(root,'dist'));
  for(const channel of ['unstable','betha'])await rename(path.join(stage,channel),path.join(root,'dist',channel));
  console.log('Assembled Stable, Unstable and Betha in dist/ with distinct build identities.');
}finally{
  assert.ok(path.resolve(stage).startsWith(root+path.sep+'.channel-stage-'),'Refuse cleanup outside channel staging');
  await rm(stage,{recursive:true,force:true});
}
