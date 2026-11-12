# Continuidad operativa de Nottas

## Ajustes de subtareas y foco — 12/11/2026 (v0.27.119)

- **AW:** «Ir al final» conserva el gesto y usa flecha vectorial con trazo Nottas, no carácter tipográfico; Android `nottas.html` y web `index.html` + `nottas-ui.css`.
- **Web:** `#editSubtasks` desplaza solamente las filas (máximo 30vh/300px); `#editSubtaskContent` no recorta el pie, y el botón de agregar permanece después de la lista visible. El salto apunta al scroll del listado, no al contenedor exterior. Se conservan los «Elementos marcados» independientes.
- **Android:** títulos vacíos de tarea o nota (nuevas o existentes) reciben foco; con título abren sin teclado; las llamadas especializadas que pasan `autoFocus:false` conservan esa excepción. Web replica foco según título.
- **Entrega:** frontend publicado en Worker `nottas-web-preview` (15 rutas y `/stable`/`/classic` conservados). Android subió a `0.27.119`, `versionCode 200`, **APK firmada confirmada** en Release `v0.27.119` mediante Actions `43275668042` (compilación, firma y publicación correctas). Prueba física de teclado pendiente. Sin cambios FCM/WSS/backend.


## Corrección preventiva de pérdida de datos y mejoras del editor — 12/11/2026

- **Android 0.27.118 (versionCode 199):** `assistantApplyRemoteChange` conserva siempre notas/tareas/categorías `syncState=pending` ante snapshots remotos y conflictos, eleva revisión para reintentar cuando el servidor rechaza el cambio; `assistantMarkAccepted` solo confirma una versión que coincida con la revisión efectivamente enviada. Esto evita sobrescribir ediciones offline o recientes con respuestas antiguas. El guardado local y backup nativo continúan independientes de la red. La causa reportada no está reproducida físicamente: verificar con modo avión, edición, reconexión y versiones concurrentes.
- **Android editor:** «+ Añadir subtarea» ancho total; botón contextual «Ir al final ↓» visible al desplegar lista existente; nuevas tareas/notas sin enfoque inicial automático, salvo nota existente sin título. La captura rápida conserva su enfoque cuando el usuario la abre expresamente.
- **Web experimental:** equivalentes de botón ancho, «Ir al final» dentro de la lista desplazable y apertura del editor sin foco automático (nota existente sin título sigue enfocada). Publicado en Worker `nottas-web-preview`, con `/stable` y `/classic` preservados; no se tocó backend FCM/WSS.
- **Entrega:** cambios y versión registrados en `main`; GitHub Actions publica por push tras firma. **Publicación confirmada:** GitHub Actions `43272639018` compiló y verificó firma correctamente; Release `v0.27.118` publicada con `Nottas-v0.27.118.apk` (3.15 MB) para Obtainium. Pruebas físicas de instalación y reconexión offline pendientes.


## Ajustes web de edición — 12/11/2026

- En `feature/nottas-web-initial`: scroll contenido en `#editSubtaskContent` (overscroll contain), indicador activo del formato B/I/U/S según selección, chevrón del tipo de bloque integrado al botón y editor de texto sin superficie de tarjeta. Commits `af63c52` y `b79959b`.
- **Publicado en Cloudflare**: Worker `nottas-web-preview` actualizado mediante API y verificado por lectura del script desplegado (15 rutas, assets nuevos y respaldos `/stable` y `/classic`). Prueba real en navegador pendiente. No tocar FCM/WSS, Android ni backend por estos cambios.


**Actualizado:** 12 de noviembre de 2026 (interfaz web de subtareas/paneles flotantes publicada; FCM + WSS sin cambios).  
**Objetivo:** retomar el desarrollo en un chat nuevo sin depender del historial de conversaciones. Este archivo es una ficha de entrada, **no** reemplaza al código, las pruebas ni a los documentos de detalle.

## Correcciones de editor web — 12/11/2026

