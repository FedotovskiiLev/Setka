// Betha's motion is opt-in: call this after each main render, only for Betha.
let lastView;
let dashboardObserver;
let dashboardWasOpen=false;
let motionPreference;
const activeAnimations=new Set();

const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate=element=>element&&typeof element.animate==='function'&&!reduced()&&document.visibilityState!=='hidden';
function play(element,frames,options){
  if(!canAnimate(element))return;
  const animation=element.animate(frames,options);
  activeAnimations.add(animation);
  animation.finished.catch(()=>{}).finally(()=>activeAnimations.delete(animation));
}

function animateDashboard(dialog){
  if(reduced()||document.visibilityState==='hidden')return;
  for(const [index,card] of [...dialog.querySelectorAll('.study-metrics > div')].entries()){
    play(card,[
      {opacity:0.6,transform:'translate3d(0, 6px, 0)'},
      {opacity:1,transform:'translate3d(0, 0, 0)'}
    ],{duration:260,delay:index*28,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  for(const [index,bar] of [...dialog.querySelectorAll('.study-bar-track i')].entries()){
    if(bar.style.height==='0%')continue;
    play(bar,[
      {opacity:0.7,transform:'scaleY(.72)'},
      {opacity:1,transform:'scaleY(1)'}
    ],{duration:340,delay:Math.min(index*10,120),easing:'cubic-bezier(.2,.7,.2,1)'});
  }
}

function watchDashboard(){
  if(dashboardObserver)return;
  const dialog=document.querySelector('#dialog');
  if(!dialog)return;
  dashboardObserver=new MutationObserver(()=>{
    const open=dialog.open&&dialog.classList.contains('study-dashboard-dialog');
    if(open&&!dashboardWasOpen)animateDashboard(dialog);
    dashboardWasOpen=open;
  });
  dashboardObserver.observe(dialog,{attributes:true,attributeFilter:['open','class']});
}

export function mountBethaMotion(view){
  document.body.classList.add('betha-motion');
  if(!motionPreference){
    motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
    motionPreference.addEventListener('change',event=>{
      if(event.matches)for(const animation of activeAnimations)animation.cancel();
    });
  }
  if(!document.querySelector('link[data-betha-motion]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=new URL('./src/betha-motion.css',document.baseURI).href;
    link.dataset.bethaMotion='';
    document.head.append(link);
  }
  watchDashboard();
  if(view===lastView)return;
  lastView=view;
  const main=document.querySelector('#main-content');
  play(main,[
    {opacity:0.86,transform:'translate3d(0, 8px, 0)'},
    {opacity:1,transform:'translate3d(0, 0, 0)'}
  ],{duration:270,easing:'cubic-bezier(.2,.7,.2,1)'});
  for(const item of document.querySelectorAll('.nav-item.active')){
    play(item,[
      {opacity:0.7,transform:'scale(.97)'},
      {opacity:1,transform:'scale(1)'}
    ],{duration:230,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
}
