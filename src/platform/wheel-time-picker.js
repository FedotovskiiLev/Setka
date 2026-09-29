// The same explicit wheel control works in browsers without a native wheel picker.
export function wheelTimePicker(value='09:00',title='Время'){
  return new Promise(resolve=>{
    const active=document.activeElement,host=document.querySelector('#dialog[open]')||document.body;
    const dialog=document.createElement('dialog');dialog.className='time-picker-dialog';dialog.setAttribute('aria-labelledby','wheel-title');
    dialog.innerHTML='<h2 id="wheel-title"></h2><p class="section-caption">24 часа · время расписания по Москве</p><div class="time-wheels"></div><output class="wheel-value" aria-live="polite"></output><div class="wheel-actions"><button type="button" class="secondary" data-cancel>Отмена</button><button type="button" class="primary" data-apply>Выбрать</button></div>';
    dialog.querySelector('h2').textContent=title;
    const initial=/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)?value:'09:00',chosen=initial.split(':').map(Number),wheels=[];
    const format=()=>chosen.map(n=>String(n).padStart(2,'0')).join(':');
    for(const [i,count,label] of [[0,24,'Часы'],[1,60,'Минуты']]){
      const column=document.createElement('div');column.className='wheel-column';const caption=document.createElement('p');caption.textContent=label;
      const wheel=document.createElement('div');wheel.className='time-wheel';wheel.tabIndex=0;wheel.setAttribute('role','listbox');wheel.setAttribute('aria-label',label);
      const options=Array.from({length:count},(_,n)=>{const option=document.createElement('div');option.id=`wheel-${i}-${n}`;option.setAttribute('role','option');option.className='wheel-option';option.textContent=String(n).padStart(2,'0');option.onclick=()=>select(n,true);wheel.append(option);return option;});
      function select(n,scroll){chosen[i]=Math.max(0,Math.min(count-1,n));options.forEach((o,k)=>o.setAttribute('aria-selected',String(k===chosen[i])));wheel.setAttribute('aria-activedescendant',options[chosen[i]].id);dialog.querySelector('output').textContent=format();if(scroll)wheel.scrollTop=chosen[i]*44;}
      wheel.addEventListener('scroll',()=>select(Math.round(wheel.scrollTop/44),false));
      wheel.addEventListener('keydown',e=>{const moves={ArrowDown:1,ArrowUp:-1,PageDown:5,PageUp:-5};if(e.key in moves){e.preventDefault();select(chosen[i]+moves[e.key],true);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();select(e.key==='Home'?0:count-1,true);}});
      column.append(caption,wheel);dialog.querySelector('.time-wheels').append(column);wheels.push(()=>select(chosen[i],true));
    }
    let result=null;const overflow=document.documentElement.style.overflow;
    if(host===document.body)document.documentElement.style.overflow='hidden';
    const preventOutside=e=>{if(!dialog.contains(e.target)||e.ctrlKey||(e.touches&&e.touches.length>1))e.preventDefault();};
    document.addEventListener('wheel',preventOutside,{passive:false});document.addEventListener('touchmove',preventOutside,{passive:false});
    dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
    dialog.querySelector('[data-apply]').onclick=()=>{result=format();dialog.close();};
    dialog.addEventListener('close',()=>{document.removeEventListener('wheel',preventOutside);document.removeEventListener('touchmove',preventOutside);if(host===document.body)document.documentElement.style.overflow=overflow;dialog.remove();if(active?.isConnected)active.focus({preventScroll:true});resolve(result);},{once:true});
    host.append(dialog);dialog.showModal();wheels.forEach(init=>init());dialog.querySelector('.time-wheel').focus({preventScroll:true});
  });
}
