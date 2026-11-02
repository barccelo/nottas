# Historial de cambios de Nottas

## 0.27.107 — 2 de noviembre de 2026

- Reemplazado el encabezado de texto de los recordatorios por el wordmark vectorial de la barra lateral, con las T originales y sus tonos.
- Flecha de regreso sustituida por chevrón vectorial uniforme y correctamente alineado.
- Encabezado compartido entre recordatorio individual y pantalla de recordatorios múltiples, sin modificar acciones ni comportamiento.
- Versión incrementada y distribución mediante GitHub Actions para Obtainium.


## 0.27.106 — 2 de noviembre de 2026

- Nueva superficie translúcida con desenfoque progresivo detrás de la barra de búsqueda y el dock inferior.
- Se preserva la visibilidad parcial de las tarjetas al fondo sin perder contraste ni interactividad de los botones.
- Ajustes para temas claro y oscuro; la capa se desactiva en modo teclado y papelera, con alternativa en WebView sin soporte de blur.
- Actualización de versión Android y distribución de APK firmada para Obtainium.


## 0.27.105 — 2 de noviembre de 2026

- Solucionado el origen de los recordatorios fantasma: eventos ocultos por rechazo, cancelación o estado final dejan de programar avisos en Android.
- Verificación de elegibilidad duplicada en la interfaz y en el servicio nativo, con identificadores de evento/espacio/ocurrencia.
- Al sincronizar se eliminan alarmas y notificaciones obsoletas; posposiciones solo válidas si el evento sigue activo.
- Protección contra alarmas desactualizadas justo antes de mostrar la notificación y al actuar desde la pantalla completa.
- Búsqueda extendida a registros rechazados/cancelados, únicamente bajo otras coincidencias; no se borran ni alteran datos de Cloudflare.
- Publicación de APK mediante GitHub Actions para Obtainium.


## 0.27.104 — 2 de noviembre de 2026

- Botón «Elegir» extendido hasta el borde derecho de la fila de hora, alineándolo visualmente con la fila de fecha y recordatorios.
- Handle funcional en selectores de opciones dinámicos, incluida la hoja «Recordatorio»: arrastrar hacia abajo para cerrar, con desplazamiento visible y retorno cuando no se completa el gesto.
- Interruptores grandes y pequeños unificados en azul, también para tema oscuro; eliminado el verde heredado en controles de hora.
- Incremento de versión y publicación automática de APK firmada para Obtainium.


## 0.27.103 — 2 de noviembre de 2026

- Corrección del selector de horas/minutos: tamaño real de ventana y centrado, eliminación de superposición de números, selección fluida con seguimiento y ajuste final al detener el desplazamiento.
- El toque en el número seleccionado abre la edición directa y el deslizamiento sigue siendo accesible desde toda la rueda.
- Pulido del handle, espaciado, fila seleccionada y tema oscuro.
- Sustitución del glifo de flecha de la hora por chevrón vectorial.
- Calendario y campana unificados en dimensiones, fondo, borde y centrado, con contador flotante.
- APK de Android actualizada para publicación firmada mediante GitHub Actions y Obtainium.


## 0.27.102 — 2 de noviembre de 2026

- Alineados los botones de recordatorio y nuevo calendario en la captura rápida.
- El botón Calendario abre las vistas y eventos existentes sin perder el borrador al regresar.
- Detección automática de nombres de categorías escritos en el título, sin retirar las palabras y respetando selección manual.
- El selector de hora nativo de Android se sustituye por la rueda de horas/minutos de Nottas, reutilizando sus controles.
- Versión Android incrementada para generar y publicar la APK firmada en GitHub Releases mediante Obtainium.


## 0.27.101 — 2 de noviembre de 2026

- Sustitución del selector de categorías de captura rápida por carrusel horizontal de iconos siempre accesible debajo del título.
- Detección de horas abreviadas con a/p y ceros iniciales, incluidas 2p/2a, 430p/430a, 02p/02a y 0430p/0430a.
- Nueva categoría «Acto presencial», con icono lineal de persona frente a atril y migración para espacios compartidos existentes.
- Incremento de versión Android y publicación automatizada de APK firmada para Obtainium.


