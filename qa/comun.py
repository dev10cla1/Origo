"""Utilidades comunes de las pruebas de Origo.
Uso (desde la carpeta del repositorio):  python3 qa/e2e_pruebas_usuario.py · python3 qa/revision_pantallas.py · python3 qa/test.py
Necesitan Playwright (pip install playwright) y Chromium o Chrome. Si Playwright no encuentra navegador,
indica uno con la variable CHROME (por ejemplo CHROME=/usr/bin/google-chrome)."""
import os,re,shutil,tempfile
QA=os.path.dirname(os.path.abspath(__file__))
RAIZ=os.path.dirname(QA)
SALIDA=os.path.join(tempfile.gettempdir(),'origo-qa')
os.makedirs(SALIDA,exist_ok=True)
def navegador(pw):
    exe=os.environ.get('CHROME') or next((x for x in('/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser') if os.path.exists(x)),None)
    try:return pw.chromium.launch()
    except Exception:
        return pw.chromium.launch(executable_path=exe,args=['--no-sandbox'])
def copia_local():
    """Copia de la app SIN Firebase (solo este dispositivo) para probar las pantallas. Devuelve su URL file://"""
    d=os.path.join(SALIDA,'sitio');shutil.rmtree(d,ignore_errors=True);os.makedirs(d)
    shutil.copytree(os.path.join(RAIZ,'assets'),os.path.join(d,'assets'))
    s=open(os.path.join(RAIZ,'index.html'),encoding='utf-8').read()
    s2=re.sub(r'const FIREBASE_CONFIG = \{.*?\};','const FIREBASE_CONFIG = null;',s,count=1,flags=re.S)
    assert s2!=s,'No se encontró FIREBASE_CONFIG en index.html'
    open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(s2)
    return 'file://'+d+'/index.html'
def ir(pg,k):
    """Navega como el menú: hoy · his · stats · cre · pan · prep · des · aju"""
    pg.evaluate("k=>{closeSheet();if(k==='hoy'){tab='hoy';masSub=null;render()}else ACT.ir(k)}",k);pg.wait_for_timeout(250)
