/* ===== Curvas de crecimiento OMS 2006 (0-24 meses) =====
   Peso: [L,M,S] por mes. Talla y perímetro craneal: [M,S] por mes (L=1).
   Fuente: parámetros LMS publicados de los estándares de la OMS. Orientativo. */
const OMS={
m:{w:[.3487,3.3464,.14602,.2297,4.4709,.13395,.197,5.5675,.12385,.1738,6.3762,.11727,.1553,7.0023,.11316,.1395,7.5105,.1108,.1257,7.934,.10958,.1134,8.297,.10902,.1021,8.6151,.10882,.0917,8.9014,.10881,.082,9.1649,.10891,.073,9.4122,.10906,.0644,9.6479,.10925,.0563,9.8749,.10949,.0487,10.0953,.10976,.0413,10.3108,.11007,.0343,10.5228,.11041,.0275,10.7319,.11079,.0211,10.9385,.11119,.0148,11.143,.11164,.0087,11.3462,.11211,.0029,11.5486,.11261,-.0028,11.7504,.11314,-.0083,11.9514,.11369,-.0137,12.1515,.11426],
 l:[49.8842,.03795,54.7244,.03557,58.4249,.03424,61.4292,.03328,63.886,.03257,65.9026,.03204,67.6236,.03165,69.1645,.03139,70.5994,.03124,71.9687,.03117,73.2812,.03118,74.5388,.03125,75.7488,.03137,76.9186,.03154,78.0497,.03174,79.1458,.03197,80.2113,.03222,81.2487,.0325,82.2587,.03279,83.2418,.0331,84.1996,.03342,85.1348,.03376,86.0477,.0341,86.941,.03445,87.8161,.03479],
 c:[34.4618,.03686,37.2759,.03133,39.1285,.02997,40.5135,.02918,41.6317,.02868,42.5576,.02837,43.3306,.02817,43.9803,.02804,44.53,.02796,44.9998,.02792,45.4051,.0279,45.7573,.02789,46.0661,.02789,46.3395,.02789,46.5844,.02791,46.806,.02792,47.0088,.02795,47.1962,.02797,47.3711,.028,47.5357,.02803,47.6919,.02806,47.8408,.0281,47.9833,.02813,48.1201,.02817,48.2515,.02821]},
f:{w:[.3809,3.2322,.14171,.1714,4.1873,.13724,.0962,5.1282,.13,.0402,5.8458,.12619,-.005,6.4237,.12402,-.043,6.8985,.12274,-.0756,7.297,.12204,-.1039,7.6422,.12178,-.1288,7.9487,.12181,-.1507,8.2254,.12199,-.17,8.48,.12223,-.1872,8.7192,.12247,-.2024,8.9481,.12268,-.2158,9.1699,.12283,-.2278,9.387,.12294,-.2384,9.6008,.12299,-.2478,9.8124,.12303,-.2562,10.0226,.12306,-.2637,10.2315,.12309,-.2703,10.4393,.12315,-.2762,10.6464,.12323,-.2815,10.8534,.12335,-.2862,11.0608,.1235,-.2903,11.2688,.12369,-.2941,11.4775,.1239],
 l:[49.1477,.0379,53.6872,.0364,57.0673,.03568,59.8029,.0352,62.0899,.03486,64.0301,.03463,65.7311,.03448,67.2873,.03441,68.7498,.0344,70.1435,.03444,71.4818,.03452,72.771,.03464,74.015,.03479,75.2176,.03496,76.3817,.03514,77.5099,.03534,78.6055,.03555,79.671,.03576,80.7079,.03598,81.7182,.0362,82.7036,.03643,83.6654,.03666,84.604,.03688,85.5202,.03711,86.4153,.03734],
 c:[33.8787,.03496,36.5463,.0321,38.2521,.03168,39.5328,.0314,40.5817,.03119,41.459,.03102,42.1995,.03087,42.829,.03075,43.3671,.03063,43.83,.03053,44.2319,.03044,44.5844,.03035,44.8965,.03027,45.1752,.03019,45.4265,.03012,45.6551,.03006,45.865,.02999,46.0598,.02993,46.2424,.02987,46.4152,.02982,46.5801,.02977,46.7384,.02972,46.8913,.02967,47.0391,.02962,47.1822,.02957]}};
