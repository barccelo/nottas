# Nottas Web — versión base restaurada

**Estado vigente:** previsualización experimental basada en el cliente de `0305339`, con una **única adición**: WebSocket autenticado para recibir avisos de sincronización desde Android. El resto del editor y la navegación siguen en la base original. Publicada el 10 de noviembre de 2026.

**URL:** https://nottas-web-preview.losrobles.workers.dev/

## Funciones de esta versión

- Vinculación mediante **Acceder desde otro teléfono** en Android y clave temporal de un solo uso. No usar clave de recuperación.
- Menú de vistas Todo/Notas/Tareas/Papelera, selección de espacio mediante menú desplegable, búsqueda, modo claro/oscuro.
- Consulta y edición controlada de notas de párrafo simple y tareas; creación, completar tarea y envío a papelera. Preserva estructuras de datos enriquecidos, subtareas, fechas, aprobaciones y recordatorios originales, pero **no ofrece edición completa de esos campos**.
- Sesión **solo en memoria**. Tras recargar o cerrar la página hay que vincular nuevamente.
- **Tiene avisos en tiempo real por WebSocket (sin sondeo periódico).** Tras vincular, el navegador establece una conexión WSS autenticada con `/v1/realtime`. Una escritura del móvil o de otro cliente emite una señal `sync` sin contenido; la web consulta el snapshot únicamente entonces, al reconectar, cuando la pestaña vuelve a estar visible, al pulsar Actualizar o después de guardar. La conexión usa un Durable Object con hibernación (SQLite); los avisos no llevan texto de notas ni tareas.
- La API de Cloudflare sigue en `nottas-assistant-api.losrobles.workers.dev`. El backend permaneció en su versión vigente tras PR #9; la reversión **solo afectó al cliente web**. El backend envía FCM a dispositivos Android registrados, pero la recepción inmediata no ha sido reconfirmada tras la reversión.

## Regresiones y medidas preventivas

El usuario identificó esta versión como la referencia que deseaba recuperar. No se debe reconstruir ni volver a incorporar funciones de las versiones posteriores sin prueba de creación y eliminación de **nota y tarea** en ambos sentidos, incluyendo permisos Personal/Oficina y conservación de subtareas.

Los cambios posteriores están en el historial Git y pueden recuperarse selectivamente; no forman parte del despliegue actual. No asumir que la sincronización instantánea se ha verificado a partir de GitHub Actions o de un despliegue exitoso.

No se han modificado Android, D1, las cuentas ni datos durante esta reversión.

## Cambio Android → Web (10/11/2026)

- PR de backend [#11](https://github.com/barccelo/nottas/pull/11): Worker con binding `SYNC_HUB` a Durable Object hibernable, migración SQLite `sync-hub-v1` y señal por usuario/membresía tras cada cambio aceptado. Se conserva el envío FCM a Android.
- Web `feature/nottas-web-initial`: conexión WSS al iniciar sesión, recarga solo cuando llega `sync` o al recuperar/reconectar pestaña; reintento con backoff sin temporizador de consultas a D1. Token de sesión en subprotocolo WebSocket; nunca en la URL. Restricción de origen al dominio Nottas Web.
- **Comprobado:** suite CI del Worker (run `42905553337`), despliegue backend (run `42905627037`), namespace Durable Object creado y Worker web actualizado/inspeccionado en Cloudflare. **Pendiente:** comprobar WebSocket conectado y sincronización efectiva Android→web en un navegador real, con creación/eliminación de nota y tarea. Una prueba sintáctica o despliegue correcto no acreditan esa verificación.
