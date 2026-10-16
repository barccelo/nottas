# Recuperación de espacios Asistente tras reinstalación (v0.27.6)

## Causa

La copia JSON conserva tareas, notas, categorías, metadatos del espacio y nombres/roles de interfaz, pero **no** incluye un token de autenticación reutilizable del servidor. Al reinstalar y registrar otra vez, el servidor crea un **usuario diferente**, con su propio espacio Personal. El espacio anterior puede verse localmente (desde el JSON), pero la cuenta nueva no es propietaria de él; el servidor rechaza llamadas y Google Calendar con `owner_required` o `workspace_forbidden`.

Es un fallo de continuidad de identidad; los avisos «registrado» y «push listo» no prueban que el usuario sea miembro de un espacio determinado.

## Protección añadida

- Antes de cada sync, el cliente consulta `GET /v1/me`, reconcilia el ID real del usuario y la lista de miembros que devuelve el servidor y **solo sube cambios de espacios autorizados**. Los espacios del JSON sin acceso se etiquetan «Sin acceso», no «Jefe».
- «Registrar de nuevo» requiere una segunda confirmación. No reutiliza accidentalmente el usuario antiguo.
- Los espacios duplicados u obsoletos pueden **ocultarse en el teléfono** y volver a mostrarse desde Ajustes → Asistente. No se borran tareas o datos del servidor.
- El propietario de un espacio puede restaurarse **solamente** con un código aleatorio de un solo uso, generado por un administrador en Cloudflare D1. Un respaldo JSON, un ID de espacio y un código de invitación **no** sirven para recuperar la propiedad.

## Migración de base de datos (solo una vez, antes del deploy)

En Cloudflare Dashboard → D1 SQL Database → `nottas-assistant` → Console, ejecutar el contenido de `workspace-recovery-schema.sql`. Crea solo una tabla y un índice nuevos. No modifica espacios o tareas actuales.

Tras la migración, desplegar el Worker actualizado desde GitHub Actions → **Deploy Nottas Assistant Worker**. Instalar Nottas v0.27.6 mediante Obtainium.

## Restablecer el dueño de un espacio anterior

1. En el teléfono **del jefe**, abrir Nottas → menú lateral → seleccionar el espacio compartido original que vino del JSON (no crear otro).
2. Entrar en Ajustes → Asistente → Espacios de trabajo. Copiar el **ID del espacio seleccionado**.
3. En la consola D1, opcionalmente identificar los espacios existentes mediante:

   ```sql
   SELECT id, name, owner_user_id
   FROM workspaces
   WHERE kind='assistant'
   ORDER BY created_at;
   ```

4. Ejecutar la instrucción siguiente, **reemplazando solo el texto `AQUI_EL_ID_DEL_ESPACIO` por el ID exacto mostrado en Nottas**:

   ```sql
   INSERT INTO workspace_recovery_codes(code, workspace_id, expires_at)
   SELECT lower(hex(randomblob(24))), id, (unixepoch() * 1000) + 900000
   FROM workspaces
   WHERE id = 'AQUI_EL_ID_DEL_ESPACIO' AND kind='assistant'
   RETURNING code, workspace_id;
   ```

   Debe devolver una sola fila con un `code` de **48 caracteres hexadecimales** y el `workspace_id` correspondiente. El código caduca a los **15 minutos**.

5. Copiar `code` en el campo **Código de recuperación de Cloudflare** de la app (en el mismo espacio original) y pulsar **Restaurar propiedad**.
6. Pulsar **Sincronizar ahora** y comprobar que el rol ya aparece como «Jefe».
7. **En el teléfono del asistente**: si también fue reinstalado, su usuario del servidor cambió. Entrar en Ajustes → Asistente → «Código de invitación», introducir el código que muestra el jefe en ese mismo espacio y pulsar «Unirme». Después, pulsar **Sincronizar ahora**. Simplemente sincronizar una sesión nueva que aún no sea miembro no basta.
8. Solo después de verificar las llamadas y Google Calendar, ocultar los espacios duplicados usando **Ocultar en este teléfono**. Pueden restaurarse desde **Espacios ocultos**.

## Efecto sobre el propietario anterior

La recuperación *transfiere* la propiedad a la sesión del dispositivo que canjea el código. Desactiva la membresía del propietario antiguo de ese espacio, sin borrar su usuario, su espacio personal, sus tareas, los contenidos compartidos, los códigos de invitación, ni los dispositivos o sesiones históricas. Los miembros que ya eran asistentes permanecen. Si algún otro dispositivo sigue usando la sesión antigua del jefe, habrá que reconectarlo adecuadamente; **no** debe ejecutar «Registrar de nuevo» como procedimiento automático de recuperación.

**No publiques los códigos de recuperación.** Son temporales pero otorgan propiedad del espacio. No es necesario pegar credenciales OAuth, secretos de GitHub, ni contraseñas de Google. Esta solución es transitoria hasta introducir un inicio de sesión recuperable (p. ej. passkeys) para la identidad del jefe.

## Alcance

No existe todavía eliminación definitiva remota de espacios compartidos, ni restauración automatizada de identidad por JSON (sería insegura). «Ocultar» es reversible y local; las funciones existentes de tareas, llamadas, FCM y Google Calendar no deben perder sus datos.