## 0.27.100 — 2 de noviembre de 2026

- El editor de captura rápida representa marcadores de fecha y hora como píldoras intercaladas dentro del campo de texto.
- Los espacios se conservan durante la edición y se eliminan al guardar o ampliar el título.
- Tocar la X o usar retroceso junto al marcador lo transforma en la palabra original y permite reactivar el reconocimiento tras editar o reescribir.
- Soporte de composición de teclado Android, pegado de texto plano y publicación automática de APK firmada mediante Obtainium.


## 0.27.99 — 2 de noviembre de 2026

- Los marcadores de fecha y hora de captura rápida se extraen del texto y se representan como píldoras junto al campo de título. Quitar un marcador restaura sus palabras y reescribirlas vuelve a activar el reconocimiento.
- Las propuestas muestran pista de deslizamiento y responden visualmente al gesto antes de abrir las opciones de descarte, sin disparar la apertura del evento.
- Nueva versión de Android para publicación automática de APK firmada y actualización vía Obtainium.


## 0.27.98 — 2 de noviembre de 2026

- Pulido final de la bandeja de propuestas: botón visible «Revisar después» y protección contra el clic accidental del evento tras deslizar su tarjeta.
- Mantiene los siete cambios de v0.27.97 y no altera los servicios de Firebase/Cloudflare.
- Pendiente prueba manual en ambos teléfonos.


## 0.27.97 — 2 de noviembre de 2026

- Corregida la alineación vertical de subtareas y sus círculos de selección en el editor.
- Reconocimiento de fecha y hora en captura rápida mediante píldoras removibles; X o Backspace desactivan el reconocimiento sin borrar el texto literal durante la sesión de captura.
- Bandeja del director con X y swipe para decidir entre ocultar solo un aviso local o rechazar el evento compartido.
- Confirmar y Rechazar directamente en cada propuesta; salida inmediata de pendientes y las vistas activas en caso de rechazo/cancelación, sin borrar el historial de la tarea.
- Pantalla de revisión de pendientes al abrir Nottas, con propuestas múltiples y opción de cerrar para revisar después; campanita y aviso persistente se mantienen.
- La notificación persistente existente en Android incorpora apertura profunda hacia la bandeja (y conserva el contador sin generar avisos duplicados).
- Se respeta la infraestructura de sincronización FCM y Cloudflare vigente. Requiere validación visual y entre los dos teléfonos.


## 0.27.96 — 2 de noviembre de 2026

- Solucionado el bloqueo de configuración del receptor: el Worker ahora publica los cuatro parámetros públicos originales del proyecto Firebase Android Nottas desde su configuración de despliegue. Se utiliza el mismo proyecto y emisores en ambos roles.
- Conservado el mecanismo de arranque y reintento introducido en 0.27.95; Nottas configura Firebase por sí sola al recibir los datos públicos del servidor, sin registrar una cuenta nueva.
- Los secretos de servicio Firebase no se copian al repositorio ni al cliente; las credenciales privadas permanecen en Cloudflare.
- La publicación verifica que /v1/client-config devuelve una configuración Android completa. Pendiente comprobación física de la recepción inmediata en ambos dispositivos.


## 0.27.95 — 2 de noviembre de 2026

- Corregida la autoconfiguración Firebase del teléfono receptor: antes una respuesta incompleta del Worker desactivaba permanentemente nuevos intentos de instalación en la sesión.
- Ahora se verifica Firebase nativo al entrar, reintenta la configuración pública durante la visualización cuando falta y pasa a registrar el token sin necesitar entrar a la pantalla Asistente.
- Las comprobaciones de configuración se detienen automáticamente al inicializar Firebase. No se modifican tareas, sincronización, cuentas, permisos ni calendarios.
- La pantalla Asistente explica si el Worker carece de los cuatro valores públicos para que no se confunda el problema con una falla de sincronización.
- GitHub Actions comprueba la disponibilidad de esos valores sin revelar contenido. El servidor sigue necesitando que estén configurados; no se generan datos falsos de Firebase.


