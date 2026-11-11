# Nottas Web — previsualización con identidad Android

**Estado vigente:** interfaz experimental derivada del cliente `0305339`, con identidad gráfica Android, sincronización bidireccional FCM/WSS sin polling y sesión de navegador persistente opcional. El editor y la lógica de guardado mantienen el alcance básico original.

**URL:** https://nottas-web-preview.losrobles.workers.dev/

## Editor y selector de espacios funcionales — 10/11/2026 (fecha local)

**Publicado en la web de previsualización:** `https://nottas-web-preview.losrobles.workers.dev/`. La versión visual anterior con sesión persistente y WSS permanece en `/stable` (assets CSS/JS propios), y la edición web básica histórica continúa en `/classic`.

**Correcciones de interfaz**
- Sustituido el `select` del encabezado Personal/Oficina por un botón y menú de espacios propio con iconos, roles y marca de selección. El `select#workspace` permanece oculto como control de compatibilidad; el cambio dispara el mismo evento `change` y conserva el espacio en la sesión.
- Tarjetas con checks accionables para tarea completa, subtarea (incluida anidación) y casilla de nota; metadatos de fecha, duración, recordatorios, prioridad, estado de reunión, categoría y etiquetas. La acción rápida emite el mismo `POST /v1/sync` que el editor y después reconcilia con snapshot; no agrega polling.
- `web/nottas-editor.js`: editor de bloques de Android (`paragraph`, `heading`, `subheading`, `quote`, `bullet`, `number`, `checklist`) con formato básico, checklist, subtareas editables/anidadas, checks, añadir/quitar/reordenar, título, prioridad, fecha/hora inicial y final, recurrencia, múltiples recordatorios numéricos, categoría y etiquetas. Usa el esquema real `items` + `subtasks`, `blocks`, `reminders`, `approvalStatus` y `meetingStatus`.
- Para Oficina: mostrar el estado de aprobación y permitir que el dueño agende propuestas; estados `scheduled`, `deferred`, `realized`, `not_realized`, `cancelled` y observación. El backend mantiene los permisos y el historial. La UI no reemplaza las pantallas de confirmación de Android ni la interacción avanzada con el asistente.
- Calendario: botón «Agendar» en la fecha seleccionada, que abre una nueva tarea prellenando su fecha.
- Categorías: ahora se leen los cambios `entityType:"category"` del mismo snapshot `/v1/sync?full=1` sin petición adicional; se pueden seleccionar categorías sincronizadas y ver iconos originales del Design System.

**Seguridad y preservación**
- El modelo de notas/tareas es el de `app/src/main/assets/nottas.html` de `main`. Los datos originales se clonan y los campos no editados se conservan, incluidos hijos, revisiones, historial, estados de aprobación y contenido enriquecido sin modificar. HTML editable renderizado con una lista segura de etiquetas; texto pegado como texto plano.
- La capa de presentación `web/nottas-ui.js` reusa los iconos `ns-*` y tokens de `web/nottas-ui.css`. No se han cambiado el backend Cloudflare, FCM, cliente WSS, autenticación, APK ni el esquema de D1.
- Se compararon textualmente las funciones `stopRealtime/startRealtime`, `request`, `restoreAccount`, `push`, `remove` con el cliente previo: **idénticas**. `refresh` solo agrega categorías a su snapshot; no hace polling ni modifica `/v1/sync`.
- QA **realizado**: sintaxis JS, IDs sin duplicados, todos los IDs del DOM referenciados, símbolos SVG disponibles, despliegue Cloudflare confirmado e inspeccionado; se verificaron `/stable`, `/classic`, WSS y ausencia de `setInterval`.
- QA **pendiente**: crear y editar tareas reales de Oficina/Personal, subtareas, notas con formato, recordatorios y reuniones desde navegador y comprobar su representación y avisos en Android. No afirmar pruebas end-to-end ni paridad con todos los módulos Android.

