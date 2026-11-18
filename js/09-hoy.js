/* ===== Rediseño: Hoy, Registros, Más ===== */
const I=d=>'<svg viewBox="0 0 24 24">'+d+'</svg>';
const IC={toma:I('<path d="M9 3h6M10 3v3h4V3M8 6h8v14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zM8 12h8"/>'),panal:I('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),sueno:I('<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>'),temp:I('<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>'),med:I('<path d="M10.5 20.5l-7-7a4.9 4.9 0 0 1 7-7l7 7a4.9 4.9 0 0 1-7 7zM8.5 8.5l7 7"/>'),medida:I('<path d="M3 20h18M6 16l4-5 4 3 5-7"/>'),alim:I('<path d="M12 21V11M12 11C12 7 9 5 5 5c0 4 2 6 7 6zM12 14c0-3 2-5 6-5 0 4-2 6-6 6z"/>'),momento:I('<path d="M12 21s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>'),prep:I('<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>')};
const GR={toma:'f',alim:'f',comida:'f',panal:'p',sueno:'s',temp:'h',med:'h',medida:'h',momento:'m'};
const LK={formula:'fórmula',materna:'leche materna',pecho:'pecho'},PK={pis:'Pipí',caca:'Caca',ambos:'Pipí y caca',seco:'Seco'};
const LIM=60; /* filas de Registros que se pintan de una vez; «Ver más» suma otras LIM */
let filt='all',dia='',masSub=null,lim=LIM;
const dtl=t=>new Date(t-new Date(t).getTimezoneOffset()*6e4).toISOString().slice(0,16);
function panel(html,lbl){$('sh').innerHTML=html+'<button class="sec" id="shx" style="width:100%;margin-top:8px">'+(lbl||'Cancelar')+'</button>';shOpen();$('shx').onclick=closeSheet}
$('sh').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)ACT[b.dataset.a](b.dataset.v)});
function evInfo(e){const d=e.datos;switch(e.tipo){
  case'toma':return d.leche==='pecho'?['Pecho',[{i:'izquierdo',d:'derecho',a:'ambos'}[d.lado],d.min&&d.min+' min'].filter(Boolean).join(' · ')]:['Biberón',(d.ml?d.ml+' ml · ':'')+(LK[d.leche]||'')];
  case'panal':return[PK[d.k]||'Pañal',''];
  case'sueno':return['Sueño',e.fin?dur(e.fin-e.inicio):'En curso'];
  case'temp':return['Temperatura',d.c+' °C'+(d.m?' · '+MT[d.m]:'')+(d.nota?' · '+esc(d.nota):'')];
  case'med':return['Medicación',esc(d.farmaco)+' · '+d.ml+' ml'];
  case'medida':return['Medidas',[d.peso&&d.peso+' kg',d.talla&&d.talla+' cm',d.pc&&'PC '+d.pc+' cm'].filter(Boolean).join(' · ')];
  case'alim':return['Alimento nuevo',esc(d.n)+' · '+RX[d.r]];
  case'momento':return[(DCAT.find(x=>x[0]===(d.cat||'anec'))||[0,'Momento'])[1],esc(d.t)||'Foto'];
  case'comida':return['Comida · '+(SLN[d.slot]||''),esc(d.t)+(d.acep?' · '+ACEP[d.acep]:'')]}return[e.tipo,'']}
function evRow(e,full,del){const[t,d]=evInfo(e);return'<div class="it ev" data-a="ev" data-v="'+e.id+'"><div class="ic g'+GR[e.tipo]+'">'+IC[e.tipo]+'</div><div style="flex:1;min-width:0"><b style="font-size:15px">'+t+'</b>'+(d?'<div class="mute">'+d+'</div>':'')+'</div><span class="mute" style="text-align:right">'+(full?fdt(e.inicio):hm(e.inicio))+(quien(e)?'<div style="font-size:11px">'+esc(quien(e))+'</div>':'')+'</span>'+(del?'<button class="delb" data-a="elim" data-v="'+e.id+'" aria-label="Eliminar registro"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg></button>':'')+'</div>'}
function ageTxt2(){if(!cfg.nac)return'';const nac=new Date(cfg.nac);if(nac>new Date())return'Faltan '+Math.ceil((nac-Date.now())/864e5)+' días';const m=ageM(),b=new Date(nac);b.setMonth(b.getMonth()+m);const d=Math.max(0,Math.floor((Date.now()-b)/864e5));return m+(m===1?' mes':' meses')+' y '+d+(d===1?' día':' días')}