## 0.27.94 — 2 de noviembre de 2026

- El registro de Firebase se valida con envío real FCM; los tokens caducados ya no pueden registrarse como si fueran funcionales.
- Si FCM devuelve UNREGISTERED/404/410, el cliente Android invalida su caché nativa de token, solicita uno nuevo y lo registra automáticamente.
- Recuperación automática al reestablecerse el token: push inmediato de sincronización a los espacios autorizados y reenvío del mensaje reciente no leído, sin duplicar entradas persistentes.
- El registro vigente no reenvía mensajes viejos en cada comprobación. La misma infraestructura Firebase se usa para director y asistente, sin rutas diferenciadas.
- Retirada la confirmación pasiva de «respuesta guardada sin entrega» cuando el servidor confirmó la persistencia; el aviso queda pendiente de recuperación automática.
- Añadidas cuatro pruebas para registros válidos, tokens rechazados, fallos de credenciales y supresión de reenvíos redundantes. Ningún dato local, membresía o cuenta se borra.


## 0.27.93 — 2 de noviembre de 2026

- Unificada la entrega de avisos FCM de tareas/eventos, respuestas y mensajes con la misma rutina probada de llamadas. Antes la sincronización genérica silenciaba rechazos y mantenía tokens de dispositivos definitivamente inválidos.
- El Worker deshabilita tokens FCM rechazados de forma definitiva (404/410), conserva otros dispositivos del usuario y devuelve conteos de intentos y aceptaciones por espacio sin exponer tokens.
- Nueva comprobación autenticada GET /v1/devices/push-status, limitada al propio dispositivo y sin datos confidenciales.
- Android/WebView vuelve a registrar y verificar el token actual al entrar a primer plano; si la aplicación sigue visible repite la verificación como máximo cada 2 minutos, sin sondeos de tareas cada 15 segundos ni tareas de fondo.
- Al sincronizar cambios compartidos, el cliente informa una sola vez cuando no se confirmó ningún aviso FCM para un destinatario activo, evitando confundir «guardado» con «aviso aceptado».
- Pruebas de regresión: respuesta de llamada asistente→director con token obsoleto, respuesta a mensajes dirigida al director y consulta de estado de registro sin revelar el token.
- La aceptación de FCM no garantiza por sí misma visualización inmediata en Android; pendiente verificación real en ambos teléfonos y comprobación de notificaciones del sistema.


## 0.27.92 — 2 de noviembre de 2026

- Cloudflare Worker: la sincronización completa incluye las tareas y notas eliminadas (lápidas) en cada espacio autorizado. El límite se aplica por espacio y no se acepta un snapshot incompleto.
- Cliente: las eliminaciones pendientes de tareas, notas y categorías ya no son reemplazadas por copias antiguas; una baja explícita puede resolver conflictos de revisiones.
- Mensajes: las respuestas desde la pantalla completa distinguen entre guardado confirmado y notificación push aceptada. Si el push no fue aceptado, se informa sin afirmar una entrega inexistente.
- Recuperación de avisos: si Nottas está visible, revisa mensajes recientes no leídos tras sincronizar y puede mostrar los avisos perdidos por Firebase. Sin consultas adicionales en segundo plano; Android puede restringir pantalla completa fuera de la aplicación.
- Sin borrado de datos, sin cambio de cuentas ni restablecimiento de espacio. Pendiente validación de los dos sentidos en dispositivos reales y despliegue efectivo del Worker y APK.


## 0.27.91 — 2 de noviembre de 2026

