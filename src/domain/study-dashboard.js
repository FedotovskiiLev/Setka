import {addDays} from './dates.js';
import {studySummary,subjectKey} from './study.js';

// Measurements are observed time. Task estimates and plans never enter these totals.
export function studyDashboardPeriod(days=7,offset=0){
  const period=Number(days)===30?30:7;
  const page=Number.isFinite(Number(offset))?Math.max(0,Math.trunc(Number(offset))):0;
  return {days:period,offset:page};
}

export function studyDashboardData(state,{today,days=7,offset=0,subject='',query=''}={}){
  const {days:period,offset:page}=studyDashboardPeriod(days,offset);
  const to=addDays(today,-page*period),from=addDays(to,1-period);
  const selected=subject==='_empty'?'_empty':subjectKey(subject);
  const words=subjectKey(query).split(' ').filter(Boolean);
  const matches=record=>(!selected||(subjectKey(record.subject)||'_empty')===selected)
    &&words.every(word=>subjectKey(`${record.subject||''} ${record.note||''} ${record.unit||''}`).includes(word));
  const measurements=state.measurements||[];
  const records=measurements.filter(record=>record.date>=from&&record.date<=to&&matches(record))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.startedAt-a.startedAt);
  const summary=studySummary({measurements:records},from,to);
  const total=records.reduce((sum,record)=>sum+record.measuredMs,0);
  const previousFrom=addDays(from,-period);
  const previous=measurements.filter(record=>record.date>=previousFrom&&record.date<from&&matches(record))
    .reduce((sum,record)=>sum+record.measuredMs,0);
  const byDay=new Map();
  for(const record of records)byDay.set(record.date,(byDay.get(record.date)||0)+record.measuredMs);
  const daily=Array.from({length:period},(_,index)=>{
    const date=addDays(from,index);
    return {date,ms:byDay.get(date)||0};
  });
  const maximum=Math.max(1,...daily.map(day=>day.ms));
  const options=[...new Map(measurements.map(record=>[
    subjectKey(record.subject)||'_empty',record.subject||'Без предмета'
  ])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'ru'));
  return {from,to,records,summary,total,previous,daily,maximum,options};
}
