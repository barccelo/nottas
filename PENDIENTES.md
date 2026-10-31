# Pendientes de Nottas

Última revisión: 31 de octubre de 2026 · X9.

Estados: **Por verificar**, **Pendiente**, **En evaluación**. El contenido de esta lista no sustituye la comprobación del código ni las pruebas en Android.

## Prioridad inmediata

- [ ] **Por verificar · Título:** campo del título centrado verticalmente con el check circular tanto en una línea como con texto largo en pantallas estrechas.
- [ ] **Por verificar · Checks circulares:** uniformidad de bordes, tamaños, color y marca en Inicio, Agenda, Día, subtareas, notas con casillas, selección múltiple y preferencias.
- [ ] **Por verificar · Interruptores:** iosSwitch y miniSwitch siguen mostrando la forma de interruptor y no adoptan el aspecto de checkbox.
- [ ] **Por verificar · Funcionalidad:** completar y desmarcar tareas y subtareas sigue guardando/sincronizando correctamente; casillas del calendario y listas mantienen su área táctil.


- [ ] **Por verificar · Pantalla completa:** Día/Semana sin horario laboral deben ocupar toda la altura; con horario laboral, las filas deben ampliarse sin perder el scroll vertical.
- [ ] **Por verificar · Editor:** descripción inmediatamente después de añadir subtareas y sección de marcadas, sin margen fantasma; el teclado y la barra inferior no deben cubrir texto.
- [ ] **Por verificar · Iconos:** Papelera, fecha inicio/fin y elementos marcados coherentes con el lenguaje visual del resto de Nottas.
- [ ] **Por verificar · Encabezados:** reducir el espacio superior de calendario y editores sin ocultar controles bajo la barra de estado.


- [ ] **Por verificar · Editor:** Atrás, completar, título y estrella en una línea en pantallas estrechas; sin espacios vacíos en la parte superior.
- [ ] **Por verificar · Teclado/Atrás:** tras cerrar el teclado con Atrás, el siguiente Atrás debe regresar al calendario o inicio sin pulsación fantasma.
- [ ] **Por verificar · Ojito:** el toque oculta/muestra calendarios sin desactivarlos en el servidor; mantener pulsado muestra solo ese calendario y «Mostrar todos» recupera la vista.
- [ ] **Por verificar · Ajustes Google:** desde el ojito se abre la sección de administración, con permisos intactos del propietario.
- [ ] **Por verificar · Arrastre:** los encabezados y áreas no interactivas desplazan hojas sin interceptar botones ni scroll.
- [ ] **Por verificar · Eventos cortos y largos:** 15/30 minutos deben verse y poder tocarse; eventos extensos deben mostrar más líneas de título.


- [ ] **Por verificar · Papelera:** buscar por nombre y contenido de tareas/notas eliminadas; comprobar posición del buscador y restauración.
- [ ] **Por verificar · Filtros de búsqueda:** con Pendientes vacío, la búsqueda debe seguir mostrando coincidencias de Completadas en «Otras coincidencias».
- [ ] **Por verificar · Calendario Día:** tres o más eventos simultáneos individuales deben verse mediante scroll horizontal, sin interferir con abrir, marcar o arrastrar.
- [ ] **Por verificar · Eventos pasados:** comprobar grisado sin completar automáticamente, incluidos eventos de Google, y que los que están en curso permanezcan coloreados.
- [ ] **Por verificar · Densidad:** confirmar escala de 40 px/h y ausencia de estiramiento vertical al activar horario laboral.


- [ ] **Por verificar · Colisiones Día:** dos eventos simultáneos de fuentes distintas se ven paralelos; tres concurrentes muestran dos tarjetas y +1, y la hoja inferior abre cada evento correctamente.
- [ ] **Por verificar · Colisiones Semana:** dos o más eventos coincidentes muestran franjas y contador; tocarlos abre una lista completa sin crear accidentalmente un nuevo evento.
- [ ] **Por verificar · Rango horario:** comparar solapamientos parciales, eventos consecutivos, cambio de horario laboral, modo oscuro, fuentes ocultas y Google Calendar de solo lectura.
- [ ] **Por verificar · Interacciones:** comprobar que tarjetas individuales mantienen completar, abrir, arrastrar y ajustar duración.


- [ ] **Por verificar · Categorías:** probar en Android la recuperación de categorías compartidas después de actualizar a v0.27.62 y realizar una sincronización.
- [ ] **Por verificar · Persistencia:** cerrar y reabrir Nottas; comprobar que las categorías mantienen espacio, nombre, color, icono y asignaciones.
- [ ] **Por verificar · Dos dispositivos:** comprobar visibilidad y sincronización de categorías en el director y el asistente.
- [ ] **Por verificar · Publicación:** comprobar que v0.27.74 se publique como APK firmada en Releases y sea detectada por Obtainium.
- [ ] **Por verificar · Estados:** al realizar, diferir o cancelar un evento, comprobar que solo aparece el estado pertinente en la tarjeta.
- [ ] **Por verificar · Categorías visuales:** comprobar los iconos y colores en tarjetas, incluso con dos categorías llamadas «Reunión».
- [ ] **Por verificar · Eliminación:** borrar «Nottas» y «Reunión» del espacio elegido, sincronizar, reiniciar y comprobar que no reaparezcan en ambos dispositivos (sin afectar categorías de otro espacio).

