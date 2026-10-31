# Estado actual de Nottas

Última actualización: 31 de octubre de 2026 · Chat de continuidad X9.

## Fuente de referencia

- Repositorio: `barccelo/nottas`, rama `main`.
- Versión del código Android: **0.27.75** (`versionCode 156`).
- La publicación de la APK firmada depende del resultado de GitHub Actions; la versión del código no demuestra por sí sola que la APK esté disponible.
- Arquitectura: aplicación Android con interfaz WebView local-first; datos y copias locales; integración optativa de espacios compartidos y calendario mediante Cloudflare.

## Funcionalidades implementadas (visión general)

- Tareas y notas con categorías, etiquetas, búsqueda, prioridades, subtareas y edición enriquecida.
- Fechas, recurrencia, recordatorios, calendario (día, semana, mes y agenda), eventos multidía y Google Calendar en modo consulta.
- Captura rápida, gestos, presentación al encender/desbloquear, horarios de trabajo, temas claro/oscuro, importación y exportación JSON.
- Espacio compartido de dirección y asistencia: propuestas y estados de reuniones, sincronización, mensajes y avisos a pantalla completa, llamadas y notificaciones.

## Cambios v0.27.75 — checks circulares y alineación del título

- El campo editable del título queda alineado verticalmente con el botón circular de completar, sin mover el botón Atrás ni la estrella de su fila.
- Se aplica un diseño circular único de 22 px, borde fino y marca azul a las casillas de tareas, subtareas, listas enriquecidas, Agenda, calendario, selección múltiple y configuraciones con casillas.
- Se conservan los interruptores deslizantes (iosSwitch y miniSwitch) y todos los manejadores originales de cada casilla; no hay cambios en los estados guardados ni en sincronización.
- El check circular del editor mantiene su área táctil y utiliza el color azul común cuando está marcado.
- Pendiente verificar visualmente el resultado en Android en modo claro/oscuro, con títulos de una o varias líneas y casillas dentro de eventos de calendario.

## Cambios v0.27.74 — densidad, espacio e iconografía

- Día y Semana: la cuadrícula se estira hasta el borde inferior disponible; la escala por hora se calcula según espacio útil, con scroll cuando corresponde.
- Papelera: icono Restaurar rediseñado con flecha de retorno y geometría de toque consistente.
- Editor de tareas: se suprime el margen inferior fijo de 110 px en subtareas y el padding de 110 px en bloques para quitar el hueco entre lista y descripción.
- Elementos marcados y selección de fechas: sustituidos símbolos genéricos por SVG vectoriales (check, chevron y calendario).
- Menor espacio superior en calendario y editor, sin cambiar los insets de Android del sistema.
- Pendiente verificación en Android (pantallas diferentes, teclado y horario laboral).

## Cambios v0.27.73 — editor, navegación y calendario

- Editor: Atrás, check, título y estrella comparten fila compacta; las notas recuperan su estructura normal al cambiar de modo.
- Android + WebView: se sincroniza el cierre del teclado con el foco para que Atrás no se consuma una segunda vez.
- Ojito de calendario: visibilidad por fuente solo temporal en memoria, pulsación prolongada para mostrar un calendario y enlace directo a su configuración; no se alteran suscripciones/selecciones remotas.
- Se eliminan dos leyendas informativas redundantes del calendario y se conserva únicamente estado de carga/error cuando procede.
- Hojas y paneles: arrastre por encabezado y zonas no interactivas con umbral antes de capturar el gesto.
- Bloques horarios cortos con altura mínima de 38 px; títulos con más líneas cuando queda altura aprovechable.
- Pendiente probar en dispositivos reales y comprobar que la APK firmada llegue a Releases/Obtainium.

## Cambios v0.27.72 — búsqueda y calendario

- Papelera: cuadro de búsqueda bajo su cabecera y filtrado funcional en notas y tareas eliminadas.
- Búsquedas en el espacio activo: coincidencias de filtro primero, después coincidencias de otros filtros, sin alterar la selección actual.
- Calendario: escala de 40 px/h sin estiramiento por horas laborales; eventos finalizados aparecen grisados, pero no quedan marcados como realizados.
- Día: carriles individuales para todos los solapamientos, con scroll horizontal; Semana mantiene indicadores de colores con lista desplegable.
- El código superó revisión sintáctica y pruebas lógicas; falta validar la experiencia visual en Android.

## Cambios v0.27.71 — distribución conjunta de eventos simultáneos

- Día: eventos locales y de Google Calendar se colocan lado a lado cuando coinciden; si concurren tres o más, un bloque muestra dos vistas previas y un contador, que abre la hoja de detalles.
- Semana: se sustituyen los bloques superpuestos por indicadores de franjas cromáticas con contador interactivo; los bloques no solapados no cambian.
- El cálculo se comparte entre ambas vistas e incluye solapamientos parciales, recorte de horarios laborales y separación de finales que coinciden exactamente con nuevos comienzos.
- Se reutiliza la lista de eventos y su navegación nativa, sin alterar los datos o los permisos de Google Calendar.
- Pendiente validación en Android y comprobación de APK firmada.