- Ordenar tareas distingue fecha programada próxima/lejana, creación reciente y última modificación. Nuevas configuraciones usan «Fecha programada: próximas primero»; se respeta el orden ya guardado de los usuarios existentes.
- Añadido criterio «Creadas recientemente» independiente de «Modificadas recientemente». La agrupación cronológica conserva exclusivamente los criterios de fecha programada.
- Sincronización de Oficina robustecida: los fallos transitorios se reintentan automáticamente con esperas progresivas de 4 a 60 segundos y cambios pendientes conservados.
- Introducida conciliación de respaldo mientras la app está visible, cada 75 segundos, cuando no hay una sincronización en curso, para recuperar eventos perdidos por notificaciones FCM; push sigue siendo el mecanismo inmediato y no hay polling en segundo plano.
- Deslizar hacia abajo desde el inicio de la lista de tareas o notas fuerza una sincronización completa (primero sube los pendientes). Muestra progreso y resultado sin interceptar swipes horizontales ni pulsaciones de controles.
- Sin cambios de Cloudflare Worker, Firebase, iconografía ni estructura persistida. Pendiente probar los dos sentidos de sincronización en Android.


## 0.27.90 — 2 de noviembre de 2026

- «Acerca de Nottas»: reducido el margen inferior del ícono azul de 12 px a 4 px para compactar la composición y acercar el nombre monocromático.
- Se mantienen los tamaños, el centrado, los colores y el espacio del subtítulo; sin cambios en el ícono de inicio, la barra lateral ni el recurso de notificaciones.
- Actualización exclusiva de presentación, sin cambios en datos, sincronización o permisos. Pendiente validación visual en Android.

## 0.27.89 — 2 de noviembre de 2026

- Logotipo de la barra lateral ajustado a la nueva referencia: las dos «t» azul y naranja utilizan el vector monocromático actualizado, reproducido en sus colores propios y alineado a la altura de la N (sin sobresalir). Las letras N, o, a y s permanecen oscuras, con fondo transparente.
- En «Acerca de Nottas», el texto del logotipo se reduce a 132 px, monocromático y de presencia más discreta, conservando los detalles del check y del calendario.
- Corregido el borde oscuro alrededor de la imagen azul en «Acerca de Nottas»: el fondo oscuro de la capa inferior deja de transparentarse; se oculta el recurso alternativo al cargar el original y se recortan los píxeles exteriores del recurso al mostrarlo.
- Sin cambios en el ícono del lanzador ni en el ícono del sistema de notificaciones; no se modifican datos ni permisos.
- Nueva versión para publicación firmada por GitHub Actions y actualización desde Obtainium. Pendiente comprobación visual en teléfonos y ambos temas.

## 0.27.88 — 2 de noviembre de 2026

- Reemplazado el recurso vectorial `ic_nottas_status.xml` por la silueta monocromática de las dos «t» aprobadas (azul y naranja en el original), conservando como espacios transparentes el check, el calendario y sus seis casillas.
- Todas las notificaciones, accesos rápidos y Firebase continúan referenciando el mismo recurso Android; el ícono principal de la aplicación no se modifica.
- Actualizada la versión para generar la APK firmada mediante GitHub Actions y distribuirla desde GitHub Releases a Obtainium.
- Pendiente verificación visual en Android a escala real de la barra de estado.

## 0.27.87 — 2 de noviembre de 2026

- Vista de tareas agrupadas por fecha y hora: las tareas y eventos sin fecha se muestran en primer lugar bajo «Sin fecha», antes de los grupos fechados.
- Se mantiene el orden ascendente o descendente elegido entre los grupos con fecha y se conserva la agrupación interna por horas.
- Reducción de márgenes acumulados entre los encabezados de fecha y hora: separación vertical del listado cronológico reducida a 5 px; fecha y hora quedan más próximos a sus tarjetas.
- El ajuste de espaciado se aplica únicamente a la vista cronológica; al cambiar a notas vuelve el espaciado normal.
- Sin alteraciones del contenido, permisos, calendario ni almacenamiento. Pendiente validación visual en Android.

## 0.27.86 — 2 de noviembre de 2026

