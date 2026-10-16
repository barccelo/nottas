# Google Calendar · primera fase (autorización y descubrimiento)

La API de Google Calendar y las credenciales OAuth deben estar configuradas previamente en el proyecto Google Cloud `nottas`, con OAuth interno. La cuenta autorizada es `calendario@losroblesenlinea.com.ve`. Este piloto incorpora la conexión de solo lectura para **espacios Asistente**.

## Desplegar en Cloudflare

**Orden obligatorio:** primero crear las tablas D1, luego publicar el nuevo Worker, y finalmente instalar la nueva APK desde GitHub Releases / Obtainium.

Desde el directorio `cloudflare/assistant`, en una sesión Wrangler autenticada en la cuenta Cloudflare correcta:

```sh
npx wrangler d1 execute nottas-assistant --remote --file=google-calendar-schema.sql
npx wrangler deploy
```

Alternativa: en Cloudflare Dashboard → D1 → `nottas-assistant` → consola, ejecutar el SQL de `google-calendar-schema.sql`; luego desplegar el Worker actualizado. Ejecutar `wrangler deploy` del repositorio **después** del cambio en GitHub, no solo hacer clic en Deploy de la configuración de secretos: eso no publica el código nuevo.

Se necesitan secretos protegidos ya configurados:
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`

OAuth exige que el cliente web de Google tenga exactamente la URI:

```text
https://nottas-assistant-api.losrobles.workers.dev/v1/google/oauth/callback
```

Nunca publicar los secretos OAuth en GitHub, dentro de la APK ni en este documento. El token de renovación se cifra antes de guardarse en D1 con AES-256-GCM, usando una clave derivada del secreto del cliente. **Rotar el secreto del cliente inutiliza los tokens almacenados; hay que volver a autorizar los espacios afectados.**

## Probar desde Nottas

1. Actualizar a la APK que contiene `Conectar cuenta Google` en Ajustes → Asistente.
2. Desde el dispositivo del **jefe**, entrar al espacio compartido Asistente donde se desea conectar la cuenta.
3. Abrir Ajustes → Asistente → Google Calendar → **Conectar cuenta Google**.
4. El navegador externo de Android abrirá Google. Elegir `calendario@losroblesenlinea.com.ve` y autorizar acceso de solo lectura.
5. Al obtener la confirmación en el navegador, regresar a Nottas y pulsar **Comprobar**.
6. La aplicación debe mostrar la dirección de la cuenta y los nombres de los calendarios disponibles. El jefe puede usar **Actualizar lista** si cambia la lista de calendarios en Google.

El Worker almacena las listas por espacio compartido. Los miembros de ese espacio pueden consultarlas; solo el dueño puede iniciar la autorización o refrescar la lista de calendarios. La app no recibe tokens OAuth, y el navegador de Google no se abre en WebView.

## API de esta fase

- `POST /v1/workspaces/:id/google/connect` — devuelve URL de autorización, solo jefe, requiere sesión del dispositivo.
- `GET /v1/google/oauth/callback` — callback OAuth, protege estado con token aleatorio de un solo uso, caduca en 10 minutos, usa PKCE.
- `GET /v1/workspaces/:id/google` — estado de conexión.
- `GET /v1/workspaces/:id/google/calendars` — lista de calendarios cacheada en D1.
- `POST /v1/workspaces/:id/google/discover` — actualiza lista desde Google, solo jefe.

**Fuera del alcance de esta fase:** todavía no se recuperan eventos, no se dibujan eventos externos en día/semana/mes/agenda, no hay canales `watch`, `syncToken` ni panel de métricas de consumo. Esas piezas requieren después caché de eventos, permisos de visibilidad entre jefe y asistente, tratamiento de recurrencias y métricas por calendario. El desplegar esta fase no activa automáticamente la integración visual.

### Protección de datos

Solicita únicamente `calendar.calendarlist.readonly` y `calendar.events.readonly`. No modifica eventos de Google. La autorización es exclusiva del espacio compartido y no altera tareas, notificaciones Firebase ni la sincronización existente.
