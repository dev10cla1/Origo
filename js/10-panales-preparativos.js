/* ===== Fase 4: inventario de pañales y preparativos ===== */
const TAL=['0','1','2','3','4'],fx=x=>(Math.round(x*10)/10).toString().replace('.',',');
const CATS=['Dormitorio y descanso','Paseo y transporte','Alimentación y lactancia','Higiene y baño','Ropa y complementos','Salud y seguridad','Documentación y trámites'];
const PREP=[[CATS[0],'Cuna o minicuna'],[CATS[0],'Colchón'],[CATS[0],'Sábanas y protector'],[CATS[0],'Saco o manta de dormir'],[CATS[1],'Cochecito'],[CATS[1],'Silla de coche (grupo 0/0+ o evolutiva)'],[CATS[1],'Bolso o mochila de paseo'],[CATS[2],'Biberones y tetinas'],[CATS[2],'Esterilizador'],[CATS[2],'Cojín de lactancia'],[CATS[2],'Baberos y muselinas'],[CATS[3],'Bañera y toallas con capucha'],[CATS[3],'Gel y crema'],[CATS[3],'Cambiador'],[CATS[3],'Toallitas'],[CATS[4],'Bodys y pijamas'],[CATS[4],'Gorro, calcetines y manoplas'],[CATS[4],'Ropa de abrigo'],[CATS[5],'Termómetro, suero y gasas'],[CATS[5],'Cortaúñas y cepillo para bebé'],[CATS[6],'Inscripción del nacimiento y libro de familia'],[CATS[6],'Tarjeta sanitaria del bebé'],[CATS[6],'Elegir pediatra'],[CATS[6],'Trámites de la prestación por nacimiento']];
const OLDC={'Cuna y ropa de cama':CATS[0],'Paseo':CATS[1],'Baño y cambio':CATS[3],'Ropa':CATS[4],'Botiquín':CATS[5]};
const PS={pend:['Pendiente','warnbg','warn'],comp:['Comprado','accbg','acc'],reg:['Regalo','t2','ok'],no:['No necesario','line','mute']};
let prepOpen={};
function prep(){
  if(!cfg.prep||cfg.prepV!==2){const cur=cfg.prep||[];cur.forEach(x=>{x.c=OLDC[x.c]||x.c});PREP.forEach(([c,n])=>{if(!cur.some(x=>x.n===n))cur.push({id:'p'+Math.random().toString(36).slice(2,8),c,n,s:'pend'})});cfg.prep=cur;cfg.prepV=2;saveCfg()}
  return cfg.prep}
const catsAll=P=>[...CATS,...new Set(P.map(x=>x.c).filter(c=>!CATS.includes(c)))];
const eur=v=>String(v).replace('.',',')+' €';
function itemRow(x){const[l,bg,fg]=PS[x.s],tags=[x.q>1&&'×'+x.q,x.p&&eur(x.p),x.tienda&&esc(x.tienda),x.nota&&esc(x.nota)].filter(Boolean).join(' · ');
  return'<div class="it" style="gap:8px"><div data-a="pe" data-v="'+x.id+'" style="flex:1;min-width:0;cursor:pointer'+(x.s==='no'?';opacity:.55;text-decoration:line-through':'')+'"><div style="font-size:15px">'+esc(x.n)+'</div>'+(tags?'<div class="mute">'+tags+'</div>':'')+'</div><button class="sec" style="padding:6px 10px;white-space:nowrap;background:var(--'+bg+');color:var(--'+fg+')" data-a="prc" data-v="'+x.id+'">'+l+'</button></div>'}
