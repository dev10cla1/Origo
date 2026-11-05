import sys, datetime, json
from playwright.sync_api import sync_playwright
URL='file:///mnt/user-data/outputs/index.html'
errs=[];res=[]
def step(name,fn):
    try: pg.evaluate("1") if name.startswith('Alta') else pg.evaluate("closeSheet();document.getElementById('rep').style.display='none';document.getElementById('toast').style.display='none'")
    except Exception: pass
    try: fn();res.append(('OK',name))
    except Exception as e:
        st=pg.evaluate("({ov:document.getElementById('ov').style.display,rep:document.getElementById('rep').style.display,tab:typeof tab!=='undefined'?tab:'?',sal:typeof sal!=='undefined'?sal:'?'})")
        res.append(('FALLO',name+' -> '+' / '.join(str(e).split('\n')[:3])[:230]+' | estado: '+json.dumps(st)));pg.screenshot(path='/tmp/qa/fallo_%d.png'%len(res))
    print(res[-1][0],'·',res[-1][1],flush=True)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,locale='es-ES')
    pg=ctx.new_page();pg.set_default_timeout(2500);pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)));pg.on('console',lambda m:m.type=='error' and errs.append('console: '+m.text))
    pg.goto(URL);pg.wait_for_timeout(300)
    nac=(datetime.date.today()-datetime.timedelta(days=75)).isoformat()
    def onboarding():
        pg.fill('#on','Lucía');pg.fill('#of',nac);pg.click('#sh .chips button[data-v=f]');pg.click('#shs');pg.wait_for_selector('#bT')
        assert 'Lucía' in pg.inner_text('#app')
    step('Alta inicial (nombre, fecha, sexo)',onboarding)
    def toma_rapida(): pg.click('#bT');pg.wait_for_selector('#toast',state='visible');assert 'Toma' in pg.inner_text('#tmsg')
    step('Toma con un toque',toma_rapida)
    def panal():
        pg.click('#bP');pg.click('#sh button[data-v=caca]');pg.wait_for_timeout(200);assert 'Pañal' in pg.inner_text('#tmsg')
    step('Pañal (panel de 4 botones)',panal)
    def sueno():
        pg.click('#bS');pg.wait_for_timeout(1300);assert pg.is_visible('#ban');pg.click('#ban button');pg.wait_for_timeout(200);assert not pg.is_visible('#ban')
    step('Sueño: iniciar, cronómetro, finalizar',sueno)
    def toma_detalle():
        b=pg.locator('#bT').bounding_box();pg.mouse.move(b['x']+30,b['y']+30);pg.mouse.down();pg.wait_for_timeout(700);pg.mouse.up()
        pg.wait_for_selector('#sh input#ml');pg.fill('#ml','150');pg.click('#shs');pg.wait_for_timeout(200)
    step('Toma con detalle (mantener pulsado)',toma_detalle)
    def pecho():
        b=pg.locator('#bT').bounding_box();pg.mouse.move(b['x']+30,b['y']+30);pg.mouse.down();pg.wait_for_timeout(700);pg.mouse.up()
        pg.click('#sh .chips[id=lt] button[data-v=pecho]');pg.click('#sh .chips[id=ld] button[data-v=i]');pg.fill('#mn','12');pg.click('#shs');pg.wait_for_timeout(200)
    step('Toma de pecho (lado y duración)',pecho)
    def temp():
        pg.click('button[data-a=otros]');pg.click('#sh button[data-a=temp]');pg.fill('#tc','37.8');pg.fill('#tn','algo irritable');pg.click('#shs');pg.wait_for_timeout(200)
    step('Temperatura desde Más registros',temp)
    def medidas():
        pg.click('button[data-a=otros]');pg.click('#sh button[data-a=medidas]');pg.fill('#mp','5.4');pg.fill('#mt','59');pg.fill('#mc','39');pg.click('#shs');pg.wait_for_timeout(200)
    step('Peso y medidas desde Más registros',medidas)
    def resumen():
        pg.click('button[data-a=resumen]');pg.wait_for_selector('#sh');t=pg.inner_text('#sh');assert 'Última toma' in t and 'Último pañal' in t;pg.click('#shx')
    step('Resumen del bebé (cambio de turno)',resumen)
    def registros():
        pg.click('nav button[data-k=his]');t=pg.inner_text('#app');assert 'Biberón' in t or 'Pecho' in t
        for k in ['f','p','s','h','all']:pg.click('#app button[data-a=filt][data-v=%s]'%k)
        pg.click('#app .it.ev >> nth=0');pg.wait_for_selector('#sh input,#sh .chips');pg.click('#shx')
    step('Registros: filtros y abrir un registro',registros)
    def editar():
        pg.click('#app button[data-a=filt][data-v=f]');pg.click('#app .it.ev >> nth=0');pg.fill('#ml','111') if pg.locator('#ml').count() else None;pg.click('#shs');pg.wait_for_timeout(200)
    step('Editar un registro',editar)
    def eliminar():
        pg.click('#app button[data-a=filt][data-v=all]');n0=pg.locator('#app .it.ev').count();pg.click('#app .it.ev >> nth=0');pg.click('#sh button[data-a=elim]');pg.wait_for_timeout(200);assert pg.locator('#app .it.ev').count()==n0-1
        pg.click('#undo');pg.wait_for_timeout(200);assert pg.locator('#app .it.ev').count()==n0
    step('Eliminar y deshacer',eliminar)
    def dia():
        pg.fill('#hd',datetime.date.today().isoformat());pg.wait_for_timeout(200);assert pg.locator('#app .it.ev').count()>0
        pg.click('#app button[data-a=hdclr]')
    step('Registros: ver un día concreto',dia)
    def stats():
        pg.click('#app button[data-a=rv][data-v=stats]')
        for v in ['1','7','30']:pg.click('#app button[data-a=stp][data-v="%s"]'%v)
        for m in ['tomas','pan','sue','sies','ml']:
            pg.click('#app button[data-a=stm][data-v=%s]'%m)
    step('Estadísticas: hoy, 7 y 30 días',stats)
    def salud():
        pg.click('nav button[data-k=cre]')
        for k in ['tem','med','vac','cit','cre']:pg.click('#app button[data-a=sal][data-v=%s]'%k);assert len(pg.inner_text('#app'))>50
    step('Salud: los cinco módulos',salud)
    def pauta():
        pg.click('#app button[data-a=sal][data-v=med]');pg.click('#app button[data-a=pauta]');pg.fill('#pf','Paracetamol');pg.fill('#pc','100 mg/ml');pg.fill('#pm','2.5');pg.fill('#ph','6');pg.fill('#px','4');pg.fill('#pd','Dra. Ruiz');pg.click('#shs')
        pg.click('#app button[data-a=dosis]');pg.wait_for_timeout(300);assert 'Dosis registrada' in pg.inner_text('#tmsg')
        pg.click('#app button[data-a=dosis]');assert 'Registrar igualmente' in pg.inner_text('#sh');pg.click('#shx')
    step('Pauta del pediatra y dosis (con aviso de intervalo)',pauta)
    def vacuna():
        pg.click('#app button[data-a=sal][data-v=vac]');pg.click('#app .it.ev >> nth=0');pg.click('#sh .chips[id=vs] button[data-v="1"]');pg.click('#shs');assert 'Puesta' in pg.inner_text('#app')
    step('Vacuna marcada como puesta',vacuna)
    def cita():
        pg.click('#app button[data-a=sal][data-v=cit]');pg.click('#app button[data-a=cita]');pg.fill('#cf2',(datetime.datetime.now()+datetime.timedelta(days=2)).strftime('%Y-%m-%dT10:00'));pg.fill('#cc','C.S. Triana');pg.fill('#cp','Cólicos');pg.click('#shs')
        pg.click('#app button[data-a=preg]');pg.fill('#pq1','¿Vitamina D?');pg.click('#shs');assert 'Triana' in pg.inner_text('#app') and 'Vitamina D' in pg.inner_text('#app')
    step('Cita y pregunta para el pediatra',cita)
    def crecimiento():
        pg.click('#app button[data-a=sal][data-v=cre]');assert pg.locator('#app svg').count()>=1 or 'Aún no hay medidas' in pg.inner_text('#app')
        for c in ['l','c','w']:pg.click('#app button[data-a=cv][data-v=%s]'%c)
    step('Crecimiento: curvas OMS (peso, talla, perímetro)',crecimiento)
    def informe():
        pg.click('#app button[data-a=inf]');pg.wait_for_selector('#rep',state='visible');assert 'Resumen diario' in pg.inner_text('#repb')
        for d in ['14','30','7']:pg.click('#rep button[data-r="%s"]'%d)
        pg.click('#rep button[data-r=x]')
    step('Informe para el pediatra',informe)
    def panales():
        pg.click('nav button[data-k=mas]');pg.click('#app .it.mi[data-v=pan]');pg.click('#app button[data-a=pana]');pg.fill('#mmk','Dodot');pg.fill('#mmo','Sensitive');pg.fill('#mpq','2');pg.fill('#mup','30');pg.click('#shs')
        assert '60' in pg.inner_text('#app');
        pg.click('#app .it.ev[data-v="1"]');pg.click('#sh button[data-a=padj]');pg.fill('#aj','50');pg.click('#shs');pg.click('#app button[data-a=mback]')
    step('Pañales: compra de paquetes, talla en uso y ajuste',panales)
    def stock_consumo():
        pg.click('nav button[data-k=hoy]');pg.click('#bP');pg.click('#sh button[data-v=pis]');pg.wait_for_timeout(200)
        pg.click('nav button[data-k=mas]');pg.click('#app .it.mi[data-v=pan]');assert '49' in pg.inner_text('#app');pg.click('#app button[data-a=mback]')
    step('El stock baja al registrar un pañal',stock_consumo)
    def prep():
        pg.click('#app .it.mi[data-v=prep]');pg.click('#app summary >> nth=0');pg.click('#app button[data-a=prc] >> nth=0');pg.click('#app [data-a=pe] >> nth=0');pg.fill('#ep','89,90');pg.fill('#eq','1');pg.fill('#et','Ikea');pg.click('#sh .chips[id=es] button[data-v=comp]');pg.click('#shs')
        pg.click('#app button[data-a=padd] >> nth=0');pg.fill('#en','Móvil de cuna');pg.fill('#ecn','Decoración');pg.click('#shs');assert 'Decoración' in pg.inner_text('#app');pg.click('#app button[data-a=mback]')
    step('Preparativos: estado, precio, producto y categoría nueva',prep)
    def desarrollo():
        pg.click('#app .it.mi[data-v=des]')
        pg.click('#app button[data-a=mom]');pg.fill('#mt','Primera sonrisa de verdad');pg.click('#sh .chips[id=mcat] button[data-v=prim]');pg.click('#shs');assert 'Primera sonrisa' in pg.inner_text('#app')
        pg.click('#app button[data-a=sub][data-v=hit]');pg.click('#app button[data-a=hv][data-v=cat]');pg.click('#app summary >> nth=0');pg.click('#app [data-a=hit2] >> nth=0');pg.click('#sh .chips[id=hs] button[data-v="1"]');pg.fill('#ho','Con su peluche');pg.click('#shs')
        pg.click('#app button[data-a=sub][data-v=ali]');pg.click('#app button[data-a=ali]');pg.fill('#af','Calabaza');pg.click('#shs');pg.click('#app button[data-a=comida]');pg.fill('#ct','Puré de calabaza');pg.click('#shs');assert 'Calabaza' in pg.inner_text('#app')
        pg.click('#app button[data-a=mback]')
    step('Desarrollo: recuerdo, hito con observación, alimento y comida',desarrollo)
    def ajustes():
        pg.click('#app .it.mi[data-v=aju]');pg.click('#app .chips[id=ct] button[data-v=noche]');pg.click('#cs');pg.wait_for_timeout(200);assert pg.evaluate("document.documentElement.dataset.t")=='dark'
        pg.click('#app .chips[id=ct] button[data-v=claro]');pg.click('#cs');assert pg.evaluate("document.documentElement.dataset.t")=='light';pg.click('#app button[data-a=mback]')
    step('Ajustes: tema noche y claro',ajustes)
    def hoy_final():
        pg.click('nav button[data-k=hoy]');t=pg.inner_text('#app');assert 'Resumen del día' in t and 'Actividad reciente' in t
    step('Hoy con todo lo registrado',hoy_final)
    def persistencia():
        pg.reload();pg.wait_for_selector('#bT');t=pg.inner_text('#app');assert 'Lucía' in t and 'Actividad reciente' in t
    step('Los datos persisten al recargar',persistencia)
    b.close()
print('\nERRORES DE CONSOLA/JS:',errs if errs else 'ninguno')
