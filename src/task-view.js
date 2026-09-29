// Presentation ordering only: does not allocate work or change stored tasks.
export function compareTasks(a,b){
  return (a.dueOn||'9999').localeCompare(b.dueOn||'9999')
    || (a.dueTime||'23:59').localeCompare(b.dueTime||'23:59')
    || (b.priority||0)-(a.priority||0)
    || a.title.localeCompare(b.title,'ru');
}
export function taskMatches(task,query){
  const words=query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
  const text=[task.title,task.subject,task.origin?.subject,task.notes].filter(Boolean).join(' ').toLocaleLowerCase('ru');
  return words.every(word=>text.includes(word));
}
export function taskBucket(task,today,weekEnd){
  if(!task.dueOn)return 'Без срока';
  if(task.dueOn<today)return 'Срок прошёл';
  if(task.dueOn===today)return 'На сегодня';
  return task.dueOn<=weekEnd?'В ближайшие 7 дней':'Позже';
}
