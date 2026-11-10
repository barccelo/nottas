# Nottas Web — primera implementación experimental

La interfaz estática está en `web/index.html` y utiliza los tokens y criterios básicos de `DESIGN_SYSTEM.md`. Es una vista de escritorio adaptable, **no una sustitución del cliente Android**.

## Acceso y sincronización

1. Vista de prueba desplegada en `https://nottas-web-preview.losrobles.workers.dev/` mediante Cloudflare Worker independiente; no sustituye el API existente.
2. En Android: Ajustes → Asistente → generar **clave de vinculación de cuenta** (no invitación al equipo). Caduca a los 10 minutos y es de uso único.
3. En Nottas Web, introducir la URL HTTPS del Worker configurado en Android y la clave.
4. El navegador obtiene una sesión independiente mediante `POST /v1/auth/redeem`; consulta los espacios autorizados mediante `GET /v1/me` y carga el snapshot con `GET /v1/sync?full=1`.
5. La creación, cambios de título/texto, finalización de tareas y envío a papelera utilizan `POST /v1/sync`. Se conserva el resto del payload para no borrar subtareas, calendarios, recordatorios y metadatos compartidos.

## Precauciones

- No se registra una nueva cuenta, no se solicita ni expone un token Android existente, y la clave temporal se borra del formulario después de canjearse.
- La sesión se mantiene solo en sessionStorage de la pestaña y se intenta restaurar al recargar; cerrar la pestaña o pulsar Salir elimina la sesión del navegador. La sesión emitida permanece en el servidor hasta su revocación; añadir gestión y caducidad de sesiones web antes de ofrecerlo como acceso público definitivo.
- Solo se muestran entidades que ya están sincronizadas en D1. Datos que permanezcan únicamente en WebView de Android no aparecerán automáticamente.
- Las notas de párrafo simple pueden editar texto y título; los bloques enriquecidos son de solo lectura en el contenido, pero permiten editar el título sin sobrescribir los bloques. No se modifican roles, aprobación, historial de reuniones ni alarmas nativas desde el editor web.
- La web permite crear nota/tarea, editar subtareas y fecha/hora, ver Personal/Oficina como espacios separados y utilizar Ctrl/Cmd+K para buscar, Ctrl/Cmd+N para nueva nota y Ctrl/Cmd+Enter para guardar. La web requiere conexión. Refresca cambios incrementales cada 1,5 segundos cuando la pestaña está visible; se actualiza al enfocar y realiza un snapshot completo cada 5 minutos. Después de una escritura, aplica la respuesta aceptada del servidor inmediatamente en la interfaz y después reconcilia; las respuestas HTTP anteriores al guardado se descartan. Cuando hay errores de red aplica un margen de reintento de 10 segundos. No hay cola offline ni edición simultánea con resolución visual de conflictos.
- No se almacena ninguna clave, token o URL privada en el repositorio. No incluir el Worker personal en el código.
- La previsualización fue desplegada como Cloudflare Worker `nottas-web-preview` y se validó la sintaxis JavaScript, pero no se han probado los flujos desde un navegador real; no publicar como producto estable sin pruebas de seguridad, integración y sincronización entre dispositivos.

## Validaciones manuales antes de desplegar

- Vinculación con clave vigente, inválida, expirada y reutilizada; cierre de pestaña y recarga.
- Acceso solo a espacios autorizados y separación de Personal / Asistente.
- Crear nota/tarea; editar texto y título; marcar completada; mover a papelera; verificar en Android.
- Editar título de nota enriquecida sin perder bloques ni formatos en Android.
- Editar tareas con subtareas, fechas y recordatorios sin modificar campos no relacionados.
- Simular conflicto entre Android y web; confirmar que se muestra un aviso y no se sobrescribe el contenido remoto.
- Contraste, teclado, lector de pantalla, diseños estrechos y temas claro/oscuro.
- Validar límites del endpoint snapshot (5000 entradas por espacio), reglas de roles y enlaces temporales.

Esta rama no cambia Android, Worker ni esquema de D1. La publicación de una web de producción y una eventual APK de actualización son tareas separadas.


## Corrección de latencia — 10/11/2026

La web usa consultas incrementales, **no FCM/Web Push**. El móvil sí utiliza FCM. Se redujo la espera de la web desde 8 s a 1,5 s en primer plano y se corrigió que crear/eliminar desde la web dependiera de un GET adicional para reflejarse. El transporte web verdaderamente push requerirá un canal de eventos autenticado (WebSocket/SSE/Push) implementado y probado por separado; evitar afirmar que existe. Los avisos FCM y la entrega en Android pueden sufrir latencia variable; confirmar en pruebas reales.


## Reversión por regresión (10/11/2026)

Por reporte del usuario, se restauró `web/index.html` de commit `46429cac` y se redeplegó al Worker de prueba. Se retiraron la aceleración a 1,5 segundos y la aplicación optimista de POST. Se vuelve al comportamiento de 8 segundos con FCM backend sin cambios; está pendiente confirmación del comportamiento Android real y corrección segura de bajas. No usar la sección anterior de latencia como estado vigente.
