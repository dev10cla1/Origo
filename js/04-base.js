/* ===== Ventanas de vigilia orientativas (minutos) por edad en meses ===== */
function ventana(m){
  if(m<2)return[35,60];if(m===2)return[60,90];if(m===3)return[75,105];
  if(m<6)return[90,150];if(m<9)return[120,180];return[180,240];
}

/* ===== Utilidades ===== */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dayStart=(t=Date.now())=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const hm=t=>new Date(t).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
function dur(ms){const m=Math.max(0,Math.floor(ms/60000));return m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min'}
function clock(ms){const s=Math.max(0,Math.floor(ms/1000));return[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')}
function ageM(){if(!cfg.nac)return 0;const a=new Date(cfg.nac),b=new Date();let m=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())m--;return Math.max(0,m)}
function ageTxt(){if(!cfg.nac)return'';const d=Math.floor((Date.now()-new Date(cfg.nac))/864e5),m=ageM();if(d<0)return'Aún no ha nacido';if(m<1)return d+' días';return m+(m===1?' mes':' meses')+' · '+Math.floor((d-m*30.4)/7)+' sem.'}
function toTs(hhmm){const[h,m]=hhmm.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);if(d>Date.now()+6e4)d.setDate(d.getDate()-1);return d.getTime()}
const nowHM=()=>hm(Date.now());

/* ===== Tema (automático: noche de 21:00 a 07:00) ===== */
/* Fase del día por horas fijas: amanecer 8:00 · día 9:00 · atardecer 18:30 · noche 21:00 */
let faseFija=null;
const FASES=[[8*60,'amanecer'],[9*60,'dia'],[18*60+30,'atardecer'],[21*60,'noche']];
function fase(){if(faseFija)return faseFija;const d=new Date(),m=d.getHours()*60+d.getMinutes();let f='noche';FASES.forEach(([h,n])=>{if(m>=h)f=n});return f}
function theme(){const f=fase();document.documentElement.dataset.f=f;document.documentElement.classList.toggle('scn',document.body.classList.contains('scn'));
  document.documentElement.dataset.t='dark';const m=document.querySelector('meta[name=theme-color]');if(m)m.content=getComputedStyle(document.documentElement).getPropertyValue(document.body.classList.contains('hoy')?'--st':'--shg').trim()||'#0c1524'}

/* ===== Hoja inferior y avisos ===== */
function sheet(html,onSave){
  $('sh').innerHTML=html+'<div class="row" style="margin-top:6px"><button class="sec" id="shx">Cancelar</button><button class="sec" id="shs" style="background:var(--acc);color:var(--on)">Guardar</button></div>';
  shOpen();
  $('shx').onclick=closeSheet;
  $('shs').onclick=()=>{if(onSave()!==false)closeSheet()};
}
/* Abrir una hoja añade una entrada al historial: así el gesto «atrás» del móvil la cierra en vez de salir de la pantalla.
   Si la hoja se cierra con un botón, la entrada queda «gastada» y el siguiente «atrás» la salta (ver popstate). */
let atSh=false;
function shOpen(){
  $('ov').style.display='flex';$('toast').style.display='none';
  if(!Sync.gate){if(!(history.state&&history.state.sh))history.pushState({sh:1,sub:!!(history.state&&history.state.sub)},'');atSh=true}
  a11y($('sh'));$('sh').scrollTop=0;try{$('sh').focus({preventScroll:true})}catch(_){}
}
/* Los elementos pulsables que no son botones también se pueden usar con teclado y lector de pantalla */
function a11y(r){r.querySelectorAll('[data-a]:not(button):not([tabindex])').forEach(x=>{x.tabIndex=0;if(!x.getAttribute('role'))x.setAttribute('role','button')})}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('ov').style.display==='flex'&&!Sync.gate)return closeSheet();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-a]:not(button)')){e.preventDefault();e.target.click()}});
const vibra=()=>{try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}};
const closeSheet=()=>$('ov').style.display='none';
$('ov').onclick=e=>{if(e.target===$('ov')&&!Sync.gate)closeSheet()};
let tt,undoFn;
function toast(msg,fn,lbl,ms){$('tmsg').textContent=msg;$('toast').style.display='flex';undoFn=fn;$('undo').textContent=lbl||'Deshacer';$('undo').hidden=!fn;clearTimeout(tt);tt=setTimeout(()=>$('toast').style.display='none',ms||5000)}
$('undo').onclick=()=>{if(undoFn)undoFn();$('toast').style.display='none'};
function chips(id,opts,sel){return'<div class="chips" id="'+id+'">'+opts.map(([v,l])=>'<button type="button" data-v="'+v+'" class="'+(v===sel?'on':'')+'">'+l+'</button>').join('')+'</div>'}
document.addEventListener('click',e=>{const b=e.target.closest('.chips button');if(!b)return;b.parentNode.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  if(b.parentNode.id==='lt'&&$('tml')){const p=b.dataset.v==='pecho';$('tml').hidden=p;$('tpe').hidden=!p}});
const chipVal=id=>document.querySelector('#'+id+' button.on')?.dataset.v;

