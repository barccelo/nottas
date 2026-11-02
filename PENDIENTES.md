# Pendientes de Nottas

Última revisión: 2 de noviembre de 2026 · Eliminaciones y mensajería crítica.

Estados: **Por verificar**, **Pendiente**, **En evaluación**. El contenido de esta lista no sustituye la comprobación del código ni las pruebas en Android.

## Prioridad inmediata

- [ ] **Crítico · v0.27.92:** comprobar en GitHub Actions que el Worker se desplegó; la APK sola no corrige el fallo de las lápidas.
- [ ] **Crítico · bajas bidireccionales:** crear y eliminar tarea y nota de Oficina en ambos sentidos, con uno de los teléfonos desconectado y posterior reconexión. Verificar ausencia de reapariciones y duplicados.
- [ ] **Crítico · respuestas a avisos:** responder al mensaje director→asistente y comprobar notificación en director, historial persistente y tratamiento explícito si Firebase no acepta el push.
- [ ] **Crítico · Android:** comprobar notificaciones y permisos de pantalla completa en teléfono director. Firebase puede aceptar un mensaje sin que Android permita abrir automáticamente una actividad en segundo plano.
- [ ] **Crítico · v0.27.92:** validar firma, APK en Releases y detección desde Obtainium.



- [ ] **Validar · Sync v0.27.91:** crear y editar tareas director→asistente y asistente→director con ambos teléfonos abiertos; verificar cambio inmediato por push y recuperación por conciliación (≤75 s aproximadamente) si FCM no llega.
- [ ] **Validar · Fallos transitorios:** desactivar y restablecer internet en un teléfono; comprobar que cambios pendientes se reenvían sin requerir crear una tarea en el otro dispositivo; verificar que no aparecen duplicados ni se pierden modificaciones.
- [ ] **Validar · Pull to refresh:** desde el inicio de Tareas y Notas, deslizar verticalmente hacia abajo; comprobar indicador, sincronización y ausencia de colisión con swipe lateral o con editores.
- [ ] **Validar · Ordenación:** alternar entre próximas/lejanos, creadas y modificadas; con agrupación, comprobar fechas ascendentes, descendentes y sin fecha primero.
- [ ] **Validar · Batería:** push inmediato; respaldo solo mientras la WebView está visible; sin reintroducir consultas cada 15 s.
- [ ] **Validar · Publicación:** firma de APK v0.27.91 y detección desde Obtainium.



- [ ] **Por verificar · Acerca de v0.27.90:** comprobar menor separación ícono azul–logotipo Nottas y buen equilibrio con el subtítulo en modo claro y oscuro.
- [ ] **Por verificar · Publicación v0.27.90:** comprobar APK firmada en GitHub Releases y actualización detectada desde Obtainium.


- [ ] **Por verificar · Identidad v0.27.89:** comprobar que el ícono azul en «Acerca de» ya no muestra bordes negros en claro y oscuro; el logotipo inferior debe ser pequeño y monocromático.
- [ ] **Por verificar · Barra lateral v0.27.89:** logo con «No», las dos «t» azul/naranja con check y calendario, «as» y sin fondo blanco; las «t» no deben sobresalir por arriba de la N.
- [ ] **Por verificar · Publicación:** comprobar GitHub Actions, APK firmada y aparición de v0.27.89 en Obtainium.


- [ ] **Por verificar · Ícono de notificaciones v0.27.88:** comprobar las dos «t», el check y las seis casillas del calendario en la barra de estado, las notificaciones desplegadas y el acceso rápido, en modo claro y oscuro.
- [ ] **Por verificar · Obtener APK v0.27.88:** confirmar compilación y publicación firmada en GitHub Releases y actualización desde Obtainium; no alterar el ícono principal.


- [ ] **Por verificar · Equipo de trabajo (1-11-2026):** comprobar en Android separaciones de tarjetas, adaptación a zoom/tamaño reducido y modo oscuro; abrir Calendarios desde Integraciones, cambiar calendarios y comprobar que persistan selección y sincronización.


- [ ] **Por verificar · Orden de descripción v0.27.77:** con una tarea que contenga notas y subtareas, comprobar que la descripción aparece siempre antes de la lista de subtareas con herramientas compactas, expandidas y tras alternar entre ambas.
- [ ] **Por verificar · Integridad:** editar descripción y subtareas, completar y descompletar, plegar la lista y reabrir la tarea sin pérdida de datos.
- [ ] **Por verificar · Publicación:** confirmar compilación y APK firmada v0.27.77 en GitHub Releases y Obtainium.



- [ ] **Por verificar · Ícono v0.27.76:** comprobar en Android que el ícono de inicio usa la N azul con calendario, sin fondo blanco cuadrado; conservar el diseño monocromático de notificaciones.
- [ ] **Por verificar · Obtainium:** confirmar compilación y publicación de APK firmada v0.27.76.



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


