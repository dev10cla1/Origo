# ORIGO · Guía de traspaso

App web para familias: seguimiento del bebé, salud, preparativos y recuerdos. Es **un solo archivo** (`index.html`, ~190 KB: HTML + CSS + JS, sin dependencias ni servidor). Se publica en GitHub Pages y se instala en el móvil con "Añadir a pantalla de inicio".

## Estado
Fases 1 a 7 del rediseño **completadas y verificadas**. **Fase 8 (Firebase)**: código hecho y probado con un servidor simulado de dos móviles; configuración real ya puesta (proyecto `origo-5ae53`); comprobar que las reglas de `reglas-firestore.txt` están publicadas.

Verificación final: 27 pasos de uso real con Chromium (alta, registros rápidos, edición, deshacer, Salud, informe, pañales, preparativos, desarrollo, ajustes, persistencia) sin fallos ni errores de consola; 150 comprobaciones de pantalla (15 pantallas × 5 anchos × claro/noche) sin desbordes. Scripts en `qa/`.

## Identidad visual
Azul petróleo `#234366` (principal) · verde salvia `#82ADA0` · coral `#ECAF8E` · fondo `#F4F7F8`. Modo noche propio (fondo `#0C1524`), automático de 21:00 a 07:00 o forzado en Ajustes. El logo va **incrustado como SVG vectorial** (calcado de los contornos del original, mismos colores y formas, nítido a cualquier tamaño); copias en `assets/*.svg`. Los iconos `icon-192/512.png` se generan desde `assets/icono-app.svg`.

## Navegación
Barra inferior: **Hoy · Registros · Salud · Más**.
- **Hoy** (dos modos según `nacido()`: sin `cfg.nac` o fecha ya pasada = nacido):
  - *Embarazo* (`cfg.nac` futura, `vEmb()`): cuenta atrás, semana aproximada (40 − ceil(días/7), acotada a 4..42), trimestre, barra de semanas, un consejo de organización, progreso de Preparativos (botón → Más › Preparativos), próxima cita y botón **Ya ha nacido** (hoja con la fecha real → guarda `cfg.nac` y pasa al modo nacido). Sin botones de registro ni resumen; `tick()` sale si no existe `#wk`.
  - *Nacido*: estado actual, "Más registros", resumen del día, actividad reciente y pendientes. **Barra fija inferior** `#qbar` (Toma · Pañal · Sueño, 64 px, encima de la nav; `--nh` = alto de la nav, `body.qb` sube el aviso) solo en esta pestaña. Sin "mantener pulsado": **Toma** abre `sheetToma` (valores por defecto = últimos usados; un toque en Guardar), **Pañal** abre `panelPanal`, **Sueño** abre `panelSueno` (ahora / a las…; `toggleSueno(ts)` acepta hora).
  - Actividad reciente: `evRow(e,full,del)`; con `del` añade papelera (`ACT.elim`, borrado lógico + Deshacer). Solo se usa en Hoy.
  - Contraste: `--mute` claro `#5c6d83` (antes `#62748a`, 4,45:1 sobre `--bg`); el modo noche ya cumplía 4,5:1.
- **Registros**: cronología con filtros y selector de día · Estadísticas (hoy / 7 / 30 días con comparación).
- **Salud**: Crecimiento (curvas OMS) · Temperatura · Medicación · Vacunas · Citas + informe para el pediatra.
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
`manifest.webmanifest` + `sw.js` (en la raíz) + iconos `assets/icon-192.png` y `icon-512.png`: permiten instalar desde Chrome y abrir sin conexión. El service worker pide la página a internet primero (las actualizaciones llegan solas) y guarda el SDK de Firebase. Si cambias la lista de archivos de `sw.js` o los iconos, sube la versión (`origo-v2` ahora).

## Cómo publicar
Sube `index.html` a un repositorio de GitHub → Settings → Pages → rama `main`, carpeta raíz. Abre el enlace en el móvil y "Añadir a pantalla de inicio". Haz copias periódicas con Ajustes → Exportar (incluye fotos).

## Prompt para empezar el siguiente chat
> Continúo el proyecto ORIGO (app web de seguimiento de bebé en un único `index.html`, adjunto junto con `TRASPASO.md`). Las fases 1–8 están terminadas (la 8 conecta Firebase: Firestore + Auth, familias con código, sincronización y autoría). No cambies el stack, la identidad visual ni funcionalidades existentes. Guíame paso a paso (no soy programador).
