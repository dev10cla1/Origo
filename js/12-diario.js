/* ===== Fase 6: diario con fotos, hitos por categorías y alimentación completa ===== */
let FOT=fotProxy((()=>{try{return JSON.parse(localStorage.getItem('bebe.fotos')||'{}')}catch(_){return{}}})()),pendFoto=null,dfil='all',hitoVista='edad';
const saveFot=()=>{if(Sync.ready)return syncFot();try{localStorage.setItem('bebe.fotos',JSON.stringify(FOT));return true}catch(_){return false}};
const fotoMB=()=>(localStorage.getItem('bebe.fotos')||'').length/1e6;
function leerFoto(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.72))};im.onerror=()=>cb(null);im.src=r.result};r.onerror=()=>cb(null);r.readAsDataURL(file)}
$('sh').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(e.target.id!=='mfo'||!f)return;leerFoto(f,d=>{pendFoto=d;$('mfp').innerHTML=d?'<img src="'+d+'" alt="" style="width:100%;border-radius:12px;margin-bottom:10px">':'<div class="mute">No se pudo leer la foto.</div>'})});
const DCAT=[['anec','Anécdota'],['prim','Primera vez'],['esp','Momento especial'],['nota','Nota personal']];
const SLN=Object.fromEntries(SL),ACEP={b:'Bien',r:'Poco',n:'Rechaza'};IC.comida=IC.alim;

function vMom(){
  let L=Store.live().filter(e=>e.tipo==='momento');if(dfil!=='all')L=L.filter(e=>(e.datos.cat||'anec')===dfil);
  let h='<button class="sec" style="width:100%;margin:12px 0 10px" data-a="mom">Añadir recuerdo</button>'+T2('dfil',[['all','Todo']].concat(DCAT),dfil,1);
  if(!L.length)return h+'<div class="card mute" style="text-align:center;padding:24px 14px">'+(dfil==='all'?'Aquí guardarás anécdotas, primeras veces y momentos especiales, con foto si quieres.':'No hay recuerdos en esta categoría.')+'</div>';
  let cur='';h+='<div class="tl">';
  L.forEach(e=>{const mk=new Date(e.inicio).toLocaleDateString('es-ES',{month:'long',year:'numeric'}),f=e.datos.foto&&FOT[e.datos.foto];if(mk!==cur){cur=mk;h+='<div class="day">'+mk+'</div>'}
    h+='<div class="tli" data-a="ev" data-v="'+e.id+'"><span class="tld"></span><div class="card" style="margin:0 0 12px"><div class="row"><span class="pill">'+evInfo(e)[0]+'</span><span class="mute">'+new Date(e.inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})+'</span></div>'+(f?'<img src="'+f+'" alt="" style="width:100%;border-radius:12px;margin-top:8px;display:block">':'')+(e.datos.t?'<div style="white-space:pre-wrap;margin-top:8px">'+esc(e.datos.t)+'</div>':'')+'</div></div>'});
  return h+'</div><div class="mute" style="margin-top:4px">'+(Sync.on?'Las fotos se guardan en la nube de la familia y se ven en todos sus móviles.':'Fotos guardadas en este dispositivo: '+fotoMB().toFixed(1)+' MB de unos 5 MB.')+'</div>';
}

const HC='ssssccggmmm|ssscccggmmmmm|ssscccgggmmm|sscssccggmmmm|scccggmmmm'.split('|'),HCN={m:'Motor',g:'Cognitivo',c:'Comunicación',s:'Social y emocional'};
const hitoItems=()=>{const o=[];HITOS.forEach(([m,L],gi)=>L.forEach((t,i)=>o.push({id:'h'+m+'_'+i,m,t,c:HC[gi][i]})));return o};
function hitoRow(x,edad){const d=(cfg.hitos||{})[x.id],ob=(cfg.hitoO||{})[x.id];
  return'<div class="it"><div data-a="hit2" data-v="'+x.id+'" style="flex:1;min-width:0;cursor:pointer"><div style="font-size:15px">'+x.t+'</div><div class="mute">'+(edad?'Orientativo: '+x.m+' meses':HCN[x.c])+(d?' · Logrado el '+new Date(d).toLocaleDateString('es-ES'):'')+(ob?'<br>'+esc(ob):'')+'</div></div><button class="sec'+(d?' on':'')+'" style="padding:6px 10px" data-a="hito" data-v="'+x.id+'">'+(d?'Logrado':'Marcar')+'</button></div>'}
