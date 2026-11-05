import re,sys,time,base64,io,datetime,json
from playwright.sync_api import sync_playwright
MOCK=open('/home/claude/qa2/mock.js').read()
URL='http://127.0.0.1:8765/index.html'
R=[];ERR={}
def res(n,ok,info=''):
    R.append((n,ok,info));print(('OK  ' if ok else 'FAIL'),n,info,flush=True)
def mk(br,name):
    ctx=br.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale='es-ES')
    ctx.route('https://www.gstatic.com/firebasejs/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=MOCK))
    ERR[name]=[]
    p=ctx.new_page()
    p.on('pageerror',lambda e,n=name:ERR[n].append('pageerror: '+str(e)))
    p.on('console',lambda m,n=name:ERR[n].append('console.'+m.type+': '+m.text) if m.type in('error','warning') else None)
    return ctx,p
def wait(f,t=5,step=0.2):
    e=time.time()+t
    while time.time()<e:
        try:
            if f():return True
        except Exception as x:pass
        time.sleep(step)
    return False
def txt(p):return p.inner_text('body')
def tab(p,k):p.click(f'nav button[data-k={k}]');time.sleep(0.3)
def signup(p,mail):
    p.wait_for_selector('#le',timeout=8000);p.fill('#le',mail);p.fill('#lp','123456');p.click('#lc')
with sync_playwright() as pw:
    br=pw.chromium.launch()
    cA,A=mk(br,'A');cB,B=mk(br,'B')
    A.goto(URL)
    try:
        A.wait_for_selector('#le',timeout=8000);res('1a login gate',A.is_visible('#lc') and A.is_visible('#li'))
    except Exception as x:res('1a login gate',False,str(x)[:100])
    signup(A,'a@x.com')
    try:
        A.wait_for_selector('#gn',timeout=5000);A.fill('#gn','Iván');A.click('#gc');A.wait_for_selector('#on',timeout=8000)
        res('1b family gate + onboarding',True)
    except Exception as x:res('1b family gate + onboarding',False,str(x)[:150]+' | '+txt(A)[:200])
    d=(datetime.date.today()-datetime.timedelta(days=60)).isoformat()
    A.fill('#on','Lucía');A.fill('#of',d);A.click('#os button[data-v=f]');A.click('#shs');time.sleep(0.5)
    res('1c baby shown',wait(lambda:'Lucía' in txt(A)),txt(A)[:100].replace('\n',' '))
    # 2
    A.click('#bT');time.sleep(0.5)
    A.click('#bP');time.sleep(0.3)
    try:A.click('#sh button[data-v=caca]');time.sleep(0.3)
    except Exception as x:res('2 pañal sheet',False,str(x)[:100])
    # maybe needs save
    if A.is_visible('#shs'):A.click('#shs')
    time.sleep(0.3)
    A.click('#bS');time.sleep(0.5)
    evs=A.evaluate("JSON.parse(localStorage.getItem('bebe.ev')||'[]').map(e=>e.tipo)")
    res('2 A events',sorted(evs)==['panal','sueno','toma'],str(evs))
    # 3
    tab(A,'mas');A.click('[data-a=mas][data-v=aju]');time.sleep(0.5)
    m=re.search(r'[A-Z0-9]{4}-[A-Z0-9]{4}',txt(A));code=m.group(0) if m else None
    res('3 invite code',bool(code),str(code))
    # 4
    B.goto(URL);signup(B,'b@x.com')
    B.wait_for_selector('#gn');B.fill('#gn','Ana');B.fill('#gj',code or 'ZZZZ-ZZZZ');B.click('#gu')
    ok=wait(lambda:B.is_hidden('#gn') and not B.is_visible('#on'),8)
    time.sleep(1.5)
    res('4a B joined, no onboarding, baby',ok and 'Lucía' in txt(B) and not B.is_visible('#on'),txt(B)[:120].replace('\n',' '))
    tab(B,'his');ok=wait(lambda:'Iván' in txt(B),5)
    res('4b B Registros shows author Iván',ok,txt(B)[:300].replace('\n',' | '))
    h=txt(B);res('4c B sees toma/pañal/sueño',all(w in h for w in('Toma','Pañal','Sueño')) or all(w.lower() in h.lower() for w in('toma','pañal','sue')),'')
    # 5
    tab(B,'hoy');B.click('#bT');time.sleep(0.2)
    tab(A,'his');ok=wait(lambda:'Ana' in txt(A),4)
    res('5a A sees B toma w/ author Ana',ok,txt(A)[:200].replace('\n',' | '))
    ban=B.is_visible('#ban');B.click('#banb')
    ok=wait(lambda:A.is_hidden('#ban'),4)
    res('5b sleep ended on B -> A banner gone',ban and ok,f'B banner visible before={ban}')
    # 6
    tab(A,'mas');A.click('[data-a=mas][data-v=aju]') if not A.query_selector('#ct') else None
    A.evaluate("cfg.prepV=5;cfg.tema='noche';saveCfg()")
    B.evaluate("cfg.talla='T2';cfg.stock=Object.assign(cfg.stock||{},{T2:7});saveCfg()")
    time.sleep(2)
    ca=A.evaluate('cfg');cb=B.evaluate('cfg')
    exp=lambda c:c.get('prepV')==5 and c.get('tema')=='noche' and c.get('talla')=='T2' and (c.get('stock') or {}).get('T2')==7
    res('6 cfg merge both ways',exp(ca) and exp(cb),f'A={json.dumps(ca)[:200]} B={json.dumps(cb)[:200]}')
    # 7
    tab(A,'hoy');n0=A.evaluate("Store.live().length");A.click('#bT');time.sleep(0.3)
    idt=A.evaluate("Store.live()[0].id")
    A.click('#undo');time.sleep(1.5)
    gone_B=B.evaluate(f"!Store.live().some(e=>e.id=='{idt}')")
    gone_A=A.evaluate(f"!Store.live().some(e=>e.id=='{idt}')")
    res('7 undo propagates',gone_A and gone_B,f'A={gone_A} B={gone_B}')
    # 8
    A.click('[data-a=resumen]');time.sleep(0.5);t=txt(A)
    res('8 Resumen',"Registros de hoy" in t and ('Iván' in t and 'Ana' in t),t[-300:].replace('\n',' | '))
    A.evaluate("closeSheet()") if A.evaluate("typeof closeSheet")=='function' else None
    # 9
    cC,C=mk(br,'C');C.goto(URL);signup(C,'c@x.com');C.wait_for_selector('#gn');C.fill('#gn','Zed');C.fill('#gj','ABCD-2345');C.click('#gu');time.sleep(1)
    gm=C.inner_text('#gm');res('9 wrong code error',bool(gm) and 'ncorrect' not in gm and C.is_visible('#gn'),repr(gm))
    # 10
    before=A.evaluate("Store.live().length");A.reload();time.sleep(2)
    gate=A.evaluate("Sync.gate");nl=A.evaluate("Store.live().length");seen=A.evaluate("localStorage.getItem('origo.seen')")
    res('10a reload no gate, data present',not gate and nl==before and not A.is_visible('#le'),f'gate={gate} before={before} after={nl}')
    time.sleep(1.5);nl2=A.evaluate("Store.live().length");
    # check events still all there after listener settles; also duplicates
    ids=A.evaluate("Store.ev.map(e=>e.id)")
    res('10b after listener, events intact, no dups',nl2==before and len(ids)==len(set(ids)),f'{nl2} seen={seen}')
    # B event added while A reloaded? add and check incremental
    B.evaluate("document.querySelector('nav button[data-k=hoy]').click()");B.click('#bT');time.sleep(1.5)
    res('10c post-reload incremental event',A.evaluate("Store.live().length")==before+1,'')
    # 11 photo
    from PIL import Image
    buf=io.BytesIO();Image.new('RGB',(60,40),(200,30,90)).save(buf,'JPEG');open('/home/claude/qa2/p.jpg','wb').write(buf.getvalue())
    tab(A,'mas');
    if A.query_selector('[data-a=mback]'):A.click('[data-a=mback]')
    A.click('[data-a=mas][data-v=des]');time.sleep(0.3)
    A.click('[data-a=sub][data-v=mom]');time.sleep(0.3)
    A.click('[data-a=mom]');time.sleep(0.3)
    A.fill('#mt','Primera foto');A.set_input_files('#mfo','/home/claude/qa2/p.jpg')
    wait(lambda:A.query_selector('#mfp img') is not None,5);A.click('#shs');time.sleep(1.5)
    nfot=A.evaluate("Object.keys(FOT).length");
    tab(B,'mas')
    if B.query_selector('[data-a=mback]'):B.click('[data-a=mback]')
    B.click('[data-a=mas][data-v=des]');time.sleep(0.3);B.click('[data-a=sub][data-v=mom]')
    ok=wait(lambda:B.evaluate("[...document.querySelectorAll('#app img')].some(i=>i.src.startsWith('data:image'))"),6)
    res('11 photo shows in B Diario',ok,f'A FOT keys={nfot}; B text={txt(B)[:150]!r}')
    # 12 offline
    B.evaluate("localStorage.setItem('mock.offline','1')")
    tab(B,'hoy');B.click('#bT');time.sleep(1.5)
    idb=B.evaluate("Store.live()[0].id")
    seenA=A.evaluate(f"Store.ev.some(e=>e.id=='{idb}')")
    B.evaluate("localStorage.removeItem('mock.offline')")
    ok=wait(lambda:A.evaluate(f"Store.ev.some(e=>e.id=='{idb}')"),5)
    res('12 offline queue then A receives',(not seenA) and ok,f'A had it while offline={seenA}')
    # screenshots
    tab(A,'his');tab(B,'his');time.sleep(0.5)
    A.screenshot(path='/home/claude/qa2/A_his.png');B.screenshot(path='/home/claude/qa2/B_his.png')
    print('ERRORS');
    for k,v in ERR.items():
        for l in v:print(k,l[:300])
    br.close()
