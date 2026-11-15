/* ===== Sincronización con Firebase (Firestore + Auth) =====
   Si FIREBASE_CONFIG está vacío, la app funciona como antes: solo en este dispositivo.
   Con Firebase:
   - localStorage sigue siendo la copia local (la app abre al instante y funciona sin conexión).
   - Firestore guarda familias/{código} (miembros, nombres, cfg) con las subcolecciones
     eventos/{id} y fotos/{id}. Las escrituras sin conexión quedan en cola y se envían solas.
   - Cada evento guarda "por" (UID de quien lo registró). */
const FB_V='12.0.0',FB_URL=m=>'https://www.gstatic.com/firebasejs/'+FB_V+'/firebase-'+m+'.js';
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(_){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const Sync={
  on:!!(FIREBASE_CONFIG&&FIREBASE_CONFIG.apiKey),ready:false,gate:false,uid:LS.get('origo.uid',null),fid:LS.get('origo.fid',null),
  email:LS.get('origo.email',''),miembros:LS.get('origo.miem',[]),nombres:LS.get('origo.nom',{}),estado:'Conectando…',
  pend:new Set(LS.get('origo.pend',[])),fotKnown:new Set(),askedFot:new Set(),F:null,db:null,auth:null,unsub:[],firstFam:false
};
const savePend=()=>LS.set('origo.pend',[...Sync.pend]);
/* Quién hizo un registro (solo se muestra si la familia tiene más de un miembro) */
function quien(e){if(!Sync.on||!e||!e.por||Sync.miembros.length<2)return'';const n=(Sync.nombres[e.por]||'').trim().split(/\s+/)[0];return n?n.slice(0,14):''}
/* Redibuja sin interrumpir a quien está escribiendo en un campo */
let rPend=false;
function softRender(){const a=document.activeElement;if(a&&$('app').contains(a)&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)){if(!rPend){rPend=true;a.addEventListener('blur',()=>{rPend=false;setTimeout(render,0)},{once:true})}return}render()}

/* --- cfg: cada clave se guarda como texto JSON; los objetos simples (stock, vacs, hitos…) por subclave,
   así dos móviles pueden cambiar cosas distintas a la vez sin pisarse --- */
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
function encCfg(c){const o={};for(const k in c){const v=c[k];if(v===undefined)continue;if(isObj(v)){o[k]={};for(const s in v)if(v[s]!==undefined)o[k][s]=JSON.stringify(v[s])}else o[k]=JSON.stringify(v)}return o}
function decCfg(o){const c={};for(const k in o||{}){const v=o[k];if(typeof v==='string'){try{c[k]=JSON.parse(v)}catch(_){}}else if(isObj(v)){c[k]={};for(const s in v){try{c[k][s]=JSON.parse(v[s])}catch(_){}}}}return c}
const SEP='\u0001';
function flat(E){const f={};for(const k in E||{}){const v=E[k];if(typeof v==='string')f[k]=v;else if(isObj(v)){f[k]='\u0002';for(const s in v)f[k+SEP+s]=v[s]}}return f}
function unflat(f){const E={};for(const p in f)if(!p.includes(SEP))E[p]=f[p]==='\u0002'?{}:f[p];for(const p in f)if(p.includes(SEP)){const[k,s]=p.split(SEP);if(isObj(E[k]))E[k][s]=f[p]}return E}
function diffCfg(A,B){const ops=[];const K=new Set([...Object.keys(A||{}),...Object.keys(B||{})]);
  K.forEach(k=>{const a=(A||{})[k],b=(B||{})[k];
    if(b===undefined){if(a!==undefined)ops.push([[k],null])}
    else if(typeof b==='string'){if(a!==b)ops.push([[k],b])}
    else if(a===undefined&&Object.keys(b).length)Object.keys(b).forEach(s=>ops.push([[k,s],b[s]]));
    else if(!isObj(a))ops.push([[k],b]);
    else{new Set([...Object.keys(a),...Object.keys(b)]).forEach(s=>{if(a[s]!==b[s])ops.push([[k,s],b[s]===undefined?null:b[s]])})}});
  return ops}