## Cambios v0.27.70 — corrección del contorno del icono principal

- Corregido el margen blanco cuadrado del icono Android del lanzador. El recurso ahora utiliza únicamente el cuadro azul redondeado de la imagen original, con **transparencia real en las esquinas externas** y sin lienzo blanco.
- Se preservan exactamente la composición de la «N», el listado, el calendario y el check de la identidad aprobada; WebP RGBA optimizado 256 × 256.
- Sin modificaciones al icono «tt» monocromático de notificaciones ni a las funcionalidades o datos.
- Pendiente comprobar el renderizado tras actualizar ambos dispositivos mediante Obtainium.

## Cambios v0.27.69 — identidad visual de Android

- **Icono principal:** la «N» azul original, con lista, check y calendario, se instala como recurso gráfico del lanzador y también en los accesos directos.
- **Icono de notificaciones:** el símbolo «tt» de la segunda imagen se transforma en una silueta vectorial blanca con fondos transparentes, tal como exige Android para la barra de estado. Conserva el check y el calendario.
- Todas las notificaciones (asistente, propuestas, recordatorios y servicio persistente), el acceso rápido y las notificaciones predeterminadas de Firebase usan «tt».
- No hay cambios a notas, tareas, eventos ni sincronización; solo recursos visuales de Android.
- Pendiente probar el icono del lanzador y las notificaciones en ambos dispositivos.

## Cambios v0.27.68 — botones separados y coherencia gráfica

- Se restaura en la barra superior de Tareas el botón independiente **Agrupar por fecha y hora**, con su icono original de reloj y líneas. Activa/desactiva la agrupación con un solo toque, sin abrir otro menú.
- **Filtrar y ordenar** mantiene su propio botón adicional, inmediatamente después del botón de agrupación y antes de Pendientes; ambos tienen estados visuales independientes y ajustes para pantallas estrechas.
- Selector de estados de eventos rediseñado con iconos, matices cromáticos apropiados, descripciones, grupos «Seguimiento del evento» y «Gestión de la propuesta», indicador de selección y confirmación de cancelación sin perder el diseño.
- La hoja Filtrar y ordenar incorpora encabezado contextual, iconos en filtros y opciones de ordenación, elementos compactos con jerarquía y señal visual de la selección. Se conservan los cinco criterios de ordenación y la persistencia de preferencias.
- Se revisaron los estilos claro/oscuro y el JavaScript embebido superó una comprobación de sintaxis; siguen pendientes pruebas visuales y táctiles en Android.

## Cambios v0.27.67 — menú lateral, filtros y navegación Atrás

- **Barra lateral:** la cabecera ya no comparte el scroll de categorías, etiquetas y espacios. Tiene una cabecera anclada, contenido central desplazable y pie fijo con Papelera y Ajustes; al abrir se muestra desde el comienzo.
- **Iconos:** Ajustes reutiliza el SVG del botón principal y Papelera el símbolo común. Los accesos del pie se presentan como tarjetas diferenciadas, con tema claro y oscuro.
- **Filtrar y ordenar:** botón a la izquierda de Pendientes. Incluye filtros Pendientes, Todas, Hoy, Destacadas, Completadas y orden por fecha reciente (predeterminado), fecha antigua, última modificación, prioridad o título A–Z. La preferencia se guarda en la interfaz local.
- **Agrupar:** la agrupación por fecha/hora se incorpora al nuevo panel y solo se habilita en ordenaciones cronológicas; respeta el sentido ascendente o descendente.
- **Atrás en Android:** Apariencia, Alertas, Respaldo y demás subpáginas vuelven a Ajustes antes de cerrar esa pantalla. Desde las opciones de equipo, Atrás recupera Ajustes cuando se llegó desde allí. La nueva hoja de filtros se cierra antes de navegar por debajo.
- **Revisión técnica:** el JavaScript embebido ha pasado comprobación sintáctica; las pruebas táctiles reales deben hacerse en Android tras la publicación.

## Cambios v0.27.66 — todos los estados y pulsación prolongada

- **Diferida**: evento aplazado, pendiente de nueva fecha; conserva la intención de realizarse.
- **No realizada**: el evento no tuvo lugar, se cierra sin marcarlo realizado y mantiene fecha, categoría e historial. No equivale a cancelada ni se envía a Papelera.
- El selector inferior muestra siempre: Agendada, Realizada, No realizada, Diferida, Cancelada, Propuesta, Solicitar nueva fecha y Rechazada.
- El check del editor abre esa misma lista al mantenerlo presionado en eventos nuevos y antiguos de Oficina, incluso si su marca histórica de seguimiento estaba desactivada.
- El estado No realizada se guarda y sincroniza con Cloudflare; deja de figurar en Pendientes y de generar recordatorios, pero sigue visible en Todas y en el historial.
- Los cambios incluyen Worker + Android. Pendiente comprobar la operación en los dos dispositivos.

