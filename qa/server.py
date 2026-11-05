import json,time,threading,os
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
D={};U={};L=threading.Lock();LOG=[]
def err(c):return {'error':{'code':c}}
def now():return int(time.time()*1000)
def res(v):
    if isinstance(v,dict):
        if v.get('__st'):return {'__ts':now()}
        return {k:res(x) for k,x in v.items()}
    if isinstance(v,list):return [res(x) for x in v]
    return v
def members(fid):
    d=D.get('familias/'+fid);return (d or {}).get('miembros',[])
def allowed(uid,path,op,ups=None):
    s=path.split('/')
    if not uid:return False
    if s[0]=='usuarios':return s[1]==uid
    if s[0]=='familias':
        m=members(s[1])
        if uid in m:return True
        if len(s)==2 and op=='update' and ups is not None and 'familias/'+s[1] in D:
            ks=[tuple(k) for k,_ in ups]
            if set(ks)=={('miembros',),('nombres',uid)}:
                for k,v in ups:
                    if k==['miembros'] and not(isinstance(v,dict) and v.get('__au')==[uid]):return False
                return True
        return False
    return False
def setpath(d,segs,v):
    for k in segs[:-1]:
        if not isinstance(d.get(k),dict):d[k]={}
        d=d[k]
    if isinstance(v,dict) and v.get('__del'):d.pop(segs[-1],None)
    elif isinstance(v,dict) and v.get('__au'):
        a=d.get(segs[-1]) if isinstance(d.get(segs[-1]),list) else []
        for x in v['__au']:
            if x not in a:a.append(x)
        d[segs[-1]]=a
    else:d[segs[-1]]=res(v)
def write(uid,ops):
    for o in ops:
        cre=o['op']=='set' and o['path'].count('/')==1 and o['path'].startswith('familias/') and o['path'] not in D and uid in (o['data'].get('miembros') or [])
        if not cre and not allowed(uid,o['path'],o['op'],o.get('ups')):return err('permission-denied')
        if o['op']=='update' and o['path'] not in D:return err('not-found')
    for o in ops:
        p=o['path']
        if o['op']=='set':D[p]=res(o['data'])
        elif o['op']=='delete':D.pop(p,None)
        else:
            for k,v in o['ups']:setpath(D[p],k,v)
    return {'ok':1}
class H(BaseHTTPRequestHandler):
    def log_message(self,*a):pass
    def send(self,j,ct='application/json'):
        b=j if isinstance(j,bytes) else json.dumps(j).encode()
        self.send_response(200);self.send_header('Content-Type',ct);self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
    def do_GET(self):
        p=self.path.split('?')[0].lstrip('/') or 'index.html'
        if os.path.isfile(p):self.send(open(p,'rb').read(),'text/html' if p.endswith('.html') else 'application/octet-stream')
        else:self.send_response(404);self.end_headers()
    def do_POST(self):
        b=json.loads(self.rfile.read(int(self.headers['Content-Length'])) or b'{}');ep=self.path.split('/')[-1]
        with L:
            if ep in('signin','signup'):
                e=b['e'];
                if ep=='signup':
                    if e in U:return self.send(err('auth/email-already-in-use'))
                    U[e]={'p':b['p'],'uid':'u%d'%(len(U)+1)}
                elif e not in U or U[e]['p']!=b['p']:return self.send(err('auth/invalid-credential'))
                return self.send({'uid':U[e]['uid']})
            u=b.get('uid')
            if ep=='write':r=write(u,b['ops'])
            elif ep=='get':
                r=err('permission-denied') if not allowed(u,b['path'],'get') and not(b['path'].startswith('familias/') and b['path'].count('/')==1 and False) else {'d':D.get(b['path'])}
            elif ep=='list':
                if not allowed(u,b['path']+'/x','get'):r=err('permission-denied')
                else:
                    pre=b['path']+'/';gt=b.get('gt',0)
                    r={'docs':[{'path':k,'d':v} for k,v in D.items() if k.startswith(pre) and '/' not in k[len(pre):] and (not gt or v.get('act',{}).get('__ts',0)>gt)]}
            else:r=err('bad')
        self.send(r)
ThreadingHTTPServer(('127.0.0.1',8765),H).serve_forever()