function pushCfg(){
  if(!Sync.ready)return;const B=LS.get('origo.base',{}),L=encCfg(cfg),ops=diffCfg(B,L);if(!ops.length)return;
  const F=Sync.F,args=[];ops.forEach(([p,v])=>{args.push(new F.FieldPath('cfg',...p),v===null?F.deleteField():v)});
  LS.set('origo.base',L);
  F.updateDoc(F.doc(Sync.db,'familias',Sync.fid),...args).catch(fbErr);
}
/* Mezcla a tres bandas: lo que cambió en remoto se aplica; lo que cambió aquí se envía */
function mergeCfg(R){
  const B=flat(LS.get('origo.base',{})),Rf=flat(R),Lf=flat(encCfg(cfg)),M={};
  new Set([...Object.keys(B),...Object.keys(Rf),...Object.keys(Lf)]).forEach(p=>{const v=Rf[p]!==B[p]?Rf[p]:Lf[p];if(v!==undefined)M[p]=v});
  const ME=unflat(M),nc=decCfg(ME),old=JSON.stringify(cfg);let ch=false;
  Object.keys(cfg).forEach(k=>{if(!(k in nc)){delete cfg[k];ch=true}});
  Object.keys(nc).forEach(k=>{if(JSON.stringify(cfg[k])!==JSON.stringify(nc[k])){cfg[k]=nc[k];ch=true}});
  guardaLocal('bebe.cfg',JSON.stringify(cfg));
  LS.set('origo.base',R);pushCfg();
  return ch&&old!==JSON.stringify(cfg);
}

/* --- eventos --- */
function evDoc(e){const F=Sync.F;return{tipo:e.tipo,inicio:e.inicio,borrado:!!e.borrado,por:e.por||null,j:JSON.stringify(e),act:F.serverTimestamp()}}
function pushEv(e){
  if(!Sync.on)return;
  if(!Sync.ready){Sync.pend.add(e.id);savePend();return}
  const F=Sync.F;F.setDoc(F.doc(Sync.db,'familias',Sync.fid,'eventos',e.id),evDoc(e)).catch(fbErr);
}
async function pushMany(list){const F=Sync.F;for(let i=0;i<list.length;i+=400){const b=F.writeBatch(Sync.db);list.slice(i,i+400).forEach(e=>b.set(F.doc(Sync.db,'familias',Sync.fid,'eventos',e.id),evDoc(e)));await b.commit()}}
/* Sustituye todos los registros (Importar): los que no vienen en la copia quedan borrados */
function replaceAll(nuevos){
  const ids=new Set(nuevos.map(e=>e.id)),fuera=Store.ev.filter(e=>!ids.has(e.id)).map(e=>Object.assign({},e,{borrado:true}));
  Store.ev=nuevos;
  if(Sync.on){if(Sync.ready)pushMany(fuera.concat(nuevos)).catch(fbErr);else{fuera.concat(nuevos).forEach(e=>Sync.pend.add(e.id));Store.ev=nuevos.concat(fuera);savePend()}}
  Store.save();
}

/* --- fotos: se descargan al verlas y quedan en la caché de Firestore (sirve sin conexión) --- */
function fotProxy(o){return new Proxy(o,{get(t,k){
  if(typeof k==='string'&&!(k in t)&&Sync.ready&&/^f[0-9a-z]+$/.test(k)&&!Sync.askedFot.has(k)){Sync.askedFot.add(k);const F=Sync.F,r=F.doc(Sync.db,'familias',Sync.fid,'fotos',k);
    F.getDocFromCache(r).catch(()=>F.getDoc(r)).then(s=>{if(s&&s.exists()){t[k]=s.data().d;Sync.fotKnown.add(k);softRender()}}).catch(()=>Sync.askedFot.delete(k))}
  return t[k]}})}
function syncFot(){
  const F=Sync.F;let ok=true;
  Object.keys(FOT).forEach(k=>{if(Sync.fotKnown.has(k))return;if(String(FOT[k]).length>950000){ok=false;return}
    Sync.fotKnown.add(k);F.setDoc(F.doc(Sync.db,'familias',Sync.fid,'fotos',k),{d:FOT[k],act:F.serverTimestamp()}).catch(fbErr)});
  [...Sync.fotKnown].forEach(k=>{if(!(k in FOT)){Sync.fotKnown.delete(k);F.deleteDoc(F.doc(Sync.db,'familias',Sync.fid,'fotos',k)).catch(fbErr)}});
  localStorage.removeItem('bebe.fotos');return ok;
}
async function todasFotos(){if(!Sync.ready)return;const F=Sync.F,q=await F.getDocs(F.collection(Sync.db,'familias',Sync.fid,'fotos'));q.forEach(s=>{if(!(s.id in FOT))FOT[s.id]=s.data().d;Sync.fotKnown.add(s.id)})}

