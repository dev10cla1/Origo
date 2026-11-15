/* ===== Fase 5: Salud por módulos y estadísticas ===== */
const MT={ax:'Axilar',oi:'Oído',fr:'Frente',re:'Rectal'};
let sal='cre',regVista='crono',stP=7,stM='ml';
const fh=x=>Math.floor(x+1e-9)+' h '+String(Math.round((x%1)*60)).padStart(2,'0')+' min';
const fdt=t=>new Date(t).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const rowSv=(a,b)=>'<div class="it"><span>'+a+'</span><b>'+b+'</b></div>';

/* --- Medicación (varias pautas, siempre indicadas por el profesional) --- */
function pautas(){if(cfg.pauta&&!cfg.pautas){cfg.pautas=[Object.assign({id:'pa0'},cfg.pauta)];delete cfg.pauta;saveCfg()}if(!cfg.pautas)cfg.pautas=[];return cfg.pautas}
function pautaInfo(id){
  const p=id?pautas().find(x=>x.id===id):pautas()[0];if(!p)return null;
  const n=Date.now(),L=Store.live().filter(e=>e.tipo==='med'&&e.datos.farmaco===p.farmaco),last=L[0],c24=L.filter(e=>n-e.inicio<864e5).length;
  let next=last?last.inicio+p.horas*36e5:0;if(c24>=p.max)next=Math.max(next,L[p.max-1].inicio+864e5);
  return{p,last,c24,next,ok:n>=next};
}
const infos=()=>pautas().map(p=>pautaInfo(p.id));
function vMed(){
  const I=infos(),D=Store.live().filter(e=>e.tipo==='med'),pn=Store.live().find(e=>e.tipo==='medida'&&e.datos.peso);
  let h='<h2>Medicación</h2><div class="mute" style="margin-bottom:8px">ORIGO no calcula dosis: solo guarda la pauta que te indique tu profesional sanitario.</div>';
  I.forEach(i=>{const p=i.p;h+='<div class="card"><div class="row"><b>'+esc(p.farmaco)+(p.conc?' <span class="mute">'+esc(p.conc)+'</span>':'')+'</b><button class="lnk" data-a="pauta" data-v="'+p.id+'">Editar</button></div><div class="mute">'+p.ml+' ml cada '+p.horas+' h como mínimo · máx. '+p.max+' en 24 h'+(p.medico?' · '+esc(p.medico):'')+'</div><div style="margin:6px 0 8px">'+(i.last?'<span class="mute">Última dosis '+fdt(i.last.inicio)+' · '+i.c24+' en 24 h · </span>':'')+(i.ok?'<b style="color:var(--ok)">Se puede dar ahora</b>':'<b style="color:var(--bad)">Próxima a las '+hm(i.next)+'</b>')+'</div>'+(pn&&p.f&&pn.inicio>p.f?'<div class="mute" style="margin-bottom:8px">Hay un peso nuevo desde que se guardó la pauta: confirma con tu pediatra si sigue vigente.</div>':'')+'<button class="sec" style="width:100%" data-a="dosis" data-v="'+p.id+'">Dosis dada</button></div>'});
  h+='<button class="sec" style="width:100%" data-a="pauta">'+(I.length?'Añadir otra pauta':'Añadir pauta del pediatra')+'</button>';
  if(D.length)h+='<h2>Dosis administradas</h2><div class="card" style="padding:2px 14px">'+D.slice(0,15).map(e=>evRow(e,1)).join('')+'</div>';
  return h;
}
/* --- Temperatura --- */
function tempSvg(P){
  const W=340,H=160,pl=34,pr=10,pt=10,pb=22,vs=P.map(e=>+e.datos.c),y0=Math.min(36.5,...vs)-.1,y1=Math.max(38.5,...vs)+.1,x0=P[0].inicio,x1=P[P.length-1].inicio;
  const X=t=>pl+(t-x0)/(x1-x0||1)*(W-pl-pr),Y=v=>H-pb-(v-y0)/(y1-y0)*(H-pb-pt);let g='';
  for(let v=Math.ceil(y0*2)/2;v<=y1;v+=.5)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" stroke="var(--line)"'+(v===38?' stroke-dasharray="4 4" style="stroke:var(--warn)"':'')+'/><text x="'+(pl-4)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end" font-size="11" fill="var(--mute)">'+v.toFixed(1)+'</text>';
  g+='<text x="'+pl+'" y="'+(H-6)+'" font-size="11" fill="var(--mute)">'+new Date(x0).toLocaleDateString('es-ES',{day:'numeric',month:'short'})+'</text><text x="'+(W-pr)+'" y="'+(H-6)+'" text-anchor="end" font-size="11" fill="var(--mute)">'+new Date(x1).toLocaleDateString('es-ES',{day:'numeric',month:'short'})+'</text>';
  g+='<polyline points="'+P.map(e=>X(e.inicio).toFixed(1)+','+Y(+e.datos.c).toFixed(1)).join(' ')+'" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round"/>'+P.map(e=>'<circle cx="'+X(e.inicio).toFixed(1)+'" cy="'+Y(+e.datos.c).toFixed(1)+'" r="3.5" fill="var(--acc)"/>').join('');
  return'<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Evolución de la temperatura">'+g+'</svg><div class="mute">Últimos 7 días. La línea discontinua marca 38 °C.</div>';
}
function vTemp(){
  const T=Store.live().filter(e=>e.tipo==='temp'),n=Date.now();
  let h='<h2>Temperatura</h2><button class="sec" style="width:100%;margin-bottom:10px" data-a="temp">Anotar temperatura</button>';
  if(!T.length)return h+'<div class="card mute" style="text-align:center;padding:22px 14px">Aún no hay temperaturas registradas.</div>';
  const t=T[0],R=T.filter(e=>n-e.inicio<7*864e5).reverse();
  h+='<div class="card"><div class="mute">Última medición</div><div class="val" style="font-size:28px">'+t.datos.c+' °C</div><div class="mute">'+fdt(t.inicio)+(t.datos.m?' · '+MT[t.datos.m]:'')+(t.datos.nota?' · '+esc(t.datos.nota):'')+'</div>'+(t.datos.c>=38&&ageM()<3&&n-t.inicio<864e5?'<div style="color:var(--bad);font-weight:600;margin-top:6px">Menor de 3 meses con fiebre: consulta con su pediatra o urgencias.</div>':'')+'</div>';
  if(R.length>=2)h+='<div class="card">'+tempSvg(R)+'</div>';
  return h+'<h2>Historial</h2><div class="card" style="padding:2px 14px">'+T.slice(0,15).map(e=>evRow(e,1)).join('')+'</div>';
}
/* --- Vacunas (calendario configurable) --- */
function vacList(){
  const nac=cfg.nac?new Date(cfg.nac):null,R=cfg.vacs||{},out=[];
  VAC.forEach(([m,t])=>{const id='v'+m,r=R[id]||(cfg.vd&&cfg.vd[m]?{ok:true}:{});let pv=r.prev||'';if(!pv&&nac){const d=new Date(nac);d.setMonth(d.getMonth()+m);pv=d.toLocaleDateString('sv-SE')}out.push({id,t:(m<24?m+' meses':'2 años')+' · '+t,prev:pv,ok:!!r.ok,real:r.real||'',nota:r.nota||''})});
  (cfg.vacX||[]).forEach(x=>out.push({id:x.id,t:x.t,prev:x.prev||'',ok:!!x.ok,real:x.real||'',nota:x.nota||'',x:1}));
  return out.sort((a,b)=>(a.prev||'9')<(b.prev||'9')?-1:1);
}
function vVac(){
  const V=vacList(),f=d=>new Date(d+'T12:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
  let h='<h2>Vacunas</h2><div class="mute" style="margin-bottom:8px">Calendario oficial de Andalucía 2026. Toca una vacuna para ajustar la fecha prevista o anotar la fecha real. La primera dosis de rotavirus (oral) debe ponerse antes de las 20 semanas de vida. Confirma las pautas con tu centro de salud o en andavac.es.</div>';
  if(!cfg.nac)h+='<div class="card mute">Indica la fecha de nacimiento en Más → Ajustes para calcular las fechas previstas.</div>';
  h+='<div class="card" style="padding:2px 14px">'+V.map(v=>{const late=!v.ok&&v.prev&&new Date(v.prev+'T12:00')<new Date();return'<div class="it ev" data-a="vac" data-v="'+v.id+'"><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:500">'+esc(v.t)+'</div><div class="mute">'+(v.ok?'Administrada'+(v.real?' el '+f(v.real):''):'Prevista: '+(v.prev?f(v.prev):'sin fecha'))+(v.nota?' · '+esc(v.nota):'')+(!v.ok&&vacCita(v.id)?' · en Citas':'')+'</div></div><span class="pill" style="'+(v.ok?'background:var(--t2);color:var(--ok)':late?'background:var(--warnbg);color:var(--warn)':'')+'">'+(v.ok?'Puesta':late?'Revisar':'Pendiente')+'</span></div>'}).join('')+'</div>';
  return h+'<button class="sec" style="width:100%;margin-top:10px" data-a="vacadd">Añadir vacuna</button>';
}
/* --- Citas y preguntas --- */
/* Fecha de una cita; las citas «de día» (vacuna sin hora) no muestran hora */
function citaF(c,lg){const o=lg?{weekday:'long',day:'numeric',month:'long'}:{weekday:'short',day:'numeric',month:'short'};return c.dia?new Date(c.f).toLocaleDateString('es-ES',o):new Date(c.f).toLocaleString('es-ES',Object.assign(o,{hour:'2-digit',minute:'2-digit'}))}
/* Vacuna con fecha → cita médica enlazada (campo vac) */
const vacCita=id=>(cfg.citas||[]).find(c=>c.vac===id);
function vacSync(id,nom,fecha,hora,on){
  cfg.citas=cfg.citas||[];let c=vacCita(id);
  if(!on||!fecha){if(c)cfg.citas=cfg.citas.filter(x=>x!==c);return}
  if(!c){c={id:'cv-'+id,vac:id,t:'Vacuna'};cfg.citas.push(c)}
  c.m=nom;c.f=fecha+'T'+(hora||'23:59');if(hora)delete c.dia;else c.dia=1}
const CTIPOS=['Vacuna','Revisión del niño sano','Urgencias','Especialista','Otra consulta'];
function vCit(){
  const n=Date.now(),C=(cfg.citas||[]).slice().sort((a,b)=>a.f<b.f?-1:1),fu=C.filter(c=>new Date(c.f)>=n-36e5),pa=C.filter(c=>new Date(c.f)<n-36e5).reverse(),Q=cfg.preg||[];
  const row=c=>'<div class="it ev" data-a="cite" data-v="'+c.id+'"><div style="flex:1;min-width:0"><b style="font-size:15px">'+esc(c.t)+(c.m?' · '+esc(c.m):'')+'</b><div class="mute">'+citaF(c)+([c.centro,c.prof].filter(Boolean).length?' · '+esc([c.centro,c.prof].filter(Boolean).join(' · ')):'')+'</div>'+(c.p?'<div class="mute">Preguntar: '+esc(c.p)+'</div>':'')+(c.obs?'<div class="mute">Observaciones: '+esc(c.obs)+'</div>':'')+'</div><span class="mute">›</span></div>';
  let h='<h2>Citas médicas</h2><button class="sec" style="width:100%;margin-bottom:10px" data-a="cita">Añadir cita</button>';
  h+=fu.length?'<div class="card" style="padding:2px 14px">'+fu.map(row).join('')+'</div>':'<div class="card mute" style="text-align:center;padding:18px 14px">No hay citas próximas.</div>';
  h+='<h2>Preguntas para el pediatra</h2><div class="card" style="padding:2px 14px">'+(Q.length?Q.map(x=>'<div class="it"><span data-a="pq" data-v="'+x.id+'" style="flex:1;cursor:pointer'+(x.ok?';opacity:.55;text-decoration:line-through':'')+'">'+esc(x.q)+'</span><button class="lnk" aria-label="Quitar" data-a="pqdel" data-v="'+x.id+'">×</button></div>').join(''):'<div class="mute" style="padding:10px 0">Anota aquí lo que quieras preguntar en la próxima visita.</div>')+'</div><button class="sec" style="width:100%;margin-top:10px" data-a="preg">Añadir pregunta</button><div class="mute" style="margin:6px 2px">Toca una pregunta para marcarla como resuelta.</div>';
  if(pa.length)h+='<h2>Citas anteriores</h2><div class="card" style="padding:2px 14px">'+pa.slice(0,10).map(row).join('')+'</div>';
  return h;
}
function citaForm(c){
  const ts=CTIPOS.includes(c.t)?CTIPOS:CTIPOS.concat(c.t?[c.t]:[]);
  return'<label>Tipo</label><select id="ct2">'+ts.map(t=>'<option'+(t===c.t?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select><label>Motivo</label><input id="cm" value="'+esc(c.m)+'"><label>Fecha y hora</label><input id="cf2" type="datetime-local" value="'+esc(c.f)+'"><label>Centro</label><input id="cc" value="'+esc(c.centro)+'"><label>Profesional</label><input id="cpr" value="'+esc(c.prof)+'"><label>Dudas para esta visita</label><input id="cp" value="'+esc(c.p)+'"><label>Observaciones posteriores</label><textarea id="co">'+esc(c.obs)+'</textarea>';
}
function citaRead(c){if(!$('cf2').value)return false;if(c.dia&&$('cf2').value.slice(11)!=='23:59')delete c.dia;Object.assign(c,{t:$('ct2').value,m:$('cm').value.trim(),f:$('cf2').value,centro:$('cc').value.trim(),prof:$('cpr').value.trim(),p:$('cp').value.trim(),obs:$('co').value.trim()});
  if(c.vac){const d=c.f.slice(0,10),x=(cfg.vacX||[]).find(v=>v.id===c.vac);if(x)x.prev=d;else{cfg.vacs=cfg.vacs||{};cfg.vacs[c.vac]=Object.assign(cfg.vacs[c.vac]||{},{prev:d})}}
  return true}
function histMed(){const M=medidas().reverse();return M.length?'<h2>Historial de mediciones</h2><div class="card" style="padding:2px 14px">'+M.slice(0,15).map(e=>evRow(e,1)).join('')+'</div>':''}
const SG=(a,it,cur,h)=>'<div class="seg'+(h?' h':'')+'">'+it.map(([k,l,i])=>'<button data-a="'+a+'" data-v="'+k+'" class="'+(k==cur?'on':'')+'">'+(i||'')+'<span>'+l+'</span></button>').join('')+'</div>';
const T2=(a,it,cur,fl)=>'<div class="'+(fl?'fl':'t2')+'">'+it.map(([k,l])=>'<button data-a="'+a+'" data-v="'+k+'" class="'+(k==cur?'on':'')+'">'+l+'</button>').join('')+'</div>';
const ISG={jer:I('<path d="M18 2l4 4M20 4l-9 9M15 5l4 4M9.5 10.5l4 4-6 6H3.5v-4z"/>'),cal:I('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),est:I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>')};
const vSalud=()=>'<h1>Salud</h1>'+SG('sal',[['cre','Medidas',IC.medida],['tem','Fiebre',IC.temp],['med','Medicinas',IC.med],['vac','Vacunas',ISG.jer],['cit','Citas',ISG.cal]],sal)+({cre:()=>vCre()+histMed(),tem:vTemp,med:vMed,vac:vVac,cit:vCit})[sal]()+'<button class="sec" style="width:100%;margin-top:14px" data-a="inf">Informe para el pediatra</button>';

/* --- Estadísticas (Registros) --- */
const MET={ml:['Leche'],tomas:['Tomas'],pan:['Pañales'],sue:['Sueño'],sies:['Siestas']};
function dayStats(a){const b=a+864e5,n=Date.now();let ml=0,tomas=0,pan=0,sue=0,sies=0;
  Store.live().forEach(e=>{if(e.tipo==='toma'&&e.inicio>=a&&e.inicio<b){tomas++;ml+=e.datos.ml||0}else if(e.tipo==='panal'&&e.inicio>=a&&e.inicio<b)pan++;else if(e.tipo==='sueno'){const o=Math.min(e.fin||n,b)-Math.max(e.inicio,a);if(o>0)sue+=o;if(e.inicio>=a&&e.inicio<b)sies++}});
  return{ml,tomas,pan,sue:sue/36e5,sies}}
function periodo(off,N){
  const t=Date.now(),B=Store.live().filter(e=>['toma','panal','sueno'].includes(e.tipo)),first=B.length?Math.min(...B.map(e=>e.inicio)):Infinity,days=[];
  for(let i=off+N-1;i>=off;i--){const a=dayStart(t-i*864e5);days.push(Object.assign({a},dayStats(a)))}
  const v=days.filter(d=>d.a+864e5>first),k=v.length||1,S=m=>v.reduce((x,d)=>x+d[m],0)/k;
  return{days,n:v.length,avg:{ml:S('ml'),tomas:S('tomas'),pan:S('pan'),sue:S('sue'),sies:S('sies')}}}
function barSvg(days,m){
  const W=340,H=160,pl=32,pb=22,pt=8,mx=Math.max(...days.map(d=>d[m]),1)*1.1,bw=(W-pl-6)/days.length;let g='';
  for(let i=0;i<=3;i++){const v=mx*i/3,y=H-pb-v/mx*(H-pb-pt);g+='<line x1="'+pl+'" x2="'+(W-6)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="var(--line)"/><text x="'+(pl-4)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="11" fill="var(--mute)">'+(m==='ml'?Math.round(v):Math.round(v*10)/10)+'</text>'}
  days.forEach((d,i)=>{const hh=d[m]/mx*(H-pb-pt),x=pl+i*bw;g+='<rect x="'+(x+bw*.15).toFixed(1)+'" y="'+(H-pb-hh).toFixed(1)+'" width="'+(bw*.7).toFixed(1)+'" height="'+Math.max(hh,0).toFixed(1)+'" rx="3" fill="var(--acc)"'+(i===days.length-1?'':' opacity=".7"')+'/>';
    if(days.length<=7||i%5===4||i===0)g+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="var(--mute)">'+(days.length<=7?new Date(d.a).toLocaleDateString('es-ES',{weekday:'narrow'}).toUpperCase():new Date(d.a).getDate())+'</text>'});
  return'<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Gráfico diario">'+g+'</svg>';
}
function vStats(){
  const N=stP,cur=periodo(0,N),prev=periodo(N,N),F={ml:x=>Math.round(x)+' ml',tomas:fx,pan:fx,sue:fh,sies:fx};
  let h='<div style="height:6px"></div>'+T2('stp',[[1,'Hoy'],[7,'7 días'],[30,'30 días']],N);
  if(!cur.n)return h+'<div class="card mute" style="text-align:center;padding:24px 14px">Aún no hay registros en este periodo.</div>';
  h+='<div class="card"><div class="mute">'+(N===1?'Hoy frente a ayer (hoy aún no ha terminado)':'Media por día · '+cur.n+(cur.n===1?' día':' días')+' con registros')+'</div><table class="rt"><tr><th></th><th>'+(N===1?'Hoy':'Actual')+'</th><th>'+(N===1?'Ayer':'Anterior')+'</th></tr>'+Object.keys(MET).map(m=>'<tr><td>'+MET[m][0]+'</td><td><b>'+F[m](cur.avg[m])+'</b></td><td class="mute">'+(prev.n?F[m](prev.avg[m]):'Sin datos')+'</td></tr>').join('')+'</table></div>';
  if(N>1)h+=''+T2('stm',Object.keys(MET).map(m=>[m,MET[m][0]]),stM,1)+'<div class="card"><div class="mute" style="margin-bottom:4px">'+MET[stM][0]+' por día'+(stM==='sue'?' (horas)':stM==='ml'?' (ml)':'')+'</div>'+barSvg(cur.days,stM)+'<div class="mute">Cada barra es un día; la última es hoy.</div></div>';
  return h+'<div class="mute" style="margin:6px 2px">Estos datos solo resumen lo que has registrado. No indican problemas médicos ni de desarrollo.</div>';
}
function vHis(){
  return'<h1>Registros</h1>'+SG('rv',[['crono','Cronología',ico.his],['stats','Estadísticas',ico.cre]],regVista,1)+(regVista==='stats'?vStats():vCrono());
}

Object.assign(ACT,{
  sal(v){sal=v;render()},rv(v){regVista=v;render()},stp(v){stP=+v;render()},stm(v){stM=v;render()},
  temp(){const lm=(Store.live().find(e=>e.tipo==='temp')||{datos:{}}).datos.m||'ax';sheet('<h2 style="margin-top:0">Temperatura</h2><label>Grados (°C)</label><input id="tc" type="number" step="0.1" inputmode="decimal"><label>Método</label>'+chips('tm',[['ax','Axilar'],['oi','Oído'],['fr','Frente'],['re','Rectal']],lm)+'<label>Síntomas o notas (opcional)</label><input id="tn" placeholder="Ej.: irritable, no quiere comer"><label>Hora</label><input id="hr" type="time" value="'+nowHM()+'">',()=>{
    const c=+$('tc').value;if(!c||c<30||c>43)return false;addEv('temp',{c,m:chipVal('tm'),nota:$('tn').value.trim()},toTs($('hr').value),'Temperatura registrada')})},
  pauta(id){const p=pautas().find(x=>x.id===id)||{};sheet('<h2 style="margin-top:0">Pauta del pediatra</h2><div class="mute" style="margin-bottom:8px">Copia exactamente lo que te indicó. La app no calcula dosis.</div><label>Medicamento</label><input id="pf" value="'+esc(p.farmaco)+'"><label>Concentración</label><input id="pc" placeholder="Ej.: 100 mg/ml" value="'+esc(p.conc)+'"><label>Dosis indicada (ml)</label><input id="pm" type="number" step="0.1" inputmode="decimal" value="'+esc(p.ml)+'"><label>Mínimo de horas entre dosis</label><input id="ph" type="number" inputmode="decimal" value="'+esc(p.horas)+'"><label>Máximo de dosis en 24 h</label><input id="px" type="number" inputmode="numeric" value="'+esc(p.max)+'"><label>Quién la indicó</label><input id="pd" value="'+esc(p.medico)+'">'+(p.id?'<button class="sec bad" style="width:100%;margin:6px 0 10px" data-a="pautadel" data-v="'+p.id+'">Eliminar pauta</button>':''),()=>{
    const q={farmaco:$('pf').value.trim(),conc:$('pc').value.trim(),ml:+$('pm').value,horas:+$('ph').value,max:+$('px').value,medico:$('pd').value.trim(),f:Date.now()};
    if(!q.farmaco||!q.ml||!q.horas||!q.max)return false;
    if(p.id)Object.assign(p,q);else pautas().push(Object.assign({id:'pa'+Math.random().toString(36).slice(2,7)},q));saveCfg();render()})},
  pautadel(id){closeSheet();const P=pautas(),i=P.findIndex(x=>x.id===id),x=P.splice(i,1)[0];saveCfg();render();toast('Pauta eliminada',()=>{P.splice(i,0,x);saveCfg();render()})},
  dosis(id){const P=pautas();if(!P.length)return ACT.pauta();
    if(!id){if(P.length>1)return panel('<h2 style="margin-top:0">¿Qué medicamento?</h2><div class="pg" style="grid-template-columns:1fr">'+P.map(p=>'<button data-a="dosis" data-v="'+p.id+'">'+IC.med+esc(p.farmaco)+'</button>').join('')+'</div>');id=P[0].id}
    closeSheet();const i=pautaInfo(id),go=()=>addEv('med',{farmaco:i.p.farmaco,ml:i.p.ml,conc:i.p.conc},0,'Dosis registrada');
    if(i.ok)go();else sheet('<h2 style="margin-top:0">¿Registrar igualmente?</h2><div class="mute" style="margin-bottom:12px">Según la pauta aún no toca (próxima a las '+hm(i.next)+'). Registra solo si ya se la has dado.</div>',()=>{go()})},
  vac(id){const v=vacList().find(x=>x.id===id),vc=vacCita(id);sheet('<h2 style="margin-top:0">'+esc(v.t)+'</h2><label>Fecha prevista</label><input id="vp" type="date" value="'+esc(v.prev)+'">'+'<label>Hora de la cita (opcional)</label><input id="vh" type="time" value="'+esc(vc&&!vc.dia?vc.f.slice(11,16):'')+'"><label>Añadir a Citas médicas</label>'+chips('vci',[['1','Sí'],['0','No']],v.ok&&!vc?'0':'1')+'<label>Estado</label>'+chips('vs',[['0','Pendiente'],['1','Administrada']],v.ok?'1':'0')+'<label>Fecha real</label><input id="vr" type="date" value="'+esc(v.real)+'"><label>Notas (lote, reacción…)</label><input id="vn" value="'+esc(v.nota)+'">'+(v.x?'<button class="sec bad" style="width:100%;margin:6px 0 10px" data-a="vacdel" data-v="'+id+'">Eliminar vacuna</button>':''),()=>{
    const r={prev:$('vp').value,ok:chipVal('vs')==='1',real:$('vr').value,nota:$('vn').value.trim()};if(r.ok&&!r.real)r.real=dkey(0);
    vacSync(id,v.t,r.prev,$('vh').value,chipVal('vci')==='1');
    if(v.x)Object.assign(cfg.vacX.find(x=>x.id===id),r);else{cfg.vacs=cfg.vacs||{};cfg.vacs[id]=r}saveCfg();render()})},
  vacadd(){sheet('<h2 style="margin-top:0">Añadir vacuna</h2><label>Nombre</label><input id="vnm" placeholder="Ej.: Gripe, bronquiolitis…"><label>Fecha prevista</label><input id="vp" type="date" value="'+dkey(0)+'"><label>Hora de la cita (opcional)</label><input id="vh" type="time"><label>Añadir a Citas médicas</label>'+chips('vci',[['1','Sí'],['0','No']],'1'),()=>{const t=$('vnm').value.trim();if(!t)return false;const id='vx'+Math.random().toString(36).slice(2,7);cfg.vacX=(cfg.vacX||[]).concat({id,t,prev:$('vp').value});vacSync(id,t,$('vp').value,$('vh').value,chipVal('vci')==='1');saveCfg();render()})},
  vacdel(id){closeSheet();cfg.vacX=cfg.vacX.filter(x=>x.id!==id);vacSync(id,'','','',false);saveCfg();render()},
  cita(){const c={t:CTIPOS[1]};sheet('<h2 style="margin-top:0">Nueva cita</h2>'+citaForm(c),()=>{if(!citaRead(c))return false;c.id=Date.now().toString(36);cfg.citas=(cfg.citas||[]).concat(c);saveCfg();render()})},
  cite(id){const c=cfg.citas.find(x=>x.id===id);sheet('<h2 style="margin-top:0">Cita</h2><button class="sec bad" style="width:100%;margin-bottom:12px" data-a="cdel2" data-v="'+id+'">Eliminar cita</button>'+citaForm(c),()=>{if(!citaRead(c))return false;saveCfg();render()})},
  cdel2(id){closeSheet();const C=cfg.citas,i=C.findIndex(x=>x.id===id),x=C.splice(i,1)[0];saveCfg();render();toast('Cita eliminada',()=>{C.splice(i,0,x);saveCfg();render()})},
  preg(){sheet('<h2 style="margin-top:0">Pregunta para el pediatra</h2><input id="pq1" placeholder="Ej.: ¿Cuándo empezamos con el puré?">',()=>{const q=$('pq1').value.trim();if(!q)return false;cfg.preg=(cfg.preg||[]).concat({id:'q'+Date.now().toString(36),q,ok:false});saveCfg();render()})},
  pq(id){const x=cfg.preg.find(y=>y.id===id);x.ok=!x.ok;saveCfg();render()},
  pqdel(id){cfg.preg=cfg.preg.filter(x=>x.id!==id);saveCfg();render()}
});
