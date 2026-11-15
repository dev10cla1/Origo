/* Origo · service worker: permite instalar la app y abrirla sin conexión.
   La app se abre AL INSTANTE desde la copia guardada (aunque la cobertura sea mala) y, a la vez, se comprueba en internet
   si hay versión nueva. La app son varios archivos (lista APP): se comprueban y se guardan TODOS A LA VEZ, para no mezclar
   archivos de versiones distintas. Si alguno ha cambiado, se avisa a la app («Hay una versión nueva» → Actualizar).
   No toca las peticiones a Firestore ni al inicio de sesión.
   Si añades, quitas o renombras un archivo de css/ o js/, o cambias los iconos, actualiza las listas y sube la versión (C). */
const C='origo-v5',
  APP=['index.html','css/origo.css','js/01-config.js','js/02-datos.js','js/03-sync.js','js/04-base.js','js/05-marca.js','js/06-pantallas.js','js/07-crecimiento.js',
    'js/08-desarrollo.js','js/09-hoy.js','js/10-panales-preparativos.js','js/11-salud.js','js/12-diario.js','js/13-inicio.js'],
  BASE=[...APP,'manifest.webmanifest','assets/icon-192.png','assets/icon-512.png','assets/escena-noche.jpg','assets/escena-amanecer.jpg','assets/escena-dia.jpg','assets/escena-atardecer.jpg'],
  fresco=f=>new Request(f,{cache:'no-cache',credentials:'same-origin'}); /* sin la caché del navegador: para enterarse enseguida de los cambios */
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(BASE.map(fresco))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* se espera un momento: la página que acaba de abrirse aún no está lista para recibir el aviso */
const avisar=()=>new Promise(r=>setTimeout(r,2500)).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(cs=>cs.forEach(c=>c.postMessage('origo-update')));
/* Comprueba todos los archivos de la app; solo si TODOS llegan bien y alguno ha cambiado, los guarda juntos y avisa. */
let comprobando=null;
const actualizar=c=>comprobando||(comprobando=(async()=>{
  const nuevos=await Promise.all(APP.map(async f=>{const res=await fetch(fresco(f));if(!res.ok)throw new Error(f);return[f,res,await res.clone().text()]}));
  let cambio=false;
  for(const[f,,t]of nuevos){const v=await c.match(f);if(!v||await v.text()!==t){cambio=true;break}}
  if(cambio){await Promise.all(nuevos.map(([f,res])=>c.put(f,res)));await avisar()}
})().finally(()=>{comprobando=null}));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  if(u.origin===location.origin){
    const pagina=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
    const deApp=pagina||APP.some(f=>u.pathname.endsWith('/'+f));
    e.respondWith(caches.open(C).then(async c=>{
      const clave=pagina?'index.html':r,hit=await c.match(clave,{ignoreSearch:true});
      if(hit){
        /* al abrir la página se comprueba la app entera; el resto (imágenes…) se refresca suelto */
        if(pagina)e.waitUntil(actualizar(c).catch(()=>{}));
        else if(!deApp)e.waitUntil(fetch(r).then(res=>res.ok?c.put(r,res):0).catch(()=>{}));
        return hit}
      return fetch(pagina?fresco(r.url):r).then(res=>{if(res.ok)c.put(clave,res.clone());return res}).catch(()=>pagina?c.match('index.html'):Response.error());
    }));
  }else if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res})));
  }
});
