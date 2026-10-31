# Historial de cambios de Nottas

Los cambios de código y la publicación de la APK deben verificarse por separado.

## 0.27.75 — 31 de octubre de 2026

- Centrado vertical del campo editable de título respecto al check de completar en la cabecera del editor de tareas y eventos, conservando la flecha Atrás y la estrella en su posición.
- Unificación del lenguaje visual de todas las casillas de verificación: círculos con borde gris y estado marcado azul, siguiendo el aspecto de la lista principal.
- Incluye checkboxes de subtareas, listas de notas, Agenda, tarjetas de calendario, selección múltiple, casillas de recordatorios y configuración de Google Calendar.
- Los interruptores de activación/desactivación permanecen intactos y los checkboxes conservan su lógica de estado y persistencia.
- Revisión de sintaxis JavaScript. Pendiente prueba visual y táctil en Android, además de confirmar la compilación y la publicación de la APK firmada.

## 0.27.74 — 31 de octubre de 2026

- Día y Semana aprovechan toda la altura disponible de la hoja, sin un espacio muerto bajo la cuadrícula; el desplazamiento vertical se conserva cuando las horas exceden el alto de la pantalla.
- Escala horaria adaptable al alto disponible: se mantiene un mínimo legible en vista de 24 horas y crecen las filas cuando el intervalo laboral es corto; los eventos mantienen fecha y duración originales.
- Icono de restauración de Papelera redibujado como flecha de retorno estilizada, con superficie de toque y estados coherentes.
- Eliminados el margen inferior heredado de 110 px en subtareas y el padding de 110 px del editor de bloques de tareas; descripción y casillas quedan más próximas.
- «Elementos marcados» usa un check circular y un chevron vectorial en lugar del símbolo genérico; iconos de calendario vectoriales en los campos de fecha de inicio y fin.
- Reducidos la separación superior, alto del handle y márgenes del encabezado de Calendario, y el padding superior duplicado de los editores de tareas/notas.
- Validación: sintaxis JS y escenarios de escala 24 h / 9 h; pendiente prueba visual en Android y comprobación de compilación/publicación APK.

## 0.27.73 — 30 de octubre de 2026

- Cabecera del editor de tareas y eventos compactada en una sola fila real: Atrás, completar, título editable y estrella. Se recolocan los mismos controles, sin duplicados; las notas conservan su cabecera original.
- Corregido el retroceso fantasma tras cerrar el teclado Android: el host notifica la ocultación a la WebView y el manejador web ya no consume Atrás por foco residual sin teclado.
- Ocultado el texto normal de contador/solo lectura de Google Calendar sobre la cuadrícula y el texto de conteo/límite/propietario del panel del ojito; los errores de conexión y estados de carga relevantes siguen visibles.
- El ojito ya solo filtra temporalmente fuentes Google en la vista: ocultar/mostrar con toque, pulsación prolongada para ver exclusivamente una fuente y «Mostrar todos» para salir del modo solitario. No cambia calendarios activos ni llama al endpoint de selección; calendarios inactivos se administran solo desde Ajustes.
- Añadido acceso «Administrar calendarios de Google» desde el panel del ojo hacia Ajustes → Equipo de trabajo → Google Calendar.
- Los paneles pueden arrastrarse desde el encabezado y superficies no interactivas además del handle, con umbral de movimiento vertical para no cancelar los toques precisos.
- Los eventos de 30 minutos o menos reciben altura táctil mínima y distribución que tiene en cuenta dicha altura; los títulos de eventos largos usan un número dinámico de líneas proporcional al espacio realmente disponible, incluido Google Calendar.
- Sintaxis JavaScript comprobada; pendiente comprobar compilación, publicación y gestos/maquetación en Android.

## 0.27.72 — 30 de octubre de 2026