## Cambios v0.27.65 — navegación lateral y estados compartidos

- Barra lateral más compacta, agrupada y con iconos consistentes, incluidas categorías con sus colores y tema oscuro.
- En Tareas: deslizamiento de izquierda a derecha sobre el fondo abre la barra; desde el borde izquierdo también sobre una tarjeta. El gesto normal sobre una tarjeta sigue editándola; el gesto inverso permanece para Notas. Desde la barra, deslizar a la izquierda la cierra.
- El estado dentro del formulario de evento a pantalla completa abre exactamente la misma hoja inferior que la tarjeta.
- Director y asistente autorizados pueden cambiar aprobación y seguimiento de cualquier evento compartido, no solo eventos propios.
- El servidor deja de revertir cambios de estado y cambios de horario de eventos compartidos realizados por el asistente.
- Se conserva la confirmación adicional antes de cancelar y la autorización para acceder al espacio. No se amplían permisos de administración del espacio (como eliminarlo).
- Requiere verificar la APK y el despliegue del Worker en GitHub Actions.

## Corrección v0.27.64 — eliminación de categorías entre dispositivos

- El botón Eliminar selecciona por **ID y workspaceId**, no solo por ID (históricamente podía haber IDs duplicados entre Personal y Oficina).
- La sincronización deja de mover una categoría entre espacios solo porque coincida su ID.
- El Worker conserva y devuelve las categorías eliminadas en las instantáneas completas, de forma que el otro teléfono conozca los borrados.
- Las categorías borradas tienen prioridad sobre versiones antiguas, incluso si las otras versiones estaban editadas o procedían de respaldos.
- Se consulta una instantánea completa una vez al abrir la aplicación y hay conexión, evitando consultas completas continuas.
- Cambios tanto en la APK como en el Worker desplegable con GitHub Actions. No se borran automáticamente categorías por nombre.

## Cambios de v0.27.63: estados, iconos y borrado de categorías

- La tarjeta muestra un único estado principal: «Realizada», «Diferida», «Cancelada» o «Pendiente de verificar» sustituyen «Agendada» cuando corresponde; las propuestas y solicitudes de cambios mantienen prioridad.
- Los iconos de las categorías en las tarjetas recuperan su color propio.
- La selección entre categorías generales y de eventos del mismo nombre conserva el ID escogido.
- La sincronización interpreta correctamente fechas ISO y milisegundos. Las eliminaciones de categorías locales pendientes no se revierten al recibir copias antiguas, y pueden reintentarse ante conflictos remotos.
- Cambios implementados en código; las interacciones y recuperación de datos requieren comprobación en Android.

## Incidencia más reciente: categorías invisibles

**Corregida en el código de 0.27.62; pendiente de validación en dispositivos.**

La función `normalize(raw)` descartaba `workspaceId`, `createdBy` y `updatedBy` al reconstruir las categorías guardadas. Después asignaba a las categorías sin `workspaceId` el espacio personal. Por eso una categoría compartida podía desaparecer de la vista de «Oficina» tras recargar la app, aunque siguiera existiendo como registro local.

La corrección:
- Conserva los metadatos de espacio y autor al normalizar.
- Reasigna categorías antiguas solo cuando los identificadores o las tareas/notas relacionadas permiten identificar el espacio sin ambigüedad.
- Reconcilia una categoría de la nube por su ID sin crear una copia innecesaria por un antiguo espacio local incorrecto.
- Ejecuta una sincronización completa de recuperación una sola vez tras instalar esta versión y sincronizar correctamente con el servidor.

**Precaución:** si una categoría antigua carece de referencias suficientes y no existe en la nube, no se fuerza una asignación adivinada. No borrar datos ni reinstalar sin respaldo. Los datos compartidos requieren comprobar que la cuenta tiene acceso al espacio correcto.

## Continuación inmediata

1. Actualizar ambos teléfonos a v0.27.75 tras verificar la publicación de la APK firmada en Obtainium.
2. Comprobar categorías en «Personal» y «Oficina», incluidos los ajustes y el selector de cada evento.
3. Sincronizar desde ambos dispositivos; cerrar y reabrir la aplicación para comprobar persistencia.
4. Verificar que las categorías existentes conservan nombres, colores, iconos y asociaciones de tareas/eventos.
5. Si quedan categorías invisibles, examinar una copia de seguridad o la sincronización antes de modificar registros.

## Regla de publicación

Toda nueva versión deberá actualizar este archivo, `PENDIENTES.md` y `CHANGELOG.md` en el mismo conjunto de cambios del código. La APK solo se considera publicada tras verificar el resultado de GitHub Actions.