- **Vigente en Cloudflare:** `https://nottas-web-preview.losrobles.workers.dev/`, actualización 12/11/2026 14:16:16 UTC. Web en rama `feature/nottas-web-initial`, respaldo visual anterior en `/stable`; Android/backend no modificados, no APK nueva.
- **Bugs reportados con capturas:** «Tipo → Tarea» era un `select` inutilizable porque edición deshabilita el cambio de tipo; solo se veían parte de 69 subtareas («Mejoras», 31/69); selector de bloques nativo con franja clara; sombras HTML impropias del Design System.
- **Solución aplicada:** `#type` permanece oculto para la lógica de creación (botones «Nueva nota» y «Tarea»); `web/nottas-editor.js` usa menú de formato propio con las siete opciones Android, cierre clic fuera/Escape. La visualización del árbol elimina el límite `depth>12` (500 como protección excepcional), conserva `{...n}` en la normalización de nodos y no agrupa como completa una subtarea raíz con hijos pendientes. `textarea` de altura automática muestra textos largos. `web/nottas-ui.css` elimina sombras convencionales de tarjetas/diálogos/menús/paneles; mantiene paleta, contornos y radios nativos.
- **Pruebas realizadas:** sintaxis JS, IDs y SVG correctos; **test sintético** del renderizado con 69 nodos: plano con 31 marcados → 38 pendientes y 31 marcados; cadena anidada de 69 → 69 representados. Worker Cloudflare actualizado e inspeccionado, WebSocket y sesión persistente siguen, sin polling. **No se ha probado** en el navegador del usuario que «Mejoras» visualice 69 ni la sincronización real tras editar.
- **Regresión:** no tocar FCM, WSS, D1 ni Android para cambios visuales; conservar `/stable`. Ver `web/README.md` de la rama web para detalles, y evaluar la lista real antes de afirmar paridad completa.

## Nottas Web — experiencia de Android en escritorio (12/11/2026)

**Actualización web publicada en Cloudflare** (13:45:32 UTC del 12/11/2026): `https://nottas-web-preview.losrobles.workers.dev/`. Rama del frontend `feature/nottas-web-initial`; respaldo de interfaz/sincronización `/stable` y cliente antiguo `/classic`. **No se modificó Android ni el backend**, ni se publicó APK nueva.

- **Problema de diseño reconocido:** antes la web aún se parecía a un formulario HTML, no al flujo de Android. Referencia autoritativa `main:app/src/main/assets/nottas.html`: `taskSubtasksSummaryCard`, `taskCheckedSectionToggle`, paneles `taskInline*`, ruedas `timeWheel`, chips `taskMetaChip`, plus `DESIGN_SYSTEM.md`.
- **Tarjetas:** vista web con tarjeta fija «Subtareas» y contador, visible aunque plegada; clic abre/cierra. «Elementos marcados» queda al final con chevrón y plegado independiente, solo agrupa completadas de nivel raíz (los hijos mantienen su jerarquía). Los checks guardan por `POST /v1/sync`.
- **Editor:** orden título → chips compactos de fecha/hora/recordatorio/categoría/estado → notas → tarjeta de subtareas plegable → `Más opciones` (campos extensos). El editor sigue guardando todos los datos Android originales y no borra campos ocultos.
- **Paneles flotantes:** nuevo `web/nottas-float.js` con calendario mensual propio, controles Hoy/Mañana/Pasado mañana, rueda de 24 horas y 60 minutos, recordatorios múltiples, categoría, prioridad, estado, recurrencia y etiquetas. En la tarjeta guardan por `NottasEditor.quick`; dentro del editor mutan solo el borrador hasta Guardar. Cerrar fuera/Escape, clic repetido cierra.
- **Archivos web:** `web/index.html`, `web/nottas-ui.js`, `web/nottas-ui.css`, `web/nottas-editor.js`, `web/nottas-float.js` (más categorías, calendario y sprite existentes). No añadir polling ni modificar FCM/WSS por una mejora de UI.
- **QA estático realizado:** seis módulos JS válidos, 104 IDs DOM sin duplicados ni referencias faltantes, símbolos SVG disponibles, orden visual de secciones, ausencia de `setInterval`, Worker web publicado/inspeccionado, `/stable` y `/classic` conservados. **QA real pendiente:** navegar y guardar en navegador/dispositivo, ruedas, desplegables, permisos de Oficina y sincronización de todos los campos en Android; no declarar paridad completa ni funcionalidad que no se haya probado.
- **Siguiente prioridad:** confirmar interacción real (abrir subtareas, ocultar marcadas, configurar fecha/hora/recordatorio con panel desde tarjeta y desde editor, completar y recibir cambios instantáneos en teléfono). Funciones Android aún no espejadas: todas las píldoras de captura rápida dentro del texto, eventos Google Calendar, comunicaciones de equipo y ajustes específicos de OS. Registrar incidencias sin romper FCM + WebSocket.

## Nottas Web — categorías, captura rápida y toques (12/11/2026)