- **Papelera:** la búsqueda filtra por texto entre tareas y notas eliminadas, y el campo aparece inmediatamente después del encabezado, sin desalineaciones con las acciones inferiores.
- **Búsqueda en Tareas y Notas:** muestra primero coincidencias del filtro activo y después «Otras coincidencias», incluidas completadas o pertenecientes a otra categoría/fecha; mantiene intacto el filtro elegido y limita resultados al espacio actual.
- **Calendario más compacto:** escala temporal de 40 px por hora en Día y Semana, sin ampliar artificialmente las horas laborales.
- **Eventos anteriores:** color gris y opacidad atenuada para eventos que terminaron, también en listas y puntos del mes; su estado de realizado/no realizado no cambia.
- **Vista Día:** cada evento simultáneo ocupa un carril propio (sin ocultar el tercero tras un indicador); se habilita desplazamiento horizontal cuando falta espacio. Semana conserva los grupos cromáticos compactos.
- Validación de sintaxis completa del JavaScript y pruebas lógicas de búsquedas, solapamientos y fuentes ocultas; pendiente prueba visual/táctil en Android y verificación de la APK firmada.

## 0.27.71 — 30 de octubre de 2026

- Unificación del cálculo de colisiones entre eventos de Nottas y Google Calendar en las vistas Día y Semana; se elimina la prioridad visual involuntaria de Google Calendar.
- En Día, eventos simultáneos ocupan columnas paralelas (hasta dos). Con tres o más solapamientos reales, aparecen dos vistas previas coloreadas, contador y acceso a la lista completa.
- En Semana, los solapamientos se representan mediante franjas de los colores de origen y contador interactivo, conservando las tarjetas individuales cuando no existe colisión.
- La lista reutiliza la hoja de eventos con nombre, hora, origen y acceso individual; Google Calendar sigue siendo de solo lectura y Nottas mantiene edición, completar, mover y redimensionar donde se muestran tarjetas individuales.
- Se contemplan solapamientos parciales y eventos que cruzan los límites del horario laboral visible. Pendiente verificar fidelidad gráfica, tacto y compilación en Android.

## 0.27.70 — 30 de octubre de 2026

- Eliminado el fondo blanco cuadrado que rodeaba el icono de la aplicación en Android; el símbolo azul queda recortado con esquinas exteriores transparentes.
- Reemplazado exclusivamente el WebP del lanzador (256 × 256 con canal alfa), conservando intacto el símbolo de notificaciones «tt» y el comportamiento de Nottas.
- Pendiente verificación visual en Android tras actualizar la APK.

## 0.27.69 — 30 de octubre de 2026

- Nuevo icono del lanzador: diseño «N» azul suministrado por el usuario, como imagen WebP optimizada.
- Nuevo recurso monocromático «tt» para la barra de notificaciones, vectorizado desde la segunda imagen y con check/calendario transparentes.
- Sustitución de iconos pequeños en mensajes, llamadas del asistente, notificaciones del director, recordatorios y servicio persistente.
- Ajustes rápidos y Firebase usan «tt»; los accesos directos usan la nueva «N».
- Pendiente validación visual en Android.

## 0.27.68 — 30 de octubre de 2026

- Restaurado el botón de agrupación rápida por fecha y hora, separado del botón adicional para Filtrar y ordenar.
- Los dos botones mantienen estados activos independientes y dimensiones adaptadas a pantallas estrechas.
- Selector de estado de evento: iconos, colores semánticos, textos descriptivos, grupos de opciones e indicador de selección; conserva todas las acciones y el segundo toque de cancelación.
- Hoja Filtrar y ordenar: introducción con icono, iconos de filtros y ordenación, tarjetas compactas, marcas de selección y estilo claro/oscuro.
- Preferencias de ordenación y agrupación continúan guardándose. Comprobación sintáctica de JavaScript satisfactoria; pendiente prueba táctil en dispositivos.

## 0.27.67 — 30 de octubre de 2026

- Corregida la superposición de la cabecera de navegación mediante cabecera fija, contenido desplazable independiente y accesos a Papelera/Ajustes anclados.
- Icono de Ajustes reutilizado de la barra principal; icono de Papelera unificado con el símbolo de la aplicación; accesos inferiores con identidad gráfica y variantes claro/oscuro.
- Nuevo panel «Filtrar y ordenar» junto a Pendientes: filtros rápidos y cinco órdenes, predeterminando fecha más reciente primero.
- La ordenación se conserva entre aperturas; agrupación cronológica integrada al panel y coherente con el sentido de orden elegido.
- Atrás en subapartados de Configuración vuelve primero a Configuración. Corrección equivalente al volver desde ajustes del equipo y al cerrar el nuevo selector de filtros.
- JavaScript validado sintácticamente; pruebas de interacción Android pendientes.

