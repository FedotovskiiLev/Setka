import {startStudy,pauseStudy,resumeStudy,finishStudy,correctStudy,elapsedStudy,studySubjects} from './domain/study.js';
import {completeTask} from './domain/planner.js';
import {studyDashboard} from './study-dashboard.js';
import {CHANNEL} from './channel.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=ms=>{const sec=Math.floor(ms/1000);return `${Math.floor(sec/3600).toString().padStart(2,'0')}:${Math.floor(sec/60%60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`;};
export function studyPanel(state,taskId=''){
  const t=state.activeStudy;
  return `<section class="study-panel ${t?'is-active':''}"><div><strong>${t?'Учёба · '+esc(t.subject||'Без предмета'):'Время поучиться?'}</strong><p>${t?`<output data-study-clock>${clock(elapsedStudy(t,Date.now()))}</output><span class="study-running-state"> · ${t.runningSince===null?'пауза':'идёт отсчёт'}</span>`:'Можно начать без задачи и без ограничения времени.'}</p></div><div class="primary-actions">${t?`<button class="secondary" data-study="${t.runningSince===null?'resume':'pause'}">${t.runningSince===null?'Продолжить':'Пауза'}</button><button class="primary" data-study="finish" aria-label="Завершить учёбу"><span class="study-label-long">Завершить</span><span class="study-label-short" aria-hidden="true">Готово</span></button>`:`<button class="primary" data-study="start" data-task="${esc(taskId)}" aria-label="Начать учёбу"><span class="study-label-long">▶ Начать учёбу</span><span class="study-label-short" aria-hidden="true">▶ Учиться</span></button>`}<button class="subtle" data-study="stats" aria-label="Моя статистика"><span class="study-label-long">Моя статистика</span><span class="study-label-short" aria-hidden="true">▥</span></button></div>${t?.recovered?'<p class="section-caption">Таймер восстановлен. Проверьте время при завершении.</p>':''}${t?.clockChanged?'<p class="notice warning">Часы устройства изменились. Проверьте длительность перед сохранением.</p>':''}</section>`;
}
export function bindStudyUI({getState,mutate,modal,today,toast}){
  let sample={wall:Date.now(),mono:performance.now()},editing=null,statsOptions={days:7,offset:0,subject:'',query:''};
  function start(taskId,subject=''){mutate(()=>{startStudy(getState(),{id:crypto.randomUUID(),at:Date.now(),taskId:taskId||null,subject});document.querySelector('#dialog').close();});}
  function startForm(){
    const s=getState();modal('Начать учёбу',`<form id="study-start"><label>Предмет (необязательно)<input name="subject" list="study-subjects" maxlength="180" autofocus placeholder="Например, физика"></label><datalist id="study-subjects">${studySubjects(s).map(x=>`<option value="${esc(x)}">`).join('')}</datalist><label>Задача (необязательно)<select name="task"><option value="">Просто поучиться</option>${s.tasks.filter(t=>t.status==='todo').map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')}</select></label><p>Обычный таймер без лимита. Паузы не учитываются. Можно закрыть приложение и вернуться; забытый таймер можно исправить или удалить.</p><button class="primary full">Начать</button></form>`);
    document.querySelector('#study-start').onsubmit=e=>{e.preventDefault();const v=new FormData(e.target);document.querySelector('#dialog').close();start(v.get('task'),v.get('subject'));};
  }
  function recordForm(record=null){
    const s=getState(),t=s.activeStudy;if(!record&&!t)return;
    if(!record)mutate(()=>pauseStudy(getState(),Date.now()));
    editing=record?.id||null;
    const minutes=record?record.measuredMs/60000:elapsedStudy(t,Date.now())/60000;
    modal(record?'Исправить запись':'Как прошла учёба?',`<form id="study-finish"><label>Время учёбы, мин<input name="minutes" type="number" min="0" max="1440" step="0.01" required value="${Math.round(minutes*100)/100}"></label><p class="section-caption">${record?'Исходный отсчёт: '+Math.round(record.timerMs/60000)+' мин.':'Таймер на паузе. Проверьте забытые перерывы.'} Измерения не заменяют оценки и запланированное время.</p><label>Предмет<input name="subject" value="${esc(record?.subject??t?.subject)}" maxlength="180" list="study-subjects"></label><datalist id="study-subjects">${studySubjects(s).map(x=>`<option value="${esc(x)}">`).join('')}</datalist><details ${record?.progress!==null&&record?'open':''}><summary>Что удалось сделать (необязательно)</summary><div class="form-row"><label>Количество<input name="progress" type="number" min="0" step="any" placeholder="0.25" value="${record?.progress??''}"></label><label>Ваша единица<input name="unit" maxlength="80" placeholder="задач, тем, страниц…" value="${esc(record?.unit||'')}"></label></div><label>Короткая заметка<textarea name="note" maxlength="2000">${esc(record?.note||'')}</textarea></label><p class="section-caption">Доли тоже считаются. Единица может отличаться у разных предметов; еженедельное ДЗ не предполагается.</p></details>${!record&&t.taskId?'<label class="checkbox-label"><input type="checkbox" name="complete">Связанная задача полностью выполнена</label>':''}<button class="primary full">Сохранить</button><button class="subtle full" type="button" data-study="${record?'delete-record':'discard'}" data-id="${esc(record?.id||'')}">${record?'Удалить запись':'Не сохранять этот отсчёт'}</button>${record?.corrections?.length?'<button type="button" class="secondary full" data-study="undo-record" data-id="'+esc(record.id)+'">Отменить последнее исправление</button>':''}</form>`);
    document.querySelector('#study-finish').onsubmit=e=>{e.preventDefault();const v=new FormData(e.target),fields={minutes:Number(v.get('minutes')),subject:v.get('subject'),progress:v.get('progress')===''?null:Number(v.get('progress')),unit:v.get('unit')||'',note:v.get('note')||''};
      mutate(()=>{const live=getState();if(editing)correctStudy(live,editing,fields);else{const taskId=t.taskId;finishStudy(live,{id:t.id,at:Date.now(),...fields});if(v.has('complete')&&taskId)completeTask(live,taskId,today());}document.querySelector('#dialog').close();toast('Сохранено только на этом устройстве');});};
  }
  function statistics(days=7){
    if(days!==statsOptions.days)statsOptions.offset=0;statsOptions.days=days;
    modal('Моя учёба',studyDashboard(getState(),{today:today(),...statsOptions,enhanced:CHANNEL==='betha'}));
    const root=document.querySelector('#dialog');root.classList.add('study-dashboard-dialog');
    const refresh=()=>{const input=root.querySelector('#study-record-search'),focused=document.activeElement===input,at=input.selectionStart;statistics(statsOptions.days);if(focused){const next=root.querySelector('#study-record-search');next.focus();try{next.setSelectionRange(at,at);}catch{}}};
    root.querySelector('#study-subject-filter').onchange=e=>{statsOptions.subject=e.target.value;refresh();};
    root.querySelector('#study-record-search').oninput=e=>{statsOptions.query=e.target.value;refresh();};
    root.querySelectorAll('[data-study-period]').forEach(b=>b.onclick=()=>{statsOptions.offset=Math.max(0,Number(b.dataset.studyPeriod));refresh();});

  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-study]');if(!b)return;const s=getState();
    if(b.dataset.study==='start'){if(s.activeStudy){toast('Таймер уже идёт');return;}if(b.dataset.task)start(b.dataset.task);else startForm();}
    if(b.dataset.study==='start-subject'&&CHANNEL==='betha'){if(s.activeStudy){toast('Таймер уже идёт');return;}start(null,b.dataset.subject==='Без предмета'?'':b.dataset.subject);}
    if(b.dataset.study==='pause')mutate(()=>pauseStudy(s,Date.now()));
    if(b.dataset.study==='resume')mutate(()=>resumeStudy(s,Date.now()));
    if(b.dataset.study==='finish')recordForm();
    if(b.dataset.study==='stats')statistics(Number(b.dataset.days)||7);
    if(b.dataset.study==='edit')recordForm(s.measurements.find(r=>r.id===b.dataset.id));
    if(b.dataset.study==='discard')mutate(()=>{s.activeStudy=null;document.querySelector('#dialog').close();});
    if(b.dataset.study==='delete-record')mutate(()=>{s.measurements=s.measurements.filter(r=>r.id!==b.dataset.id);document.querySelector('#dialog').close();});
    if(b.dataset.study==='undo-record')mutate(()=>{const r=s.measurements.find(r=>r.id===b.dataset.id),old=r?.corrections?.pop();if(old)Object.assign(r,old);document.querySelector('#dialog').close();});
  });
  setInterval(()=>{
    const wall=Date.now(),mono=performance.now(),t=getState().activeStudy;
    if(t&&t.runningSince!==null&&Math.abs((wall-sample.wall)-(mono-sample.mono))>60000)mutate(()=>t.clockChanged=true);
    sample={wall,mono};document.querySelectorAll('[data-study-clock]').forEach(e=>e.textContent=clock(elapsedStudy(t,wall)));
  },1000);
}