## Editor de listas — seguimiento 0.27.79
- [ ] Probar en Android la precisión del umbral de swipe horizontal y su convivencia con la pulsación larga y el scroll.
- [x] Selección múltiple de subtareas para mover, sangrar, completar, marcar pendientes y copiar en bloque (v0.27.80).

## Seguimiento 0.27.80
- [ ] Validar en Android swipe derecha/izquierda en el nuevo asa izquierda, reordenamiento por pulsación prolongada y desplazamiento de listas largas.
- [ ] Comprobar la selección múltiple con elementos anidados, completados y desplazamientos entre niveles.
- [ ] Revisar el menú contextual en pantallas estrechas y el foco al editar con teclado.

## Seguimiento 0.27.81
- [ ] Probar en Android reubicación vertical inmediata desde el controlador izquierdo, incluyendo primer/último elemento y subniveles.
- [ ] Verificar que el gesto horizontal no compite con el arrastre vertical; deshacer reordenamiento y sangrías.
- [ ] Verificar que el menú «Notas / descripción» actúa sobre el bloque actualmente enfocado y los menús generales siguen accesibles.
- [ ] Validar el diseño compacto en móviles con zoom alto y listas anidadas.

## 0.27.82 — Verificación de agrupación temporal
- [ ] En vista cronológica, comprobar que «Pendientes 1» muestre el encabezado de su fecha y la hora.
- [ ] Comprobar que «Todas» con varios días conserve cada encabezado y contador.
- [ ] Comprobar agrupación de una única tarea sin fecha y sin hora («Sin fecha» / «Sin hora»).
- [ ] Validar una tarea en filtro «Hoy» y los cambios entre filtros sin saltos en los encabezados.

## 0.27.83 — Pruebas pendientes de invitación
- [ ] Crear equipo desde teléfono nuevo y verificar aparición inmediata del código de invitación del administrador.
- [ ] Copiar código y unirse desde otro teléfono con una cuenta diferente; confirmar integrantes y sincronización.
- [ ] Comprobar que la cuenta integrante no puede copiar un código reservado al administrador, pero ve por qué.
- [ ] Comprobar que recuperación de cuenta no se confunda con invitaciones y que un fallo al crear no cierre el formulario.

## Verificación posterior a v0.27.84
- [ ] Validar en pantallas Android estrechas y con zoom alto que las tarjetas del equipo se separen, no se encimen y la invitación no tenga subtarjeta.
- [ ] Comprobar acceso plegable a Soporte y diagnóstico, botón «Comprobar conexión», sincronización, copia de ID y ocultar espacio.
- [ ] Comprobar que Recuperación de propiedad solo presente el código a miembros no propietarios, y que Administración avanzada mantenga confirmación al eliminar.
- [ ] Comprobar que Calendarios sigue abriendo desde Integraciones y que actualizar push, actividad y funciones heredadas de compatibilidad operan en el panel plegable.
- [ ] Confirmar consistencia de modo oscuro, visualización de miembros y permisos de director/asistente.

## Verificación posterior a v0.27.85
- [ ] Comprobar en Android que la cabecera lateral muestra el logotipo «No» + dos T de notificaciones + «as», sin fondo blanco, y conserva el subtítulo.
- [ ] Verificar que «Acerca de Nottas» muestra el icono actual del launcher en blanco y negro, no la antigua N tipográfica, y el nuevo logotipo completo.
- [ ] Comprobar que los recursos locales de WebView cargan sin internet, especialmente file:///android_res/drawable/ic_nottas_launcher.webp.
- [ ] Revisar escala en pantallas estrechas, modo oscuro y accesibilidad/lectura de la marca.
- [ ] Verificar que no cambiaron el launcher ni el icono de notificaciones del sistema y que Obtainium publica la APK firmada.

## Comprobación de identidad visual v0.27.86
- [ ] En «Acerca de Nottas», verificar icono cuadrado a color, idéntico al launcher, sin filtro gris.
- [ ] Verificar logotipo inferior monocromático, dos T originales de notificaciones, negro en tema claro y blanco en oscuro.
- [ ] Comprobar que el logo de la barra lateral conserva sus colores y que la APK v0.27.86 se detecta por Obtainium.

## Verificación v0.27.87
- [ ] Vista cronológica «Pendientes»: verificar que tareas/eventos «Sin fecha» aparezcan arriba con cualquier otra fecha.
- [ ] Comprobar que los días fechados respetan orden ascendente/descendente seleccionado.
- [ ] Comprobar separación compacta entre encabezados de fecha, horas y tarjetas, sin espacios excesivos.
- [ ] Verificar «Todas», «Pendientes», tareas con y sin hora, modo oscuro y cambio de Notas a Tareas.
- [ ] Confirmar que APK firmada está publicada y disponible en Obtainium.