**Regla de regresión:** antes de tocar editor, crear/borrar/editar nota y tarea en ambos sentidos, validar confirmaciones y diferidas con permisos de Oficina, verificar WSS/FCM sin refresco manual, y conservar una ruta de respaldo funcional. El sistema de fecha/hora, categorías y estados debe seguir usando nombres y estructuras Android, nunca inventar campos equivalentes.

## Sesión de navegador que sobrevive a recargas — 10/11/2026

- **Problema resuelto:** la versión anterior almacenaba `sessionToken` solo en la variable `state.token`; cualquier actualización de la página lo perdía y exigía otra clave temporal de vinculación.
- **Implementación web:** `web/index.html` valida la sesión existente con `GET /v1/me` al abrir, reconstruye los espacios autorizados y reestablece el WebSocket anterior sin crear un token nuevo. La clave de vinculación de 10 minutos sigue siendo de **un solo uso** para el primer acceso.
- **Opciones:** casilla `Mantener sesión iniciada en este navegador` en la vinculación (activada por defecto) y conmutador en **Ajustes → Datos y respaldo → Sesión web**. Con la casilla activa, token en `localStorage` de ese origen; desactivada, `sessionStorage` de pestaña. Si un navegador bloquea el almacenamiento, la sesión solo funciona hasta cerrar y se informa del límite.
- **Seguridad:** el token es un secreto de sesión, no una clave extra permanente; permanece bajo el mismo origen HTTPS y nunca se añade a las URLs ni a mensajes WebSocket. No activar persistencia en equipos compartidos. El servidor permite `POST /v1/auth/logout` para invalidar **solo** el token de esa sesión (PR #12, backend en `main`); Android conserva su sesión. La web elimina el token de ambos almacenamientos al cerrar. Las sesiones web nuevas se registran con plataforma `web`.
- **Fallo de red:** una interrupción al restaurar **no borra** el token guardado; solamente un `401 unauthorized` produce limpieza y exige volver a vincular. No se añadieron solicitudes periódicas ni nuevos timers; la restauración ocurre únicamente al abrir la página.
- **Regresión protegida:** las funciones `stopRealtime`, `startRealtime`, `request`, `refresh`, `save`, `push` y `remove` se compararon con el cliente anterior sin cambios. Se comprobaron sintaxis JS, IDs y publicación en Cloudflare. **Falta una prueba real** de recargar/cerrar/reabrir el navegador y de cerrar sesión en los dispositivos; no se afirma prueba de navegador que no se haya realizado.
- **Despliegue:** PR #12 fusionado; backend Actions `42930298365` y `42930374923` correctos; Worker web actualizado y verificado. No hay APK nueva ni cambio de D1.

## Adaptación de identidad Android a escritorio — 10/11/2026

La interfaz visual de la previsualización `https://nottas-web-preview.losrobles.workers.dev/` incorpora ahora el lenguaje gráfico de Nottas Android, basado en `DESIGN_SYSTEM.md` 1.3 y el código vigente. La versión anterior se conserva accesible en `/classic` como medida de recuperación.

**Fuentes y archivos de la web:**

- `web/index.html`: estructura de navegación, paneles y editor básico existente. Conserva sin cambios las funciones originales `request`, `refresh`, `connect`, `openEditor`, `save`, `push`, `remove` y el canal WebSocket de sincronización.
- `web/nottas-ui.css`: adaptación responsiva de los tokens reales de `app/src/main/assets/design-system.css` (colores `#1677FF`, `#4B9AFF`, fondos, radios, checks redondos, alineación, foco y accesibilidad).
- `web/nottas-ui.js`: **solo capa de presentación**: cards de notas/tareas y subtareas, filtros de la barra lateral, calendarios Día/Semana/Mes/Agenda sobre tareas fechadas, espacios Personal/Oficina, información de equipo y secciones de Ajustes.
- `web/nottas_wordmark.svg`: copia **idéntica** del wordmark de `app/src/main/assets/nottas_wordmark.svg`.
- `web/nottas-icons.svg`: 31 símbolos SVG reales `ns-*` de `app/src/main/assets/nottas.html` y los 10 glifos de navegación trazados con las rutas nativas.
- El Worker estático `nottas-web-preview` sirve `/assets/nottas-ui.css`, `/assets/nottas-ui.js`, `/assets/nottas_wordmark.svg` y `/assets/nottas-icons.svg`, además de `/` y `/classic`.

**Alcance funcional real:**

- Pantalla Inicio, navegación de Tareas/Notas, filtros Hoy/Pendientes/Destacadas/Completadas, Papelera, búsqueda, editor existente, tema claro/oscuro local en el navegador y navegación adaptada a escritorio/tablet/móvil.
- Calendario Día/Semana/Mes/Agenda **basado en tareas con fecha ya sincronizadas**. No sustituye el calendario Android completo, ni carga Google Calendar de manera independiente, ni ofrece programación enriquecida desde ese panel.
- «Equipo de trabajo» muestra espacios autorizados, roles y cantidades. Los mensajes/llamadas/permisos avanzados siguen en Android.
- Ajustes conserva las mismas familias de secciones; **el tema web y la preferencia «Mantener sesión iniciada» son editables**. El editor ahora incluye organización (categorías y etiquetas) y programación de tareas; las funciones nativas de sistema siguen siendo Android-only. Notificaciones, recordatorios, horario, mensajes rápidos, respaldos y otros ajustes nativos se indican como controles de Android, no botones web falsos. Preferencia de tema guardada en `localStorage` **solo para este navegador**, nunca en D1.
- No se han modificado datos, esquemas, Android, el backend FCM ni el Durable Object. El cliente WebSocket anterior sigue sin polling; la capa estética no añade llamadas a API.

**Verificación de esta integración:** se contrastaron clases y símbolos con archivos Android; se validaron sintaxis JavaScript, IDs duplicados/referencias, iconos y rutas; todas las funciones críticas del cliente original se compararon literalmente con el commit `53093c9` y resultaron idénticas. Cloudflare confirmó la publicación y el contenido de los assets, CSP WSS y ruta de respaldo. **Pendiente:** revisión visual y funcional desde navegador real, sobre todo dimensiones, tema oscuro, menús, editor y sincronización tras este cambio de presentación. La sincronización previa sí fue confirmada por el usuario.

**Condición de calidad:** no declarar paridad funcional completa con Android: esa labor requiere nuevas implementaciones y pruebas separadas. No reemplazar datos o flujos existentes para lograr semejanza visual.

## Sincronización estable — validada por el usuario (10/11/2026)

**Estado confirmado:** el usuario probó la configuración publicada tras el PR #11 y confirmó que la sincronización automática funciona en ambos sentidos («Ahora sí. Perfecto perfectísimo perfectote»). Anteriormente Web → Android funcionaba, mientras Android → Web requería «Actualizar». Este es el punto de referencia funcional que se debe preservar.

- **Web → Android:** `POST /v1/sync` desencadena aviso FCM `sync` también para la cuenta autora (arreglo de `pushWorkspaceSync`, PR #10); Android obtiene y aplica cambios.
- **Android → Web:** la misma escritura aceptada genera aviso de invalidación `{"type":"sync"}` mediante WSS `/v1/realtime` al usuario autenticado y sus miembros autorizados; el navegador solicita un snapshot nuevo y actualiza la vista, sin polling periódico. El aviso no lleva el contenido de las notas.
- **Infraestructura:** Worker `nottas-assistant-api` y Durable Object SQLite `SyncHub`, binding `SYNC_HUB`, `new_sqlite_classes` en migración `sync-hub-v1`; conexiones hibernables. Sesión en subprotocolo WSS, restricción de Origin al dominio web, `connect-src` CSP WSS. El código servidor está en `main`; el cliente web está en esta rama experimental y desplegado como `nottas-web-preview`.
- **Resiliencia:** reconexión con backoff; refresh al reconectar y al recuperar la pestaña; actualización manual opcional. No usar temporizadores de consultas a D1.
- **Verificación:** GitHub Actions CI `42905553337` y despliegue `42905627037` correctos; Cloudflare comprobado; **validación funcional en los dispositivos confirmada por el usuario**. Sin APK nueva; Android permanece v0.27.117.
- **Regla de regresión:** antes de modificar backend, cliente, permisos o reconexión, comprobar creación/eliminación de notas y tareas tanto Android → Web como Web → Android, sin pulsar «Actualizar». Mantener FCM y WSS, sin sustituirlos por sondeo. Reconexiones prolongadas, múltiples usuarios y conflictos simultáneos requieren pruebas complementarias.

Las secciones de reversiones antiguas más abajo son historial; **no son el estado actual**.

## Funciones de esta versión

- Vinculación mediante **Acceder desde otro teléfono** en Android y clave temporal de un solo uso. No usar clave de recuperación.
- Menú de vistas Todo/Notas/Tareas/Papelera, selección de espacio mediante menú desplegable, búsqueda, modo claro/oscuro.
- Consulta y edición controlada de notas de párrafo simple y tareas; creación, completar tarea y envío a papelera. Preserva estructuras de datos enriquecidos, subtareas, fechas, aprobaciones y recordatorios originales, pero **no ofrece edición completa de esos campos**.
- Sesión de navegador opcionalmente persistente: con «Mantener sesión iniciada en este navegador» (activado por defecto) el token de sesión se almacena en `localStorage` y se valida mediante `/v1/me` al iniciar la web. Si se desactiva, se conserva solo en `sessionStorage` de la pestaña (resiste recargas, no necesariamente el cierre). No se guarda la clave temporal de Android. La opción también está disponible en Ajustes → Datos y respaldo → Sesión web.
- **Tiene avisos en tiempo real por WebSocket (sin sondeo periódico).** Tras vincular, el navegador establece una conexión WSS autenticada con `/v1/realtime`. Una escritura del móvil o de otro cliente emite una señal `sync` sin contenido; la web consulta el snapshot únicamente entonces, al reconectar, cuando la pestaña vuelve a estar visible, al pulsar Actualizar o después de guardar. La conexión usa un Durable Object con hibernación (SQLite); los avisos no llevan texto de notas ni tareas.
- La API de Cloudflare sigue en `nottas-assistant-api.losrobles.workers.dev`. El backend vigente incluye los PR #10 y #11: FCM para Android (incluido el autor) y avisos WebSocket para el navegador. La recepción automática en ambos sentidos fue confirmada por el usuario.

## Regresiones y medidas preventivas

La referencia visual sigue siendo la versión `0305339`, pero el estado funcional vigente incorpora WebSocket (PR #11), sin polling. El usuario confirmó esta configuración como funcional. No se debe reconstruir ni volver a incorporar funciones de las versiones posteriores sin prueba de creación y eliminación de **nota y tarea** en ambos sentidos, incluyendo permisos Personal/Oficina y conservación de subtareas.

Los cambios posteriores están en el historial Git y pueden recuperarse selectivamente; no forman parte del despliegue actual. No asumir que la sincronización instantánea se ha verificado a partir de GitHub Actions o de un despliegue exitoso.

No se han modificado Android, D1, las cuentas ni datos durante esta reversión.

## Cambio Android → Web (10/11/2026)

- PR de backend [#11](https://github.com/barccelo/nottas/pull/11): Worker con binding `SYNC_HUB` a Durable Object hibernable, migración SQLite `sync-hub-v1` y señal por usuario/membresía tras cada cambio aceptado. Se conserva el envío FCM a Android.
- Web `feature/nottas-web-initial`: conexión WSS al iniciar sesión, recarga solo cuando llega `sync` o al recuperar/reconectar pestaña; reintento con backoff sin temporizador de consultas a D1. Token de sesión en subprotocolo WebSocket; nunca en la URL. Restricción de origen al dominio Nottas Web.
- **Comprobado:** suite CI del Worker (run `42905553337`), despliegue backend (run `42905627037`), namespace Durable Object creado y Worker web actualizado/inspeccionado en Cloudflare. **Confirmado posteriormente por el usuario:** sincronización automática de Android→Web y Web→Android en el uso real. Quedan pendientes pruebas exhaustivas de reconexión, permisos multiusuario y conflictos. Una prueba sintáctica o despliegue correcto no acreditan esa verificación.