- **Publicación vigente:** `https://nottas-web-preview.losrobles.workers.dev/`, Worker estático Cloudflare actualizado el 12/11/2026 (12:33 UTC), sin cambios en Android, API/D1, FCM ni WSS. Fallbacks: `/stable` conserva la web anterior con sesión persistente y sync automático, y `/classic` la básica.
- **Nuevos archivos de frontend (rama `feature/nottas-web-initial`):** `web/nottas-categories.js` renderiza las categorías usando exactamente el contrato Android `categorySymbolHtml()` (`ns-event-*`, emoji, color y punto de respaldo) a partir del mismo snapshot; `web/nottas-schedule.js` adapta `parseQuickSchedule()` a fechas y horas locales, sin polling.
- **Editor y tarjetas:** categoría con menú ilustrado real (no `select` de texto), chips accionables de fecha/hora inicio-fin, recordatorios, categorías, etiquetas, prioridad y estado; botón para abrir el selector nativo (cuando `showPicker` esté disponible); días y horas rápidos; resumen y botón Quitar recordatorios. En tareas **nuevas** escribir `mañana 2p`, `430p`, días de semana o fecha concreta genera sugerencia pulsable «Usar fecha y hora», que completa los campos y limpia el título. Aún no son las mismas píldoras internas de texto de Android.
- **Corrección del check:** los checks de tareas/subtareas/notas realizan `POST /v1/sync`, muestran cambio optimista inmediato, aplican payload aceptado o revierten explícitamente ante conflicto/error; después concilian snapshot. No manipulan FCM/WSS, ni introducen `setInterval`.
- **QA realizado:** parser de fecha/hora evaluado con casos locales; pruebas simuladas de guardado de tarea y subtarea, y restauración del check al rechazar el servidor; sintaxis de 5 JS, sin IDs DOM ni iconos faltantes. El Worker publicado fue leído desde Cloudflare y contiene assets, respaldos, WSS y persistencia. **Falta** prueba navegador real con cuenta y Android, de recordatorios/horarios/clicks/íconos e interacción táctil; no declarar validación end-to-end.
- **Regla de continuidad:** mantener la arquitectura FCM (Web→Android) + WSS Durable Object (Android→Web), sesión recordada y los datos Android originales. Antes de modificar sincronización volver a probar crear/borrar nota/tarea en ambos sentidos sin actualizar manualmente. Detalles en `web/README.md` de la rama web.

## Nottas Web — editor operativo y espacios nativos (10/11/2026)

- **Último cambio en previsualización (NO APK):** `https://nottas-web-preview.losrobles.workers.dev/` incorpora un selector Personal/Oficina propio de Nottas (elimina franja blanca del `select` nativo), tarjetas con casillas accionables y editor funcional con bloques, subtareas, fecha/hora, múltiples recordatorios y estados de reunión. Versión anterior con sincronización y sesión funcionales disponible en `https://nottas-web-preview.losrobles.workers.dev/stable` con recursos propios; cliente primitivo de respaldo adicional en `/classic`.
- **Modelo Android como contrato:** `app/src/main/assets/nottas.html` (bloques `paragraph/heading/subheading/quote/bullet/number/checklist`, estructura `items` recursiva + `subtasks`, `reminders` en minutos, `dueDate/endDate/dueTime/endTime`, `meetingStatus`, `approvalStatus`, `priority`, `recurrence`, `category`, `tags`); compartir esos campos, nunca inventar alternativas. Editor `web/nottas-editor.js` en rama `feature/nottas-web-initial`, interfaz `web/index.html`, vistas `web/nottas-ui.js`, estilo `web/nottas-ui.css`.
- **Funciones implementadas:** editar bloques enriquecidos y checklists sin perder los otros bloques; subtareas anidadas editables con marcar, añadir, borrar y reordenar; checks rápidos desde las tarjetas; programación, recordatorios y categorías; aprobación (agendar propuesta desde rol dueño) y estados de reunión; botón «Agendar» desde día seleccionado del calendario; iconos, etiquetas y prioridades visibles.
- **Sincronización protegida:** mismo `POST /v1/sync`, FCM y WSS, sin polling. `stopRealtime/startRealtime`, `request`, `restoreAccount`, `push` y `remove` comprobados idénticos a baseline con sesión persistente. `refresh` solo lee también entidades `category` del mismo snapshot, sin otra consulta. Backend/API, D1 y Android no cambiaron; no nueva APK.
- **QA estático efectuado:** 3 scripts JavaScript válidos, sin IDs duplicados ni referencias DOM/SVG ausentes, iconos disponibles, Worker estático con CSS/JS/editor y `/stable` inspeccionado en Cloudflare. **QA manual todavía pendiente:** probar en navegador real checklist, subtareas, edición de bloques y agendar; validar creación/eliminación Android ↔ Web y permisos Personal/Oficina después del rediseño. No asumir paridad total de funciones avanzadas Android.
- **Cuidado:** proteger la confirmación bidireccional previa y la sesión persistente. Si se detecta una regresión, probar `/stable`, revisar específicamente los cambios de datos, no revertir FCM/WebSocket. Detalles en `web/README.md` de la rama experimental.

