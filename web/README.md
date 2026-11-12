# Nottas Web — previsualización con identidad Android

**Estado vigente:** interfaz experimental derivada del cliente `0305339`, con identidad gráfica Android, sincronización bidireccional FCM/WSS sin polling y sesión de navegador persistente opcional. El editor y la lógica de guardado mantienen el alcance básico original.

**URL:** https://nottas-web-preview.losrobles.workers.dev/

## Corrección de editor: lista completa, tipos y diseño sin sombras — 12/11/2026

**Incidencias reportadas con capturas del editor de «Mejoras»:** el selector `Tipo / Tarea` aparecía al editar aunque estaba deshabilitado; la tarea contabilizaba 31/69 subtareas y mostraba solo parte de la jerarquía; el selector de formato de bloques era un `<select>` nativo con franja clara y menús de apariencia HTML; exceso de sombras.

**Implementado y publicado:** en `web/index.html` se mantiene el `select#type` **oculto** solo para compatibilidad; el usuario utiliza los controles independientes «Nueva nota» y «Tarea» ya existentes. Al editar, no se puede cambiar el tipo ni se muestra el control sin efecto. El editor construye menú de tipos de bloque accesible, sin `select` nativo, con las siete opciones Android y cierre por clic exterior o Escape.

**Integridad de subtareas:** en `web/nottas-editor.js` se eliminó el límite visual anterior `depth>12` para árboles normales; se permite hasta 500 niveles como protección contra estructuras aberrantes. Se conserva `{...n}` al normalizar cada nodo para no perder metadatos ajenos a los campos editados. La agrupación de marcados exige que también estén completos los hijos, evitando esconder descendientes pendientes dentro de una sección plegada. Los campos pasan a `textarea` de altura automática para mostrar textos largos sin truncamiento, con salto de línea preservado en el HTML al editar. No se cambia el esquema de Android, el árbol `items` ni la vía de sincronización.

**Diseño:** `web/nottas-ui.css` elimina sombras HTML de tarjetas, formularios, menú de espacios, categoría, paneles y desplegables. Se conservan los tokens, radios, bordes y colores de Nottas, con control de formatos emergente en la paleta del tema y sin el desplegable nativo.

**Pruebas realizadas:** sintaxis válida de JS del núcleo, editor, vistas, formularios flotantes, calendario y categorías; sin IDs DOM duplicados, referencias ausentes o iconos inexistentes; prueba de renderizado del editor con 69 subtareas planas (31 marcadas: 38 pendientes + 31 marcadas) y árbol de 69 niveles (69 visibles); despliegue Cloudflare aceptado y código publicado inspeccionado. `/stable` y `/classic` conservadas, WSS y sesión persistente intactos, sin `setInterval` ni polling.

**Pendiente:** revisión visual real en navegador (texto largo, edición de subtareas con formato, comportamiento de menú propio y scroll de lista); verificar que la tarea real «Mejoras» muestre los 69 elementos y que al guardarlos se reflejen en Android. Las pruebas sintéticas no son prueba end-to-end con el usuario.

## Paridad de interacción Android → Web — 12/11/2026

**Publicado:** `https://nottas-web-preview.losrobles.workers.dev/`; última revisión confirmada en Cloudflare a las 13:45:32 UTC del 12/11/2026. El respaldo `/stable` conserva íntegro el código anterior con sesión persistente y WSS/FCM; `/classic` sigue disponible.

**Objetivo:** dejar de usar un formulario HTML genérico y trasladar los patrones de uso reales de Android a escritorio, sin duplicar backend ni inventar la lógica de datos.

- **Tarjeta fija desplegable de subtareas:** `web/nottas-ui.js` muestra `Subtareas`, el contador `marcadas/total` y un chevrón aunque esté plegada, con expansión al pulsar el encabezado. Estado de la presentación guardado en memoria local por elemento, no enviado a D1. En la tarjeta abierta se conservan controles individuales de completado.
- **«Elementos marcados» al final:** agrupación independiente con flecha, plegada por defecto. Separar solo elementos **principales** completos; los hijos completados de una tarea pendiente permanecen bajo su padre. El editor replica la misma tarjeta `editSubtasksToggle`, `editCompletedToggle`, `editCompletedList`; no elimina ni aplana las subtareas anidadas.
- **Editor content-first:** orden visible título → píldoras de metadatos (`editorMetaChips`) → contenido/bloques → subtareas → opciones extensas. `Más opciones` muestra fecha/hora/recordatorios/repetición/prioridad/estado y organización; los datos cargan aunque el bloque esté oculto.
- **Formularios flotantes:** `web/nottas-float.js` implementa calendario propio por mes, días rápidos, ruedas de horas/minutos, recordatorios múltiples y selector de categoría/estado/prioridad/repetición/etiquetas. En tarjetas, guardan mediante `NottasEditor.quick`, la misma petición `POST /v1/sync` con reconciliación; en editor, usan `openDraft` y solo mutan el borrador hasta pulsar **Guardar** en la tarea. Los toques en chips de tarjeta y píldoras del editor abren el panel correspondiente sin abrir el formulario entero. Click exterior y Escape cierran los paneles.
- **Identidad:** paleta y tokens existentes `web/nottas-ui.css`, SVGs `ns-*` copiados de Android, radios 16 px, checks redondos, subelementos indentados y chevrón de elementos marcados. Se amplió la anchura útil de las tarjetas en escritorio y se compactaron los campos secundarios.

**Protección de sincronización:** no se cambió `cloudflare/assistant/src/index.js`, la APK, `/v1/sync`, FCM/WSS, `restoreAccount`, ni se introdujeron consultas recurrentes. El frontend conserva sesión persistente y los esquemas `items`, `subtasks`, `blocks`, `reminders` de Android. Las operaciones de los paneles flotantes usan los mismos identificadores y revisiones que las tarjetas.