function vHit(){
  const hd=cfg.hitos||{},I=hitoItems();
  let h='<div style="height:8px"></div>'+T2('hv',[['edad','Por edad'],['cat','Por categoría']],hitoVista)+'<div class="mute" style="margin:2px 2px 10px">Hitos que consiguen al menos 3 de cada 4 bebés a cada edad (CDC y AAP, 2022). Las edades son orientativas, no plazos. Cada bebé va a su ritmo; si algo te preocupa, coméntalo con tu pediatra.</div>';
  if(hitoVista==='edad')HITOS.forEach(([m])=>{const R=I.filter(x=>x.m===m);h+='<details class="card"'+(hitoAbierto(m)?' open':'')+'><summary data-a="hg" data-v="'+m+'"><span>'+m+' meses</span><span class="mute">'+R.filter(x=>hd[x.id]).length+'/'+R.length+'</span></summary>'+R.map(x=>hitoRow(x,0)).join('')+'</details>'});
  else Object.keys(HCN).forEach(c=>{const R=I.filter(x=>x.c===c);h+='<details class="card"'+(openG['k'+c]?' open':'')+'><summary data-a="hgk" data-v="k'+c+'"><span>'+HCN[c]+'</span><span class="mute">'+R.filter(x=>hd[x.id]).length+'/'+R.length+'</span></summary>'+R.map(x=>hitoRow(x,1)).join('')+'</details>'});
  return h;
}

const PREC=['Sin sal ni azúcar añadidos, y sin zumos ni bebidas azucaradas.','Sin miel antes de los 12 meses (riesgo de botulismo).','Sin leche de vaca como bebida antes de los 12 meses.','Sin acelgas, espinacas, borraja, col ni remolacha antes de los 12 meses (nitratos).','Sin pez espada, cazón, tintorera, atún rojo ni lucio (mercurio).','Frutos secos enteros, uvas, aceitunas o zanahoria cruda: riesgo de atragantamiento. Los frutos secos, solo molidos o en crema.','Gluten: la AEP aconseja introducirlo entre los 4 y los 11 meses, en pequeñas cantidades al principio.'];
function aliGrupos(){const m={};Store.live().filter(e=>e.tipo==='alim').sort((a,b)=>a.inicio-b.inicio).forEach(e=>{const k=e.datos.n.toLowerCase();(m[k]=m[k]||{k,n:e.datos.n,L:[]}).L.push(e)});return Object.values(m).sort((a,b)=>b.L[b.L.length-1].inicio-a.L[a.L.length-1].inicio)}
function aliEstado(g){const dx=(cfg.alerg||[]).includes(g.k),w=g.L.some(e=>e.datos.r==='seria')?'seria':g.L.some(e=>e.datos.r==='leve')?'leve':'ok';
  return dx?['Alergia diagnosticada','badbg','bad']:w==='seria'?['Reacción importante observada','badbg','bad']:w==='leve'?['Reacción leve observada','warnbg','warn']:['Sin reacción','t2','ok']}
