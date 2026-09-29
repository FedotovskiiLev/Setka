import test from 'node:test';
import assert from 'node:assert/strict';
import {studyDashboardData,studyDashboardPeriod} from '../src/domain/study-dashboard.js';

const minute=60000;
const measurement=(id,date,subject,minutes,{progress=null,unit='',note=''}={})=>({
  id,date,subject,startedAt:Date.parse(`${date}T12:00:00Z`),measuredMs:minutes*minute,progress,unit,note
});
const state={measurements:[
  measurement('older','2026-08-20','Физика',40),
  measurement('previous','2026-09-22','Физика',30),
  measurement('empty','2026-09-24','',0),
  measurement('chapter','2026-09-25','Физика',20,{progress:1,unit:'глава',note:'Квант'}),
  measurement('pages','2026-09-29','Физика',10,{progress:2,unit:'страницы',note:'Атом'}),
  measurement('literature','2026-09-15','Литература',5)
]};

test('seven and thirty day periods include current and preceding bounds',()=>{
  const week=studyDashboardData(state,{today:'2026-09-29'});
  assert.equal(week.from,'2026-09-23');assert.equal(week.to,'2026-09-29');
  assert.deepEqual(week.records.map(record=>record.id),['pages','chapter','empty']);
  assert.equal(week.total,30*minute);assert.equal(week.previous,30*minute);
  assert.equal(week.daily.length,7);assert.equal(week.daily.find(day=>day.date==='2026-09-24').ms,0);
  assert.equal(week.maximum,20*minute);
  const prior=studyDashboardData(state,{today:'2026-09-29',offset:1});
  assert.equal(prior.from,'2026-09-16');assert.equal(prior.to,'2026-09-22');
  assert.deepEqual(prior.records.map(record=>record.id),['previous']);
  assert.equal(prior.previous,5*minute);
  const month=studyDashboardData(state,{today:'2026-09-29',days:30});
  assert.equal(month.from,'2026-08-31');assert.equal(month.to,'2026-09-29');
  assert.equal(month.previous,40*minute);assert.equal(month.daily.length,30);
});

test('subject and note search normalize keys; empty subject has a distinct option',()=>{
  const selected=studyDashboardData(state,{today:'2026-09-29',subject:'  ФИЗИКА ',query:'физика атом'});
  assert.deepEqual(selected.records.map(record=>record.id),['pages']);
  assert.equal(selected.total,10*minute);assert.equal(selected.previous,0);
  const empty=studyDashboardData(state,{today:'2026-09-29',subject:'_empty'});
  assert.deepEqual(empty.records.map(record=>record.id),['empty']);
  assert.ok(empty.options.some(([key,label])=>key==='_empty'&&label==='Без предмета'));
});

test('zero days and progress units stay separate; input state is immutable',()=>{
  const before=JSON.stringify(state);
  const result=studyDashboardData(state,{today:'2026-09-29',subject:'физика'});
  assert.equal(result.daily.filter(day=>day.ms>0).length,2);
  assert.deepEqual(result.summary[0].progress,{'глава':1,'страницы':2});
  assert.equal(result.summary[0].measuredMs,30*minute);
  const quiet=studyDashboardData(state,{today:'2026-09-29',offset:3,subject:'_empty'});
  assert.equal(quiet.total,0);assert.equal(quiet.maximum,1);
  assert.ok(quiet.daily.every(day=>day.ms===0));
  assert.equal(JSON.stringify(state),before);
});

test('period choices and offsets clamp to valid nonnegative integers',()=>{
  assert.deepEqual(studyDashboardPeriod(30,1.9),{days:30,offset:1});
  assert.deepEqual(studyDashboardPeriod(12,-2),{days:7,offset:0});
  assert.deepEqual(studyDashboardPeriod(7,Infinity),{days:7,offset:0});
});
