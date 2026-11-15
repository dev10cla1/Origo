/* Origo · service worker: permite instalar la app y abrirla sin conexión.
   La app se abre AL INSTANTE desde la copia guardada (aunque la cobertura sea mala) y, a la vez, se pide la versión
   nueva a internet. Si la página ha cambiado, se guarda y se avisa a la app («Hay una versión nueva» → Actualizar).
   No toca las peticiones a Firestore ni al inicio de sesión.
   Si cambias la lista BASE o los iconos, sube la versión (C). */
const C='origo-v4',BASE=['./','index.html','manifest.webmanifest','assets/icon-192.png','assets/icon-512.png','assets/escena-noche.jpg','assets/escena-amanecer.jpg','assets/escena-dia.jpg','assets/escena-atardecer.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* se espera un momento: la página que acaba de abrirse aún no está lista para recibir el aviso */
const avisar=()=>new Promise(r=>setTimeout(r,2500)).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(cs=>cs.forEach(c=>c.postMessage('origo-update')));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  if(u.origin===location.origin){
    const pagina=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
    e.respondWith(caches.open(C).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true})||(pagina?await c.match('index.html'):undefined);
      const viejo=hit&&pagina?hit.clone():null;
      /* la página se pide sin la caché del navegador para enterarse enseguida de las actualizaciones */
      const red=fetch(pagina?new Request(r.url,{cache:'no-cache',credentials:'same-origin'}):r).then(async res=>{
        if(res.ok){
          const cp=res.clone();
          if(viejo){const[a,b]=await Promise.all([viejo.text(),res.clone().text()]);await c.put(pagina?'index.html':r,cp);if(a!==b)await avisar()}
          else await c.put(pagina?'index.html':r,cp);
        }
        return res});
      if(hit){e.waitUntil(red.catch(()=>{}));return hit}
      return red.catch(()=>c.match('index.html'));
    }));
  }else if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res})));
  }
});
