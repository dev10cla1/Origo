# ORIGO · Guía de traspaso

App web para familias: seguimiento del bebé, salud, preparativos y recuerdos. Es **un solo archivo** (`index.html`, ~190 KB: HTML + CSS + JS, sin dependencias ni servidor). Se publica en GitHub Pages y se instala en el móvil con "Añadir a pantalla de inicio".

## Estado
Fases 1 a 7 del rediseño **completadas y verificadas**. **Fase 8 (Firebase)**: código hecho y probado con un servidor simulado de dos móviles; configuración real ya puesta (proyecto `origo-5ae53`); comprobar que las reglas de `reglas-firestore.txt` están publicadas.

Verificación final: 27 pasos de uso real con Chromium (alta, registros rápidos, edición, deshacer, Salud, informe, pañales, preparativos, desarrollo, ajustes, persistencia) sin fallos ni errores de consola; 150 comprobaciones de pantalla (15 pantallas × 5 anchos × claro/noche) sin desbordes. Scripts en `qa/`.

## Identidad visual
Azul petróleo `#234366` (principal) · verde salvia `#82ADA0` · coral `#ECAF8E` · fondo `#F4F7F8`. Modo noche propio (fondo `#0C1524`), automático de 21:00 a 07:00 o forzado en Ajustes. El logo va **incrustado como SVG vectorial** (calcado de los contornos del original, mismos colores y formas, nítido a cualquier tamaño); copias en `assets/*.svg`. Los iconos `icon-192/512.png` se generan desde `assets/icono-app.svg`.

## Escena (fondo según la luz del día)
Cuatro ilustraciones en `assets/escena-{amanecer,dia,atardecer,noche}.jpg` (1438×2576). `fase()` usa horas fijas (`FASES`): **amanecer** 8:00 · **día** 9:00 · **atardecer** 18:30 · **noche** 21:00–8:00. Se guarda en `html[data-f]`; cada fase define colores (`--sb` fondo inferior, `--st` color de la barra de estado del móvil, `--nm` color del nombre, etc.). `theme()` (cada minuto) la actualiza; el tema **Auto** pasa a modo noche cuando la fase es noche. La escena (`#scene`) solo se ve en Hoy (`body.scn`), y ahí las tarjetas son de cristal oscuro. Las hojas (Toma, Pañal, Sueño…) abiertas desde Hoy toman los colores de la fase (`--shb`, `--shg`, `--sha`). El fondo del documento y una prolongación de la barra inferior (`nav::after`) evitan bordes blancos; el manifiesto usa fondo oscuro. En modo oscuro el logo de las demás pestañas es blanco y más pequeño. Para probar una fase: `faseFija='dia';theme();render()`.

## Navegación
**Sin barra inferior.** Desde Hoy se toca la **tarjeta de estado** (o la tarjeta de cuenta atrás en embarazo) → `ACT.menu` abre el menú (`MENU`): Registros · Estadísticas · Salud · Pañales · Preparativos · Desarrollo · Resumen del día · Ajustes (`ACT.ir`). El engranaje de la cabecera abre Ajustes. Las demás pantallas llevan arriba **‹ Inicio** (`subTop()`, `ACT.inicio`); al salir de Hoy se añade una entrada al historial, así el gesto «atrás» del móvil vuelve a Inicio.
Toda la app usa los colores de la fase (`body.scn`): en Hoy con la ilustración y en el resto con un degradado del color de la fase; tarjetas de cristal oscuro. Ya no hay selector de tema (siempre oscuro). Los scripts de `qa/` aún hacen clic en la barra inferior: hay que adaptarlos.
- **Hoy** (dos modos según `nacido()`: sin `cfg.nac`, o fecha pasada sin `cfg.emb` = nacido):
  - *Embarazo* (`cfg.nac` futura, `vEmb()`): misma escena con nombre y cuenta atrás; debajo, semana aproximada (40 − ceil(días/7), acotada a 4..42), trimestre, barra de semanas, un consejo de organización, progreso de Preparativos (botón → Más › Preparativos), próxima cita y botón **Ya ha nacido** (hoja con la fecha real → guarda `cfg.nac` y pasa al modo nacido). Sin botones de registro ni resumen; `tick()` sale si no existe `#wk`.
  - *Nacido*: **escena ilustrada** a pantalla completa (ver «Escena»). Primera pantalla (`.hx`, alto = pantalla − nav): cabecera (logo + engranaje → Ajustes), nombre grande y edad, y abajo la **tarjeta de estado** minimalista (`.st`: despierto/durmiendo, tiempo, barra de ventana de sueño, última toma y último pañal; la actualiza `tick()` con `#wkl #wk #wkh #wbar #sd #ago #pago`) y los **tres botones grandes** (`.qk`: Toma · Pañal · Sueño, iconos de color `IQ`). Al deslizar: Más registros · Resumen (cambio de turno), resumen del día, actividad reciente y pendientes. **Toma** abre `sheetToma` (valores por defecto = últimos usados), **Pañal** `panelPanal`, **Sueño** `panelSueno` (ahora / a las…). En Hoy no se muestra la franja «Durmiendo» (`#ban`), solo en las demás pestañas.
  - Actividad reciente: `evRow(e,full,del)`; con `del` añade papelera (`ACT.elim`, borrado lógico + Deshacer). Solo se usa en Hoy.
  - Contraste: `--mute` claro `#5c6d83` (antes `#62748a`, 4,45:1 sobre `--bg`); el modo noche ya cumplía 4,5:1.
