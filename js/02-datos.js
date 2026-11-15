/* ===== Capa de datos =====
   localStorage es la copia local; con Firebase, add() y patch() además envían el registro a Firestore
   (ver bloque "Sincronización con Firebase"). */
/* Guardar en este móvil sin romper nada si el almacenamiento está lleno o bloqueado */
let sinEsp=false;
function guardaLocal(k,v){try{localStorage.setItem(k,v);return true}catch(_){if(!sinEsp){sinEsp=true;setTimeout(()=>toast('Este móvil se ha quedado sin espacio para Origo. Exporta una copia desde Ajustes.',null,null,9000),0)}return false}}
const Store={
  _ev:(()=>{try{const a=JSON.parse(localStorage.getItem('bebe.ev')||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}})(),_l:null,
  get ev(){return this._ev},set ev(v){this._ev=v;this._l=null},
  /* touch(): avisa de que los registros han cambiado (invalida la lista ordenada en caché) */
  touch(){this._l=null},
  write(){this._l=null;return guardaLocal('bebe.ev',JSON.stringify(this._ev))},
  save(){this.write();render()},
  add(e){e.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);e.borrado=false;if(Sync.on&&Sync.uid)e.por=Sync.uid;this.ev.push(e);this.save();pushEv(e);return e},
  patch(id,p){const e=this.ev.find(e=>e.id===id);if(!e)return;Object.assign(e,p);this.save();pushEv(e)},
  /* Registros vivos, del más reciente al más antiguo. La lista se reutiliza hasta el siguiente cambio: no modificarla. */
  live(){return this._l||(this._l=this.ev.filter(e=>!e.borrado).sort((a,b)=>b.inicio-a.inicio))}
};
let cfg=(()=>{try{const c=JSON.parse(localStorage.getItem('bebe.cfg')||'{}');return c&&typeof c==='object'&&!Array.isArray(c)?c:{}}catch(_){return{}}})();
const saveCfg=()=>{guardaLocal('bebe.cfg',JSON.stringify(cfg));pushCfg()};