/* --- errores y estado --- */
function fbErr(err){const c=err&&err.code||'';console.warn('Firebase',c,err&&err.message);
  Sync.estado=c.includes('permission')?'Sin permiso: revisa las reglas o el código de familia':c.includes('unavailable')?'Sin conexión: se enviará al volver':'Error de sincronización';
  if(c.includes('permission'))toast(Sync.estado,null)}
function authMsg(c){return({'auth/invalid-email':'El correo no es válido','auth/missing-password':'Escribe la contraseña','auth/weak-password':'La contraseña debe tener al menos 6 caracteres','auth/email-already-in-use':'Ese correo ya tiene cuenta: pulsa Entrar','auth/invalid-credential':'Correo o contraseña incorrectos','auth/wrong-password':'Correo o contraseña incorrectos','auth/user-not-found':'No hay ninguna cuenta con ese correo','auth/too-many-requests':'Demasiados intentos. Espera un poco','auth/network-request-failed':'Sin conexión a internet'})[c]||'No se pudo completar ('+(c||'error')+')'}

/* --- pantallas de acceso (no se pueden cerrar hasta terminar) --- */
function gate(html){Sync.gate=true;$('sh').innerHTML='<div style="text-align:center;margin-bottom:8px"><span style="display:inline-block;background:#f4f7f8;border-radius:16px;padding:10px 18px">'+LOGO(110)+'</span></div>'+html+'<div class="mute" id="gm" style="min-height:20px;margin-top:8px;color:var(--bad)"></div>';$('ov').style.display='flex';$('toast').style.display='none'}
const gmsg=t=>{if($('gm'))$('gm').textContent=t};
function endGate(){Sync.gate=false;closeSheet();checkOnboard()}
function checkOnboard(){if(Sync.firstFam&&!Sync.gate&&!cfg.nombre&&$('ov').style.display!=='flex')onboard()}
const busy=(id,on)=>{const b=$(id);if(b){b.disabled=on;b.style.opacity=on?.5:1}};
function gateLogin(){
  gate('<h2 style="margin-top:0;text-align:center">Entrar en Origo</h2><div class="mute" style="text-align:center;margin-bottom:6px">Con una cuenta, los registros se comparten entre los móviles de la familia.</div><button class="sec" id="lg" style="width:100%;margin:6px 0 4px;background:var(--acc);color:var(--on);display:flex;align-items:center;justify-content:center"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#fff;margin-right:10px;flex:none" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg></span>Entrar con Google</button><div class="mute" style="text-align:center;margin:8px 0 0">o con correo y contraseña</div><label>Correo</label><input id="le" type="email" autocomplete="email" value="'+esc(Sync.email)+'"><label>Contraseña</label><input id="lp" type="password" autocomplete="current-password"><div class="grid" style="margin-top:6px"><button class="sec" id="lc">Crear cuenta</button><button class="sec" id="li">Entrar</button></div><button class="sec" id="lr" style="width:100%;margin-top:10px;background:none">He olvidado la contraseña</button>');
  const F=Sync.F,go=(fn,id)=>async()=>{const e=$('le').value.trim(),p=$('lp').value;gmsg('');busy(id,true);try{Sync.email=e;LS.set('origo.email',e);await fn(Sync.auth,e,p)}catch(x){gmsg(authMsg(x.code))}busy(id,false)};
  $('li').onclick=go(F.signInWithEmailAndPassword,'li');$('lc').onclick=go(F.createUserWithEmailAndPassword,'lc');
  $('lg').onclick=async()=>{gmsg('');const pr=()=>{const p=new F.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});return p};busy('lg',true);
    try{await F.signInWithPopup(Sync.auth,pr())}
    catch(x){const c=x.code||'';if(c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment'){try{await F.signInWithRedirect(Sync.auth,pr())}catch(y){gmsg(authMsg(y.code))}}
      else if(c!=='auth/popup-closed-by-user'&&c!=='auth/cancelled-popup-request')gmsg(c==='auth/operation-not-allowed'?'Falta activar Google en Firebase (Authentication → Método de acceso)':c==='auth/unauthorized-domain'?'Falta añadir este dominio en Firebase (Authentication → Dominios autorizados)':authMsg(c))}
    busy('lg',false)};
  $('lr').onclick=async()=>{const e=$('le').value.trim();if(!e)return gmsg('Escribe tu correo arriba');try{await F.sendPasswordResetEmail(Sync.auth,e);gmsg('Te hemos enviado un correo para cambiarla')}catch(x){gmsg(authMsg(x.code))}};
}
const ALF='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nuevoCod=()=>{const a=new Uint32Array(8);crypto.getRandomValues(a);return[...a].map(n=>ALF[n%32]).join('')};
const fmtCod=c=>String(c||'').slice(0,4)+'-'+String(c||'').slice(4);
const conTiempo=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r({code:'timeout'}),ms))]);
function gateFamilia(){
  const hay=Store.ev.length>0||!!cfg.nombre;
  gate('<h2 style="margin-top:0;text-align:center">Tu familia</h2><label>Tu nombre (se verá en cada registro)</label><input id="gn" placeholder="Por ejemplo, Iván" value="'+esc(Sync.nombres[Sync.uid]||'')+'">'+
    '<div class="card" style="background:var(--bg);margin-top:8px"><b>Soy el primero</b><div class="mute" style="margin:4px 0 10px">Crea la familia'+(hay?' y sube los datos que ya hay en este móvil':'')+'. Después invitarás al otro progenitor con un código.</div><button class="sec" id="gc" style="width:100%;background:var(--acc);color:var(--on)">Crear familia</button></div>'+
    '<div class="card" style="background:var(--bg)"><b>Me han invitado</b><div class="mute" style="margin:4px 0 6px">Escribe el código que aparece en Ajustes del otro móvil.'+(hay?' Los datos de este móvil se sustituirán por los de la familia (exporta antes una copia si los necesitas).':'')+'</div><input id="gj" placeholder="ABCD-EFGH" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:2px"><button class="sec" id="gu" style="width:100%">Unirme</button></div>'+
    '<button class="sec" id="gx" style="width:100%;background:none">Salir de esta cuenta</button>');
  const F=Sync.F,nom=()=>{const n=$('gn').value.trim();if(!n)gmsg('Escribe tu nombre');return n};
  $('gx').onclick=salir;
  $('gc').onclick=async()=>{const n=nom();if(!n)return;busy('gc',true);gmsg('Creando…');
    try{const fid=nuevoCod();Sync.fid=fid;const base=encCfg(cfg);
      await conTiempo(F.setDoc(F.doc(Sync.db,'familias',fid),{miembros:[Sync.uid],nombres:{[Sync.uid]:n},cfg:base,creado:F.serverTimestamp()}),20000);
      await F.setDoc(F.doc(Sync.db,'usuarios',Sync.uid),{fid});
      LS.set('origo.base',base);Store.ev.forEach(e=>{if(!e.por)e.por=Sync.uid});Store.save();
      Sync.nombres={[Sync.uid]:n};Sync.miembros=[Sync.uid];
      await arrancar(fid,true);endGate();toast('Familia creada. Invita al otro móvil desde Ajustes',null)}
    catch(x){Sync.fid=null;busy('gc',false);gmsg(x.code==='timeout'?'Necesitas conexión a internet para crear la familia':'No se pudo crear la familia ('+(x.code||'error')+')')}};
  $('gu').onclick=async()=>{const n=nom();if(!n)return;const c=$('gj').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length!==8)return gmsg('El código tiene 8 letras y números');busy('gu',true);gmsg('Uniéndote…');
    try{await conTiempo(F.updateDoc(F.doc(Sync.db,'familias',c),'miembros',F.arrayUnion(Sync.uid),new F.FieldPath('nombres',Sync.uid),n),20000);
      await F.setDoc(F.doc(Sync.db,'usuarios',Sync.uid),{fid:c});
      ['bebe.ev','bebe.cfg','bebe.fotos','origo.pend','origo.seen','origo.base'].forEach(k=>localStorage.removeItem(k));
      Store.ev=[];Object.keys(cfg).forEach(k=>delete cfg[k]);Object.keys(FOT).forEach(k=>delete FOT[k]);Sync.pend.clear();
      await arrancar(c,false);endGate();toast('Te has unido a la familia',null)}
    catch(x){busy('gu',false);gmsg(x.code==='timeout'?'Necesitas conexión a internet para unirte':x.code&&x.code.includes('permission')||x.code==='not-found'?'Código no válido o ya estás en esa familia':'No se pudo unir ('+(x.code||'error')+')')}};
}
async function salir(){try{Sync.unsub.forEach(u=>u());await Sync.F.signOut(Sync.auth)}catch(_){}
  Object.keys(localStorage).filter(k=>/^(bebe|origo)\./.test(k)&&k!=='origo.email').forEach(k=>localStorage.removeItem(k));location.reload()}