/* ===== Registros ===== */
const lastMl=()=>{const t=Store.live().find(e=>e.tipo==='toma'&&e.datos.ml);return t?t.datos.ml:120};
const lastLeche=()=>{const t=Store.live().find(e=>e.tipo==='toma');return t?t.datos.leche:'formula'};
function addEv(tipo,datos,inicio,msg){
  const dec=tipo==='panal'&&cfg.talla&&(cfg.stock||{})[cfg.talla]>0;
  if(dec){cfg.stock[cfg.talla]--;datos.talla=cfg.talla;saveCfg()}
  const e=Store.add({tipo,inicio:inicio||Date.now(),fin:null,datos});vibra();
  const tl=cfg.talla;toast(msg,()=>{Store.patch(e.id,{borrado:true});if(dec){cfg.stock[tl]++;saveCfg();render()}})}
function toggleSueno(ts){
  const S=Store.live().find(e=>e.tipo==='sueno'&&!e.fin),t=typeof ts==='number'?ts:Date.now();vibra();
  if(S){Store.patch(S.id,{fin:t});toast('Sueño guardado: '+dur(t-S.inicio),()=>Store.patch(S.id,{fin:null}))}
  else{const e=Store.add({tipo:'sueno',inicio:t,fin:null,datos:{}});toast('Sueño iniciado',()=>Store.patch(e.id,{borrado:true}))}
}
function panelSueno(){
  const dormido=!!Store.live().find(e=>e.tipo==='sueno'&&!e.fin);
  panel('<h2 style="margin-top:0">Sueño</h2><div class="pg" style="grid-template-columns:1fr">'+
    (dormido?'<button data-a="sue" data-v="ahora">'+IC.sueno+'Se ha despertado ahora</button><button data-a="sue" data-v="hora">'+IC.sueno+'Se despertó a las…</button>'
            :'<button data-a="sue" data-v="ahora">'+IC.sueno+'Se ha dormido ahora</button><button data-a="sue" data-v="hora">'+IC.sueno+'Se durmió a las…</button>')+'</div>')
}
function sheetSuenoHora(){
  const S=Store.live().find(e=>e.tipo==='sueno'&&!e.fin);
  sheet('<h2 style="margin-top:0">'+(S?'¿A qué hora se despertó?':'¿A qué hora se durmió?')+'</h2><label>Hora</label><input id="hr" type="time" value="'+nowHM()+'">',()=>{
    if(!$('hr').value)return false;const t=toTs($('hr').value);
    if(S&&t<=S.inicio){toast('La hora debe ser posterior a las '+hm(S.inicio),null);return false}
    toggleSueno(t)})
}
$('banb').onclick=toggleSueno;
