# Nottas Web — primera implementación experimental

La interfaz estática está en `web/index.html` y utiliza los tokens y criterios básicos de `DESIGN_SYSTEM.md`. Es una vista de escritorio adaptable, **no una sustitución del cliente Android**.

## Acceso y sincronización

1. Alojar `web/` en un origen HTTPS confiable (por ejemplo, Cloudflare Pages). No está desplegado todavía.
2. En Android: Ajustes → Asistente → generar **clave de vinculación de cuenta** (no invitación al equipo). Caduca a los 10 minutos y es de uso único.
3. En Nottas Web, introducir la URL HTTPS del Worker configurado en Android y la clave.
4. El navegador obtiene una sesión independiente mediante `POST /v1/auth/redeem`; consulta los espacios autorizados mediante `GET /v1/me` y carga el snapshot con `GET /v1/sync?full=1`.
5. La creación, cambios de título/texto, finalización de tareas y envío a papelera utilizan `POST /v1/sync`. Se conserva el resto del payload para no borrar subtareas, calendarios, recordatorios y metadatos compartidos.

## Precauciones

- No se registra una nueva cuenta, no se solicita ni expone un token Android existente, y la clave temporal se borra del formulario después de canjearse.
- El token de sesión permanece solo en memoria del navegador. Cerrar/recargar obliga a vincular otra vez. La sesión emitida permanece en el servidor hasta su revocación; añadir gestión y caducidad de sesiones web antes de ofrecerlo como acceso público definitivo.
- Solo se muestran entidades que ya están sincronizadas en D1. Datos que permanezcan únicamente en WebView de Android no aparecerán automáticamente.
- Las notas de párrafo simple pueden editar texto y título; los bloques enriquecidos son de solo lectura en el contenido, pero permiten editar el título sin sobrescribir los bloques. No se modifican roles, aprobación, historial de reuniones ni alarmas nativas desde el editor web.
- La web requiere conexión. Aún no hay cola offline ni edición simultánea con resolución visual de conflictos.
- No se almacena ninguna clave, token o URL privada en el repositorio. No incluir el Worker personal en el código.
- No está probado en navegadores reales ni se ha desplegado Cloudflare Pages; no publicar como producto estable sin pruebas de seguridad, integración y sincronización entre dispositivos.

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
