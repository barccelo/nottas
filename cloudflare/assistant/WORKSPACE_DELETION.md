# Llamadas rápidas y limpieza de espacios compartidos (v0.27.8)

## Botón de llamada en Inicio

El botón rápido de llamada de la pantalla inicial y el botón de Ajustes → Asistente usan exactamente la misma invocación `assistantCall()`. El evento `click` no debe pasarse como identificador de usuario (`toUserId`); antes se serializaba como un objeto y el servidor devolvía `invalid_target`, aunque las llamadas desde Ajustes sí funcionaran.

## Eliminar los espacios compartidos de prueba en Cloudflare

Un **espacio** es distinto de un **miembro**. Desvincular una cuenta antigua de David no elimina su espacio compartido ni los contenidos remotos. Ocultar un espacio en un teléfono tampoco borra la base de datos.

La nueva operación se encuentra en **Ajustes → Asistente → Espacios de trabajo → Eliminar espacio de Cloudflare** y solo está visible en un espacio **Asistente** cuyo propietario haya sido verificado contra el servidor. Los espacios **Personal** no pueden eliminarse con esta función.

1. Actualizar Nottas a v0.27.8 o superior.
2. Antes de eliminar, exportar un respaldo JSON desde Ajustes y guardarlo de forma segura.
3. Seleccionar en el menú lateral **el espacio de prueba** que se desea retirar. No seleccionar «Oficina» si es el espacio de trabajo actual.
4. Abrir Ajustes → Asistente → Espacios de trabajo. Comprobar el **nombre e ID** del espacio actual.
5. Pulsar **Revisar eliminación de este espacio**. Nottas consulta al Worker y muestra las cantidades de elementos, notas, llamadas, cambios y miembros que se eliminarán, y si contiene una conexión a Google Calendar.
6. Si el nombre e ID son correctos, escribir exactamente **ELIMINAR**, marcar la casilla de confirmación de pérdida definitiva de información y pulsar **Eliminar definitivamente de Cloudflare**.
7. La app archivará como `inactive` el **registro local** del espacio eliminado para que ya no aparezca en el menú; sus elementos en el almacenamiento local no se descartan silenciosamente. En el **servidor**, se borran por cascada todos los datos del espacio, incluidos los elementos compartidos, miembros, historial de llamadas, sincronizaciones, conexión Google Calendar y tokens OAuth asociados. No se borran las identidades de usuario, espacios personales ni otros espacios compartidos.
8. Repetir solo con los otros espacios de prueba que realmente deban desaparecer.

**No se admite deshacer en Cloudflare.** En caso de dudas, usar **Ocultar en este teléfono** en vez de eliminar. Una copia JSON no restablece automáticamente un espacio eliminado del servidor ni su identidad: para restaurar la colaboración habría que crear y configurar otro espacio.

## API

- `GET /v1/workspaces/:id/deletion-preview`: solo para el propietario del espacio Asistente; devuelve `name`, `workspaceId`, `contentCount`, `noteCount`, `memberCount`, `changeCount`, `callCount` y `googleConnected`.
- `DELETE /v1/workspaces/:id`: solo para el propietario del espacio Asistente; exige `workspaceId`, `workspaceName`, `confirmation: "ELIMINAR"` y `backupAcknowledged: true`. El backend valida permisos y coincidencia de nombre e ID y borra exclusivamente el espacio elegido.

Ninguna de estas rutas permite borrar un espacio Personal ni un espacio sin la propiedad correspondiente. Al terminar se envía a los miembros anteriores una señal de sincronización por Firebase, sin revelar contenido. El borrado depende de las claves foráneas `ON DELETE CASCADE` definidas en D1.

No se necesitan migraciones SQL adicionales. Las pruebas de backend para permisos, confirmación e identidad del espacio se ejecutan antes de cada despliegue automático del Worker.
