# Historial de cambios de Nottas

Los cambios de código y la publicación de la APK deben verificarse por separado.

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
