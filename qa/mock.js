const W=window;
const M=W.__M||(W.__M=(()=>{
const B='http://127.0.0.1:8765/api/';
class Timestamp{constructor(ms){this.ms=ms}static fromMillis(ms){return new Timestamp(ms)}toMillis(){return this.ms}}
class FieldPath{constructor(...s){this.segs=s}}
const enc=v=>{if(v instanceof Timestamp)return{__ts:v.ms};if(v&&v.__sent)return v;if(v instanceof FieldPath)return{__fp:v.segs};if(Array.isArray(v))return v.map(enc);if(v&&typeof v==='object'){const o={};for(const k in v)if(v[k]!==undefined)o[k]=enc(v[k]);return o}return v};
const dec=v=>{if(Array.isArray(v))return v.map(dec);if(v&&typeof v==='object'){if('__ts' in v)return new Timestamp(v.__ts);const o={};for(const k in v)o[k]=dec(v[k]);return o}return v};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const online=async()=>{while(localStorage.getItem('mock.offline')==='1')await sleep(100)};
const uid=()=>localStorage.getItem('mock.uid');
async function api(p,body){await online();let r;try{r=await fetch(B+p,{method:'POST',body:JSON.stringify(Object.assign({uid:uid()},body))})}catch(e){throw{code:'unavailable'}}const j=await r.json();if(j.error)throw j.error;return j}
const pathOf=s=>s.join('/');
const snap=(path,d)=>({id:path.split('/').pop(),ref:{path},exists:()=>d!=null,data:()=>d==null?undefined:dec(d),metadata:{hasPendingWrites:false,fromCache:false}});
const authL=[];let auth={};
const fire=()=>authL.forEach(cb=>cb(uid()?{uid:uid()}:null));
return{Timestamp,FieldPath,
initializeApp:c=>({c}),getAuth:a=>auth,
onAuthStateChanged:(a,cb)=>{authL.push(cb);setTimeout(()=>cb(uid()?{uid:uid()}:null),50);return()=>{}},
signInWithEmailAndPassword:async(a,e,p)=>{if(!e)throw{code:'auth/invalid-email'};const j=await fetch(B+'signin',{method:'POST',body:JSON.stringify({e,p})}).then(r=>r.json());if(j.error)throw j.error;localStorage.setItem('mock.uid',j.uid);fire()},
createUserWithEmailAndPassword:async(a,e,p)=>{if(!e)throw{code:'auth/invalid-email'};if((p||'').length<6)throw{code:'auth/weak-password'};const j=await fetch(B+'signup',{method:'POST',body:JSON.stringify({e,p})}).then(r=>r.json());if(j.error)throw j.error;localStorage.setItem('mock.uid',j.uid);fire()},
sendPasswordResetEmail:async()=>{},
signOut:async()=>{localStorage.removeItem('mock.uid');fire()},
initializeFirestore:()=>({}),getFirestore:()=>({}),persistentLocalCache:()=>({}),persistentMultipleTabManager:()=>({}),
doc:(db,...s)=>({path:pathOf(s)}),collection:(db,...s)=>({path:pathOf(s),col:1}),
where:(f,o,v)=>({f,o,v}),query:(c,w)=>({path:c.path,col:1,w}),
serverTimestamp:()=>({__sent:1,__st:1}),arrayUnion:x=>({__sent:1,__au:[x]}),deleteField:()=>({__sent:1,__del:1}),
setDoc:(r,d)=>api('write',{ops:[{op:'set',path:r.path,data:enc(d)}]}),
updateDoc:(r,...a)=>{const ups=[];if(a.length===1)for(const k in a[0])ups.push([[k],enc(a[0][k])]);else for(let i=0;i<a.length;i+=2){const f=a[i];ups.push([f instanceof FieldPath?f.segs:[f],enc(a[i+1])])}return api('write',{ops:[{op:'update',path:r.path,ups}]})},
deleteDoc:r=>api('write',{ops:[{op:'delete',path:r.path}]}),
getDoc:async r=>{const j=await api('get',{path:r.path});return snap(r.path,j.d)},
getDocFromCache:()=>Promise.reject({code:'unavailable'}),
getDocs:async c=>{const j=await api('list',{path:c.path});const s=j.docs.map(x=>snap(x.path,x.d));return{docs:s,forEach:f=>s.forEach(f),metadata:{fromCache:false}}},
writeBatch:()=>{const ops=[];return{set(r,d){ops.push({op:'set',path:r.path,data:enc(d)});return this},commit:()=>api('write',{ops})}},
onSnapshot:(t,next,err)=>{let stop=false,last=null,first=true,known=new Map();
 (async()=>{while(!stop){try{
  if(t.col){const gt=t.w&&t.w.v?t.w.v.ms:0;const j=await api('list',{path:t.path,gt});if(stop)break;
   const ch=[];j.docs.forEach(x=>{const js=JSON.stringify(x.d),o=known.get(x.path);if(o===undefined)ch.push({type:'added',doc:snap(x.path,x.d)});else if(o!==js)ch.push({type:'modified',doc:snap(x.path,x.d)});known.set(x.path,js)});
   if(first||ch.length){first=false;next({docChanges:()=>ch,forEach:f=>ch.forEach(c=>f(c.doc)),metadata:{fromCache:false}})}}
  else{const j=await api('get',{path:t.path});if(stop)break;const js=JSON.stringify(j.d);if(first||js!==last){first=false;last=js;next(snap(t.path,j.d))}}
 }catch(e){if(e&&e.code==='unavailable'){}else{stop=true;err&&err(e);break}}await sleep(200)}})();
 return()=>{stop=true}}
}})());
export const {Timestamp,FieldPath,initializeApp,getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,initializeFirestore,getFirestore,persistentLocalCache,persistentMultipleTabManager,doc,collection,where,query,serverTimestamp,arrayUnion,deleteField,setDoc,updateDoc,deleteDoc,getDoc,getDocFromCache,getDocs,writeBatch,onSnapshot}=M;