- [ ] **Por verificar · Barra lateral:** probar deslizamiento derecha desde Tareas y desde borde izquierdo de las tarjetas, cierre al deslizar a la izquierda y que no se rompa editar/deslizar tarjetas.
- [ ] **Por verificar · Asistente:** cambiar estados y horarios de eventos propios y ajenos, desde ambas vistas y en ambos dispositivos; confirmar sincronización.
- [ ] **Por verificar · Estado dentro del editor:** comprobar apertura de hoja inferior, elección del estado y que el formulario siga abierto.

- [ ] **Por verificar · Estados:** tocar el estado en una tarjeta y en el editor; comprobar que aparecen todas las opciones, incluida Diferida, independientemente del estado actual.
- [ ] **Por verificar · Check prolongado:** mantener presionado en evento recién creado y antiguo de Oficina, en director y asistente; debe abrir el selector completo.
- [ ] **Por verificar · No realizada:** confirmar que queda en Todas, no en Pendientes, mantiene su fecha e historial, y no genera recordatorios.
- [ ] **Por verificar · Sincronización:** probar estados entre los dos teléfonos y el cambio de Diferida a Agendada al introducir una nueva fecha.

- [ ] **Por verificar · Barra lateral:** abrirla después de desplazar categorías hasta el fondo; comprobar que la cabecera no se superpone y que Papelera/Ajustes permanecen accesibles.
- [ ] **Por verificar · Iconos:** comprobar que Ajustes en el menú lateral usa el mismo engranaje de la pantalla principal y que el pie se presenta correctamente en ambos temas.
- [ ] **Por verificar · Filtros y orden:** ordenar Todas de reciente a antiguo; cambiar a cronológico ascendente, prioridad, título y últimas modificaciones. Comprobar persistencia tras reinicio.
- [ ] **Por verificar · Agrupación:** activar y desactivar agrupación dentro del menú; comprobar orden de fechas y horas.
- [ ] **Por verificar · Atrás:** Configuración > Apariencia > Atrás vuelve a Configuración; probar Notificaciones, Datos y respaldo, Asistente y hoja de filtros.

- [ ] **Por verificar · Controles independientes:** confirmar que agrupación por fecha/hora funciona con un toque sin abrir el panel y que el nuevo filtro abre su propia hoja; comprobar ambos en pantallas pequeñas.
- [ ] **Por verificar · Identidad gráfica de estados:** comprobar los ocho estados con su icono, color, texto secundario y selección, incluidos claro/oscuro y confirmación de cancelar.
- [ ] **Por verificar · Identidad gráfica de filtros:** verificar iconos, cabecera contextual, ordenación, estados seleccionados y switch de agrupación en el panel.

- [ ] **Por verificar · Icono principal:** comprobar «N» azul en lanzador, cajón de aplicaciones y accesos directos de Android, **sin márgenes blancos ni esquinas cuadradas**.
- [ ] **Por verificar · Barra de notificaciones:** comprobar «tt» monocromática en avisos, recordatorios, notificación persistente y tema oscuro.
- [ ] **Por verificar · Ajustes rápidos:** verificar símbolo «tt» en la captura rápida del sistema.

## Mejoras de interfaz y experiencia registradas en conversaciones previas

- [ ] **En evaluación:** terminar de pulir el formulario compacto de eventos y la apertura de herramientas sin desplazamiento horizontal.
- [ ] **En evaluación:** revisar la experiencia de edición rápida de fecha, hora, categoría y estado desde las tarjetas (incorporada al código en v0.27.61; pendiente de prueba de interacción).
- [ ] **Pendiente:** optimizar la vista de calendario según horas laborales y la interacción para crear eventos tocando las franjas de día/semana.
- [ ] **Pendiente:** continuar afinando los cuadros emergentes para que se cierren correctamente al tocar fuera, sin ejecutar acciones involuntarias.
- [ ] **En evaluación:** lista compacta/holgada y evolución de los filtros y navegación lateral.
- [ ] **En evaluación:** seguimiento de eventos diferidos, atrasados y multidiarios, con sus estados y acciones rápidas.

- [ ] **Por verificar · Cloudflare:** confirmar despliegue del Worker corregido con instantáneas que incluyen categorías eliminadas.

## Calidad y regresiones

- [ ] Probar importación/exportación JSON y recuperación de copias tras cambios de esquema.
- [ ] Probar la sincronización y el consumo de recursos de la asistencia sin sondeos innecesarios.
- [ ] Revisar que el teclado Android no tape controles ni mensajes en las pantallas completas.
- [ ] Incorporar una prueba repetible de normalización de categorías por espacio para prevenir una regresión similar.

## Uso de esta lista

Al implementar una mejora: actualizar su estado, registrar la versión y trasladar el resultado a `CHANGELOG.md` y `ESTADO.md`. No marcar elementos como terminados sin comprobación. Los pendientes históricos se revisarán progresivamente para distinguir lo ya implementado de lo que aún falte.
