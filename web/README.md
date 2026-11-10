# Nottas Web — versión base restaurada

**Estado vigente:** previsualización experimental restaurada al contenido exacto de `web/index.html` del commit `0305339bdee26ea3a53955aa3e600b4e14f7c32e` (blob `c45d98d9445bf7af01359c6ee7e5d357c4dcf09c`). Publicada de nuevo en Cloudflare el 10 de noviembre de 2026.

**URL:** https://nottas-web-preview.losrobles.workers.dev/

## Funciones de esta versión

- Vinculación mediante **Acceder desde otro teléfono** en Android y clave temporal de un solo uso. No usar clave de recuperación.
- Menú de vistas Todo/Notas/Tareas/Papelera, selección de espacio mediante menú desplegable, búsqueda, modo claro/oscuro.
- Consulta y edición controlada de notas de párrafo simple y tareas; creación, completar tarea y envío a papelera. Preserva estructuras de datos enriquecidos, subtareas, fechas, aprobaciones y recordatorios originales, pero **no ofrece edición completa de esos campos**.
- Sesión **solo en memoria**. Tras recargar o cerrar la página hay que vincular nuevamente.
- **No tiene sondeo automático ni canal push web.** Se sincroniza al vincular, pulsar Actualizar y después de guardar. Por tanto, Android→Web requiere refresco manual en esta versión.
- La API de Cloudflare sigue en `nottas-assistant-api.losrobles.workers.dev`. El backend permaneció en su versión vigente tras PR #9; la reversión **solo afectó al cliente web**. El backend envía FCM a dispositivos Android registrados, pero la recepción inmediata no ha sido reconfirmada tras la reversión.

## Regresiones y medidas preventivas

El usuario identificó esta versión como la referencia que deseaba recuperar. No se debe reconstruir ni volver a incorporar funciones de las versiones posteriores sin prueba de creación y eliminación de **nota y tarea** en ambos sentidos, incluyendo permisos Personal/Oficina y conservación de subtareas.

Los cambios posteriores están en el historial Git y pueden recuperarse selectivamente; no forman parte del despliegue actual. No asumir que la sincronización instantánea se ha verificado a partir de GitHub Actions o de un despliegue exitoso.

No se han modificado Android, D1, las cuentas ni datos durante esta reversión.