function pendientes(){
  const n=Date.now(),it=[];
  infos().forEach(i=>{if(i.last&&n-i.last.inicio<864e5)it.push([i.ok?'ok':'warn','Medicación · '+esc(i.p.farmaco),i.ok?'Ya se puede dar otra dosis':'Próxima dosis posible a las '+hm(i.next)])});
  const nq=(cfg.preg||[]).filter(x=>!x.ok).length;if(nq)it.push(['acc','Preguntas para el pediatra',nq+(nq===1?' pregunta pendiente':' preguntas pendientes')]);
  (cfg.citas||[]).filter(c=>{const d=new Date(c.f)-n;return d>-36e5&&d<7*864e5}).sort((a,b)=>a.f<b.f?-1:1).forEach(c=>it.push(['acc',esc(c.t),citaF(c)+(c.p?' · '+esc(c.p):'')]));
  vacList().forEach(v=>{if(v.ok||!v.prev||vacCita(v.id))return;const d=new Date(v.prev+'T12:00'),df=(d-n)/864e5;if(df<30&&df>-60)it.push([df<0?'warn':'acc','Vacuna · '+esc(v.t),(df<0?'Fecha prevista pasada (':'Prevista el ')+d.toLocaleDateString('es-ES',{day:'numeric',month:'short'})+(df<0?')':'')])});
  const mn=(cfg.menu||{})[dkey(0)];if(mn&&Object.keys(mn).length)it.push(['mint','Menú de hoy',SL.filter(([k])=>mn[k]).map(([k,l])=>l+': '+esc(mn[k])).join(' · ')]);
  if(cfg.talla&&cfg.stock&&(cfg.stock[cfg.talla]||0)<=10)it.push(['warn','Pañales talla '+cfg.talla,'Quedan '+(cfg.stock[cfg.talla]||0)+' unidades']);
  if(!it.length)return'';
  return'<h2>Pendientes</h2><div class="card" style="padding:4px 14px">'+it.map(([c,t,d])=>'<div class="it" style="justify-content:flex-start"><div class="dot" style="background:var(--'+({ok:'ok',warn:'warn',mint:'mint'}[c]||'acc')+')"></div><div style="flex:1"><b style="font-size:15px">'+t+'</b><div class="mute">'+d+'</div></div></div>').join('')+'</div>';
}
/* Embarazo: cfg.emb=true mientras la fecha de cfg.nac (prevista) no se confirme con «Ya ha nacido».
   Así, si se pasa la fecha prevista, la app no cambia sola al modo bebé. Sin cfg.emb (datos antiguos), una fecha pasada = nacido. */
