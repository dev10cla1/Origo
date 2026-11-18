/* ===== Capa de datos =====
   localStorage es la copia local; con Firebase, add() y patch() además envían el registro a Firestore
   (ver bloque "Sincronización con Firebase"). */
/* Guardar en este móvil sin romper nada si el almacenamiento está lleno o bloqueado */
let sinEsp=false;
function guardaLocal(k,v){try{localStorage.setItem(k,v);return true}catch(_){if(!sinEsp){sinEsp=true;setTimeout(()=>toast('Este móvil se ha quedado sin espacio para Origo. Exporta una copia desde Ajustes.',null,null,9000),0)}return false}}
const Store={
  _ev:(()=>{try{const a=JSON.parse(localStorage.getItem('bebe.ev')||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}})(),_l:null,_d:null,
  get ev(){return this._ev},set ev(v){this._ev=v;this._l=this._d=null},
  /* touch(): avisa de que los registros han cambiado (invalida la lista ordenada en caché) */
  touch(){this._l=this._d=null},
  write(){this._l=this._d=null;return guardaLocal('bebe.ev',JSON.stringify(this._ev))},
  save(){this.write();render()},
  add(e){e.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);e.borrado=false;if(Sync.on&&Sync.uid)e.por=Sync.uid;this.ev.push(e);this.save();pushEv(e);return e},
  patch(id,p){const e=this.ev.find(e=>e.id===id);if(!e)return;Object.assign(e,p);this.save();pushEv(e)},
  /* Registros vivos, del más reciente al más antiguo. La lista se reutiliza hasta el siguiente cambio: no modificarla. */
  live(){return this._l||(this._l=this.ev.filter(e=>!e.borrado).sort((a,b)=>b.inicio-a.inicio))},
  /* Registros vivos por día: Map 'AAAA-MM-DD' → los que empiezan ese día (más reciente primero). La propiedad .g guarda los sueños que acaban otro día
     o siguen abiertos (los necesita franja(), porque el sueño se reparte entre días). Se rehace perezosamente y a la vez que live(): no modificarlo. */
  dias(){
    if(this._d)return this._d;
    const m=new Map(),g=[],p=x=>(x<10?'0':'')+x;let a=NaN,b=NaN,l=null;
    this.live().forEach(e=>{
      if(!(e.inicio>=a&&e.inicio<b)){ /* solo se calcula la fecha al cambiar de día (la lista está ordenada) */
        const d=new Date(e.inicio),y=d.getFullYear(),o=d.getMonth(),n=d.getDate(),k=y+'-'+p(o+1)+'-'+p(n);
        a=new Date(y,o,n).getTime();b=new Date(y,o,n+1).getTime();l=m.get(k);if(!l)m.set(k,l=[])}
      l.push(e);if(e.tipo==='sueno'&&(!e.fin||e.fin>=b))g.push(e)});
    m.g=g;return this._d=m}
};
let cfg=(()=>{try{const c=JSON.parse(localStorage.getItem('bebe.cfg')||'{}');return c&&typeof c==='object'&&!Array.isArray(c)?c:{}}catch(_){return{}}})();
const saveCfg=()=>{guardaLocal('bebe.cfg',JSON.stringify(cfg));pushCfg()};
