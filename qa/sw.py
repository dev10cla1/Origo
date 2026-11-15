"""Instalación (service worker) con la app separada en archivos: caché completa, apertura sin conexión
y aviso de versión nueva. Trabaja sobre una copia temporal servida en http://localhost:8770."""
import os,shutil,subprocess,sys,time
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from comun import RAIZ,SALIDA,navegador
D=os.path.join(SALIDA,'sw');shutil.rmtree(D,ignore_errors=True);os.makedirs(D)
for x in('assets','css','js'):shutil.copytree(os.path.join(RAIZ,x),os.path.join(D,x))
for x in('index.html','sw.js','manifest.webmanifest'):shutil.copy(os.path.join(RAIZ,x),D)
srv=subprocess.Popen([sys.executable,'-m','http.server','8770','--bind','127.0.0.1'],cwd=D,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
FALLOS=0
def res(n,ok,info=''):
    global FALLOS;FALLOS+=not ok;print(('OK  ' if ok else 'FAIL'),n,info,flush=True)
EST="""()=>({app:typeof tick==='function'&&typeof FIREBASE_CONFIG==='object',reglas:document.styleSheets[0]?document.styleSheets[0].cssRules.length:0,
 ctrl:!!navigator.serviceWorker.controller,marca:window.__marca||null,avisos:window.__avisos.length})"""
def anexa(f,txt):open(os.path.join(D,f),'a',encoding='utf-8').write(txt)
try:
    with sync_playwright() as pw:
        br=navegador(pw);ctx=br.new_context(viewport={'width':390,'height':844},locale='es-ES');p=ctx.new_page()
        ctx.route('https://www.gstatic.com/**',lambda r:r.abort())
        p.add_init_script("window.__avisos=[];navigator.serviceWorker.addEventListener('message',e=>window.__avisos.push(e.data))")
        E=[];p.on('pageerror',lambda e:E.append(str(e)))
        def abre(ms=4500):p.reload();p.wait_for_timeout(ms);return p.evaluate(EST)
        p.goto('http://localhost:8770/index.html');p.wait_for_timeout(500)
        p.evaluate("navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready)");p.wait_for_timeout(1500)
        guardados=p.evaluate("caches.keys().then(async k=>(await (await caches.open(k[0])).keys()).map(r=>new URL(r.url).pathname.slice(1)))")
        esperados=['index.html','css/origo.css']+['js/'+f for f in sorted(os.listdir(os.path.join(RAIZ,'js')))]
        res('1 la caché guarda todos los archivos de la app',all(f in guardados for f in esperados),str([f for f in esperados if f not in guardados]))
        e=abre();res('2 sin cambios: abre y no avisa',e['app'] and e['ctrl'] and e['reglas']>100 and e['avisos']==0,str(e))
        anexa('js/13-inicio.js','\nwindow.__marca="v2";\n')
        e=abre();res('3 cambia solo un JS: abre la copia guardada y avisa',e['app'] and e['marca'] is None and e['avisos']==1,str(e))
        e=abre();res('4 tras Actualizar: versión nueva y sin aviso',e['app'] and e['marca']=='v2' and e['avisos']==0,str(e))
        anexa('js/13-inicio.js','\nwindow.__marca="v3";\n');os.rename(os.path.join(D,'js','05-marca.js'),os.path.join(D,'js','x.js'))
        abre();e=abre(1500);res('5 actualización a medias (falta un archivo): no se mezcla nada',e['app'] and e['marca']=='v2' and e['avisos']==0,str(e))
        os.rename(os.path.join(D,'js','x.js'),os.path.join(D,'js','05-marca.js'))
        e=abre();res('6 cuando llegan todos: avisa',e['marca']=='v2' and e['avisos']==1,str(e))
        srv.terminate();srv.wait();time.sleep(.5)
        e=abre(1500);res('7 sin conexión: abre la versión nueva completa',e['app'] and e['marca']=='v3' and e['reglas']>100,str(e))
        print('ERRORES DE CONSOLA/JS:',E or 'ninguno');FALLOS+=bool(E)
        br.close()
finally:
    srv.kill()
sys.exit(1 if FALLOS else 0)
