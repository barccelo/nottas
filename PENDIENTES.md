# Pendientes de Nottas

Última revisión: 30 de octubre de 2026 · X9.

Estados: **Por verificar**, **Pendiente**, **En evaluación**. El contenido de esta lista no sustituye la comprobación del código ni las pruebas en Android.

## Prioridad inmediata

- [ ] **Por verificar · Categorías:** probar en Android la recuperación de categorías compartidas después de actualizar a v0.27.62 y realizar una sincronización.
- [ ] **Por verificar · Persistencia:** cerrar y reabrir Nottas; comprobar que las categorías mantienen espacio, nombre, color, icono y asignaciones.
- [ ] **Por verificar · Dos dispositivos:** comprobar visibilidad y sincronización de categorías en el director y el asistente.
- [ ] **Por verificar · Publicación:** comprobar que v0.27.69 se publique como APK firmada en Releases y sea detectada por Obtainium.
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

- [ ] **Por verificar · Icono principal:** comprobar «N» azul en lanzador, cajón de aplicaciones y accesos directos de Android.
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