## 0.27.66 — 30 de octubre de 2026

- Añadido **No realizada** como estado de cierre independiente de Diferida, Cancelada y Realizada; mantiene los datos y el historial.
- Selector de estados con las ocho acciones visibles en cualquier situación, dentro y fuera del editor.
- Pulsación prolongada del check de nuevos eventos y eventos heredados sin marca de seguimiento abre el mismo selector.
- No realizada queda fuera de Pendientes y sin nuevos recordatorios; su chip usa icono y color neutros.
- El Worker admite y conserva No realizada y restituye el seguimiento a los eventos del espacio compartido.
- Cambios en código pendientes de validación manual en los dos teléfonos.

## 0.27.65 — 30 de octubre de 2026

- Barra lateral rediseñada: agrupación compacta, iconos para filtros y navegación, categorías con iconografía propia y estilos claros/oscuros.
- Deslizamiento desde la izquierda en Tareas para abrir navegación, incluido el borde de las tarjetas sin sustituir su gesto normal de edición; deslizamiento inverso para cerrar.
- En el editor a pantalla completa, el estado es pulsable y abre la misma hoja de selección disponible en las tarjetas.
- El asistente y el director autorizados pueden modificar los estados y el seguimiento de eventos del espacio, independientemente del creador; el Worker conserva los cambios.
- Cambio de fecha/hora del asistente sin degradación automática del evento a propuesta.
- Pendiente de verificar experiencia en dispositivos; despliegue de Worker y APK mediante GitHub Actions.

## 0.27.64 — 30 de octubre de 2026

- Eliminación inequívoca de categorías por ID y espacio, incluso con registros históricos duplicados.
- Eliminada la reasignación automática por ID de categorías remotas al espacio incorrecto.
- Cloudflare: las instantáneas completas incluyen categorías borradas; bloqueado el resurgimiento por datos antiguos de otros dispositivos.
- Los borrados explícitos de categorías prevalecen ante revisiones antiguas; normalización de fechas ISO en el Worker.
- Sincronización completa inicial una vez por apertura para recuperar borrados omitidos.
- Requiere publicar APK y desplegar Worker. La comprobación en ambos dispositivos sigue pendiente.

## 0.27.63 — 30 de octubre de 2026

- Tarjetas de eventos: mostrar solo un estado principal; las reuniones realizadas, diferidas o canceladas no conservan a la vez la etiqueta «Agendada».
- Corregida la pérdida de color en los iconos de categorías dentro de las tarjetas.
- Corregida la selección de categorías con el mismo nombre en ámbitos diferentes mediante preservación del ID.
- Corregidas las comparaciones de fechas ISO frente a marcas de tiempo numéricas en la sincronización.
- Protegidas las eliminaciones locales pendientes de categorías frente a instantáneas remotas antiguas, y reintentos de borrado frente a conflictos remotos.
- Pendiente de validar en dispositivos. La APK se publica mediante GitHub Actions.

## 0.27.62 — 30 de octubre de 2026

- Se preservan el espacio (`workspaceId`) y la autoría de las categorías al normalizar los datos guardados.
- Recuperación prudente de categorías antes reasignadas a Personal cuando el ID o las tareas/notas permiten establecer el espacio correcto.
- Reconciliación con las categorías de la nube mediante su ID y sincronización completa inicial de recuperación.
- Documentación de continuidad de proyecto: `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md`.
- Pendiente: probar la recuperación en los dos teléfonos y verificar la APK firmada.

## 0.27.61

- Edición directa de fecha, hora, categoría y estado desde tarjetas.
- Selector vertical de categorías en dos columnas y cierre del teclado.

## 0.27.60

- Categorías de eventos compartidos, iconos y personalización mediante emojis.

## 0.27.59

- Gesto de deslizamiento del tirador de Captura rápida hacia el editor completo.

## 0.27.58

- Reorganización de Ajustes y mejoras de iconografía.

## Procedimiento de publicación

Actualizar este historial, `ESTADO.md` y `PENDIENTES.md` con cada versión; registrar solo cambios confirmados y distinguir los pendientes de validación.