const nacFut=()=>!!cfg.nac&&new Date(cfg.nac+'T00:00')>new Date();
const nacido=()=>{if(nacFut()&&!cfg.emb){cfg.emb=true;saveCfg()}return!cfg.nac||(!cfg.emb&&!nacFut())};
const diasParto=()=>Math.ceil((new Date(cfg.nac+'T00:00')-Date.now())/864e5);
const semGest=()=>{const d=diasParto();return Math.min(42,Math.max(4,d>0?40-Math.ceil(d/7):40+Math.floor(-d/7)))};
function vEmb(){
  const hr=new Date().getHours(),sal=hr<6||hr>=21?'Buenas noches':hr<13?'Buenos días':'Buenas tardes',nom=cfg.nombre||'Bebé',d=diasParto(),sem=semGest(),tri=sem<=13?1:sem<=27?2:3,
    tips=['Apunta las dudas que te vayan surgiendo para llevarlas a las consultas.','Buen momento para ir revisando la lista de preparativos y marcar lo que ya tienes.','Ve preparando la bolsa del hospital, instala la silla del coche y ten a mano la tarjeta sanitaria.'],
    P=prep(),act=P.filter(x=>x.s!=='no'),ok=act.filter(x=>x.s==='comp'||x.s==='reg'),pct=act.length?Math.round(ok.length/act.length*100):0,
    ci=(cfg.citas||[]).filter(c=>new Date(c.f)-Date.now()>=7*864e5).sort((a,b)=>a.f<b.f?-1:1)[0],L=Store.live();
  return'<div class="eb">'+hTop(nom,d>1?'Faltan '+d+' días':d===1?'Falta 1 día':'Ya es la fecha prevista',true)+'</section><div class="hsp"></div>'+
  '<div class="card hero emb st-like" data-a="menu"><div class="row"><div style="font-weight:600">Semana '+sem+' · '+['primer','segundo','tercer'][tri-1]+' trimestre</div><span class="stm">Menú<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></div>'+
  '<div class="bar" style="margin-top:10px"><i style="width:'+Math.round(sem/40*100)+'%"></i></div><div class="mute" style="margin-top:4px">'+(sem<=40?sem+' de 40 semanas · aproximado':'Pasada la fecha prevista')+'</div>'+
  '<div class="tip">'+tips[tri-1]+'</div></div>'+
  '<div class="card"><div class="row"><b>Preparativos</b><span class="mute">'+ok.length+' de '+act.length+' hechos</span></div><div class="bar"><i style="width:'+pct+'%;background:var(--ok)"></i></div><button class="sec" style="width:100%;margin-top:10px" data-a="prepir">Ver preparativos</button></div>'+
  (ci?'<div class="card"><div class="mute">Próxima cita</div><b>'+esc(ci.t)+'</b><div class="mute">'+citaF(ci,1)+(ci.p?' · '+esc(ci.p):'')+'</div></div>':'')+
  '<button class="sec" style="width:100%;padding:14px'+(d<1?';background:var(--acc);color:var(--on)':'')+'" data-a="nacio">Ya ha nacido</button></div>'+
  (L.length?'<div class="row"><h2>Actividad reciente</h2><button class="lnk" data-a="tab" data-v="his">Ver todo ›</button></div><div class="card" style="padding:2px 14px">'+L.slice(0,4).map(e=>evRow(e,false,true)).join('')+'</div>':'')+pendientes();
}