function vPrep(){
  const P=prep(),act=P.filter(x=>x.s!=='no'),ok=act.filter(x=>x.s==='comp'||x.s==='reg'),pct=act.length?Math.round(ok.length/act.length*100):0,nc=P.filter(x=>x.s==='comp').length,nr=P.filter(x=>x.s==='reg').length,
    gasto=P.filter(x=>x.s==='comp').reduce((a,x)=>a+(+x.p||0)*(+x.q||1),0);
  let h='<h1>Preparativos</h1><div class="card hero" style="margin-top:12px"><div class="row"><div><div class="mute">Preparado</div><div class="val" style="font-size:30px">'+pct+'%</div></div><div class="mute" style="text-align:right">'+ok.length+' de '+act.length+' productos<br>'+nc+' comprados · '+nr+' regalos</div></div><div class="bar"><i style="width:'+pct+'%"></i></div>'+(gasto?'<div class="mute" style="margin-top:8px">Gastado en compras: '+eur(gasto.toFixed(2))+'</div>':'')+'</div><button class="sec" style="width:100%;margin-bottom:10px" data-a="padd">Añadir producto</button>';
  catsAll(P).forEach(c=>{const L=P.filter(x=>x.c===c);if(!L.length&&!CATS.includes(c))return;const dn=L.filter(x=>x.s==='comp'||x.s==='reg').length,na=L.filter(x=>x.s!=='no').length;
    h+='<details class="card"'+(prepOpen[c]?' open':'')+'><summary data-a="pg" data-v="'+esc(c)+'"><span>'+esc(c)+'</span><span class="mute">'+dn+'/'+na+'</span></summary>'+(L.length?L.map(itemRow).join(''):'<div class="mute" style="padding:8px 0">Sin productos.</div>')+'<button class="lnk" data-a="padd" data-v="'+esc(c)+'">+ Añadir aquí</button></details>'});
  return h+'<div class="mute" style="margin:6px 2px">Toca un producto para editarlo y el estado para cambiarlo.</div>';
}
function prepForm(x){
  const P=prep();
  return'<label>Nombre</label><input id="en" value="'+esc(x.n)+'"><label>Categoría</label><select id="ec">'+catsAll(P).map(c=>'<option'+(c===x.c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select><input id="ecn" placeholder="o crea una categoría nueva" style="margin-top:-4px"><label>Estado</label>'+chips('es',[['pend','Pendiente'],['comp','Comprado'],['reg','Regalo'],['no','No necesario']],x.s)+'<div class="grid"><div><label>Cantidad</label><input id="eq" type="number" inputmode="numeric" value="'+esc(x.q)+'"></div><div><label>Precio unidad (€)</label><input id="ep" type="text" inputmode="decimal" value="'+esc(x.p)+'"></div></div><label>Tienda o procedencia</label><input id="et" value="'+esc(x.tienda)+'"><label>Notas</label><input id="eo" value="'+esc(x.nota)+'">';
}
function prepRead(x){const n=$('en').value.trim();if(!n)return false;const p=parseFloat(String($('ep').value).replace(',','.')),q=parseInt($('eq').value);
  Object.assign(x,{n,c:$('ecn').value.trim()||$('ec').value,s:chipVal('es')||x.s,q:q>0?q:undefined,p:isFinite(p)&&p>0?p:undefined,tienda:$('et').value.trim(),nota:$('eo').value.trim()});return true}

function consumo(){
  const n=Date.now(),L=Store.live().filter(e=>e.tipo==='panal');if(!L.length)return null;
  const first=Math.min(...L.map(e=>e.inicio)),dias=Math.max(1,Math.min(7,(n-first)/864e5)),u=L.filter(e=>e.inicio>=n-7*864e5).length;
  return{dia:u/dias,sem:u/dias*7,ok:(n-first)>=2*864e5};
}
function vPan(){
  const S=cfg.stock||{},inf=cfg.panInfo||{},tot=TAL.reduce((a,t)=>a+(S[t]||0),0),c=consumo(),mx=Math.max(1,...TAL.map(t=>S[t]||0)),act=cfg.talla,i=TAL.indexOf(act),sig=i>=0?TAL.slice(i+1).find(t=>(S[t]||0)>0):null;
  let h='<h1>Pañales</h1><div class="card hero" style="margin-top:12px"><div class="mute">Pañales disponibles</div><div class="val" style="font-size:34px">'+tot+'</div><div class="mute">'+(act?'Talla en uso: '+act+(sig?' · siguiente con stock: talla '+sig:''):'Toca una talla para marcarla como en uso')+'</div>'+(c&&c.ok&&tot?'<div class="mute" style="margin-top:6px">Con tu consumo actual, unos '+Math.floor(tot/c.dia)+' días en total (orientativo)</div>':'')+'</div><button class="sec" style="width:100%;margin-bottom:6px" data-a="pana">Registrar compra o regalo</button>';
  h+='<h2>Existencias por talla</h2><div class="card" style="padding:2px 14px">'+TAL.map(t=>{const u=S[t]||0,m=inf[t]||{},nom=[m.marca,m.modelo].filter(Boolean).join(' ');
    return'<div class="it ev" data-a="pant" data-v="'+t+'" style="display:block;padding:11px 0"><div class="row"><b>Talla '+t+(act===t?' <span class="pill">en uso</span>':t===sig?' <span class="pill" style="background:var(--t2);color:var(--ok)">siguiente</span>':'')+'</b><b>'+u+'</b></div><div class="bar" style="background:var(--line);margin-top:6px"><i style="width:'+Math.round(u/mx*100)+'%;background:var('+(act===t?'--acc':'--mint')+')"></i></div>'+(nom?'<div class="mute" style="margin-top:4px">'+esc(nom)+(m.upp?' · paquetes de '+m.upp:'')+'</div>':'')+'</div>'}).join('')+'</div>';
  h+='<h2>Consumo</h2><div class="card">';
  if(!c)h+='<div class="mute">Aún no hay pañales registrados en Hoy.</div>';
  else if(!c.ok)h+='<div class="mute">Necesito al menos 2 días de registros para calcular el consumo.</div>';
  else{const d=act&&S[act]?Math.floor(S[act]/c.dia):null;
    h+='<div class="it"><span>Media diaria</span><b>'+fx(c.dia)+' pañales</b></div><div class="it"><span>Consumo semanal</span><b>'+Math.round(c.sem)+' pañales</b></div>'+(d!==null?'<div class="it"><span>Talla '+act+' en uso</span><b style="color:var(--'+(d<7?'warn':'ink')+')">unos '+d+' días</b></div>':'')+(d!==null&&d<7?'<div class="mute" style="margin-top:6px">La talla '+act+' podría agotarse pronto.</div>':'');}
  h+='<div class="mute" style="margin-top:8px">Estimaciones orientativas basadas en tu consumo real de los últimos 7 días. Cambian con la edad y el cambio de talla.</div></div>';
  const M=(cfg.panMov||[]).slice().sort((a,b)=>b.t-a.t).slice(0,8);
  if(M.length)h+='<h2>Movimientos</h2><div class="card" style="padding:2px 14px">'+M.map(m=>'<div class="it"><div><b style="font-size:15px">'+({compra:'Compra',regalo:'Regalo',ajuste:'Ajuste'})[m.tipo]+' · talla '+m.talla+'</b><div class="mute">'+new Date(m.t).toLocaleDateString('es-ES',{day:'numeric',month:'short'})+(m.paq&&m.tipo!=='ajuste'?' · '+m.paq+' × '+m.upp:'')+([m.marca,m.modelo].filter(Boolean).length?' · '+esc([m.marca,m.modelo].filter(Boolean).join(' ')):'')+(m.nota?' · '+esc(m.nota):'')+'</div></div><div class="row" style="gap:6px"><b style="color:var(--'+(m.uds<0?'warn':'ok')+')">'+(m.uds>0?'+':'')+m.uds+'</b><button class="lnk" aria-label="Quitar" data-a="pdelm" data-v="'+m.id+'">×</button></div></div>').join('')+'</div>';
  return h;
}
function vMas(){
  if(masSub){const T={des:vDes,pan:vPan,prep:vPrep,aju:vAju};return T[masSub]()}
  const R=[['pan','Pañales','Existencias, compras y consumo',IC.panal],['prep','Preparativos','Lista de productos por categorías',IC.prep],['des','Desarrollo','Hitos, momentos y alimentación complementaria',IC.alim],['aju','Ajustes','Perfil del bebé, tema y copia de seguridad',ico.aju]];
  return'<h1>Más</h1><div class="card" style="padding:0 14px;margin-top:12px">'+R.map(([k,t,d,ic])=>'<div class="it mi" data-a="mas" data-v="'+k+'"><div class="ic g0">'+ic+'</div><div style="flex:1"><b>'+t+'</b><div class="mute">'+d+'</div></div><span class="mute">›</span></div>').join('')+'</div>';
}
Object.assign(ACT,{
  pg(c){prepOpen[c]=!prepOpen[c]},
  prc(id){const x=prep().find(p=>p.id===id);x.s={pend:'comp',comp:'reg',reg:'no',no:'pend'}[x.s];saveCfg();render()},
  pe(id){const x=prep().find(p=>p.id===id);sheet('<h2 style="margin-top:0">Producto</h2>'+prepForm(x)+'<div class="grid"><button class="sec" data-a="pmv" data-v="'+id+':-1">Subir</button><button class="sec" data-a="pmv" data-v="'+id+':1">Bajar</button></div><button class="sec bad" style="width:100%;margin:10px 0" data-a="pdel" data-v="'+id+'">Eliminar producto</button>',()=>{if(!prepRead(x))return false;saveCfg();render()})},
  padd(c){const x={n:'',c:c||CATS[0],s:'pend'};sheet('<h2 style="margin-top:0">Nuevo producto</h2>'+prepForm(x),()=>{if(!prepRead(x))return false;x.id='p'+Math.random().toString(36).slice(2,8);prep().push(x);saveCfg();render()})},
  pmv(v){const[id,d]=v.split(':'),P=prep(),i=P.findIndex(x=>x.id===id),c=P[i].c;let j=i+ +d;while(j>=0&&j<P.length&&P[j].c!==c)j+=+d;closeSheet();if(j<0||j>=P.length)return;[P[i],P[j]]=[P[j],P[i]];saveCfg();render()},
  pdel(id){closeSheet();const P=prep(),i=P.findIndex(x=>x.id===id),x=P.splice(i,1)[0];saveCfg();render();toast('Producto eliminado',()=>{P.splice(i,0,x);saveCfg();render()})},
  pant(t){panel('<h2 style="margin-top:0">Talla '+t+' · '+((cfg.stock||{})[t]||0)+' unidades</h2><div class="pg"><button data-a="pana" data-v="'+t+'">'+IC.panal+'Añadir</button><button data-a="padj" data-v="'+t+'">'+IC.medida+'Ajustar</button></div>'+(cfg.talla===t?'':'<button class="sec" style="width:100%" data-a="tal2" data-v="'+t+'">Usar esta talla</button>'))},
  tal2(t){closeSheet();cfg.talla=t;saveCfg();render()},
  stka(t){ACT.pana(t)},
  pana(t){const tl=t||cfg.talla||'1',inf=(cfg.panInfo||{})[tl]||{};
    sheet('<h2 style="margin-top:0">Registrar pañales</h2>'+chips('mt',[['compra','Compra'],['regalo','Regalo']],'compra')+'<label>Talla</label><select id="mtl">'+TAL.map(x=>'<option'+(x===tl?' selected':'')+'>'+x+'</option>').join('')+'</select><label>Marca</label><input id="mmk" value="'+esc(inf.marca)+'"><label>Modelo</label><input id="mmo" value="'+esc(inf.modelo)+'"><div class="grid"><div><label>Paquetes</label><input id="mpq" type="number" inputmode="numeric" value="1"></div><div><label>Unidades por paquete</label><input id="mup" type="number" inputmode="numeric" value="'+esc(inf.upp)+'"></div></div><label>Fecha</label><input id="mdt" type="date" value="'+dkey(0)+'"><label>Notas</label><input id="mnt">',()=>{
      const paq=+$('mpq').value,upp=+$('mup').value;if(!(paq>0)||!(upp>0))return false;
      const f=$('mdt').value,mv={id:'m'+Date.now().toString(36),t:f===dkey(0)?Date.now():new Date(f+'T12:00').getTime(),talla:$('mtl').value,tipo:chipVal('mt'),paq,upp,uds:paq*upp,marca:$('mmk').value.trim(),modelo:$('mmo').value.trim(),nota:$('mnt').value.trim()};
      cfg.panMov=(cfg.panMov||[]).concat(mv);cfg.stock=cfg.stock||{};cfg.stock[mv.talla]=(cfg.stock[mv.talla]||0)+mv.uds;cfg.panInfo=cfg.panInfo||{};cfg.panInfo[mv.talla]={marca:mv.marca,modelo:mv.modelo,upp};if(!cfg.talla)cfg.talla=mv.talla;
      saveCfg();render();toast('+'+mv.uds+' pañales de talla '+mv.talla,()=>ACT.pdelm(mv.id))})},
  padj(t){const cur=(cfg.stock||{})[t]||0;sheet('<h2 style="margin-top:0">Ajustar talla '+t+'</h2><label>Unidades que hay ahora</label><input id="aj" type="number" inputmode="numeric" value="'+cur+'"><label>Motivo (opcional)</label><input id="ajn" placeholder="Ej.: recuento, regalo a otra familia">',()=>{
      const v=parseInt($('aj').value);if(!(v>=0)||v===cur)return false;
      cfg.panMov=(cfg.panMov||[]).concat({id:'m'+Date.now().toString(36),t:Date.now(),talla:t,tipo:'ajuste',uds:v-cur,nota:$('ajn').value.trim()});cfg.stock=cfg.stock||{};cfg.stock[t]=v;saveCfg();render()})},
  pdelm(id){const M=cfg.panMov||[],m=M.find(x=>x.id===id);if(!m)return;cfg.stock[m.talla]=Math.max(0,(cfg.stock[m.talla]||0)-m.uds);cfg.panMov=M.filter(x=>x.id!==id);saveCfg();render()},
  elim(id){closeSheet();const e=Store.ev.find(x=>x.id===id),tl=e.tipo==='panal'&&e.datos.talla;if(tl){cfg.stock[tl]=(cfg.stock[tl]||0)+1;saveCfg()}Store.patch(id,{borrado:true});toast('Registro eliminado',()=>{if(tl){cfg.stock[tl]=Math.max(0,(cfg.stock[tl]||0)-1);saveCfg()}Store.patch(id,{borrado:false})})}
});
