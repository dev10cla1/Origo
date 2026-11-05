import datetime, json
from playwright.sync_api import sync_playwright
seed="""(function(){var n=Date.now(),D=864e5,H=36e5,ev=[];function A(t,i,f,d){ev.push({id:Math.random().toString(36).slice(2),tipo:t,inicio:i,fin:f,datos:d,borrado:false})}
for(var d=0;d<10;d++){for(var k=0;k<6;k++)A('toma',n-d*D-k*3*H-H,null,{ml:110+k*2,leche:'formula',talla:'1'});for(k=0;k<5;k++)A('panal',n-d*D-k*4*H-H,null,{k:k%3?'pis':'caca',talla:'1'});for(k=0;k<3;k++)A('sueno',n-d*D-k*6*H-9*H,n-d*D-k*6*H-8*H,{})}
A('temp',n-5*H,null,{c:38.2,m:'oi',nota:'Irritable, poco apetito y algo de tos durante la noche'});A('med',n-2*H,null,{farmaco:'Paracetamol',ml:2.5});A('medida',n-1*D,null,{peso:5.6,talla:60,pc:39});A('medida',n-60*D,null,{peso:4.1,talla:55,pc:35});
A('alim',n-2*D,null,{n:'Calabaza con pollo y un nombre de alimento bastante largo',a:'',r:'ok',nota:''});A('momento',n-1*D,null,{t:'Una anécdota con un texto bastante largo para comprobar que se ajusta correctamente al ancho de la pantalla en móviles pequeños.',cat:'anec'});A('comida',n-3*H,null,{slot:'c',t:'Puré de calabaza',acep:'b'});
localStorage.setItem('bebe.cfg',JSON.stringify({nombre:'Lucía',sexo:'f',tema:'%s',nac:new Date(n-75*D).toISOString().slice(0,10),talla:'1',stock:{'0':5,'1':18,'2':60},panInfo:{'1':{marca:'Dodot',modelo:'Sensitive',upp:36}},pautas:[{id:'pa0',farmaco:'Paracetamol',conc:'100 mg/ml',ml:2.5,horas:6,max:4,medico:'Dra. Ruiz',f:n-5*D}],citas:[{id:'c0',t:'Revisión del niño sano',m:'Control de los 2 meses',f:new Date(n+2*D).toISOString().slice(0,16),centro:'Centro de Salud Triana',prof:'Dra. Ruiz',p:'Cólicos por la tarde'}],preg:[{id:'q1',q:'¿Cuándo empezamos con la alimentación complementaria?',ok:false}]}));
localStorage.setItem('bebe.ev',JSON.stringify(ev))})()"""
SCR=[('Hoy','tab="hoy";masSub=null'),('Registros','tab="his";regVista="crono";masSub=null'),('Estadísticas','tab="his";regVista="stats";stP=7;masSub=null')]
for k in ['cre','tem','med','vac','cit']:SCR.append(('Salud/'+k,'tab="cre";sal="%s"'%k))
SCR+= [('Más','tab="mas";masSub=null'),('Pañales','tab="mas";masSub="pan"'),('Preparativos','tab="mas";masSub="prep";prepOpen["Dormitorio y descanso"]=true'),('Ajustes','tab="mas";masSub="aju"')]
for k in ['mom','hit','ali']:SCR.append(('Desarrollo/'+k,'tab="mas";masSub="des";sub="%s"'%k))
bad=[];tot=0
with sync_playwright() as p:
    b=p.chromium.launch()
    for tema in ['claro','noche']:
        for W,Hh in [(320,640),(360,740),(414,896),(768,1024),(1280,800)]:
            ctx=b.new_context(viewport={'width':W,'height':Hh},locale='es-ES');pg=ctx.new_page();pg.set_default_timeout(3000)
            pg.add_init_script(seed.replace('%s',tema));pg.goto('file:///mnt/user-data/outputs/index.html');pg.wait_for_timeout(200)
            for name,code in SCR:
                pg.evaluate(code+";render()");tot+=1
                r=pg.evaluate("""()=>{const W=document.documentElement.clientWidth,o=[];document.querySelectorAll('#app *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>W+1&&!e.closest('[style*="overflow-x:auto"]')&&!e.closest('.chips'))o.push(e.tagName+'.'+(e.className||'')+' '+Math.round(r.right)+'>'+W)});return{sw:document.documentElement.scrollWidth,W,o:o.slice(0,3)}}""")
                if r['sw']>r['W']+1 or r['o']:bad.append((tema,W,name,r))
            ctx.close()
    # capturas de referencia
    for tema,W in [('claro',320),('noche',360)]:
        ctx=b.new_context(viewport={'width':W,'height':900},locale='es-ES');pg=ctx.new_page();pg.add_init_script(seed.replace('%s',tema));pg.goto('file:///mnt/user-data/outputs/index.html');pg.wait_for_timeout(200)
        pg.evaluate('tab="hoy";render()');pg.screenshot(path='/tmp/qa/r_hoy_%d.png'%W)
        pg.evaluate('tab="cre";sal="med";render()');pg.screenshot(path='/tmp/qa/r_med_%d.png'%W)
        ctx.close()
    b.close()
print('pantallas revisadas:',tot,'| con desborde:',len(bad))
for x in bad[:25]:print(x)