/* ===== Escena de Hoy: cabecera, nombre, tarjeta de estado y botones grandes ===== */
const IQ={toma:'<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(16 24 24)"><rect x="20" y="2" width="8" height="8" rx="4" fill="#e3f8f1"/><rect x="16.5" y="8.5" width="15" height="6" rx="2.5" fill="#6fd3b4"/><rect x="15" y="14" width="18" height="31" rx="6.5" fill="#eafbf5"/><path d="M15 31h18v7.5a6.5 6.5 0 0 1-6.5 6.5h-5A6.5 6.5 0 0 1 15 38.5z" fill="#bdeedd"/><path d="M19 21h5M19 26h5M19 31h5" stroke="#5fc7a8" stroke-width="2.4" stroke-linecap="round"/></g></svg>',
 panal:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 15h38v6c0 11.5-8.5 20-19 20S5 32.5 5 21z" fill="#f5fbfd"/><rect x="4" y="10" width="40" height="8" rx="3.5" fill="#7fdcc0"/><path d="M10.5 22.5c4 2.2 6.8 6.8 7 13M37.5 22.5c-4 2.2-6.8 6.8-7 13" stroke="#5fc7a8" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="21" y="12" width="6" height="4" rx="2" fill="#e3f8f1"/></svg>',
 sueno:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M29 5a19 19 0 1 0 14 27A16 16 0 0 1 29 5z" fill="#f7c97f"/></svg>',
 sol:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="9.5" fill="#f7d77f"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M38.1 9.9l-4.2 4.2M14.1 33.9l-4.2 4.2" stroke="#f7d77f" stroke-width="3.2" stroke-linecap="round"/></svg>'};
const GEAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.9h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM12.9 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" fill-rule="evenodd"/></svg>';
function hTop(nom,sub,emb){return'<section class="hx'+(emb?' emb':'')+'"><div class="htop"><div class="hb"><img src="'+MARK_SRC+'" height="40" alt="Origo"><img src="'+WORD_SRC+'" height="18" alt="" aria-hidden="true"></div><button class="gear" data-a="menu" aria-label="Menú">'+MENUI+'</button></div><div class="hn"><div class="nm">'+esc(nom)+'</div><div class="ag"'+(emb?' id="cd"':'')+'>'+sub+'</div></div>'}
function vHoy(){
  if(!nacido())return vEmb();
  const s=state(),n=Date.now(),hr=new Date().getHours(),sal=hr<6||hr>=21?'Buenas noches':hr<13?'Buenos días':'Buenas tardes',nom=cfg.nombre||'Bebé',t0=dayStart();
  const pis=s.pan.filter(e=>e.datos.k==='pis'||e.datos.k==='ambos').length,caca=s.pan.filter(e=>e.datos.k==='caca'||e.datos.k==='ambos').length;
  const ml=s.tomasHoy.reduce((a,e)=>a+(e.datos.ml||0),0),sl=s.L.filter(e=>e.tipo==='sueno'&&(e.fin||n)>t0),sm=sl.reduce((a,e)=>a+(e.fin||n)-Math.max(e.inicio,t0),0);
  const pd=s.lastPan?PK[s.lastPan.datos.k]:'',td=s.last?evInfo(s.last)[1]:'';
  return hTop(nom,ageTxt2())+'<div class="hsp"></div>'+
  '<div class="st" data-a="menu" role="button" aria-label="Abrir menú"><div class="row"><span class="stl"><i class="sd" id="sd"></i><span id="wkl">Estado</span></span><span class="stm">Menú<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></div><div class="stv" id="wk">—</div><div class="bar"><i id="wbar"></i></div><div class="sth" id="wkh"></div>'+
  '<div class="stf"><span>Toma <b id="ago">'+(s.last?'—':'sin registros')+'</b></span><span>Pañal <b id="pago">'+(s.lastPan?'—':'sin registros')+'</b></span></div></div>'+
  '<div class="qk"><button id="bT">'+IQ.toma+'Toma</button><button id="bP">'+IQ.panal+'Pañal</button><button id="bS" class="'+(s.S?'run':'')+'"><span id="bSi">'+(s.S?IQ.sol:IQ.sueno)+'</span><span id="bSt">'+(s.S?'Despertó':'Sueño')+'</span></button></div></section>'+
  '<div class="hacc"><button data-a="otros">Más registros</button><button data-a="resumen">Resumen</button></div>'+
  '<h2>Resumen del día</h2><div class="card sum"><div><b>'+s.tomasHoy.length+'</b><span class="mute">'+(ml?ml+' ml':'tomas')+'</span></div><div><b>'+s.pan.length+'</b><span class="mute">'+(s.pan.length?pis+' pipí · '+caca+' caca':'pañales')+'</span></div><div><b>'+(sm?dur(sm).replace(' min','m').replace(' h ','h '):'0')+'</b><span class="mute">'+sl.length+(sl.length===1?' siesta':' siestas')+'</span></div></div>'+
  '<div class="row"><h2>Actividad reciente</h2><button class="lnk" data-a="tab" data-v="his">Ver todo ›</button></div>'+
  (s.L.length?'<div class="card" style="padding:2px 14px">'+s.L.slice(0,4).map(e=>evRow(e,false,true)).join('')+'</div>':'<div class="card mute" style="text-align:center;padding:20px 14px">Aún no hay registros. Usa los botones de arriba para empezar.</div>')+pendientes();
}
const FIL={f:['toma','alim','comida'],p:['panal'],s:['sueno'],h:['temp','med','medida']};
/* Franja de un día (k = 'AAAA-MM-DD'): devuelve [html, resumen en texto]. El sueño que cruza la medianoche se reparte entre los dos días. */
function franja(k){
  const a=new Date(k+'T00:00').getTime(),b=a+864e5,n=Date.now(),pc=t=>(Math.max(0,Math.min(1,(t-a)/864e5))*100).toFixed(2);let h='',sm=0,nt=0,np=0;
  const D=Store.dias(),sue=e=>{const f=e.fin||n;if(f>a&&e.inicio<b){const x=Math.max(e.inicio,a),y=Math.min(f,b);if(y>x){sm+=y-x;h+='<i class="fs" style="left:'+pc(x)+'%;width:'+((y-x)/864e5*100).toFixed(2)+'%"></i>'}}};
  /* Solo los registros de ese día (mapa por día) y los sueños que vienen de días anteriores (D.g, ya ordenados del más reciente al más antiguo) */
  (D.get(k)||[]).forEach(e=>{
    if(e.tipo==='sueno')sue(e);
    else if(e.inicio>=a&&e.inicio<b){if(e.tipo==='toma'){nt++;h+='<i class="ft" style="left:'+pc(e.inicio)+'%"></i>'}else if(e.tipo==='panal'){np++;h+='<i class="fp" style="left:'+pc(e.inicio)+'%"></i>'}}});
  D.g.forEach(e=>{if(e.inicio<a)sue(e)});
  if(!sm&&!nt&&!np)return['',''];
  if(n>a&&n<b)h+='<i class="fn" style="left:'+pc(n)+'%"></i>';
  const tx=[sm?'Sueño '+dur(sm).replace(' min','').replace(' h ',' h ')+(sm<36e5?' min':''):'',nt?nt+(nt===1?' toma':' tomas'):'',np?np+(np===1?' pañal':' pañales'):''].filter(Boolean).join(' · ');
  return['<div class="fj" role="img" aria-label="Día en 24 horas: '+tx+'">'+h+'</div><div class="fjx" aria-hidden="true"><span>0 h</span><span>6</span><span>12</span><span>18</span><span>24</span></div>',tx]}
function vCrono(){
  let L=dia?Store.dias().get(dia)||[]:Store.live();if(filt!=='all')L=L.filter(e=>FIL[filt].includes(e.tipo));
  const tot=L.length,mas=!dia&&tot>lim;if(!dia)L=L.slice(0,lim); /* un día se pinta entero; la lista general, por tramos */
  let h='<div style="height:8px"></div>'+T2('filt',[['all','Todo'],['f','Alimentación'],['p','Pañales'],['s','Sueño'],['h','Salud']],filt,1)+'<div class="row" style="align-items:flex-end"><label style="flex:1">Ver un día<input id="hd" type="date" value="'+dia+'" style="margin:4px 0 0"></label>'+(dia?'<button class="sec" data-a="hdclr" style="margin-bottom:0">Ver todo</button>':'')+'</div>';
  if(!L.length)return h+'<div class="card mute" style="text-align:center;padding:24px 14px;margin-top:12px">'+(dia||filt!=='all'?'No hay registros con este filtro.':'Aún no hay registros. Empieza desde Hoy.')+'</div>';
  const hoy=dkey(0),ayer=dkey(-1);let cur='',open=false;
  h+='<div class="fjl" aria-hidden="true"><span><i class="fs"></i>Sueño</span><span><i class="ft"></i>Toma</span><span><i class="fp"></i>Pañal</span></div>';
  L.forEach(e=>{const k=new Date(e.inicio).toLocaleDateString('sv-SE');if(k!==cur){if(open)h+='</div>';cur=k;open=true;const fj=franja(k);h+='<div class="day"><span>'+(k===hoy?'Hoy':k===ayer?'Ayer':new Date(e.inicio).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}))+'</span><span class="dsm">'+fj[1]+'</span></div>'+fj[0]+'<div class="card" style="padding:2px 14px">'}h+=evRow(e)});
  return h+(open?'</div>':'')+(mas?'<button class="sec" data-a="crmas" style="width:100%;margin-top:12px">Ver más</button><div class="mute" style="text-align:center;margin-top:6px;font-size:13px">'+lim+' de '+tot+' registros</div>':'');
}
ico.mas='<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>';ico.pan=IC.panal;
/* Campos de una toma: solo se ve lo que aplica (cantidad para biberón; lado y minutos para pecho) */
function tomaCampos(d){const l=d.leche||'formula',p=l==='pecho';
  return chips('lt',[['formula','Biberón fórmula'],['materna','Biberón materna'],['pecho','Pecho']],l)+
  '<div id="tml"'+(p?' hidden':'')+'><label for="ml">Cantidad (ml)</label><div class="stp"><button type="button" data-a="mlpm" data-v="-10" aria-label="Quitar 10 ml">−10</button><input id="ml" type="number" inputmode="numeric" value="'+esc(d.ml||'')+'"><button type="button" data-a="mlpm" data-v="10" aria-label="Añadir 10 ml">+10</button></div></div>'+
  '<div id="tpe"'+(p?'':' hidden')+'><label>Lado</label>'+chips('ld',[['i','Izquierdo'],['d','Derecho'],['a','Ambos']],d.lado||'')+'<label for="mn">Minutos (opcional)</label><input id="mn" type="number" inputmode="numeric" value="'+esc(d.min||'')+'"></div>'}
