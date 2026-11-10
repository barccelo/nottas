# Continuidad operativa de Nottas

**Actualizado:** 10 de noviembre de 2026 (sincronización Android ↔ Web confirmada por el usuario; FCM + WebSocket sin polling).  
**Objetivo:** retomar el desarrollo en un chat nuevo sin depender del historial de conversaciones. Este archivo es una ficha de entrada, **no** reemplaza al código, las pruebas ni a los documentos de detalle.

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