- **Registros**: cronología con filtros y selector de día · Estadísticas (hoy / 7 / 30 días con comparación).
- **Salud**: Crecimiento (curvas OMS) · Temperatura · Medicación · Vacunas · Citas + informe para el pediatra.
  - Vacunas → Citas: al guardar una vacuna con fecha (o al añadir una), se crea o actualiza una cita enlazada (`vacSync`, campo `vac`, id `cv-…`), con hora opcional (sin hora → `dia:1`, se muestra solo la fecha con `citaF`). Editar la fecha en la cita cambia la fecha prevista de la vacuna; elegir «No» o borrar la vacuna quita la cita. Pendientes no repite la vacuna si ya tiene cita.
- **Más**: Pañales · Preparativos · Desarrollo (Diario, Hitos, Alimentos) · Ajustes y copia de seguridad.

## Arquitectura del código (dentro de `index.html`)
- **Capa de datos `Store`**: `ev` (eventos), `add`, `patch`, `live`, `save`. Todo evento tiene `id, tipo, inicio, fin, datos{}, borrado` (borrado lógico → permite deshacer).
- **`cfg`** (objeto, `saveCfg()`): perfil y todo lo que no es un evento.
- **`FOT`** (`saveFot()`): fotos del diario (JPEG ≤900 px).
- **Interacción**: delegación de clics con `data-a="accion" data-v="valor"` → objeto `ACT`. Ventanas: `sheet(html, onSave)` (con Guardar), `panel(html, etiqueta)` (sin Guardar). `render()` redibuja la pestaña; `tick()` actualiza los tiempos cada segundo.
- Los bloques están separados por comentarios `/* ===== ... ===== */`.

### Sincronización (bloque "Sincronización con Firebase")
- `FIREBASE_CONFIG = null` → la app funciona solo en el dispositivo, como antes. Con configuración → pide cuenta (correo y contraseña) y familia.
- SDK modular **12.0.0** desde gstatic (import dinámico). Firestore con caché persistente (cola sin conexión). **Sin Storage** (desde 2024 exige plan de pago): las fotos van como documentos de Firestore.
- Modelo: `usuarios/{uid} {fid}` · `familias/{código de 8} {miembros[], nombres{uid}, cfg{}, creado}` · `familias/{fid}/eventos/{id} {tipo, inicio, borrado, por, j (evento en JSON), act (hora del servidor)}` · `familias/{fid}/fotos/{id} {d, act}`. Una familia = un bebé.
- `cfg` se guarda clave a clave (texto JSON; objetos simples por subclave) con mezcla a tres bandas (`origo.base`), así dos móviles pueden cambiar cosas distintas a la vez.
- Eventos: escucha incremental `act > última vista − 2 min` (`origo.seen`) para no releer todo cada vez. Registros hechos antes de conectar → `origo.pend`.
- Fotos: se descargan al verse (Proxy sobre `FOT`) y quedan en la caché de Firestore.
- Autoría: `por` en cada evento; se muestra (si la familia tiene 2+ miembros) en Registros, en la ficha de edición y en el Resumen ("Registros de hoy").
- Invitación: el código de familia (Ajustes → Familia). Las reglas solo dejan a quien no es miembro añadirse a sí mismo (máx. 6).
- Borrar todo / Importar afectan a toda la familia (borrado lógico propagado).

