/* ===== Pantallas ===== */
let tab='hoy';
const ico={des:'<svg viewBox="0 0 24 24"><path d="M12 21V11M12 11C12 7 9 5 5 5c0 4 2 6 7 6zM12 14c0-3 2-5 6-5 0 4-2 6-6 6z"/></svg>',
 hoy:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
 his:'<svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4"/></svg>',
 cre:'<svg viewBox="0 0 24 24"><path d="M3 20h18M6 16l4-5 4 3 5-7"/></svg>',
 aju:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>'};
let stC=null;
function state(){
  const L=Store.live(),t0=dayStart();
  if(stC&&stC.L===L&&stC.t0===t0)return stC; /* el reloj llama cada segundo: solo se recalcula si hay cambios o cambia el día */
  const tomas=L.filter(e=>e.tipo==='toma'),pan=L.filter(e=>e.tipo==='panal'&&e.inicio>=t0);
  return stC={L,t0,last:tomas[0],tomasHoy:tomas.filter(e=>e.inicio>=t0),pan,
    lastPan:L.find(e=>e.tipo==='panal'),S:L.find(e=>e.tipo==='sueno'&&!e.fin),lastSleep:L.find(e=>e.tipo==='sueno'&&e.fin)};
}

/* vCre: ver bloque de curvas OMS más abajo */
function vAju(){
  return'<h1>Ajustes</h1><div class="card" style="margin-top:12px"><label>Nombre</label><input id="cn" value="'+esc(cfg.nombre)+'"><label>Fecha de nacimiento</label><input id="cf" type="date" value="'+esc(cfg.nac)+'"><label>Sexo (curvas de la OMS)</label>'+chips('cx',[['f','Niña'],['m','Niño']],cfg.sexo)+'<button class="sec" id="cs" style="width:100%">Guardar ajustes</button></div>'+
  vFam()+'<h2>Copia de seguridad</h2><div class="card"><div class="mute" style="margin-bottom:10px">'+(Sync.on?'Los datos se comparten entre los móviles de la familia. Aun así, exporta una copia de vez en cuando.':'Los datos viven solo en este dispositivo. Haz copias de vez en cuando.')+'</div><div class="grid"><button class="sec" id="ex">Exportar</button><button class="sec" id="im">Importar</button></div><input type="file" id="fi" accept=".json" style="display:none"></div>'+
  '<h2 style="margin-top:30px">Borrar</h2><div class="mute" style="margin:-2px 0 10px">Elimina todos los registros'+(Sync.on?' de toda la familia':'')+'. Exporta antes una copia.</div><button class="sec bad" id="rs" style="width:100%">Borrar todos los datos</button>';
}

function bind(){
  if(tab==='hoy'&&$('bT')){$('bT').onclick=sheetToma;$('bP').onclick=panelPanal;$('bS').onclick=panelSueno}
  if(tab==='his'&&$('hd'))$('hd').onchange=e=>{dia=e.target.value;lim=LIM;render()};
  if(tab==='cre'&&$('addM'))$('addM').onclick=()=>ACT.medidas();
  if(tab==='mas'&&masSub==='aju'){
    if(Sync.ready&&!Sync.fotTodas){Sync.fotTodas=true;todasFotos().catch(()=>{Sync.fotTodas=false})}
    if($('fcp'))$('fcp').onclick=()=>{const c=fmtCod(Sync.fid);(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast('Código copiado: '+c,null),()=>toast('Código: '+c,null))};
    if($('fso'))$('fso').onclick=()=>sheet('<h2 style="margin-top:0">¿Cerrar sesión?</h2><div class="mute" style="margin-bottom:12px">Los datos siguen guardados en la familia. Para volver, entra con tu correo y contraseña.</div>',()=>{salir()});
    $('cs').onclick=()=>{cfg.nombre=$('cn').value.trim();cfg.nac=$('cf').value;if(!nacFut())delete cfg.emb;cfg.sexo=chipVal('cx')||cfg.sexo;saveCfg();theme();render();toast('Ajustes guardados',null)};
    $('ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({cfg,ev:Store.ev,fotos:Object.assign({},FOT)})],{type:'application/json'}));a.download='bebe-copia-'+new Date().toISOString().slice(0,10)+'.json';a.click()};
    $('im').onclick=()=>$('fi').click();
    $('fi').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!Array.isArray(j.ev))throw 0;cfg=j.cfg||{};saveCfg();if(j.fotos){Object.keys(FOT).forEach(k=>delete FOT[k]);Object.assign(FOT,j.fotos);saveFot()}replaceAll(j.ev);theme();toast('Copia importada',null)}catch(_){toast('Archivo no válido',null)}};r.readAsText(f)};
    $('rs').onclick=()=>sheet('<h2 style="margin-top:0">¿Borrar todo?</h2><div class="mute" style="margin-bottom:12px">Se eliminarán todos los registros'+(Sync.on?' en todos los móviles de la familia':' de este dispositivo')+'. No se puede deshacer.</div>',()=>{
      if(Sync.on){Store.ev.forEach(e=>e.borrado=true);if(Sync.ready)pushMany(Store.ev).catch(fbErr);else{Store.ev.forEach(e=>Sync.pend.add(e.id));savePend()}}else Store.ev=[];
      Object.keys(cfg).forEach(k=>delete cfg[k]);const limpiar=()=>{Object.keys(FOT).forEach(k=>delete FOT[k]);saveFot()};limpiar();if(Sync.ready)todasFotos().then(limpiar,()=>{});
      saveCfg();Store.save();onboard()});
  }
}

