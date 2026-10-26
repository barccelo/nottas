# Google Calendar · fase 2: visualizar eventos (v0.27.9)

Esta fase añade una **capa de eventos de solo lectura** en el calendario de Nottas dentro del espacio de trabajo «Oficina», conservando intactas las tareas locales y compartidas.

## Requisito previo: migración D1 (ejecutar solo una vez)

Cloudflare Dashboard → D1 → **nottas-assistant** → Console. Ejecutar el archivo `google-events-schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS google_calendar_event_windows (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  month TEXT NOT NULL,
  events_json TEXT NOT NULL,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY(workspace_id,calendar_id,month),
  FOREIGN KEY(workspace_id,calendar_id) REFERENCES google_calendar_sources(workspace_id,calendar_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_gcal_event_windows_ws
ON google_calendar_event_windows(workspace_id,month);
```

Esta migración **no borra, modifica ni reubica** tareas, notas, espacios, personas, ni los datos previos de Google OAuth. Si la tabla no existe todavía, el Worker mostrará `calendar_events_unavailable` al consultar eventos; el resto de Nottas seguirá funcionando.

## Conectar y seleccionar

1. Actualiza Nottas a v0.27.9 en el dispositivo del jefe mediante Obtainium.
2. Selecciona el espacio compartido **Oficina** (ID `506ac238-8f65-490f-8bcf-d88fe671b53a`) y pulsa **Sincronizar ahora**.
3. Ajustes → Asistente → Google Calendar → **Comprobar**. Si la cuenta `calendario@losroblesenlinea.com.ve` no está conectada, selecciona **Conectar cuenta Google** y completa OAuth desde el navegador Android.
4. Aparecerá la lista de calendarios que esa cuenta puede consultar. Marca hasta **40 calendarios** y pulsa **Guardar selección**. También hay botones para seleccionar todos (hasta el límite) o ninguno. La selección se almacena **en Cloudflare D1**, por espacio, no en el respaldo JSON ni en el teléfono.
5. Abre el **Calendario** de Nottas. Los eventos Google se mostrarán con el color de origen y la etiqueta de lectura, junto a las tareas del espacio, en vistas Día, Semana, Mes y Agenda.
6. Un toque en el evento muestra título, fuente, fecha, hora y ubicación, si la suministra Google. Nunca permite cambiarlo, completar ni arrastrar eventos de Google. Para actualizar de inmediato, pulsa **Actualizar Google Calendar** en la vista Calendario.

## Arquitectura y límites de esta fase

- Toda consulta a Google y la renovación de su token OAuth se realizan **en el Worker**. La APK nunca recibe un secreto de Google.
- Solo los miembros activos del espacio pueden leer eventos. Solo el **jefe** puede seleccionar fuentes o solicitar una actualización forzada. Se respetan los permisos y los títulos ocultos por Google Calendar.
- El Worker consulta Google Calendar Events con `singleEvents=true` para expandir recurrencias, usa las fechas RFC 3339 y guarda resultados en D1 por calendario y mes. Los eventos se vuelven a consultar después de una antigüedad de **15 minutos**; en el teléfono también hay una caché de siete minutos para evitar consultas redundantes.
- Se conservan correctamente eventos de todo el día, eventos multidiarios y horas con zona horaria del dispositivo. Las tareas se siguen gestionando con la lógica anterior, sin mezclarse con las fuentes Google ni exportarlas como tareas en un JSON.
- Máximo 40 fuentes seleccionadas, ventana por consulta de hasta 125 días. Los errores parciales se indican y puede mantenerse un resultado en caché previo; la interfaz no debe reportar una sincronización completa si faltan calendarios.
- **Todavía no** hay notificaciones de cambios de Google, actualización por Google Push Watch, almacenamiento de historial ilimitado, ni sincronización incremental `nextSyncToken`. Este paso prepara la visualización. En una fase posterior, una cola de sincronización y webhooks evitarán depender de la ventana de caché.
- Un espacio distinto de Oficina no recibe eventos de Oficina. Los datos cacheados se eliminan del servidor por cascada si se elimina su espacio o su calendario fuente.