- Ajustada la sección «Acerca de Nottas» según el diseño aprobado: el icono cuadrado reproduce el icono principal de la aplicación con todos sus colores originales, sin tratamiento monocromático.
- Únicamente el logotipo «Nottas» que aparece debajo es monocromático, usando las dos T del vector del icono de notificaciones ya incorporadas en el wordmark.
- Texto negro en tema claro y blanco en tema oscuro. El logotipo a color de la barra lateral permanece intacto, también en modo oscuro.
- Pendiente comprobación visual del recurso Android en el dispositivo después de actualizar desde Obtainium.

## 0.27.85 — 2 de noviembre de 2026

- Nueva marca gráfica en el encabezado de la barra lateral: el texto «Nottas» se sustituye por un logotipo SVG sin fondo, conservando «Espacios y organización» debajo.
- El logotipo reutiliza los contornos de las letras «No» y «as» de la imagen de referencia, con las dos T centrales sustituidas por el vector original ic_nottas_status.xml del icono de notificaciones; se mantiene la diferenciación azul/naranja en la marca.
- «Acerca de Nottas»: se sustituye la N genérica por la imagen del icono actual de la aplicación en Android con filtro monocromático, con una N vectorial de respaldo si WebView no pudiera cargar el recurso.
- El título «Nottas» de «Acerca de» adopta el mismo logotipo, con ajuste responsive y modo oscuro. No se modifica el icono principal ni el icono de notificaciones del sistema.
- Pendiente validar que el icono Android se renderice correctamente en WebView y que el logotipo conserve legibilidad en teléfonos y modo oscuro.

## 0.27.84 — 2 de noviembre de 2026

- Ajuste de «Equipo de trabajo» para evitar tarjetas pegadas: separación uniforme de 19 px entre las tarjetas principales, radios y márgenes consistentes.
- «Oficina»: se elimina la subtarjeta gris de invitación, pasando el código y «Copiar» a una fila integrada; miembros en filas compactas con divisores y alineación coherente.
- «Soporte y diagnóstico» vuelve a ser accesible (una regla anterior lo mantenía oculto). Se reorganiza en sincronización, recuperación de espacios, administración avanzada y configuración técnica plegable.
- Añadido «Comprobar conexión» mediante la sesión vigente y respuesta del servidor. Oculto el campo para reclamar propiedad cuando el usuario ya es dueño del espacio.
- Mantiene las funciones previas de sincronización, recuperación administrativa, ocultar y eliminar espacios, llamadas, push, Google Calendar y compatibilidad de equipos sin cambiar roles ni datos.
- Comprobaciones de estructura HTML y sintaxis JavaScript completas; pendiente inspección visual y prueba de flujo en Android.

## 0.27.83 — 2 de noviembre de 2026

- Invitaciones a equipos: acción explícita «Invitar a una persona» para el administrador en los detalles del espacio; al crear un equipo nuevo se despliega el código de invitación para copiarlo.
- Integrantes sin permiso de administración reciben una explicación en vez de una sección de invitación ausente. Las claves de recuperación y acceso a cuenta siguen separadas.
- Si el servidor no devuelve el código, la interfaz permite actualizarlo consultando la membresía autorizada. No se muestra el código a otras cuentas.
- El formulario para crear equipos solo se cierra cuando el servidor confirma que creó el espacio; los errores no se ocultan.
- Sin cambios en el esquema de datos ni en los permisos del Worker. Pendiente prueba en Android con dos cuentas y publicación de APK firmada para Obtainium.

## 0.27.82 — 1 de noviembre de 2026

- Corregido el agrupador cronológico de tareas: el encabezado de día se muestra siempre que la agrupación por fecha y hora está habilitada, incluso con una única tarea o un solo día en el filtro «Pendientes».
- La línea de hora, el contador de tareas y la opción «Sin fecha» se mantienen sin alterar el orden ni el filtrado.
- Corrección motivada por el video `889466.mp4`; pendiente comprobación visual en Android y publicación de APK firmada para Obtainium.

## 0.27.81 — 1 de noviembre de 2026

