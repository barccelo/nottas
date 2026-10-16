# Diagnóstico de llamadas de Asistente después de reinstalar Nottas

## Problema corregido en v0.27.7

Después de registrar el teléfono del asistente otra vez, la tabla `workspace_members` podía conservar **dos usuarios diferentes con el mismo nombre** (por ejemplo, «David»). El Worker de llamadas elegía el primero incorporado (`ORDER BY joined_at`), que con frecuencia era el antiguo y ya no tenía una instalación operativa. En ese caso, devolvía éxito aunque el push faltara o Firebase rechazara el envío. Además, la UI no actualizaba la actividad después de llamar.

## Cambio

- `/v1/workspaces/:id/call` considera los usuarios asistentes activos y **prioriza el registro de dispositivo con token FCM más reciente**. Si el antiguo falla, prueba otros asistentes vinculados que tengan push.
- Si no hay token registrado, devuelve `assistant_push_not_registered` (HTTP 409); si Firebase rechaza todas las entregas, devuelve `assistant_push_delivery_failed` (HTTP 502) y registra la llamada como `failed`. Nunca anuncia una entrega sin respuesta satisfactoria de FCM.
- Una respuesta HTTP satisfactoria de FCM significa **aceptación de Firebase**, no prueba de que Android haya mostrado la pantalla de llamada. Para eso hay que verificar las notificaciones y permisos de pantalla completa del teléfono.
- En Ajustes → Asistente hay un botón **Actualizar registro push**.
- En **Equipo y actividad**, cada cuenta del asistente muestra una terminación identificadora distinta, información del último registro push, y se pueden hacer llamadas a una cuenta concreta.
- El jefe puede **desvincular** una cuenta asistente antigua mediante doble confirmación. Solo se modifica su membresía; **no se borran notas, tareas, usuarios ni mensajes existentes**.
- El envío de llamadas refresca el panel Equipo y actividad inmediatamente.
- Cuando se asocia un token FCM a un dispositivo reinstalado, se libera de cualquier identificador de dispositivo anterior en D1.

## Verificación con dos teléfonos

1. Actualizar ambos teléfonos a Nottas v0.27.7 o superior desde Obtainium. No reinstalar ni registrar nuevamente las identidades.
2. Seleccionar el **mismo espacio compartido existente** en ambos teléfonos y sincronizar.
3. En el teléfono del asistente → Ajustes → Asistente, pulsar **Actualizar registro push**. Si hay token nativo, debe decir **Push registrado en Cloudflare**; si sigue pendiente, comprobar configuración Firebase, conexión y permisos de notificaciones. Puede tardar unos segundos en llegar el token de Firebase.
4. En el teléfono del jefe → Ajustes → Asistente → Equipo y actividad, pulsar **Actualizar**. Verificar que uno de los «David» tenga un registro push reciente. Si ambos lo tienen, probar **Llamar a esta cuenta** en la más reciente.
5. Comprobar que Firebase acepte la solicitud y que el segundo teléfono reciba la pantalla de llamada. Si Firebase la acepta pero no hay interfaz en Android, verificar **Notificaciones**, el canal **Asistente · Llamadas**, permiso de notificación a pantalla completa y ejecutar **Probar llamada en este teléfono**. Si la prueba local tampoco funciona, el problema es Android/permiso, no el enrutamiento FCM.
6. Solo cuando se confirme qué cuenta funciona, pulsar **Desvincular** en la cuenta antigua, revisar su terminación identificadora y pulsar **Confirmar desvinculación**. La operación conserva todo el contenido compartido y no borra los datos del usuario antiguo; no desconectar la cuenta más reciente por error.
7. Pulsar **Actualizar** otra vez. Debe quedar una cuenta asistente activa junto al jefe, y las llamadas generales deben utilizar la cuenta con push registrado.

## Depuración por D1 (solo lectura)

Los siguientes SELECT ayudan a investigar sin compartir contraseñas, tokens o secretos:

```sql
SELECT m.workspace_id,m.user_id,u.display_name,m.role,m.status,m.joined_at,
       MAX(d.updated_at) AS last_device_push
FROM workspace_members m
JOIN users u ON u.id=m.user_id
LEFT JOIN devices d ON d.user_id=m.user_id AND d.fcm_token IS NOT NULL
WHERE m.workspace_id='SUSTITUIR_POR_ID_REAL'
GROUP BY m.workspace_id,m.user_id,u.display_name,m.role,m.status,m.joined_at
ORDER BY last_device_push DESC;

SELECT id,workspace_id,from_user_id,to_user_id,status,created_at,responded_at
FROM assistant_calls
WHERE workspace_id='SUSTITUIR_POR_ID_REAL'
ORDER BY created_at DESC
LIMIT 20;
```

No mostrar `fcm_token`, `session.token_hash`, secretos de Firebase o Google.

No es necesaria una migración D1 para esta actualización.