function render(){
  Store.touch();
  document.body.classList.add('scn');document.body.classList.toggle('hoy',tab==='hoy');
  if(tab!=='hoy'&&!(history.state&&history.state.sub)){history.pushState({sub:1},'');atSh=false}
  $('app').innerHTML=(tab==='hoy'?'':subTop())+{hoy:vHoy,his:vHis,cre:vSalud,mas:vMas}[tab]();
  theme();bind();a11y($('app'));tick();
}

/* ===== Salud: temperatura, pauta del pediatra, citas y vacunas ===== */
/* Calendario sistemático de Andalucía 2026 (Instrucción DGSPyOF-1/2026, andavac.es): hexavalente 2-4-11 · neumococo VNC20 2-4-6-11 · meningococo B 2-4-15 ·
   meningococo ACWY 4 y 12 · rotavirus 2 y 4 · triple vírica 12 m y 2 años · varicela 15 m y 2 años. El id de cada dosis es 'v'+mes (las ya anotadas se conservan). */
const VAC=[[2,'Hexavalente, neumococo, meningococo B y rotavirus'],[4,'Hexavalente, neumococo, meningococo B, meningococo ACWY y rotavirus'],[6,'Neumococo'],[11,'Hexavalente y neumococo'],[12,'Triple vírica y meningococo ACWY'],[15,'Meningococo B y varicela'],[24,'Triple vírica y varicela']];
/* ===== Más: preparativos y stock de pañales ===== */
const ACT={
  cita(){sheet('<h2 style="margin-top:0">Nueva cita</h2><label>Tipo</label><select id="ct2"><option>Vacuna</option><option>Revisión del niño sano</option><option>Otra consulta</option></select><label>Fecha y hora</label><input id="cf2" type="datetime-local"><label>Dudas para el médico</label><input id="cp">',()=>{
    if(!$('cf2').value)return false;cfg.citas=(cfg.citas||[]).concat({id:Date.now().toString(36),t:$('ct2').value,f:$('cf2').value,p:$('cp').value.trim()});saveCfg();render()})},
  cdel(id){cfg.citas=cfg.citas.filter(c=>c.id!==id);saveCfg();render()},
  vac(m){cfg.vd=cfg.vd||{};cfg.vd[m]=!cfg.vd[m];saveCfg();render()},
  prc(id){const x=prep().find(p=>p.id===id);x.s={pend:'comp',comp:'reg',reg:'pend'}[x.s];saveCfg();render()},
  pdel(id){cfg.prep=prep().filter(p=>p.id!==id);saveCfg();render()},
  padd(){const cs=[...new Set([...prep().map(p=>p.c),'Otros'])];sheet('<h2 style="margin-top:0">Nuevo elemento</h2><label>Categoría</label><select id="pc">'+cs.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select><label>Nombre</label><input id="pn">',()=>{
    const n=$('pn').value.trim();if(!n)return false;cfg.prep=prep().concat({id:'p'+Date.now().toString(36),c:$('pc').value,n,s:'pend'});saveCfg();render()})},
  tal(t){cfg.talla=t;saveCfg();render()},
  stk(v){const[t,d]=v.split(':');cfg.stock=cfg.stock||{};cfg.stock[t]=Math.max(0,(cfg.stock[t]||0)+ +d);saveCfg();render()},
  stka(t){sheet('<h2 style="margin-top:0">Añadir pañales de talla '+t+'</h2><label>Cantidad (pack o regalo)</label><input id="sq" type="number" inputmode="numeric">',()=>{
    const q=+$('sq').value;if(!q||q<1)return false;cfg.stock=cfg.stock||{};cfg.stock[t]=(cfg.stock[t]||0)+q;if(!cfg.talla)cfg.talla=t;saveCfg();render()})}
};
$('app').onclick=e=>{const b=e.target.closest('[data-a]');if(b)ACT[b.dataset.a](b.dataset.v)};
