/* ===== Reloj: actualiza tiempos sin redibujar ===== */
let diaR=dayStart();
function tick(){
  if(document.hidden)return; /* con la pantalla apagada o la app en segundo plano no se gasta batería */
  if(dayStart()!==diaR){diaR=dayStart();softRender();return} /* ha cambiado el día: rehacer «hoy» */
  const s=state(),n=Date.now();
  if(s.S&&tab!=='hoy'){$('ban').style.display='flex';$('bant').textContent='Durmiendo · '+clock(n-s.S.inicio)}else $('ban').style.display='none';
  if(tab!=='hoy'||!$('wk'))return;
  if($('ago')&&s.last)$('ago').textContent='hace '+dur(n-s.last.inicio);
  if($('pago')&&s.lastPan)$('pago').textContent='hace '+dur(n-s.lastPan.inicio);
  const[lo,hi]=ventana(ageM()),dot=c=>{$('sd').style.background=c;$('sd').style.boxShadow='0 0 0 4px color-mix(in srgb,'+c+' 22%,transparent)'};
  if(s.S){$('wkl').textContent='Durmiendo';$('wk').textContent=clock(n-s.S.inicio);$('wkh').textContent='desde las '+hm(s.S.inicio);$('wbar').style.width='0';dot('#f7c97f')}
  else if(s.lastSleep){
    const mins=(n-s.lastSleep.fin)/60000,p=Math.min(100,mins/hi*100),c=mins>=hi?'var(--hbad,#f29a8d)':mins>=lo?'var(--hwarn,#f2c27d)':'var(--hok,#7fe0c4)';
    $('wkl').textContent='Despierto';$('wk').textContent=dur(n-s.lastSleep.fin);
    $('wkh').textContent=mins>=hi?'Ya pasó su ventana de sueño':mins>=lo?'Buen momento para dormir':'Ventana de sueño: '+lo+'–'+hi+' min';
    $('wbar').style.width=p+'%';$('wbar').style.background=c;dot(c);
  }else{$('wkl').textContent='Estado';$('wk').textContent='Sin siestas aún';$('wkh').textContent='Ventana: '+lo+'–'+hi+' min';$('wbar').style.width='0';dot('#7fe0c4')}
}

/* ===== Familia: tarjeta de Ajustes y autoría en el Resumen ===== */
const porTxt=e=>quien(e)?' · '+esc(quien(e)):'';
function porHoy(L){if(!Sync.on||Sync.miembros.length<2)return'';const t0=dayStart(),c={};L.forEach(e=>{if(e.inicio>=t0&&e.por)c[e.por]=(c[e.por]||0)+1});const k=Object.keys(c);if(!k.length)return'';
  return'<div class="it"><span>Registros de hoy</span><span class="mute" style="text-align:right;max-width:62%">'+k.map(u=>esc(quien({por:u})||'Otro')+': '+c[u]).join(' · ')+'</span></div>'}
function vFam(){
  if(!Sync.on)return'';
  if(!Sync.ready)return'<h2>Familia</h2><div class="card mute">'+esc(Sync.estado)+'</div>';
  const nm=Sync.miembros.map(u=>esc(Sync.nombres[u]||'Sin nombre')+(u===Sync.uid?' (tú)':'')).join(' · ');
  return'<h2>Familia</h2><div class="card"><div class="it"><span>Estado</span><span class="mute" style="text-align:right">'+esc(Sync.estado)+'</span></div>'+
    '<div class="it"><span>Miembros</span><span class="mute" style="text-align:right;max-width:62%">'+nm+'</span></div>'+
    '<div class="it"><span>Código para invitar</span><b style="letter-spacing:2px">'+fmtCod(Sync.fid)+'</b></div>'+
    '<div class="mute" style="margin:6px 0 10px">En el otro móvil: abre Origo, crea su cuenta, pulsa «Me han invitado» y escribe este código.</div>'+
    '<div class="grid"><button class="sec" id="fcp">Copiar código</button><button class="sec" id="fso">Cerrar sesión</button></div>'+
    '<div class="mute" style="margin-top:8px">Sesión: '+esc(Sync.email)+'</div></div>';
}

/* ===== Primer uso ===== */
function onboard(){
  sheet('<div style="text-align:center;margin-bottom:8px"><span style="display:inline-block;background:#f4f7f8;border-radius:16px;padding:10px 18px">'+LOGO(130)+'</span></div><h2 style="margin-top:0;text-align:center">Bienvenidos a Origo</h2><label>Nombre del bebé</label><input id="on" placeholder="Nombre"><label>Fecha de nacimiento (o prevista)</label><input id="of" type="date"><label>Sexo (opcional, para las curvas de la OMS)</label>'+chips('os',[['f','Niña'],['m','Niño']],'')+'',()=>{
    if(!$('on').value.trim()||!$('of').value)return false;
    cfg.nombre=$('on').value.trim();cfg.nac=$('of').value;cfg.sexo=chipVal('os')||cfg.sexo;saveCfg();render()});
  $('shx').style.display='none';
}

theme();render();
if(!cfg.nombre&&!Sync.on)onboard();
setInterval(tick,1000);setInterval(theme,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){theme();tick()}});
iniciarFirebase();
/* Pide al navegador que no borre los datos de Origo si el móvil anda justo de espacio */
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(_){}
if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data==='origo-update')toast('Hay una versión nueva de Origo',()=>location.reload(),'Actualizar',20000)});
}