**Pruebas realizadas:** sintaxis de seis módulos JS, IDs DOM y símbolos SVG únicos/disponibles, orden de las secciones, ausencia de polling, disponibilidad de `/stable` y publicación e inspección del script en Cloudflare. **Aún faltan pruebas reales** de interacción visual en navegadores y de consistencia con Android, cambios en Oficina con aprobación y horarios/recordatorios, foco y ruedas en teléfono. No afirmar espejo completo: fuera de esta implementación siguen la captura rica con píldoras *in situ*, calendarios externos, chat/collaboración completa y configuraciones exclusivas del SO.

**Regresión obligatoria:** en Personal y Oficina crear, marcar, borrar tarea y nota, abrir panel de fecha/hora, marcar subtareas y mostrar/ocultar completadas; comprobar automáticamente Android → Web (WSS) y Web → Android (FCM), sin actualización manual. Si falla la nueva UI usar `/stable` y revisar esta capa sin tocar FCM/WebSocket.

## Categorías, captura de fecha/hora y toques directos — 12/11/2026

**Publicado:** la web de previsualización `https://nottas-web-preview.losrobles.workers.dev/`. Se conservan `/stable` (interfaz anterior con FCM/WSS y sesión persistente) y `/classic`. No requiere APK nueva ni cambios del backend.

**Categorías**
- Nuevo `web/nottas-categories.js` reutiliza el contrato de `categorySymbolHtml()` y la lista `EVENT_CATEGORY_DEFAULTS` en `app/src/main/assets/nottas.html`: íconos `ns-event-*` del sprite Android, color `#RRGGBB`, emoji cuando existe o punto de color como respaldo.
- El selector `Categoría` del editor dejó de ser un select solo de texto: contiene nombres e iconos, conserva el `select#editCategory` oculto para compatibilidad y envía el ID Android exacto. Las tarjetas también muestran la representación gráfica, no un símbolo de carpeta genérico.
- Se leen las categorías del snapshot `/v1/sync?full=1` ya existente; sin sondeo ni consulta adicional.

**Captura de fecha y hora**
- Nuevo `web/nottas-schedule.js` adapta la función Android `parseQuickSchedule()` a un analizador puro: `hoy`, `mañana`, `pasado mañana`, días de semana, fechas `dd/mm` y `día de mes`; horas `2p`, `2a`, `430p`, `14:30`, `2 pm`, `a las 14`. El cálculo de fecha usa hora local, no ISO UTC.
- En tareas nuevas, cuando el título contiene una fecha/hora válida, se muestra la sugerencia **«Usar fecha y hora»**. Aplicarla pone los valores en el editor y retira los tokens del título de manera consciente. **No es todavía la misma experiencia de píldoras dentro del texto enriquecido que tiene Android.**
- Atajos de Hoy, Mañana, Pasado mañana y Sin fecha; horas rápidas 9:00/12:00/15:00/18:00 y Sin hora. Botones de calendario/reloj llaman a `showPicker()` donde el navegador lo permite; si no, queda el input nativo accesible.
- Las opciones de recordatorio hacen visible la selección, indican la cantidad activa y permiten quitar todos. Elegir una hora/recordatorio sin fecha asigna hoy para evitar una hora huérfana. La escritura utiliza los campos Android originales `dueDate`, `dueTime`, `endDate`, `endTime` y `reminders` (minutos antes).

**Interacciones y checks**
- Las tarjetas tienen chips pulsables de fecha, hora, cierre, recordatorios, categoría, prioridad, etiquetas y estado; abren el campo correspondiente en el editor, con selector nativo cuando es posible.
- `web/nottas-editor.js` ahora hace **guardado optimista** para marcar tarea completa y elementos de checklist/subtareas: el check cambia de inmediato y, tras `POST /v1/sync`, utiliza el payload aceptado del servidor. Si hay conflicto, error HTTP o rechazo, restaura la copia anterior y muestra un error explícito. Se mantiene reconciliación por snapshot después de la acción y avisos FCM/WSS para otros dispositivos.
- Se preserva el editor de bloques, estados y subtareas. No se modifica el módulo `startRealtime()`, la lógica de `request()` ni el token persistente.

**Verificación y límites**
- Probados sintácticamente `index`, `ui`, `editor`, `schedule` y `categories`; sin IDs DOM duplicados ni referencias a elementos o iconos inexistentes.
- Casos del analizador ejecutados en un entorno aislado: `mañana 2p` → fecha del día siguiente, 14:00; `430p` → 16:30; `pasado mañana`, día de semana y fechas numeradas correctos. Pruebas simuladas de servidor: completar tarea/subtarea exitoso, y conflicto con restauración correcta del check.
- Comparadas con la publicación anterior las funciones `stopRealtime`, `request`, `restoreAccount`, `push` y `remove`: idénticas. Cloudflare confirmó el despliegue del Worker web y se inspeccionó la presencia de los dos módulos nuevos, WSS, sesión y respaldo; sin `setInterval` ni polling.
- **No probado aún:** interacción en Chrome/Opera real, rendimiento de los selectores según SO, sincronización efectiva de esas ediciones con Android ni alarmas disparadas por el teléfono. Tampoco se sustituyó la rueda propia Android por una implementación web idéntica: la web usa controles accesibles del navegador.

**Siguiente prueba de aceptación:** en una tarea Personal marcar/desmarcar desde la tarjeta; escribir `Reunión mañana 2p`, pulsar «Usar...», guardar y comprobar en Android la fecha/hora; en Oficina abrir categoría con icono y los chips de recordatorio/estado; confirmar que Android ↔ Web sigue automático sin «Actualizar».

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