function vAli(){
  const age=edadM(),A=Store.live().filter(e=>e.tipo==='alim'),G=aliGrupos(),dx=cfg.alerg||[],fd=t=>new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  let h='<div class="card" style="margin-top:12px"><div class="mute">Alimentación complementaria</div><div style="margin:4px 0 8px">'+(age<4?'Hasta los 6 meses la leche cubre sus necesidades. La AEP recomienda empezar hacia los 6 meses y no antes de los 4; tu pediatra te indicará cuándo.':age<6?'Se acerca el momento. La AEP recomienda empezar hacia los 6 meses: háblalo con tu pediatra.':'Ofrece un alimento nuevo cada vez y espera unos días antes del siguiente, para detectar posibles reacciones.')+'</div><details><summary><span>Precauciones (AEP y AESAN)</span><span class="mute">Ver</span></summary>'+PREC.map(t=>'<div class="bl">• '+t+'</div>').join('')+'<div class="mute" style="margin-top:6px">Resumen orientativo. Tu pediatra te guiará según el caso.</div></details></div><div class="grid"><button class="sec" data-a="ali">Alimento nuevo</button><button class="sec" data-a="comida">Registrar comida</button></div>';
  const pl=(cfg.alimPlan||[]).slice().sort((a,b)=>a.f<b.f?-1:1);
  h+='<h2>Próximas introducciones</h2>'+(pl.length?'<div class="card" style="padding:2px 14px">'+pl.map(x=>'<div class="it"><div><b>'+esc(x.n)+'</b><div class="mute">'+fd(x.f+'T12:00')+'</div></div><div class="row" style="gap:6px"><button class="sec" style="padding:6px 10px" data-a="alip" data-v="'+x.id+'">Probar</button><button class="lnk" aria-label="Quitar" data-a="alipdel" data-v="'+x.id+'">×</button></div></div>').join('')+'</div>':'<div class="card mute">Planifica qué alimento vas a introducir y cuándo.</div>')+'<button class="sec" style="width:100%;margin-top:10px" data-a="alipl">Planificar alimento</button>';
  h+='<h2>Alérgenos habituales</h2><div class="grid">'+ALG.map(([k,l])=>{const E=A.filter(e=>e.datos.a===k).sort((a,b)=>a.inicio-b.inicio),dxo=E.some(e=>dx.includes(e.datos.n.toLowerCase())),bad=E.some(e=>e.datos.r!=='ok'),st=dxo?['Alergia diagnosticada','bad']:bad?['Reacción observada','warn']:E.length?['Probado · '+fd(E[0].inicio),'ok']:['Sin probar','mute'];
    return'<div class="card" style="padding:10px 12px;margin:0"><div style="font-size:14px;font-weight:600">'+l+'</div><div style="font-size:12px;color:var(--'+st[1]+')">'+st[0]+'</div></div>'}).join('')+'</div>';
  h+='<h2>Alimentos probados</h2>'+(G.length?'<div class="card" style="padding:2px 14px">'+G.map(g=>{const[l,bg,fg]=aliEstado(g);return'<div class="it ev" data-a="alig" data-v="'+esc(g.k)+'"><div style="flex:1;min-width:0"><b>'+esc(g.n)+'</b><div class="mute">Introducido el '+fd(g.L[0].inicio)+' · ofrecido '+g.L.length+(g.L.length===1?' vez':' veces')+'</div></div><span class="pill" style="background:var(--'+bg+');color:var(--'+fg+');white-space:normal;text-align:center;max-width:130px">'+l+'</span></div>'}).join('')+'</div>':'<div class="card mute">Aún no has anotado alimentos.</div>');
  const C=Store.live().filter(e=>e.tipo==='comida');
  h+='<h2>Diario de comidas</h2>'+(C.length?'<div class="card" style="padding:2px 14px">'+C.slice(0,10).map(e=>evRow(e,1)).join('')+'</div>':'<div class="card mute">Anota lo que come en cada comida para llevar el control.</div>');
  const M=(cfg.menu||{})[dkey(menuDia)]||{};
  h+='<h2>Plan de comidas</h2>'+T2('mdia',[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()+i);return[i,i?d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric'}):'Hoy']}),menuDia,1)+'<div class="card" style="padding:0 14px">'+SL.map(([k,l])=>'<div class="it"><span><b>'+l+'</b><div class="mute">'+esc(M[k]||'Sin planificar')+'</div></span><button class="sec" style="padding:6px 10px" data-a="mslot" data-v="'+k+'">'+(M[k]?'Editar':'Añadir')+'</button></div>').join('')+'</div>';
  return h;
}
function aliSheet(pf){pf=pf||{};
  sheet('<h2 style="margin-top:0">Alimento'+(pf.n?' · '+esc(pf.n):' nuevo')+'</h2><label>Alimento</label><input id="af" value="'+esc(pf.n)+'" placeholder="Ej.: calabaza, huevo cocido…"><label>Alérgeno habitual</label><select id="ag"><option value="">Ninguno / otro</option>'+ALG.map(([k,l])=>'<option value="'+k+'"'+(k===pf.a?' selected':'')+'>'+l+'</option>').join('')+'</select><label>Reacción observada</label>'+chips('ar',[['ok','Ninguna'],['leve','Leve'],['seria','Importante']],'ok')+'<div class="mute" style="margin:-4px 0 10px">Si hay dificultad para respirar, hinchazón de labios o cara, urticaria extensa, vómitos repetidos o decaimiento: llama al 112.</div><label>Notas</label><input id="an" placeholder="Ej.: manchas rojas alrededor de la boca"><label>Fecha</label><input id="ad" type="date" value="'+dkey(0)+'">',()=>{
    const n=$('af').value.trim()||(ALG.find(x=>x[0]===$('ag').value)||[])[1];if(!n)return false;
    const d=$('ad').value,ts=d===dkey(0)?Date.now():new Date(d+'T12:00').getTime();
    if(pf.plan){cfg.alimPlan=(cfg.alimPlan||[]).filter(x=>x.id!==pf.plan);saveCfg()}
    addEv('alim',{n,a:$('ag').value,r:chipVal('ar'),nota:$('an').value.trim()},ts,'Alimento registrado')})}

Object.assign(ACT,{
  dfil(v){dfil=v;render()},hv(v){hitoVista=v;render()},hgk(k){openG[k]=!openG[k]},
  mom(){pendFoto=null;sheet('<h2 style="margin-top:0">Nuevo recuerdo</h2>'+chips('mcat',DCAT,'anec')+'<label>¿Qué ha pasado?</label><textarea id="mt"></textarea><label>Foto (opcional)</label><input id="mfo" type="file" accept="image/*"><div id="mfp"></div><label>Fecha</label><input id="mf" type="date" value="'+dkey(0)+'">',()=>{
    const t=$('mt').value.trim();if(!t&&!pendFoto)return false;const f=$('mf').value,ts=f===dkey(0)?Date.now():new Date(f+'T12:00').getTime();let fid;
    if(pendFoto){fid='f'+Date.now().toString(36);FOT[fid]=pendFoto;if(!saveFot()){delete FOT[fid];toast('No hay espacio para más fotos en este dispositivo',null);return false}}
    const e=Store.add({tipo:'momento',inicio:ts,fin:null,datos:{t,cat:chipVal('mcat')||'anec',foto:fid}});toast('Recuerdo guardado',()=>Store.patch(e.id,{borrado:true}))})},
  fotodel(id){const e=Store.ev.find(x=>x.id===id),d=Object.assign({},e.datos);delete FOT[d.foto];delete d.foto;saveFot();closeSheet();Store.patch(id,{datos:d})},
  hit2(id){const x=hitoItems().find(i=>i.id===id),d=(cfg.hitos||{})[id],o=(cfg.hitoO||{})[id]||'';
    sheet('<h2 style="margin-top:0;font-size:17px">'+x.t+'</h2><div class="mute" style="margin-bottom:8px">'+HCN[x.c]+' · edad orientativa: '+x.m+' meses</div>'+chips('hs',[['0','Aún no'],['1','Logrado']],d?'1':'0')+'<label>Fecha en que lo logró</label><input id="hf" type="date" value="'+(d?new Date(d).toLocaleDateString('sv-SE'):dkey(0))+'"><label>Observaciones</label><input id="ho" value="'+esc(o)+'">',()=>{
      cfg.hitos=cfg.hitos||{};cfg.hitoO=cfg.hitoO||{};if(chipVal('hs')==='1')cfg.hitos[id]=new Date($('hf').value+'T12:00').getTime()||Date.now();else delete cfg.hitos[id];
      const v=$('ho').value.trim();if(v)cfg.hitoO[id]=v;else delete cfg.hitoO[id];saveCfg();render()})},
  ali(){aliSheet()},
  aliof(k){const g=aliGrupos().find(x=>x.k===k);aliSheet({n:g.n,a:g.L[0].datos.a||''})},
  alip(id){const x=(cfg.alimPlan||[]).find(y=>y.id===id);aliSheet({n:x.n,a:x.a||'',plan:id})},
  alipl(){sheet('<h2 style="margin-top:0">Planificar alimento</h2><label>Alimento</label><input id="pn1" placeholder="Ej.: calabaza"><label>Alérgeno habitual</label><select id="pa1"><option value="">Ninguno / otro</option>'+ALG.map(([k,l])=>'<option value="'+k+'">'+l+'</option>').join('')+'</select><label>Fecha prevista</label><input id="pf1" type="date" value="'+dkey(1)+'">',()=>{const n=$('pn1').value.trim();if(!n)return false;cfg.alimPlan=(cfg.alimPlan||[]).concat({id:'ap'+Math.random().toString(36).slice(2,7),n,a:$('pa1').value,f:$('pf1').value});saveCfg();render()})},
  alipdel(id){cfg.alimPlan=cfg.alimPlan.filter(x=>x.id!==id);saveCfg();render()},
  alig(k){const g=aliGrupos().find(x=>x.k===k),dx=(cfg.alerg||[]).includes(k);
    panel('<h2 style="margin-top:0">'+esc(g.n)+'</h2><div class="mute" style="margin-bottom:6px">Toca una toma para editarla.</div><div style="max-height:34vh;overflow:auto">'+g.L.slice().reverse().map(e=>evRow(e,1)).join('')+'</div><div class="grid" style="margin-top:10px"><button class="sec" data-a="aliof" data-v="'+esc(k)+'">Volver a ofrecer</button><button class="sec'+(dx?' on':'')+'" data-a="dxtog" data-v="'+esc(k)+'">'+(dx?'Alergia diagnosticada':'Marcar alergia')+'</button></div><div class="mute" style="margin:8px 0 4px">Marca la alergia solo si un profesional sanitario la ha diagnosticado. Una reacción observada en casa no es un diagnóstico.</div>')},
  dxtog(k){const a=cfg.alerg||[],i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);cfg.alerg=a;saveCfg();render();ACT.alig(k)},
  comida(){const hr=new Date().getHours(),def=hr<11?'d':hr<16?'c':hr<19?'m':'n',pm=((cfg.menu||{})[dkey(0)]||{})[def]||'';
    sheet('<h2 style="margin-top:0">Comida</h2>'+chips('cs',SL,def)+'<label>¿Qué ha comido?</label><input id="ct" value="'+esc(pm)+'" placeholder="Ej.: puré de calabaza y pollo"><label>Cómo ha ido</label>'+chips('ca',[['b','Bien'],['r','Poco'],['n','Rechaza']],'b')+'<label>Hora</label><input id="hr" type="time" value="'+nowHM()+'">',()=>{
      const t=$('ct').value.trim();if(!t)return false;addEv('comida',{slot:chipVal('cs'),t,acep:chipVal('ca')},toTs($('hr').value),'Comida registrada')})}
});