/* --- conexión: escuchar cambios de la familia y de los registros --- */
async function arrancar(fid,subirTodo){
  const F=Sync.F,db=Sync.db;Sync.fid=fid;LS.set('origo.fid',fid);
  Sync.ready=true;Sync.estado='Sincronizado';
  if(subirTodo)pushMany(Store.ev).catch(fbErr);
  else if(Sync.pend.size)pushMany(Store.ev.filter(e=>Sync.pend.has(e.id))).catch(fbErr);
  Sync.pend.clear();savePend();syncFot();
  Sync.unsub.forEach(u=>u());Sync.unsub=[];
  Sync.unsub.push(F.onSnapshot(F.doc(db,'familias',fid),s=>{
    if(!s.exists())return;const d=s.data();Sync.miembros=d.miembros||[];Sync.nombres=d.nombres||{};LS.set('origo.miem',Sync.miembros);LS.set('origo.nom',Sync.nombres);
    mergeCfg(d.cfg||{});theme();softRender();
    if(!Sync.firstFam){Sync.firstFam=true;checkOnboard()}
  },e=>{fbErr(e);if(String(e.code).includes('permission')&&!Sync.gate){Sync.ready=false;gateFamilia()}}));
  const desde=Math.max(0,LS.get('origo.seen',0)-120000);
  Sync.unsub.push(F.onSnapshot(F.query(F.collection(db,'familias',fid,'eventos'),F.where('act','>',F.Timestamp.fromMillis(desde))),q=>{
    let seen=LS.get('origo.seen',0),ch=false;
    q.docChanges().forEach(c=>{if(c.type==='removed')return;const d=c.doc.data();let e;try{e=JSON.parse(d.j)}catch(_){return}e.id=c.doc.id;
      const cur=Store.ev.find(x=>x.id===e.id),je=JSON.stringify(e);
      if(!cur){Store.ev.push(e);ch=true}else if(JSON.stringify(cur)!==je){Object.keys(cur).forEach(k=>{if(!(k in e))delete cur[k]});Object.assign(cur,e);ch=true}
      if(!c.doc.metadata.hasPendingWrites&&d.act&&d.act.toMillis)seen=Math.max(seen,d.act.toMillis())});
    LS.set('origo.seen',seen);Sync.estado=q.metadata.fromCache?'Sin conexión: se enviará al volver':'Sincronizado';
    if(ch){Store.write();softRender()}
  },fbErr));
}
async function iniciarFirebase(){
  if(!Sync.on)return;
  try{
    const[A,AU,FS]=await Promise.all(['app','auth','firestore'].map(m=>import(FB_URL(m))));
    Sync.F=Object.assign({},A,AU,FS);const F=Sync.F,app=F.initializeApp(FIREBASE_CONFIG);
    Sync.auth=F.getAuth(app);
    try{Sync.db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()}),ignoreUndefinedProperties:true})}
    catch(_){Sync.db=F.getFirestore(app)}
    F.onAuthStateChanged(Sync.auth,async u=>{
      if(!u){Sync.ready=false;if(Sync.uid&&Sync.fid){Sync.uid=null;return salir()}return gateLogin()}
      if(Sync.uid&&Sync.uid!==u.uid){Object.keys(localStorage).filter(k=>/^(bebe|origo)\./.test(k)&&k!=='origo.email').forEach(k=>localStorage.removeItem(k));location.reload();return}
      Sync.uid=u.uid;LS.set('origo.uid',u.uid);if(u.email){Sync.email=u.email;LS.set('origo.email',u.email)}Store.ev.forEach(e=>{if(!e.por&&!Sync.fid)e.por=u.uid});
      let fid=Sync.fid;
      if(!fid){try{const s=await F.getDoc(F.doc(Sync.db,'usuarios',u.uid));fid=s.exists()&&s.data().fid}catch(_){}}
      if(!fid){endGate();return gateFamilia()}
      if(Sync.gate)endGate();
      await arrancar(fid,false);softRender();
    });
  }catch(err){console.warn('Firebase no disponible',err);Sync.estado='Sin conexión: se enviará al volver';
    if(!Sync.fid)gate('<h2 style="margin-top:0;text-align:center">Sin conexión</h2><div class="mute" style="text-align:center">La primera vez Origo necesita internet para entrar en tu cuenta.</div><button class="sec" style="width:100%;margin-top:10px" onclick="location.reload()">Reintentar</button>');
    window.addEventListener('online',()=>location.reload(),{once:true})}
}