function tomaLee(){const l=chipVal('lt')||'formula',d={ml:l==='pecho'?0:(+$('ml').value||0),leche:l};if(l==='pecho'){d.lado=chipVal('ld');d.min=+$('mn').value||0}return d}
function sheetToma(){sheet('<h2 style="margin-top:0">Toma</h2>'+tomaCampos({leche:lastLeche(),ml:lastMl()})+'<label for="hr">Hora</label><input id="hr" type="time" value="'+nowHM()+'">',()=>{
  addEv('toma',tomaLee(),toTs($('hr').value),'Toma registrada')})}
function panelPanal(){panel('<h2 style="margin-top:0">Pañal</h2><div class="pg">'+[['pis','Pipí'],['caca','Caca'],['ambos','Ambos'],['seco','Seco']].map(([k,l])=>'<button data-a="pn" data-v="'+k+'">'+IC.panal+l+'</button>').join('')+'</div>')}
const MENU=[['his','Registros',ico.his],['stats','Estadísticas',ico.cre],['cre','Salud',IC.temp],['pan','Pañales',IC.panal],['prep','Preparativos',IC.prep],['des','Desarrollo',IC.alim],['resumen','Resumen del día',IC.momento],['aju','Ajustes',ico.aju]];
window.addEventListener('popstate',e=>{
  const gastada=atSh;atSh=!!(e.state&&e.state.sh);
  if(Sync.gate)return;
  if($('ov').style.display==='flex'){closeSheet();return}
  if(gastada){history.back();return}
  if(tab!=='hoy'&&!(e.state&&e.state.sub)){tab='hoy';masSub=null;render();window.scrollTo(0,0)}});