let curva='w',repD=7;
const KEY={w:'peso',l:'talla',c:'pc'},UN={w:'kg',l:'cm',c:'cm'},NOM={w:'Peso',l:'Talla',c:'Perímetro craneal'};
const mesesDe=t=>(t-new Date(cfg.nac).getTime())/(30.4375*864e5);
function lms(sx,k,m){
  const d=OMS[sx][k],n=k==='w'?3:2,i=Math.min(Math.max(Math.floor(m),0),23),f=Math.min(Math.max(m,0),24)-i;
  const g=j=>k==='w'?[d[j*n],d[j*n+1],d[j*n+2]]:[1,d[j*n],d[j*n+1]];
  const a=g(i),b=g(i+1);return a.map((v,x)=>v+(b[x]-v)*f);
}
const zOf=(x,L,M,S)=>(Math.pow(x/M,L)-1)/(L*S);
const valZ=(z,L,M,S)=>M*Math.pow(1+L*S*z,1/L);
const cdf=z=>{const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),q=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-q:q};
function pctOf(k,x,t){if(!cfg.sexo||!cfg.nac)return null;const m=mesesDe(t);if(m<0||m>24)return null;const[L,M,S]=lms(cfg.sexo,k,m),z=zOf(x,L,M,S);return{z,p:cdf(z)*100}}
const pTxt=r=>r?'P'+(r.p<1?'<1':r.p>99?'>99':Math.round(r.p))+(Math.abs(r.z)>1.881?' · fuera de P3–P97: coméntalo con tu pediatra':''):'';
function curvaSvg(k,P){
  const W=340,H=200,pl=36,pr=10,pt=10,pb=24,key=KEY[k],sx=cfg.sexo;
  const ult=Math.max(...P.map(e=>mesesDe(e.inicio))),xm=Math.min(24,Math.max(6,Math.ceil(ult)+2));
  const zs=[[-1.881,'4 4'],[-1.036,'2 3'],[0,''],[1.036,'2 3'],[1.881,'4 4']];
  const cur=zs.map(([z])=>{const a=[];for(let m=0;m<=xm;m+=.5){const[L,M,S]=lms(sx,k,m);a.push([m,valZ(z,L,M,S)])}return a});
  const vs=cur.flat().map(p=>p[1]).concat(P.map(e=>+e.datos[key]));
  let y0=Math.min(...vs),y1=Math.max(...vs);const pd=(y1-y0)*.04;y0-=pd;y1+=pd;
  const X=m=>pl+m/xm*(W-pl-pr),Y=v=>H-pb-(v-y0)/(y1-y0)*(H-pt-pb),line=a=>a.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' ');
  let g='';
  for(let i=0;i<=4;i++){const v=y0+(y1-y0)*i/4,y=Y(v).toFixed(1);g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(pl-4)+'" y="'+(+y+4)+'" text-anchor="end" font-size="11" fill="var(--mute)">'+(Math.round(v*10)/10)+'</text>'}
  const st=xm>12?3:1;for(let m=0;m<=xm;m+=st)g+='<text x="'+X(m).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="var(--mute)">'+m+'</text>';
  cur.forEach((a,i)=>{g+='<polyline points="'+line(a)+'" fill="none" stroke="'+(i===2?'var(--peach)':'var(--mute)')+'" stroke-width="'+(i===2?2.2:1)+'"'+(zs[i][1]?' stroke-dasharray="'+zs[i][1]+'"':'')+' opacity="'+(i===2?1:.7)+'"/>'});
  const pts=P.map(e=>[mesesDe(e.inicio),+e.datos[key]]);
  g+='<polyline points="'+line(pts)+'" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round"/>'+pts.map(p=>'<circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="4" fill="var(--acc)"/>').join('');
  return'<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Curva de crecimiento de la OMS">'+g+'</svg><div class="mute">Meses en el eje inferior. Línea melocotón: P50. Otras líneas: P3, P15, P85 y P97 (OMS).</div>';
}
function medidas(){return Store.live().filter(e=>e.tipo==='medida').sort((a,b)=>a.inicio-b.inicio)}
function ultimas(M){return['w','l','c'].map(k=>{const a=M.filter(e=>e.datos[KEY[k]]),e=a[a.length-1];if(!e)return'';const x=+e.datos[KEY[k]];return'<div class="it"><span>'+NOM[k]+' <b>'+x+' '+UN[k]+'</b> <span class="mute">'+new Date(e.inicio).toLocaleDateString('es-ES')+'</span></span><span class="mute" style="text-align:right">'+pTxt(pctOf(k,x,e.inicio))+'</span></div>'}).join('')}
function vCre(){
  const M=medidas(),k=curva,P=M.filter(e=>e.datos[KEY[k]]&&(!cfg.nac||mesesDe(e.inicio)>=0));
  let h='<h2>Crecimiento</h2><div class="card">';
  if(!cfg.nac)h+='<div class="mute">Indica la fecha de nacimiento (en Más) para ver las curvas de la OMS.</div>';
  else if(!cfg.sexo)h+='<div class="mute">Para ver las curvas de la OMS indica el sexo del bebé.</div><div class="chips" style="margin-top:8px"><button data-a="sexo" data-v="f">Niña</button><button data-a="sexo" data-v="m">Niño</button></div>';
  else h+=T2('cv',[['w','Peso'],['l','Talla'],['c','Perímetro craneal']],k)+(P.length?curvaSvg(k,P):'<div class="mute">Aún no hay medidas de '+NOM[k].toLowerCase()+'.</div>');
  h+=ultimas(M)+'</div><div class="mute" style="margin:-4px 2px 10px">Percentiles orientativos de la OMS (2006). La interpretación la hace tu pediatra.</div><button class="sec" id="addM" style="width:100%">Añadir medidas</button>';
  return h;
}