### Almacenamiento local (localStorage)
`bebe.ev` (eventos) · `bebe.cfg` (configuración) · `bebe.fotos` (fotos; con Firebase solo las aún no subidas) · `origo.*` (sesión, familia, cola y marcas de sincronización).

**Tipos de evento (`tipo` → `datos`)**: `toma {ml, leche, lado, min}` · `panal {k: pis|caca|ambos|seco, talla}` · `sueno {}` (con `fin`) · `temp {c, m, nota}` · `med {farmaco, ml, conc}` · `medida {peso, talla, pc}` · `alim {n, a, r: ok|leve|seria, nota}` · `comida {slot, t, acep}` · `momento {t, cat, foto}`.

**Claves de `cfg`**: `nombre, nac` (fecha de nacimiento o, en embarazo, fecha prevista)`, emb` (true en embarazo hasta pulsar «Ya ha nacido»; evita pasar solo al modo bebé si se pasa la fecha prevista)`, sexo(f|m), tema, talla, stock{talla:n}, panInfo, panMov[], prep[], prepV, pautas[], vacs{}, vacX[], citas[], preg[], hitos{}, hitoO{}, menu{}, alimPlan[], alerg[]`. Hay migraciones automáticas desde formatos anteriores (`pauta`→`pautas`, `vd`→`vacs`, categorías de preparativos).

## Datos de referencia (verificados en fuentes oficiales)
- **Curvas OMS 2006** (0–24 m, peso/talla/perímetro, niño/niña): parámetros LMS contrastados con tablas publicadas; cada mediana cae en P50.
- **Hitos**: CDC/AAP 2022 (2, 4, 6, 9, 12 meses), redactados con palabras propias; categorías asignadas manualmente.
- **Alimentación**: resumen de recomendaciones AEP/AESAN (miel, nitratos, mercurio, atragantamiento, gluten 4–11 m).
- **Vacunas**: calendario andaluz 2026 **verificado con la Instrucción DGSPyOF-1/2026 y las instrucciones de neumococo y meningococo de andavac.es** (nov 2026): hexavalente 2-4-11 · neumococo 2-4-6-11 · meningococo B 2-4-15 · MenACWY 4 y 12 · rotavirus 2 y 4 · triple vírica 12 m y 2 años · varicela 15 m y 2 años. No incluye nirsevimab (VRS) ni gripe (campañas anuales; se pueden añadir con «Añadir vacuna»). Revisar cada enero.
- Ninguna pantalla calcula dosis: la medicación solo guarda la pauta del pediatra.

## Límites conocidos
Notificaciones reales · vídeos · avatar con foto (los registros sin conexión se envían solos al volver).

## Instalación (PWA)
`manifest.webmanifest` + `sw.js` (en la raíz) + iconos `assets/icon-192.png` y `icon-512.png`: permiten instalar desde Chrome y abrir sin conexión. El service worker pide la página a internet primero (las actualizaciones llegan solas) y guarda el SDK de Firebase. Si cambias la lista de archivos de `sw.js` o los iconos, sube la versión (`origo-v3` ahora).

## Cómo publicar
Sube `index.html` a un repositorio de GitHub → Settings → Pages → rama `main`, carpeta raíz. Abre el enlace en el móvil y "Añadir a pantalla de inicio". Haz copias periódicas con Ajustes → Exportar (incluye fotos).

## Prompt para empezar el siguiente chat
> Continúo el proyecto ORIGO (app web de seguimiento de bebé en un único `index.html`, adjunto junto con `TRASPASO.md`). Las fases 1–8 están terminadas (la 8 conecta Firebase: Firestore + Auth, familias con código, sincronización y autoría). No cambies el stack, la identidad visual ni funcionalidades existentes. Guíame paso a paso (no soy programador).
