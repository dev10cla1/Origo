/* ===== Desarrollo: momentos, hitos, alimentos nuevos y alimentación complementaria ===== */
const HITOS=[
[2,['Se calma cuando le hablas o lo coges','Te mira a la cara','Parece contento de verte','Sonríe cuando le hablas o le sonríes','Hace sonidos distintos del llanto','Reacciona a los ruidos fuertes','Te sigue con la mirada','Mira un juguete durante unos segundos','Sostiene la cabeza cuando está boca abajo','Mueve los dos brazos y las dos piernas','Abre las manos un momento']],
[4,['Sonríe por sí mismo para llamar tu atención','Se ríe un poco cuando intentas hacerle reír','Te mira, se mueve o hace sonidos para atraer tu atención','Hace sonidos tipo «oooh» y «aaah»','Te contesta con sonidos cuando le hablas','Gira la cabeza hacia el sonido de tu voz','Abre la boca al ver el pecho o el biberón si tiene hambre','Mira sus manos con interés','Mantiene la cabeza firme cuando lo sostienes','Agarra un juguete si se lo pones en la mano','Golpea juguetes con el brazo','Se lleva las manos a la boca','Se apoya en los codos o antebrazos boca abajo']],
[6,['Reconoce a las personas conocidas','Le gusta mirarse en el espejo','Se ríe a carcajadas','Se turna contigo para hacer sonidos','Hace pedorretas','Emite chillidos','Se lleva las cosas a la boca para explorarlas','Alcanza un juguete que quiere','Cierra los labios cuando no quiere más comida','Se da la vuelta de boca abajo a boca arriba','Se apoya con los brazos estirados boca abajo','Sentado, se apoya en las manos']],
[9,['Se muestra tímido o inquieto con desconocidos','Muestra varias expresiones (alegría, tristeza, enfado, sorpresa)','Mira cuando lo llamas por su nombre','Reacciona cuando te vas (mira, estira los brazos o llora)','Sonríe o ríe con el «cu-cú»','Hace sonidos como «mamama» y «bababa»','Levanta los brazos para que lo cojas','Busca objetos que se le caen fuera de la vista','Golpea dos objetos entre sí','Se sienta solo','Pasa objetos de una mano a otra','Acerca la comida hacia sí con los dedos','Se mantiene sentado sin apoyo']],
[12,['Juega contigo (palmitas, «toca-toca»)','Dice adiós con la mano','Llama «mamá» o «papá» (o un nombre especial)','Entiende «no» (se detiene un momento)','Mete un objeto en un recipiente','Busca cosas que ve esconder','Se pone de pie agarrándose','Anda agarrándose a los muebles','Bebe de un vaso sin tapa si se lo sujetas','Coge cosas pequeñas con pulgar e índice']]];
const ALG=[['huevo','Huevo'],['leche','Leche de vaca (yogur, queso)'],['pescado','Pescado'],['cacahuete','Cacahuete'],['frutos','Frutos secos'],['gluten','Trigo (gluten)'],['sesamo','Sésamo'],['soja','Soja'],['marisco','Marisco']];
const RX={ok:'Sin reacción',leve:'Reacción leve',seria:'Reacción importante'};
const SL=[['d','Desayuno'],['c','Comida'],['m','Merienda'],['n','Cena']];
let sub='mom',menuDia=0,openG={};
const dkey=i=>{const d=new Date();d.setDate(d.getDate()+i);return d.toLocaleDateString('sv-SE')};
const edadM=()=>cfg.nac?mesesDe(Date.now()):0;
const hitoAbierto=m=>openG[m]!==undefined?openG[m]:(edadM()>=m-1.5&&edadM()<=m+2);
function vDes(){
  return'<h1>Desarrollo</h1>'+SG('sub',[['mom','Diario',IC.momento],['hit','Hitos',ISG.est],['ali','Alimentos',IC.alim]],sub)+({mom:vMom,hit:vHit,ali:vAli})[sub]();
}
Object.assign(ACT,{
  sub(v){sub=v;render()},
  del(id){Store.patch(id,{borrado:true});toast('Borrado',()=>Store.patch(id,{borrado:false}))},
  hg(m){openG[m]=!hitoAbierto(+m)},
  hito(id){cfg.hitos=cfg.hitos||{};if(cfg.hitos[id])delete cfg.hitos[id];else cfg.hitos[id]=Date.now();saveCfg();render()},
  mdia(i){menuDia=+i;render()},
  mslot(k){const key=dkey(menuDia),cur=((cfg.menu||{})[key]||{})[k]||'',lb=SL.find(x=>x[0]===k)[1];
    sheet('<h2 style="margin-top:0">'+lb+'</h2><input id="mx" value="'+esc(cur)+'" placeholder="Ej.: puré de calabaza y pollo">',()=>{cfg.menu=cfg.menu||{};const o=cfg.menu[key]=cfg.menu[key]||{},v=$('mx').value.trim();if(v)o[k]=v;else delete o[k];saveCfg();render()})},
  mom(){sheet('<h2 style="margin-top:0">Nuevo momento</h2><label>¿Qué ha pasado?</label><textarea id="mt"></textarea><label>Fecha</label><input id="mf" type="date" value="'+dkey(0)+'">',()=>{
    const t=$('mt').value.trim();if(!t)return false;const f=$('mf').value,ts=f===dkey(0)?Date.now():new Date(f+'T12:00').getTime();
    const e=Store.add({tipo:'momento',inicio:ts,fin:null,datos:{t}});toast('Momento guardado',()=>Store.patch(e.id,{borrado:true}))})},
  ali(){sheet('<h2 style="margin-top:0">Alimento nuevo</h2><label>Alimento</label><input id="af" placeholder="Ej.: calabaza, huevo cocido…"><label>Alérgeno habitual</label><select id="ag"><option value="">Ninguno / otro</option>'+ALG.map(([k,l])=>'<option value="'+k+'">'+l+'</option>').join('')+'</select><label>Reacción</label>'+chips('ar',[['ok','Ninguna'],['leve','Leve'],['seria','Importante']],'ok')+'<div class="mute" style="margin:-4px 0 10px">Si hay dificultad para respirar, hinchazón de labios o cara, urticaria extensa, vómitos repetidos o decaimiento: llama al 112.</div><label>Notas</label><input id="an" placeholder="Ej.: manchas rojas alrededor de la boca"><label>Fecha</label><input id="ad" type="date" value="'+dkey(0)+'">',()=>{
    const n=$('af').value.trim()||(ALG.find(x=>x[0]===$('ag').value)||[])[1];if(!n)return false;
    const d=$('ad').value,ts=d===dkey(0)?Date.now():new Date(d+'T12:00').getTime();
    addEv('alim',{n,a:$('ag').value,r:chipVal('ar'),nota:$('an').value.trim()},ts,'Alimento registrado')})}
});
