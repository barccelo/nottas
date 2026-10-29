# Equipos de trabajo de Nottas — arquitectura compatible con v0.27.57

## Principios
- Una cuenta se representa por `users.id`. Los teléfonos son sesiones de esa cuenta.
- Un equipo mantiene su `workspaces.id`, sus tareas, notas, mensajes, eventos y el estado de Google Calendar.
- Un código de invitación del equipo concede únicamente el rol de asistente.
- La dirección se asigna explícitamente por el administrador actual a un integrante que ya pertenece al equipo.
- Los ajustes anteriores se conservan bajo Soporte y diagnóstico para no romper instalaciones existentes.

## Primer uso
1. Crear cuenta con nombre (registra una identidad y un espacio Personal).
2. Crear equipo o introducir un código de invitación de un equipo existente.
3. El primer creador administra provisionalmente el equipo. Si creó el equipo un asistente, cuando se incorpore el director puede pulsar «Hacer director» y confirmar. La persona creadora pasa a asistente.
4. Cada teléfono configura su acceso; no se duplican los equipos.

## Un teléfono nuevo, la misma cuenta
Desde el dispositivo con sesión, «Iniciar sesión en otro dispositivo» genera una clave aleatoria válida por 10 minutos, de un uso. En el teléfono nuevo, «Ya tengo una cuenta» permite introducirla. Se crea una sesión adicional con el mismo userId. No transfiere ni elimina automáticamente la sesión anterior.

También existe «Crear o renovar clave de recuperación». Es una clave de alta entropía de un uso, que debe conservarse fuera de Nottas. Permite recuperar la identidad sin disponer del teléfono anterior. Generar otra invalida la anterior. Tras utilizarla, se debe emitir una nueva.

Las claves se guardan en la tabla `sessions` mediante SHA-256 y con marcadores reservados `nottas-link` / `nottas-recovery`. El middleware rechaza esos marcadores como sesiones bearer ordinarias. La redención hace un DELETE ... RETURNING atómico. No hace falta migración D1.

## Configuración de notificaciones
El cliente solicita `GET /v1/client-config`. El Worker puede proporcionar exclusivamente datos públicos de Firebase definidos como variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_API_KEY`

**No** colocar claves privadas, service accounts ni secretos OAuth en estas variables. Hasta provisionar esos cuatro valores públicos en el Worker de producción, un dispositivo totalmente nuevo puede requerir la configuración técnica anterior para registrar FCM. La cuenta, las tareas y la sincronización no dependen de que FCM esté listo; la entrega en segundo plano sí.

## Compatibilidad y despliegue
- No reemplazar ni regenerar el ID original de Oficina.
- No borrar roles, usuarios, sesiones ni dispositivos actuales.
- Publicar backend y cliente; ejecutar las pruebas del Worker y la compilación Android.
- Comprobar en dos teléfonos: acceso existente, unión por invitación, transferencia de dirección confirmada, mensajes, llamadas, notificaciones y Google Calendar.
- No retirar el modo de diagnóstico hasta verificar esos escenarios con dispositivos físicos.

## Limitación
El acceso con clave se ha diseñado sin un servicio externo de correo. Todavía no hay autenticación mediante correo o passkeys, ni escaneo QR nativo. Estos pueden incorporarse sin cambiar IDs de usuario, espacios o membresías.