## Nottas Web — sesión vinculada persistente (10 de noviembre de 2026)

- **Problema:** cada recarga borraba `state.token` del navegador y exigía una nueva clave temporal Android, aunque la sesión siguiera válida en el servidor.
- **Solución en producción web:** `feature/nottas-web-initial:web/index.html` conserva el `sessionToken` y el espacio seleccionado, valida la sesión con `/v1/me` al entrar, reconstruye la interfaz y reactiva el mismo WebSocket. **No crea credenciales nuevas ni añade polling.** El primer acceso sí usa «Acceder desde otro teléfono», clave temporal de un solo uso.
- **Preferencia:** `Mantener sesión iniciada en este navegador` marcada por defecto al vincular; accesible en `Ajustes → Datos y respaldo → Sesión web`. Activada utiliza `localStorage` (sobrevive cierre y recargas del navegador); desactivada usa `sessionStorage` (recargas de pestaña). No habilitar persistencia en equipos compartidos.
- **Cierre seguro:** PR #12 fusionado en `main` (commit `d70b9c5a63388a2f652fcf8fac350c34936fa9c2`) añade `POST /v1/auth/logout`, que revoca solo el token del cliente; `redeemAccountKey` identifica `web-*` como plataforma `web`. Sin alterar sesiones Android, FCM ni `/v1/sync`. La web elimina el token del almacenamiento al salir. Si falla la red, conserva el token al restaurar; solo borra por 401.
- **Comprobaciones:** PR #12 CI `42930298365` exitoso; despliegue backend `42930374923` exitoso; API Cloudflare inspeccionada. Web de previsualización actualizada e inspeccionada; `request`, `refresh`, `save`, `push`, `remove`, `stopRealtime` y `startRealtime` idénticos a la versión anterior. Sin timers/polling nuevos y sin APK nueva.
- **Pendiente de prueba humana:** recargar, cerrar/abrir navegador, cambiar «Mantener sesión» y salir; verificar en dispositivos reales la sincronización bidireccional que ya estaba confirmada antes de este cambio. Si se rechaza/revoca la sesión, habrá que vincular de nuevo; eso es intencional.
- **Referencia:** `web/README.md` de `feature/nottas-web-initial`. No revertir FCM/WSS para resolver cuestiones de inicio de sesión.

## Nottas Web — identidad Android adaptada a escritorio (10 de noviembre de 2026)

