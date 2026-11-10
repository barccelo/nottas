# Nottas Web — versión base restaurada

**Estado vigente:** previsualización experimental basada en el cliente de `0305339`, con una **única adición**: WebSocket autenticado para recibir avisos de sincronización desde Android. El resto del editor y la navegación siguen en la base original. Publicada el 10 de noviembre de 2026.

**URL:** https://nottas-web-preview.losrobles.workers.dev/

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
- Ajustes conserva las mismas familias de secciones; **solo el tema web es editable**. Notificaciones, recordatorios, horario, mensajes rápidos, respaldos y otros ajustes nativos se indican como controles de Android, no botones web falsos. Preferencia de tema guardada en `localStorage` **solo para este navegador**, nunca en D1.
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
- Sesión **solo en memoria**. Tras recargar o cerrar la página hay que vincular nuevamente.
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