- Editor de tareas más compacto y coherente: sin botones «⋯» repetidos a la derecha de cada subtarea. El controlador izquierdo concentra tres acciones: tap para opciones, swipe horizontal para sangrar/desangrar y desplazamiento vertical sobre él para reordenar (también pulsación prolongada).
- Corregido el bloqueo anterior: el movimiento vertical del asa ya no se interpreta como un scroll inerte; el resto de la lista sigue desplazándose normalmente.
- Menús de las secciones «Notas / descripción» y «Subtareas» normalizados: mismo icono horizontal y ubicación en sus encabezados, sin iconos adicionales al final de cada línea descriptiva. El menú de descripción actúa sobre el bloque de texto enfocado (o el primero).
- Se conservan añadir subtarea, opciones contextuales, selección múltiple, jerarquía, acciones por lotes y historial de deshacer. Validada sintaxis de JavaScript; falta prueba de gestos, visual y accesibilidad sobre Android.

## 0.27.80 — 1 de noviembre de 2026

- Corrección de la interacción real de subtareas: controlador de seis puntos a la izquierda con captura de puntero desde el primer toque. Deslizar a la derecha anida bajo el elemento anterior; a la izquierda sube un nivel. Pulsación prolongada para reordenar.
- El botón + redundante desaparece de cada fila. El botón «+ Añadir subtarea» y la acción de añadir elementos internos desde el menú permanecen.
- Selección múltiple con menú «Acciones»: copiar, sangrar, quitar sangría, mover arriba/abajo y completar o devolver a pendientes, manteniendo historial para deshacer.
- Tab y Mayús+Tab también cambian nivel al usar teclado físico. Se conserva la iconografía y apariencia de Nottas.
- Validación de sintaxis JavaScript correcta; pendiente validación táctil y visual en Android.



## 0.27.79 — 1 de noviembre de 2026

- Deslizar horizontalmente el controlador de un subelemento hacia la derecha lo subordina al elemento anterior; hacia la izquierda reduce su nivel.
- Se mantienen pulsación larga para reordenar, el menú de jerarquía, las subtareas anidadas y el historial para deshacer.
- Pendiente comprobar gestos táctiles en Android. La selección múltiple para mover grupos continúa pendiente.


Los cambios de código y la publicación de la APK deben verificarse por separado.

## Ajuste de interfaz — 1 de noviembre de 2026 (sin cambio de versión)

- Separación visual consistente entre tarjetas en «Equipo de trabajo» y ajuste de tamaños, espaciado y jerarquía de controles.
- «Calendarios» se mueve desde los detalles de Oficina a un apartado visible de «Integraciones», conservando los controles y estados de Google Calendar y notificaciones.
- Se mantiene la estética propia de Nottas: «Apple-like» se entiende como pulido y claridad, no como copiar iOS. Pendiente comprobar la pantalla en Android y el proceso de publicación.

## 0.27.77 — 1 de noviembre de 2026

- El editor de tareas ya no traslada el contenedor de subtareas al panel compacto: «Notas / descripción» se mantiene por encima de las subtareas en todos los modos de herramientas.
- Se preserva la misma instancia del editor de subtareas (texto, casillas, jerarquía y foco) al cambiar de vista, evitando efectos secundarios sobre datos y estado.
- Verificada sintaxis de JavaScript; pendientes comprobación visual en Android y publicación de APK firmada.

## 0.27.76 — 31 de octubre de 2026

- Nuevo ícono principal de Nottas: se utiliza la ilustración suministrada de la N formada por cinta y lista de tareas, con calendario y check; fondo azul con diseño intacto.
- Eliminado el fondo blanco externo mediante máscara de transparencia y recorte optimizado a 512 × 512 en WebP RGBA, sin bordes blancos cuadrados.
- Sustituido únicamente `app/src/main/res/drawable-nodpi/ic_nottas_launcher.webp`; el ícono monocromático `ic_nottas_status.xml` para la barra de estado y notificaciones permanece sin cambios.
- Conservados `AndroidManifest.xml` y los identificadores actuales de ícono y paquete para que la sustitución funcione como actualización normal.
- Pendiente confirmar la compilación y publicación de la APK firmada en GitHub Releases / Obtainium.

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