- **Versión web publicada:** `https://nottas-web-preview.losrobles.workers.dev/`. Se actualizó la capa visual sobre el cliente de sincronización por eventos **ya confirmado**. El cliente anterior permanece como respaldo en `https://nottas-web-preview.losrobles.workers.dev/classic`; no modificar ni sustituir el canal WSS/FCM para cambios estéticos.
- **Fuentes originales:** `DESIGN_SYSTEM.md` 1.3; `app/src/main/assets/design-system.css`, `nottas.html` y `nottas_wordmark.svg`. Logo original copiado a `web/nottas_wordmark.svg` e iconos a `web/nottas-icons.svg` (31 símbolos `ns-*` existentes y trazados nativos de 10 glifos de navegación). No se han inventado colores ni un nuevo sistema de componentes.
- **Frontend en** `feature/nottas-web-initial` (PR #8): `web/index.html`, `web/nottas-ui.css`, `web/nottas-ui.js`, SVGs. Encabezado/wordmark, barra lateral Espacios/Tareas/Notas/Papelera/Ajustes, tarjetas y checks redondos, búsqueda, filtros, modo claro/oscuro local, calendario Día/Semana/Mes/Agenda sobre tareas con fechas, vistas de Equipo y Ajustes con familias de Android, responsive.
- **Límites honestos:** calendario web solo consulta tareas fechadas internas (no integra aún Google Calendar), Equipo presenta espacios y roles (mensajería y llamadas siguen en Android), y en Ajustes solo la apariencia web es editable; las preferencias exclusivamente nativas se describen, no se simulan. El editor web conserva alcance básico previo; no afirmar paridad funcional de todos los formularios Android.
- **Sincronización protegida:** comparación textual de funciones de WebSocket y funciones `request`, `refresh`, `connect`, `openEditor`, `save`, `push`, `remove` con baseline funcional `53093c9`: **sin cambios**. No se introdujeron timers ni polling. Backend Cloudflare Worker y Android no se modificaron, tampoco D1 ni APK.
- **Comprobaciones realizadas:** sintaxis de los JS, unicidad de IDs, referencias DOM y símbolos SVG, existencia de assets y publicación de la web/CSP WSS confirmadas mediante API Cloudflare. **Por verificar:** visual real, interacciones y sincronización bidireccional tras este rediseño en navegador/teléfono; el éxito anterior en dispositivo corresponde a la versión visual precedente.
- **Regla:** los cambios visuales deben usar componentes reales de Android, preservar el flujo de sincronización verificado y tener ruta de retroceso; revisar el detalle en `web/README.md` de la rama experimental.

## Configuración de sincronización confirmada por el usuario — 10 de noviembre de 2026

**ESTADO VIGENTE Y REFERENCIA PARA NO INTRODUCIR REGRESIONES.** Tras instalar el receptor WebSocket, el usuario confirmó expresamente que **la sincronización entre Android y Nottas Web funciona automáticamente en ambos sentidos** («Ahora sí. Perfecto perfectísimo perfectote»). Esto sustituye los estados *pendiente de prueba* que aparecen en las secciones históricas posteriores. La confirmación es una prueba funcional del usuario; no equivale a una batería exhaustiva de dispositivos, desconexiones o permisos.

- **Web → Android:** se guarda por `POST /v1/sync`; el Worker envía `sync` mediante **Firebase Cloud Messaging (FCM)** también a los dispositivos de la cuenta autora. Corrección crucial: `pushWorkspaceSync` NO debe filtrar `user_id<>?` (PR #10).
- **Android → Web:** después de aceptar la escritura, el Worker emite una señal `{"type":"sync"}` **sin contenido de notas/tareas** a los clientes WebSocket autenticados de los miembros activos; el navegador actualiza por la API `/v1/sync?full=1`. Usa `wss://nottas-assistant-api.losrobles.workers.dev/v1/realtime`, con origen restringido a `https://nottas-web-preview.losrobles.workers.dev`.
- **Canal web:** Durable Object SQLite `SyncHub` (binding `SYNC_HUB`, migración `sync-hub-v1`) con hibernación; habitaciones separadas por identidad de usuario, token de sesión en subprotocolo WSS (no en la URL). El navegador se reconecta con backoff y concilia al reconectar, recuperar la pestaña o pulsar «Actualizar». **Sin polling ni consultas periódicas a D1**; las solicitudes se generan por eventos, operaciones o reconexión.
- **Código de referencia:** Worker en `cloudflare/assistant/src/index.js` y `cloudflare/assistant/wrangler.toml` de `main` (PR #11, merge `55af3a4ff17660ba2d5bbbacc7bc72d09ccc1e40`; PR #10 corrige FCM); Web en `feature/nottas-web-initial:web/index.html`, basada en la interfaz `0305339`, con añadido WebSocket (commit `53093c9c3353884c3763775759ca37bd4c3c0819`). El código web desplegado está en el Worker independiente `nottas-web-preview` de Cloudflare. La documentación detallada está en `web/README.md` de esa rama.
- **Pruebas/publicación:** backend CI run `42905553337` y deployment run `42905627037` exitosos; recursos Durable Objects y código web publicado comprobados. La comprobación de uso real **ahora sí está confirmada por el usuario**. La APK Android no se modificó ni hubo una nueva publicación por este cambio (v0.27.117).
- **Regla de regresión:** antes de modificar cualquiera de los dos canales, conservar y probar los cuatro flujos: crear y eliminar nota/tarea desde Android y desde la web, con recepción automática en el otro dispositivo; no sustituir WSS por polling ni excluir al autor de FCM. Mantener los cambios de UI y la sincronización aislados. No dar por confirmadas pruebas más amplias (reconexión, múltiples usuarios, conflicto de edición) que no se han ejecutado.

**Importante:** los relatos de versiones anteriores más abajo —incluido «sin WebSocket», «sin polling» de la base y las regresiones de 8 s/1,5 s— son **históricos, no describen el despliegue vigente**.

## Sincronización por eventos Android → Nottas Web — 10 de noviembre de 2026

- **Problema:** Android sí recibía avisos FCM originados en la web, pero el navegador base carecía de canal de entrada: Android→web no se actualizaba hasta pulsar «Actualizar». No era el mismo receptor ni había simetría.
- **Solución backend:** PR #11 (fusionado a `main`), agrega WebSocket autenticado `/v1/realtime` con subprotocolo de sesión y origen web limitado. Durable Object SQLite `SYNC_HUB` usa hibernación y separa conexiones por usuario. Cada `POST /v1/sync` aceptado envía un aviso **sin contenido** a las sesiones web de los miembros activos, sin cambiar FCM Android ni D1 de notas.
- **Cliente web:** en `feature/nottas-web-initial`, `web/index.html` conserva la base `0305339` y añade exclusivamente conexión/reconexión WSS y recarga del snapshot al recibir el evento o volver a enfocar. **No usa polling periódico**. Web Worker `nottas-web-preview` publicado con CSP que permite WSS.
- **Verificado:** GitHub Actions suite backend run `42905553337` exitosa; despliegue Worker backend run `42905627037` exitoso; recurso Durable Object registrado y Worker backend/web publicados e inspeccionados en Cloudflare. **Por verificar en dos dispositivos:** conexión WebSocket real y creación/eliminación Android→web; asimismo regresión Web→Android. No dar por probada la latencia real solo con despliegues.
- **Costos:** el canal abierto permite hibernación y no realiza consultas D1 temporizadas; hay solicitudes al producirse eventos, reconexiones y operaciones del usuario. No es consumo de cuota cero.
- **Android/APK:** no se modificaron los fuentes Android ni se publicó una APK nueva por este cambio; continúa v0.27.117. No reintroducir las revisiones web con polling de 8 o 1,5 segundos.

## Reparación de FCM Web → Android — 10 de noviembre de 2026

- **Causa comprobada:** la reparación #9 modificó erróneamente `pushWorkspaceReminderPatches` pero `pushWorkspaceSync` seguía consultando miembros con `AND user_id<>?`: excluía al autor de cada cambio. En Personal resultaba **cero destinatarios**, y en Oficina omitía otros dispositivos de la misma cuenta. Algunas tareas podían aparentar funcionar por `sync_task`, pero notas y eliminaciones dependían del refresh Android.
- **Arreglo:** PR #10, commit de fusión `4b9ac6bfaa5f0ed72428336f49a68afbd4d72fea`, elimina **solo en `pushWorkspaceSync`** el filtro que excluía al autor. Se mantiene la misma API, permisos, esquema D1, Android y web.
- **Pruebas:** cuatro tests de regresión para creación y eliminación, Personal/Oficina, más suite preexistente; GitHub Actions run `42903491020` exitoso. Despliegue backend run `42903588121` exitoso; fuente desplegada en Cloudflare inspeccionada y verificada sin la condición de exclusión.
- **Estado de uso:** requiere prueba física del móvil de que `sync` FCM se entrega/procesa y las notas y tareas se crean/borran sin refresco manual. Éxito de CI y envío FCM simulado no prueban latencia real.
- **Cliente web de referencia:** sigue siendo exactamente `0305339`, sin polling y sin cambios de frontend. No reintroducir versiones posteriores por intentar reparar este fallo.

## **Versión base web recuperada — 10 de noviembre de 2026 (vigente)**

- El usuario eligió explícitamente la versión disponible durante la indicación «Acceder desde otro teléfono», no la revisión posterior `46429cac`. Se restauró el contenido **exacto** de `web/index.html` de `0305339bdee26ea3a53955aa3e600b4e14f7c32e` (blob `c45d98d9445bf7af01359c6ee7e5d357c4dcf09c`) en `feature/nottas-web-initial`; commit de reversión `20d024c261a5acab88235ffe29894348c0cc85db`.
- Cloudflare confirmó el redespliegue del Worker independiente `nottas-web-preview`. Esta versión **NO tiene polling automático** ni push en navegador: solo sincroniza al vincular, pulsar Actualizar y tras escribir. Sesión web solo en memoria; volver a vincular tras recargar.
- Se recuperó la web anterior a añadidos de edición, navegación de espacios y polling. El backend actualmente publicado (PR #9) permanece intacto: la restauración **no retrocedió todo el sistema**. Android v0.27.117 y datos sin cambios.
- **Prioridad:** probar en dispositivo real creación/eliminación de notas y tareas Web↔Android; verificar registros FCM, entrega, actualizaciones y permisos. No implementar nuevas funciones o polling hasta confirmar la referencia de comportamiento. Diferenciar la versión del código web de la versión backend/FCM.
- Para detalles exactos consultar `web/README.md` en `feature/nottas-web-initial`. Los apartados de abajo sobre 8 s/1,5 s corresponden a **versiones históricas**, NO al despliegue vigente.

## Nottas Web y sincronización — 10 de noviembre de 2026

**Reversión correctiva (10-11-2026):** a petición del usuario, se restauró en `feature/nottas-web-initial` el archivo `web/index.html` de commit `46429cac` (previo al cambio de sondeo de 1,5 s y aplicación optimista). Worker `nottas-web-preview` publicado de nuevo con éxito. El usuario observó que creación y borrado web→Android dejaron de recibir actualización automáticamente después del cambio posterior; el retroceso busca recuperar ese comportamiento probado, pero la recepción en móvil aún requiere nueva prueba. Android/APK y backend no cambiaron en esta reversión. La web vuelve a sondeo de 8 s, no push. Investigar FCM y la entrega de eliminaciones sin tocar producción antes de pruebas.



- **Revisión de latencia web (10-11-2026):** en rama `feature/nottas-web-initial`, `web/index.html` hace consultas incrementales cada 1,5 s cuando la pestaña está visible (antes 8 s), reconcilia con snapshot periódico y aplica inmediatamente la confirmación del servidor tras crear/eliminar desde la web. Protege contra respuestas antiguas que pudieran sobrescribir una escritura reciente. El Worker `nottas-web-preview` se actualizó mediante API Cloudflare; sintaxis JavaScript validada. El navegador todavía no recibe FCM/Web Push ni tiene un canal SSE/WebSocket. Se requiere prueba de usuario con notas y tareas Android↔web, especialmente las escrituras Android que tardaban 6-8 s y una nota web que tardó 20 s o no desaparecía sin refresco.


- La versión experimental web se desarrolla en `feature/nottas-web-initial` (PR #8, todavía en borrador). Se publicó una previsualización separada en `https://nottas-web-preview.losrobles.workers.dev/` con navegación Personal/Oficina, tarjetas, listas/casillas de nota, subtareas de tarea, edición, fecha/hora, búsqueda y sincronización incremental automática (8 s cuando está visible, snapshot completo periódico).
- La web vincula la cuenta mediante clave temporal desde Android; la sesión se conserva en `sessionStorage` de la pestaña. No se modifican datos Android al actualizar la interfaz web.
- **Backend publicado:** PR #9 fusionado a `main`, GitHub Actions `deploy-worker` finalizó correctamente (run 42862252735); ahora los cambios emiten FCM `sync` también a otros dispositivos del mismo usuario, incluidos espacios Personal. No se cambió el esquema D1.
- **Sin validar en dispositivos:** la recepción efectiva de FCM en Android, creación web→Android, eliminar y restaurar, conflictos de edición, conservación de bloques enriquecidos, permisos de Oficina y comportamiento de Nottas Web en navegador real. No afirmar que la sincronización está verificada por el éxito de CI.
- **Android:** sigue v0.27.117 (versionCode 198); no hay APK nueva para Obtainium por estos cambios web/backend.

## Punto de reanudación

- **Repositorio/rama:** `barccelo/nottas` · `main`.
- **Versión del código Android:** `0.27.117` (`versionCode 198`), confirmada en Gradle y GitHub Actions.
- **Publicación:** APK `Nottas-v0.27.117.apk` firmada y publicada en [GitHub Releases](https://github.com/barccelo/nottas/releases/tag/v0.27.117) el 5 de noviembre de 2026. La instalación mediante Obtainium y el funcionamiento Android siguen pendientes de prueba física.
- **Última entrega funcional documentada:** subtareas inicialmente contraídas con tarjeta-resumen; orden «Añadir subtarea» antes de «Elementos marcados»; indicador activo en herramientas de formato; corrección del flujo Diferida → Propuesta/Agendada y solicitud de nueva fecha; actualización de alarmas nativas mediante FCM `sync_task`.
- **Backend:** `ESTADO.md` indica que el Worker de Cloudflare fue actualizado para enviar `sync_task`; el funcionamiento extremo a extremo entre dispositivos continúa **por verificar**.
- **Situación:** v0.27.115, v0.27.116 y v0.27.117 publicadas con APK firmada en Releases. Continúan pendientes las pruebas reales en Android y Obtainium.

## Última intervención — v0.27.117 (5 de noviembre)

- Correcciones en `app/src/main/assets/nottas.html`: tarjeta de subtareas permanente con toggle bidireccional; cambio de inicio/fin sin cierre por toque externo; selección de rueda inmediata y edición central consistente con el valor guardado.
- **Publicado:** v0.27.117 con APK firmada verificada en Releases. **Pendiente:** probar tarjetas y cambios de hora con teclado abierto en Android y comprobar actualización en Obtainium. No hay cambios de backend ni datos.
- El trabajo previo de diferidas/FCM y la validación en dos dispositivos sigue abierto.

## Intervención anterior — v0.27.116 (5 de noviembre)

- Corrección de tarjeta duplicada de subtareas (conservar el resumen de Design System), scroll de selectores de fecha/hora anclado al inicio, notas con título sin teclado automático e icono de actualización unificado.
- Cambios de interfaz guardados en `app/src/main/assets/nottas.html`. No se han modificado datos ni servicios.
- **Siguiente paso:** validar visualmente la APK v0.27.116 en Android y su actualización por Obtainium; continuar pruebas director–asistente/FCM pendientes. La publicación confirmada no acredita pruebas físicas.

## Siguiente trabajo prioritario

1. **Diferidas / director-asistente:** en dos móviles probar diferir → fecha → hora, reagendar, reproponer, solicitar nueva fecha y confirmar; revisar estados, bandejas y avisos sin bloqueos.
2. **FCM / alarmas:** con el director en segundo plano o pantalla apagada, verificar propuesta → agendada, edición/cancelación remota, orden de mensajes, reconexión, reinicio y permisos.
3. **Editor:** validar subtareas colapsadas, posición estable de la descripción, elementos marcados, orden de controles e indicadores de formato con teclado físico y virtual.
4. **Entrega Android:** comprobar resultado de GitHub Actions, firma, Release y actualización por Obtainium conservando los datos; no dar por publicada una versión solo por cambiar Gradle.
5. **Regresiones visuales:** revisar modos claro/oscuro, calendario, selectores, navegación y recordatorios, respetando `DESIGN_SYSTEM.md`.

El desglose detallado y los pendientes históricos están en `PENDIENTES.md`. No interpretarlos todos como errores activos: varios son **pruebas por verificar** de versiones anteriores.

## Decisiones estables

- Nottas es **Android local-first**, con notas, tareas, calendario, recordatorios nativos y colaboración optativa mediante espacios compartidos. Evitar cambios que comprometan datos, sincronización, alarmas o funcionamiento sin red.
- Identidad **«Apple-like»** significa pulida, limpia, orgánica y coherente; **no** copiar literalmente iOS. Mantener los componentes, tokens y reglas editoriales del Design System existente.
- Preservar la marca acordada: icono principal de la N, símbolo monocromático de las dos T para notificaciones, wordmark discreto y checks circulares. No sustituir recursos sin petición expresa.
- Distinguir siempre **solicitado**, **implementado**, **verificado en Android** y **publicado para Obtainium**. Nunca convertir automáticamente uno de esos estados en otro.

## Qué consultar y para qué

| Archivo | Función |
| --- | --- |
| `CONTINUIDAD.md` | **Leer primero.** Estado compacto y siguiente paso. |
| `ESTADO.md` | Estado técnico y cambios recientes; consultar encabezado y secciones relevantes, no necesariamente todo el histórico. |
| `PENDIENTES.md` | Checklist activo, validaciones y propuestas; priorizar el bloque de la versión actual. |
| `CHANGELOG.md` | Historial de cambios implementados por versión; no equivale a publicación confirmada. |
| `DESIGN_SYSTEM.md` | Reglas visuales, tokens y componentes para trabajo de interfaz. |
| `README.md` | Acceso general, instalación y firma. |

## Protocolo para cada nuevo chat

1. Con acceso a GitHub, **leer primero este archivo** y contrastar las cabeceras recientes de `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md`. Abrir `DESIGN_SYSTEM.md` si el trabajo es visual. Si no hay conexión, pedir acceso en vez de inventar el estado.
2. Revisar los **archivos de código implicados** y la versión de Gradle antes de editar. La documentación puede estar desactualizada.
3. Trabajar por cambios focalizados; evitar pegar archivos completos, logs extensos o historial repetido en el chat. Informar resultados y diferencias concretas.
4. Tras implementar, registrar qué se cambió, qué se comprobó y qué falta comprobar. Para cambios de aplicación: mantener `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md` al día; comprobar firma y Release antes de anunciar Obtainium.
5. **Actualizar este archivo al finalizar cada intervención relevante**, manteniéndolo breve: versión, último cambio, bloqueos, pruebas y siguiente acción. Tras una actualización documental sin código, no inventar una nueva versión.
6. Si los documentos se contradicen, priorizar código y evidencias de compilación/publicación, señalar la discrepancia y corregirla. Nunca eliminar pendientes solo por figurar «corregidos» sin verificación.

**Para reanudar:** basta indicar «Continuemos Nottas» y conectar el repositorio; este documento es la ficha de entrada prevista, aunque su consulta requiere acceso a GitHub en la conversación.
