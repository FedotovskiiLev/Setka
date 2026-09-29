// Restore the exact public Stable tree shipped by the v0.4.0 Pages artifact.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile, readdir, lstat, mkdtemp, rename, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const snapshot=path.join(repo,'release-snapshots');
const archive=path.join(snapshot,'stable-v0.4.0.tar.gz');
const manifestPath=path.join(snapshot,'stable-v0.4.0.manifest.json');

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const isSafeRelative=name=>name&&!name.startsWith('/')&&!name.includes('\\')&&!name.split('/').some(part=>part==='..'||part==='.'||part==='');

export async function readFrozenStableManifest(){
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  assert.equal(manifest.channel,'stable');
  assert.equal(manifest.version,'0.4.0');
  const versions=JSON.parse(await readFile(path.join(repo,'release-channels.json'),'utf8'));
  assert.equal(versions.stable.version,manifest.version,'Frozen Stable version must match release config');
  const paths=manifest.files.map(file=>file.path);
  assert.equal(new Set(paths).size,paths.length,'Frozen Stable manifest needs unique paths');
  for(const file of manifest.files){
    assert.ok(isSafeRelative(file.path),`Unsafe snapshot path: ${file.path}`);
    assert.ok(!['unstable','betha'].includes(file.path.split('/')[0]),'Child channel in Stable snapshot');
    assert.match(file.sha256,/^[0-9a-f]{64}$/);
    assert.ok(Number.isSafeInteger(file.size)&&file.size>=0);
  }
  return manifest;
}

async function listFiles(root,skipChildren){
  const files=[];
  async function visit(dir,relative=''){
    for(const item of await readdir(dir)){
      const next=relative?`${relative}/${item}`:item;
      const full=path.join(dir,item);
      const stat=await lstat(full);
      if(skipChildren&&!relative&&['unstable','betha'].includes(item)){
        assert.ok(stat.isDirectory(),`Child channel must be a directory: ${item}`);
        continue;
      }
      if(stat.isDirectory())await visit(full,next);
      else{
        assert.ok(stat.isFile(),`Snapshot contains a non-file: ${next}`);
        files.push({path:next,sha256:digest(await readFile(full)),size:stat.size});
      }
    }
  }
  await visit(root);
  return files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
}

export async function verifyFrozenStableTree(root,{allowChildChannels=false}={}){
  const manifest=await readFrozenStableManifest();
  const actual=await listFiles(root,allowChildChannels);
  // Compare as a path map; byte hashes and path set are both required.
  const expected=new Map(manifest.files.map(file=>[file.path,file]));
  assert.deepEqual(actual.map(file=>file.path),[...expected.keys()].sort((a,b)=>a.localeCompare(b,'en')),'Stable file path set changed');
  for(const file of actual){
    const want=expected.get(file.path);
    assert.equal(file.size,want.size,`${file.path} size changed`);
    assert.equal(file.sha256,want.sha256,`${file.path} bytes changed`);
  }
  const meta=JSON.parse(await readFile(path.join(root,'channel.json'),'utf8'));
  assert.equal(meta.channel,'stable');
  assert.equal(meta.version,manifest.version);
  return manifest;
}

export async function restoreFrozenStable(destination){
  const manifest=await readFrozenStableManifest();
  assert.equal(digest(await readFile(archive)),manifest.archiveSha256,'Frozen Stable archive changed');
  const entries=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split(/\r?\n/);
  const expected=new Set(manifest.files.map(file=>file.path));
  const actual=new Set();
  for(const entry of entries){
    const name=entry.replace(/^\.\//,'').replace(/\/$/,'');
    if(!name)continue;
    assert.ok(isSafeRelative(name),`Unsafe archive entry: ${entry}`);
    assert.ok(!['unstable','betha'].includes(name.split('/')[0]),`Child channel in archive: ${entry}`);
    if(!entry.endsWith('/'))actual.add(name);
  }
  assert.deepEqual([...actual].sort(),[...expected].sort(),'Archive path set changed');
  const parent=path.dirname(path.resolve(destination));
  const temp=await mkdtemp(path.join(parent,'.frozen-stable-'));
  try{
    execFileSync('tar',['-xzf',archive,'-C',temp],{stdio:'inherit'});
    await verifyFrozenStableTree(temp);
    await rename(temp,destination);
  }finally{
    assert.ok(path.basename(temp).startsWith('.frozen-stable-'));
    await rm(temp,{recursive:true,force:true});
  }
}
