import {Capacitor,registerPlugin} from '@capacitor/core';
import {wheelTimePicker} from './wheel-time-picker.js';
const Picker=registerPlugin('SetkaTime');
export function bindTimePickers(){
  const native=Capacitor.isNativePlatform();
  function enhance(){
    for(const input of document.querySelectorAll('input[type=time]:not([data-time-enhanced])')){
      input.dataset.timeEnhanced='true';
      const label=input.getAttribute('aria-label')||input.closest('label')?.textContent.trim()||'Время';
      input.setAttribute('aria-label',label);
      const button=document.createElement('button');button.type='button';button.className='subtle time-picker-button';button.textContent='Выбрать колёсиками';button.setAttribute('aria-label','Выбрать время: '+label);
      button.onclick=async()=>{
        button.disabled=true;let value;
        try{value=native?(await Picker.pick({value:input.value||'09:00'})).value:await wheelTimePicker(input.value,label);}
        catch{value=await wheelTimePicker(input.value,label);}
        finally{button.disabled=false;}
        if(input.isConnected&&(!input.closest('dialog')||input.closest('dialog').open)&&value){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
        if(button.isConnected)button.focus({preventScroll:true});
      };input.after(button);
    }
  }
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
}
