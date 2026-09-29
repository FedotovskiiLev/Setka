// Betha-only navigation is presentation state; it never changes saved preferences.
let selected='settings-schedule',query='';
export function readSettingsDrafts(){
  return [...document.querySelectorAll('.settings-grid form')].flatMap(form=>{
    const fields=[...form.elements].filter(e=>e.name&&e.type!=='submit');
    const changed=fields.some(e=>e.type==='checkbox'?e.checked!==e.defaultChecked:e.tagName==='SELECT'?[...e.options].some(o=>o.selected!==o.defaultSelected):e.value!==e.defaultValue);
    return changed?[[form.id,fields.map(e=>({name:e.name,value:e.value,checked:e.checked}))]]:[];
  });
}
export function restoreSettingsDrafts(drafts){
  for(const [id,fields] of drafts||[]){const form=document.getElementById(id);if(!form)continue;for(const draft of fields){const input=form.elements.namedItem(draft.name);if(!input)continue;if(input.type==='checkbox')input.checked=draft.checked;else input.value=draft.value;}}
}
const aliases={schedule:'группа курс источник импорт excel xls xlsx',rhythm:'свободное время минимум рекомендации окно',followups:'домашние задания правила',notifications:'тихие часы напоминания разрешение звук',data:'резервная копия бэкап backup восстановление версия android apk офлайн'};
export function mountSettingsWorkspace(betha){
  const grid=document.querySelector('.settings-grid');if(!grid)return;
  const panels=[...grid.children],nav=document.querySelector('.settings-nav');
  if(!betha){
    for(const indices of [[0,2,4],[1,3]]){const column=document.createElement('div');column.className='settings-column';indices.forEach(i=>panels[i]&&column.append(panels[i]));grid.append(column);}return;
  }
  const fromHash=location.hash.slice(1);if(panels.some(p=>p.id===fromHash))selected=fromHash;
  const frame=document.createElement('div');frame.className='settings-workspace';nav.before(frame);frame.append(nav,grid);
  const search=document.createElement('div');search.className='settings-finder';
  search.innerHTML='<label for="settings-search">Найти настройку</label><div class="settings-search-row"><input id="settings-search" type="search" placeholder="Например, тихие часы" autocomplete="off"><button class="subtle" type="button" id="settings-clear">Сбросить</button></div><p id="settings-results" role="status"></p>';
  frame.before(search);const input=search.querySelector('input');input.value=query;
  const empty=document.createElement('p');empty.className='empty settings-empty';empty.textContent='Настроек не найдено. Попробуйте «расписание», «тихие часы» или «резервная копия».';grid.append(empty);
  const links=[...nav.querySelectorAll('a')];
  const normalize=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
  const searchable=new Map(panels.map(p=>[p.id,normalize(p.textContent+' '+aliases[p.id.replace('settings-','')])]));
  function show(){
    const words=normalize(query).trim().split(/\s+/).filter(Boolean),found=panels.filter(p=>words.every(w=>searchable.get(p.id).includes(w)));
    panels.forEach(p=>p.hidden=words.length?!found.includes(p):p.id!==selected);
    links.forEach(a=>{const id=a.hash.slice(1);a.hidden=words.length&&!found.some(p=>p.id===id);if(!words.length&&id===selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    empty.hidden=found.length>0;search.querySelector('#settings-clear').hidden=!query;
    search.querySelector('#settings-results').textContent=words.length?`Найдено разделов: ${found.length}`:'';
  }
  input.addEventListener('input',()=>{query=input.value;show();});
  search.querySelector('#settings-clear').onclick=()=>{query='';input.value='';show();input.focus();};
  links.forEach(a=>a.onclick=e=>{e.preventDefault();selected=a.hash.slice(1);query='';input.value='';history.replaceState(null,'',a.hash);show();});
  show();
}