Object.assign(ACT,{
  menu(){const cur=tab==='his'?(regVista==='stats'?'stats':'his'):tab==='cre'?'cre':tab==='mas'?masSub:'';
    panel('<h2 style="margin-top:0">Menú</h2><div class="pg mn">'+MENU.map(([k,l,i])=>'<button data-a="'+(k==='resumen'?'resumen':'ir')+'" data-v="'+k+'"'+(k===cur?' class="on" aria-current="page"':'')+'>'+i+l+'</button>').join('')+'</div>','Cerrar')},
  mlpm(v){const i=$('ml');if(i)i.value=Math.max(0,(+i.value||0)+ +v)},
  ir(v){closeSheet();if(v==='his'||v==='stats'){tab='his';lim=LIM;regVista=v==='stats'?'stats':'crono'}else if(v==='cre')tab='cre';else{tab='mas';masSub=v}render();window.scrollTo(0,0)},
  inicio(){if(history.state&&history.state.sub)history.back();else{tab='hoy';masSub=null;render();window.scrollTo(0,0)}},
  tab(v){tab=v;render();window.scrollTo(0,0)},
  mas(v){masSub=v;render();window.scrollTo(0,0)},
  mback(){masSub=null;render()},
  perfil(){tab='mas';masSub='aju';render();window.scrollTo(0,0)},
  filt(v){filt=v;lim=LIM;render()},
  hdclr(){dia='';lim=LIM;render()},
  crmas(){lim+=LIM;render()},
  sue(v){closeSheet();if(v==='ahora')toggleSueno();else sheetSuenoHora()},
  prepir(){tab='mas';masSub='prep';render();window.scrollTo(0,0)},
  nacio(){sheet('<h2 style="margin-top:0">Ya ha nacido</h2><label>Fecha de nacimiento</label><input id="nf" type="date" max="'+new Date().toLocaleDateString('sv-SE')+'" value="'+new Date().toLocaleDateString('sv-SE')+'">',()=>{
    const v=$('nf').value;if(!v||v>new Date().toLocaleDateString('sv-SE'))return false;cfg.nac=v;delete cfg.emb;saveCfg();render();toast('¡Enhorabuena! Ya puedes registrar tomas, pañales y sueño.',null)})},
  pn(k){closeSheet();addEv('panal',{k},0,'Pañal registrado: '+PK[k].toLowerCase())},
  elim(id){closeSheet();Store.patch(id,{borrado:true});toast('Registro eliminado',()=>Store.patch(id,{borrado:false}))},
  otros(){panel('<h2 style="margin-top:0">Más registros</h2><div class="pg"><button data-a="temp">'+IC.temp+'Temperatura</button><button data-a="'+(pautas().length?'dosis':'pauta')+'">'+IC.med+(pautas().length?'Medicación':'Añadir pauta')+'</button><button data-a="medidas">'+IC.medida+'Peso y medidas</button><button data-a="ali">'+IC.alim+'Alimento nuevo</button><button data-a="mom">'+IC.momento+'Momento</button><button data-a="tab" data-v="cre">'+IC.medida+'Salud</button></div>')},
  medidas(){sheet('<h2 style="margin-top:0">Medidas</h2><label>Peso (kg)</label><input id="mp" type="number" step="0.01" inputmode="decimal"><label>Talla (cm)</label><input id="mt" type="number" step="0.1" inputmode="decimal"><label>Perímetro craneal (cm)</label><input id="mc" type="number" step="0.1" inputmode="decimal"><label>Fecha</label><input id="md" type="date" value="'+new Date().toISOString().slice(0,10)+'">',()=>{
    const d={peso:+$('mp').value||null,talla:+$('mt').value||null,pc:+$('mc').value||null};
    if(!d.peso&&!d.talla&&!d.pc)return false;
    const e=Store.add({tipo:'medida',inicio:new Date($('md').value+'T12:00').getTime(),fin:null,datos:d});toast('Medidas guardadas',()=>Store.patch(e.id,{borrado:true}))});},
  resumen(){
    const s=state(),n=Date.now(),t24=n-864e5,sl=s.L.filter(e=>e.tipo==='sueno'&&e.fin&&e.fin>t24),tot=sl.reduce((a,e)=>a+e.fin-Math.max(e.inicio,t24),0),T=s.L.find(e=>e.tipo==='temp'),mo=s.L.find(e=>e.tipo==='momento'||(e.tipo==='alim'&&e.datos.nota)),ci=(cfg.citas||[]).filter(c=>new Date(c.f)>n).sort((a,b)=>a.f<b.f?-1:1)[0];
    const row=(a,b)=>'<div class="it"><span>'+a+'</span><span class="mute" style="text-align:right;max-width:62%">'+b+'</span></div>';
    panel('<h2 style="margin-top:0">Resumen de '+esc(cfg.nombre||'Bebé')+'</h2><div class="mute">Con los registros de ORIGO a las '+hm(n)+'</div>'+
      porHoy(s.L)+row('Última toma',s.last?hm(s.last.inicio)+' · hace '+dur(n-s.last.inicio)+(s.last.datos.ml?' · '+s.last.datos.ml+' ml':'')+porTxt(s.last):'Sin registros')+
      row('Último pañal',s.lastPan?hm(s.lastPan.inicio)+' · '+PK[s.lastPan.datos.k]+porTxt(s.lastPan):'Sin registros')+
      row('Último sueño',s.S?'Durmiendo desde las '+hm(s.S.inicio)+porTxt(s.S):s.lastSleep?hm(s.lastSleep.inicio)+'–'+hm(s.lastSleep.fin)+' ('+dur(s.lastSleep.fin-s.lastSleep.inicio)+')'+porTxt(s.lastSleep):'Sin registros')+
      row('Descanso en 24 h',sl.length?dur(tot)+' en '+sl.length+(sl.length===1?' periodo':' periodos'):'Sin registros')+
      (T?row('Última temperatura',T.datos.c+' °C · '+new Date(T.inicio).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})):'')+
      infos().filter(i=>i.last).map(i=>row('Medicación · '+esc(i.p.farmaco),i.ok?'Se puede dar otra dosis':'Próxima a las '+hm(i.next))).join('')+
      (mo?row('Última nota',esc(mo.tipo==='momento'?mo.datos.t:mo.datos.n+': '+mo.datos.nota)):'')+
      (ci?row('Próxima cita',esc(ci.t)+' · '+citaF(ci)):''),'Cerrar')},
  ev(id){
    const e=Store.ev.find(x=>x.id===id),t=e.tipo,d=e.datos,H='<label>Hora</label><input id="eh" type="datetime-local" value="'+dtl(e.inicio)+'">',del='<button class="sec bad" style="width:100%;margin-bottom:12px" data-a="elim" data-v="'+id+'">Eliminar registro</button>';
    let f=H,save=()=>{};
    if(t==='toma'){f=tomaCampos(d)+H;save=()=>{const q=tomaLee();if(q.leche!=='pecho'){delete d.lado;delete d.min}Object.assign(d,q)}}
    else if(t==='panal'){f=chips('pk',[['pis','Pipí'],['caca','Caca'],['ambos','Ambos'],['seco','Seco']],d.k)+H;save=()=>{d.k=chipVal('pk')||d.k}}
    else if(t==='sueno')f=H+'<label>Fin</label><input id="ef" type="datetime-local" value="'+(e.fin?dtl(e.fin):'')+'"><div class="mute" style="margin:-4px 0 10px">Déjalo vacío si sigue durmiendo.</div>';
    else if(t==='temp'){f='<label>Grados (°C)</label><input id="tc" type="number" step="0.1" inputmode="decimal" value="'+esc(d.c)+'"><label>Método</label>'+chips('tm',[['ax','Axilar'],['oi','Oído'],['fr','Frente'],['re','Rectal']],d.m||'')+'<label>Síntomas o notas</label><input id="tn" value="'+esc(d.nota)+'">'+H;save=()=>{d.c=+$('tc').value||d.c;d.m=chipVal('tm')||d.m;d.nota=$('tn').value.trim()}}
    else if(t==='med'){f='<label>Dosis (ml)</label><input id="md1" type="number" step="0.1" inputmode="decimal" value="'+esc(d.ml)+'">'+H;save=()=>{d.ml=+$('md1').value||d.ml}}
    else if(t==='medida'){f='<label>Peso (kg)</label><input id="mp" type="number" step="0.01" inputmode="decimal" value="'+esc(d.peso)+'"><label>Talla (cm)</label><input id="mtl" type="number" step="0.1" inputmode="decimal" value="'+esc(d.talla)+'"><label>Perímetro craneal (cm)</label><input id="mc" type="number" step="0.1" inputmode="decimal" value="'+esc(d.pc)+'">'+H;save=()=>{d.peso=+$('mp').value||null;d.talla=+$('mtl').value||null;d.pc=+$('mc').value||null}}
    else if(t==='momento'){pendFoto=null;f=chips('mcat',DCAT,d.cat||'anec')+'<label>Texto</label><textarea id="mt">'+esc(d.t)+'</textarea>'+(d.foto&&FOT[d.foto]?'<img src="'+FOT[d.foto]+'" alt="" style="width:100%;border-radius:12px;margin-bottom:8px"><button class="sec bad" style="width:100%;margin-bottom:10px" data-a="fotodel" data-v="'+id+'">Quitar foto</button>':'<label>Foto (opcional)</label><input id="mfo" type="file" accept="image/*"><div id="mfp"></div>')+H;save=()=>{d.t=$('mt').value.trim();d.cat=chipVal('mcat')||d.cat;if(pendFoto){const fid='f'+Date.now().toString(36);FOT[fid]=pendFoto;if(saveFot())d.foto=fid;else{delete FOT[fid];toast('No hay espacio para más fotos',null)}}}}
    sheet('<h2 style="margin-top:0">'+evInfo(e)[0]+'</h2>'+(quien(e)?'<div class="mute" style="margin:-6px 0 10px">Registrado por '+esc(quien(e))+'</div>':'')+del+f,()=>{
      const ini=new Date($('eh').value).getTime();if(!ini)return false;let fin=e.fin;
      if(t==='sueno'){const v=$('ef').value;fin=v?new Date(v).getTime():null;if(fin&&fin<ini)return false}
      save();Store.patch(id,{inicio:ini,fin,datos:d})})}
});