/* ===== Informe para el pediatra ===== */
function informe(D){
  const n=Date.now(),t0=n-D*864e5,L=Store.live(),W=L.filter(e=>e.inicio>=t0);
  const base=L.filter(e=>['toma','panal','sueno'].includes(e.tipo)),first=base.length?Math.min(...base.map(e=>e.inicio)):n,ed=Math.max(1,Math.min(D,(n-first)/864e5));
  const f1=x=>(Math.round(x*10)/10).toString().replace('.',','),fd=ms=>{const m=Math.round(ms/6e4);return Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min'};
  const tm=W.filter(e=>e.tipo==='toma'),pn=W.filter(e=>e.tipo==='panal'),sl=W.filter(e=>e.tipo==='sueno'&&e.fin);
  const sum=(a,f)=>a.reduce((x,e)=>x+f(e),0),pis=pn.filter(e=>e.datos.k==='pis'||e.datos.k==='ambos').length,caca=pn.filter(e=>e.datos.k==='caca'||e.datos.k==='ambos').length;
  const dt=t=>new Date(t).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  let h='<h1>'+esc(cfg.nombre||'Bebé')+'</h1><div class="mute">'+ageTxt()+' · Últimos '+D+' días · generado el '+new Date(n).toLocaleDateString('es-ES')+'</div>';
  h+='<h2>Resumen diario (media)</h2><table class="rt"><tr><td>Tomas al día</td><td>'+f1(tm.length/ed)+'</td></tr><tr><td>Leche al día</td><td>'+Math.round(sum(tm,e=>e.datos.ml||0)/ed)+' ml</td></tr><tr><td>Pañales al día</td><td>'+f1(pn.length/ed)+' ('+f1(pis/ed)+' pis, '+f1(caca/ed)+' caca)</td></tr><tr><td>Sueño al día</td><td>'+(sl.length?fd(sum(sl,e=>e.fin-Math.max(e.inicio,t0))/ed)+' en '+f1(sl.length/ed)+' periodos':'sin datos')+'</td></tr></table><div class="mute">Calculado sobre '+f1(ed)+(Math.round(ed*10)/10===1?' día':' días')+' con registros.</div>';
  let rows='';
  for(let i=0;i<Math.min(7,D);i++){const a=dayStart(n-i*864e5),b=a+864e5,inD=e=>e.inicio>=a&&e.inicio<b,t=L.filter(e=>e.tipo==='toma'&&inD(e)),pp=L.filter(e=>e.tipo==='panal'&&inD(e)),s=L.filter(e=>e.tipo==='sueno'&&e.fin&&inD(e));
    rows+='<tr><td>'+new Date(a).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})+'</td><td>'+t.length+'</td><td>'+sum(t,e=>e.datos.ml||0)+'</td><td>'+pp.length+'</td><td>'+(s.length?fd(sum(s,e=>e.fin-e.inicio)):'—')+'</td></tr>'}
  h+='<h2>Últimos días</h2><table class="rt"><tr><th>Día</th><th>Tomas</th><th>ml</th><th>Pañales</th><th>Sueño</th></tr>'+rows+'</table>';
  const T=W.filter(e=>e.tipo==='temp').sort((a,b)=>a.inicio-b.inicio),Md=W.filter(e=>e.tipo==='med'),mm={};
  Md.forEach(e=>{(mm[e.datos.farmaco]=mm[e.datos.farmaco]||[]).push(e)});
  h+='<h2>Fiebre y medicación</h2>';
  h+=T.length?'<table class="rt">'+T.map(e=>'<tr><td>'+dt(e.inicio)+'</td><td>'+String(e.datos.c).replace('.',',')+' °C'+(e.datos.m?' · '+MT[e.datos.m]:'')+(e.datos.nota?' · '+esc(e.datos.nota):'')+'</td></tr>').join('')+'</table>':'<div class="mute">Sin temperaturas registradas en este periodo.</div>';
  h+=Object.keys(mm).length?'<table class="rt">'+Object.keys(mm).map(f=>'<tr><td>'+esc(f)+'</td><td>'+mm[f].length+' dosis · última '+dt(mm[f].sort((a,b)=>b.inicio-a.inicio)[0].inicio)+'</td></tr>').join('')+'</table>':'';
  pautas().forEach(p=>{h+='<div class="mute">Pauta indicada: '+esc(p.farmaco)+(p.conc?' '+esc(p.conc):'')+' · '+p.ml+' ml cada '+p.horas+' h, máx. '+p.max+' al día'+(p.medico?' ('+esc(p.medico)+')':'')+'</div>'});
  const M=medidas();
  h+='<h2>Crecimiento</h2>'+(M.length?ultimas(M):'<div class="mute">Sin medidas registradas.</div>');
  const PW=M.filter(e=>e.datos.peso&&cfg.nac&&mesesDe(e.inicio)>=0);if(cfg.sexo&&PW.length)h+=curvaSvg('w',PW);
  const pq=(cfg.preg||[]).filter(x=>!x.ok),ci=(cfg.citas||[]).filter(c=>new Date(c.f)>=n-864e5&&c.p).sort((a,b)=>a.f<b.f?-1:1);
  const AL=W.filter(e=>e.tipo==='alim').sort((a,b)=>a.inicio-b.inicio);h+='<h2>Alimentos nuevos y reacciones</h2>'+(AL.length?'<table class="rt">'+AL.map(e=>'<tr><td>'+new Date(e.inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})+' · '+esc(e.datos.n)+'</td><td>'+RX[e.datos.r]+(e.datos.nota?' · '+esc(e.datos.nota):'')+'</td></tr>').join('')+'</table>':'<div class="mute">Ninguno en este periodo.</div>')+'<h2>Dudas para el médico</h2>'+(ci.length?'<table class="rt">'+ci.map(c=>'<tr><td>'+esc(c.t)+' · '+new Date(c.f).toLocaleDateString('es-ES')+'</td><td>'+esc(c.p)+'</td></tr>').join('')+'</table>':'<div class="mute">Ninguna anotada.</div>')+(pq.length?'<table class="rt">'+pq.map(x=>'<tr><td colspan="2">'+esc(x.q)+'</td></tr>').join('')+'</table>':'');
  h+='<h2>Vacunas administradas</h2><div>'+(vacList().filter(v=>v.ok).map(v=>esc(v.t)+(v.real?' · '+new Date(v.real+'T12:00').toLocaleDateString('es-ES'):'')).join('<br>')||'<span class="mute">Ninguna marcada.</span>')+'</div>';
  return h+'<div class="mute" style="margin-top:16px">Datos anotados por la familia. No sustituyen la valoración médica. Percentiles según los estándares de la OMS (2006).</div>';
}
function showRep(){$('repb').innerHTML=informe(repD);document.querySelectorAll('#rep [data-r]').forEach(b=>{if(/^\d+$/.test(b.dataset.r))b.classList.toggle('on',+b.dataset.r===repD)})}
$('rep').onclick=e=>{const b=e.target.closest('[data-r]');if(!b)return;const v=b.dataset.r;
  if(v==='x'){$('rep').style.display='none';return}
  if(v==='p'){window.print();return}
  if(v==='s'){navigator.share({title:'Informe de '+(cfg.nombre||'Bebé'),text:$('repb').innerText}).catch(()=>{});return}
  if(v==='c'){(navigator.clipboard?navigator.clipboard.writeText($('repb').innerText):Promise.reject()).then(()=>toast('Informe copiado',null)).catch(()=>toast('No se pudo copiar',null));return}
  repD=+v;showRep()};
Object.assign(ACT,{
  cv(v){curva=v;render()},
  sexo(v){cfg.sexo=v;saveCfg();render()},
  inf(){$('rep').style.display='block';$('reps').hidden=!navigator.share;showRep()}
});
