# Estado actual de Nottas

Última actualización: 10 de noviembre de 2026 · Nottas Web experimental y FCM same-account publicado; Android permanece en v0.27.117.

**Reanudación entre chats:** comenzar por [CONTINUIDAD.md](CONTINUIDAD.md), que resume el estado operativo y el próximo paso. Este archivo conserva el detalle técnico e histórico.

## Nottas Web experimental — 10 de noviembre

**Reversión de regresión (10-11):** Web Worker `nottas-web-preview` restaurado al código de commit `46429cac`, tras reportes de que Web→Android dejó de actualizar instantáneamente. Retirados sondeo web de 1,5 s y aplicación optimista de escrituras; vuelve sondeo web de 8 s. El backend FCM y la APK no se modificaron. Pendiente validar en Android y diagnosticar las bajas. 



- **Ajuste de latencia en previsualización (10-11):** web refresca deltas cada 1,5 s (antes 8 s), evita pisar cambios por respuestas en vuelo y refleja inmediatamente operaciones confirmadas por POST. Publicado en Worker de prueba separado, no en Android. No se ha demostrado todavía sincronización instantánea Android→web; no existe push web, solo comprobaciones periódicas.


- PR #8 (rama `feature/nottas-web-initial`, **sin fusionar**) implementa vista web independiente en `web/index.html` y previsualización en Cloudflare Worker `nottas-web-preview`.
- Separación visible Personal / Oficina, navegación de notas/tareas/papelera, búsqueda, representación de subtareas y bloques checklist anidados, edición básica de subtareas y casillas de notas, fecha/hora y guardado mediante API /v1/sync. Polling incremental 8 segundos en pestaña visible, reconciliación completa periódica, refresco al foco y después de guardar.
- La vinculación de cuenta usa clave temporal de Android y sesión solo de pestaña (`sessionStorage`). Contenido enriquecido no se sobrescribe desde la web; todavía no tiene editor enriquecido completo.
- PR #9 fusionado a `main` y Worker publicado con éxito por GitHub Actions run 42862252735: notificaciones FCM de cambios compartidos y personales alcanzan también a dispositivos de la misma cuenta. La sincronización real web↔Android **no está verificada**.
- No hay cambio de Gradle, APK, datos locales ni base D1. Necesarias pruebas funcionales y de roles antes de considerar Nottas Web estable.

## Cambios v0.27.117 — tarjeta persistente y selección estable de hora

- La única tarjeta-resumen de subtareas se mantiene visible si existen elementos, **tanto abierta como cerrada**, y conmuta el listado al pulsarla. El acceso de la barra de herramientas también alterna el listado; se conserva debajo de la descripción y sin crear tarjetas duplicadas.
- Corregido el cierre involuntario del selector al cambiar entre **hora de inicio** y **hora de fin**: el controlador global ya no trata esos botones como toques fuera del panel. Tocar de nuevo la hora ya activa continúa cerrándolo.
- En la rueda de hora/minutos, tocar un valor distinto lo aplica **inmediatamente**, sin esperar a terminar un scroll animado. Los scrolls programáticos no disparan confirmaciones tardías.
- Tocar el valor central aún ofrece edición numérica; si el campo no tenía hora guardada, se confirma primero el valor visible para evitar discrepancias con el teclado. Enfoque numérico sin desplazar el encabezado.
- Sin cambios de modelo de datos, alarmas ni Cloudflare. **Confirmadas** compilación, firma y Release de v0.27.117 con APK. **Pendiente:** validar gestos, rueda y teclado en Android real, incluida actualización desde Obtainium.

## Cambios v0.27.116 — editor y consistencia visual

- Subtareas existentes: se mantiene **una sola** tarjeta de resumen, la de estilo Design System 1.3. Se oculta el botón de subtareas redundante en las herramientas cuando ya hay elementos; al entrar en ellas se muestra la lista editable.
- Selector de fecha/hora en tareas diferidas o reprogramadas: eliminado el desplazamiento automático de paneles que recortaba título y controles superiores. Cada apertura del selector devuelve el scroll del editor al inicio; el contenido inferior puede quedar fuera del viewport y se alcanza desplazándose.
- Notas existentes con título: se abren sin enfocar el contenido ni elevar el teclado. Notas nuevas y notas sin título mantienen el enfoque de edición.
- Indicador de refresco por gesto: nuevo SVG equilibrado, trazo 1.8 con terminaciones redondeadas y caja de 20 px acorde al sistema de iconos.
- Cambio local del editor HTML/CSS sin modificaciones de datos, Cloudflare ni alarmas. **Confirmada** compilación y firma de APK y publicación de `v0.27.116` en GitHub Releases; **pendiente** prueba real en Android de los cuatro escenarios y actualización por Obtainium.

## Cambios v0.27.115 — subtareas, diferidas y alarmas de equipo

- El editor abre tareas con subtareas contraídas y muestra una tarjeta-resumen con progreso y número de elementos; tocarla abre la lista de subtareas.
- «Añadir subtarea» queda antes de «Elementos marcados», ahora separado al final del bloque.
- Las herramientas de formato marcan visualmente negrita, cursiva, subrayado y tachado activos según la selección del texto, incluidas opciones accesibles aria-pressed.
- Se corrigió la transición Diferida → Agendada/Propuesta: al diferir se conserva la preferencia de recordatorios sin activarlos, se abre automáticamente fecha y después hora; al agendar se recuperan avisos predeterminados cuando faltan. La propuesta vuelve a ser seleccionable tras un diferimiento.
- El estado de propuesta y solicitud de nueva fecha tiene prioridad visual frente al estado diferido; la bandeja del director incluye cambios solicitados y notificaciones de diferimientos.
- El Worker envía mensajes compactos sync_task con secuencia del servidor para actualizar los recordatorios Android en segundo plano. FirebaseMessagingService actualiza el planificador nativo sin requerir WebView visible; la sincronización completa sigue conciliando datos al regresar a la app.
- El Worker activo en Cloudflare ya contiene los nuevos envíos sync_task; la app requiere actualización a v0.27.115. No cambia la base de datos ni el esquema local.
- Pendiente validación entre dos dispositivos (director pantalla apagada/encendida, propuesta → agendada, desfases FCM, fecha/hora, cambios de red) y compilación firmada/Obtainium.

## Cambios v0.27.114 — vencimiento por hora

- Tareas sin hora final vencen al llegar a la hora inicial, no al acabar el día. Si hay hora final, se toma esa; si faltan ambas, se espera al inicio del día siguiente.
- Los intervalos de varios días vencen en la última jornada, según la hora final o al terminar el último día si no se fijó ninguna.
- Actualización del borde y el metadato de fecha a cada cambio de minuto, sin reconstruir la lista; revisión al volver de segundo plano.
- Calendario local utiliza el mismo criterio temporal; mantiene por separado una duración visual de 60 minutos cuando no hay hora final.
- Sin cambios de esquema, alarmas, servicios ni estados de verificación. Pendiente prueba en Android y confirmación de Release firmada.

## Cambios v0.27.113 — unificación visual y depuración editorial

- Nuevo archivo local `app/src/main/assets/design-system.css` cargado después de los estilos históricos y compartido con el catálogo `componentes.html`.
- Tokens de colores (claro/oscuro), radios, superficies, tipografía, separación y geometría de encabezados aplicados transversalmente a listas de notas/tareas, filas del calendario, propuestas, paneles de equipo y Ajustes.
- Checks de calendario, notas y subtareas normalizados a diseño circular azul, manteniendo su lógica y gestos existentes. Editor de tareas: ejes visuales comunes de volver/check/título/estrella.
- Eliminados más de 40 textos redundantes o instructivos de Ajustes, navegación lateral, filtros, ayudas del editor y vistas compartidas. Permanecen las advertencias y estados necesarios.
- Catálogo visual sincronizado con los tokens de producción y actualizado a Design System 1.3. `DESIGN_SYSTEM.md` incorpora norma editorial de textos breves y excepciones funcionales de layout.
- Queda pendiente validar visualmente en Android, especialmente tema oscuro, controles pequeños, desplazamientos y apertura de recordatorios; no hay cambios de datos, sincronización ni servicios.

## Cambios v0.27.112 — Design System 1.2

- En Ajustes → Acerca de Nottas → Componentes: ruedas de hora más ligeras, sin recuadro azul; resumen simplificado, calendario mensual con mes/año pulsables y rueda secundaria de mes/día/año.
- En el editor real de tareas/eventos: selector de hora con selección visual tenue, fecha mensual con título «Noviembre 2026» y nueva selección detallada de mes/día/año mediante ruedas, aplicada solo al pulsar «Listo» y utilizando las validaciones existentes.
- En el calendario principal se normaliza el encabezado de Mes/Agenda sin «de» (por ejemplo, «Noviembre 2026»).
- En recordatorios Android, se normaliza la geometría del encabezado: altura 56 dp, objetivo de flecha 44 dp, separación 8 dp, wordmark con alineación óptica, margen de contenido común.
- DESIGN_SYSTEM.md amplía el catálogo a 14 familias, incluida posición y alineación. No se han cambiado respaldos, datos ni sincronización.
- Publicación: GitHub Actions compila y firma para Obtainium. Pendiente validación visual/funcional en dispositivo.

## Cambios v0.27.111 — selectores de hora y fecha en el laboratorio

- El catálogo «Componentes de Nottas» incorpora una rueda de horas/minutos con scroll-snap y edición directa del valor central, además de un selector mensual de fecha con navegación, «Hoy» y selección de día.
- Se añaden botones de muestra para Día/Semana/Mes/Agenda, exclusivamente como referencia gráfica. Las vistas de calendario reales y los selectores de producción no se modifican.
- Todo es local y demostrativo: no cambia eventos, alarmas, ajustes de tema, sincronización ni datos de usuario.
- Pendiente verificar en Android el desplazamiento, edición, selector mensual, adaptación a pantallas estrechas, temas, navegación y publicación firmada por Obtainium.

## Cambios v0.27.110 — catálogo de componentes (fase 1)

- Nueva pantalla de laboratorio en Ajustes → Acerca de Nottas → Componentes de Nottas. Muestra seis familias: tipografía, iconografía, botones, checks/switches/filtros, tarjetas y colores/superficies.
- Vista previa clara/oscura y controles demostrativos independientes de las preferencias y datos reales. Archivo local `app/src/main/assets/componentes.html`; no utiliza CDN, servicios de red ni bibliotecas externas.
- Navegación de retorno desde la flecha de Ajustes y Back de Android hacia «Acerca de Nottas». Mantiene intactos los formularios operativos y los recordatorios nativos.
- Nueva especificación `DESIGN_SYSTEM.md` con inventario de 13 familias, propuestas de tokens, licencias candidatas y plan de adopción progresiva.
- La tipografía Inter y la biblioteca Lucide siguen en evaluación: NO se han incorporado sus archivos ni migrado los componentes de producción.
- Pendiente validar en Android el iframe de la galería, scroll, controles interactivos, temas, vuelta atrás, y confirmar APK firmada/Obtainium.

## Cambios v0.27.109 — cambio directo de Propuesta y recordatorios desde tarjeta

- Tocar «Propuesta» confirma directamente a «Agendada», sin abrir las opciones de estado. Tocar «Agendada» abre el menú habitual con Realizada, Diferida y otros estados. Funciona en tarjetas y en el editor del espacio compartido autorizado.
- Se registra la aceptación en el historial, se conserva el resto del evento y se sincroniza el estado confirmado.
- El metadato de recordatorio en la tarjeta abre un panel de edición rápida, consistente con los de fecha, hora y categoría. Permite elegir múltiples avisos, quitarlos o usar «Sin aviso», y ofrece acceso al editor completo para alertas personalizadas.
- La configuración se guarda en `reminders`/`reminder` y activa la sincronización con las alarmas nativas. No modifica Cloudflare ni el esquema de datos.
- Pendiente comprobar en ambos roles, la lista de recordatorios y Obtenerium.

## Cambios v0.27.108 — wordmark monocromático en recordatorios

- El encabezado nativo de recordatorios individuales y múltiples aplica al mismo wordmark original el tratamiento monocromático de Ajustes → «Acerca de»: negro y opacidad del 78 %, en lugar de los degradados azul y naranja.
- Se conserva el tamaño discreto, la alineación del chevrón, el área táctil y la acción de volver de v0.27.107. No se alteran recordatorios ni sincronización.
- Pendiente validar visualmente el resultado en Android (individual y apilado). APK firmada mediante GitHub Actions para Obtainium.

## Cambios v0.27.107 — identidad visual en el encabezado de recordatorios

- Las pantallas nativas de recordatorio individual y recordatorios apilados sustituyen el texto «Nottas» por el mismo wordmark vectorial de la barra lateral (`nottas_wordmark.svg`), conservando su diseño, las dos T estilizadas y sus colores. Se entrega como recurso Android VectorDrawable, sin WebView adicional.
- La flecha tipográfica anterior se sustituye por un chevrón vectorial uniforme, alineado verticalmente con el wordmark, con área táctil de 44 dp.
- Se centraliza el encabezado en una función nativa compartida por las dos modalidades, manteniendo la acción de volver sin completar ni posponer recordatorios.
- La marca se presenta discretamente con un tamaño equivalente al encabezado anterior; no se modifican las acciones de recordatorio.
- Pendiente comprobar la representación y proporciones del vector y el retorno en Android con la APK instalada.

## Cambios v0.27.106 — degradado translúcido bajo la búsqueda y el dock

- Se añade una capa decorativa de desenfoque de fondo detrás de la búsqueda, los botones flotantes y la barra inferior: el contenido de la lista continúa siendo perceptible, pero suavizado.
- El efecto utiliza `backdrop-filter` con degradado de transparencia desde la parte superior y tintes diferentes para los temas claro y oscuro; no desenfoca la búsqueda ni los iconos.
- La capa no captura pulsaciones ni gestos (`pointer-events:none`) y queda debajo de los controles interactivos; se adapta al espacio mayor del dock inferior.
- Se desactiva en la papelera y cuando se usa el teclado para evitar tapar resultados durante la edición. Hay un degradado alternativo para Android WebView sin compatibilidad con blur.
- Pendiente inspección visual en Android: buscar, desplazarse bajo el dock, abrir el calendario, tema oscuro, modo teclado y papelera.

## Cambios v0.27.105 — protección contra recordatorios fantasma

- Corregido el caso real «Test» en Oficina (evento rechazado con recordatorios aún activos): los eventos rechazados, cancelados, pendientes de aprobación, diferidos, realizados, no realizados, eliminados o completados no programan alarmas.
- La WebView entrega a Android el conjunto de tareas elegibles y las alarmas con identificador de tarea, espacio de trabajo y ocurrencia. El planificador nativo verifica esas condiciones de nuevo, incluso si recibe datos antiguos.
- Cada actualización local o sincronización remota reprograma las alarmas, cancela las obsoletas y retira notificaciones ya visibles correspondientes a eventos invalidados. Los snoozes solo sobreviven si su evento y su fecha siguen activos.
- El receptor de Android comprueba la vigencia del evento tanto al reclamar una alarma como justo antes de mostrar una notificación; la actividad a pantalla completa también valida sus acciones.
- La búsqueda de tareas incluye coincidencias rechazadas/canceladas en «Otras coincidencias» sin mostrarlas en los filtros normales. Se conserva el historial remoto y la evidencia en Cloudflare.
- Se añaden metadatos de espacio y estado a los registros nativos y una lista local limitada de notificaciones emitidas para su invalidación.
- Pendiente prueba en ambos teléfonos y sincronización al iniciar tras la actualización; un teléfono desconectado no puede conocer cambios remotos hasta sincronizar.

## Cambios v0.27.104 — simetría de controles, gesto de recordatorios e interruptores azules

- Captura rápida: el botón «Elegir» ocupa el ancho flexible disponible hasta el borde derecho, alineado con calendario y recordatorio de la fila superior. Ajustes de separación y tamaño para pantallas estrechas.
- Hoja «Recordatorio» y otros selectores de opciones: el handle ahora dispone de área táctil ampliada y admite deslizamiento hacia abajo para cerrar. La hoja sigue al dedo durante el gesto; al soltar completa el cierre o vuelve a su posición si no alcanza el umbral. El gesto hacia arriba no realiza ninguna acción. El selector es dinámico y no estaba incluido en el controlador de las hojas normales.
- Diseño consistente: se sustituyó el verde de los interruptores grandes y pequeños por azul de Nottas (con adaptación al tema oscuro) en toda la aplicación, incluido el selector de hora.
- Sin cambios de sincronización, modelo de datos ni servicios externos. Pendiente prueba en Android antes de considerar cerradas las incidencias.

## Cambios v0.27.103 — reconstrucción del selector de rueda y controles simétricos

- Corrección estructural de las ruedas: alturas, rellenos y ventana visible coherentes con el centrado de filas de 48 px. El valor central deja de duplicarse porque se elimina el botón superpuesto que interceptaba los gestos.
- El elemento de la rueda seleccionado se resalta en su propia posición; leer el desplazamiento en cada fotograma y ajustar a la fila más cercana al terminar evita saltos, selecciones tardías y desajustes con la hora guardada. Un toque en el valor central permite escribir directamente la hora o los minutos.
- Estilo general del selector: handle más pequeño y consistente, espaciado del encabezado, selector y sección de recordatorios, realce suave de la fila seleccionada y compatibilidad con modo oscuro.
- El botón «Elegir hora» usa un chevrón SVG del sistema en vez del carácter tipográfico desalineado.
- Calendario y recordatorio de captura rápida comparten caja cuadrada, color, borde, radio y tamaño de icono; el número de recordatorios pasa a una insignia superpuesta que no desplaza la campana.
- Pendiente comprobar en Android los gestos rápidos, la inercia, la edición numérica y el guardado de la hora. El cambio reutiliza el componente existente y no altera los servicios compartidos.

## Cambios v0.27.102 — captura rápida: iconos, calendario, rueda y categorías inteligentes

- Alineados el icono de recordatorios y el botón nuevo de calendario en la misma fila y con el mismo tamaño.
- Nuevo acceso a la agenda/calendario existente desde captura rápida, con vistas y eventos intactos. Al cerrar el calendario se recupera el borrador de captura sin cambiar el título, recordatorios, fecha, hora o categoría; al abrir un evento se mantiene el retorno al calendario.
- Captura rápida reconoce automáticamente nombres de categorías disponibles en el texto, como «Consejo Directivo»; selecciona la categoría sin extraer ni modificar esas palabras. Prioriza coincidencias completas y nombres más largos, y no anula una selección manual. Al quitar la coincidencia vuelve a «Ninguna» si no hubo selección manual.
- Sustituido el control nativo Android de hora por un botón que abre la rueda existente de Nottas (horas y minutos con desplazamiento). La rueda conserva sus ajustes de recordatorio sin modificar el editor de tareas.
- Pendiente comprobación Android: teclado, alineación, categorías, rueda y retorno tras abrir/cerrar calendario. Sin cambios de esquema ni Cloudflare.

## Cambios v0.27.101 — categorías visibles y horarios abreviados

- Captura rápida: el selector de categorías se muestra como carrusel horizontal de iconos con sus nombres, inmediatamente bajo el título. El desplegable antiguo no ocupa espacio mientras el teclado está abierto. La categoría seleccionada queda resaltada; el carrusel puede desplazarse lateralmente.
- Reconocimiento de hora: se aceptan 2p, 2a, 430p, 430a, 02p, 02a, 0430p, 0430a y otras variantes equivalentes con AM/PM implícito. Las horas se validan y convierten a formato 24 horas, respetando los marcadores en línea.
- Categoría «Acto presencial» con icono lineal de presentador y atril, diferenciada de «Actividad». Se añade a los espacios compartidos existentes con una migración independiente, sin repetir las categorías previas.
- Pendiente validación visual con teclado físico/táctil Android; no hay cambios en servicios Cloudflare.
- APK de Android firmada y distribuida mediante el flujo habitual de GitHub Actions para Obtainium.

## Cambios v0.27.100 — marcadores temporales integrados en el título

- Captura rápida: el campo de texto admite píldoras de fecha y hora en línea. «Test mañana» se representa como «Test [mañana]» dentro del propio campo, no en una segunda fila.
- Reconocer un marcador conserva los espacios circundantes durante la edición; al guardar o ampliar la captura se normalizan y recortan, de modo que el título queda en «Test».
- Pulsar la X o Backspace/Eliminar junto a una píldora restaura en su posición la palabra editable. Si el texto rechazado se borra o modifica, al reescribirlo se vuelve a sugerir.
- El nuevo campo respeta composición IME, inserción de texto plano y foco de teclado de Android WebView; queda pendiente comprobarlo en dispositivos reales.
- Nueva versión distribuible mediante APK firmada por GitHub Actions y Obtainium.

## Cambios v0.27.99 — marcadores rápidos y gesto visible de descarte

- Captura rápida: el título muestra únicamente el texto de la tarea; las expresiones interpretadas como fecha u hora se extraen y aparecen como píldoras inmediatamente debajo del campo, sin duplicarse.
- Quitar una píldora recupera las palabras en el título. La supresión deja de ser permanente: al editar o borrar la palabra y volver a escribirla, el marcador se ofrece de nuevo.
- Backspace sobre una píldora situada al final recupera la expresión para editarla con el teclado.
- Bandeja de propuestas: cada aviso señala visualmente el deslizamiento; el desplazamiento horizontal mueve la tarjeta en tiempo real y conduce al diálogo de opciones de descarte, sin abrir accidentalmente el evento.
- La acción de descarte mantiene la distinción entre ocultar el aviso local y rechazar la propuesta compartida. Sin cambios en Cloudflare ni Firebase.
- APK firmada vía GitHub Actions para actualización mediante Obtainium. Requiere verificación manual en Android.

## Cambios v0.27.98 — cierre de interacción de la bandeja

- Añadido «Revisar después» explícito al pie de la bandeja. Cierra sin confirmar, rechazar ni eliminar pendientes, conservando el aviso persistente.
- Corregido el evento táctil de descarte: un swipe horizontal abre únicamente el menú de opciones y suprime el clic sintético que podía abrir el evento por error.
- No se modifica Firebase, Cloudflare ni el esquema de persistencia.

## Cambios v0.27.97 — subtareas, captura rápida y decisiones del director

- Editor: los círculos de subtareas se centran verticalmente respecto del texto, incluso si ocupa varias líneas.
- Captura rápida: los indicadores detectados de fecha/hora aparecen como píldoras removibles. La primera pulsación de Backspace sobre el texto al final desactiva el reconocimiento y conserva las palabras. El descarte de interpretación se recuerda durante esa captura.
- Dirección: X y swipe en tarjetas de propuestas abren un menú que separa ocultar solo el aviso en ese dispositivo de rechazar el evento compartido.
- Dirección: propuestas en bandeja cuentan con botones Confirmar/Rechazar. El estado compartido sale inmediatamente de pendientes al resolverse.
- Rechazados/cancelados no aparecen en listas activas, Calendario ni Agenda; permanecen en los registros sincronizados para historial.
- Notificación persistente Android: conserva el contador ya existente y ahora abre directamente la bandeja mediante intent seguro consumido una sola vez. Al abrir Nottas, el director revisa pendientes en un panel que también admite varias propuestas y «revisar después».
- Sin nuevas credenciales ni modificaciones del sistema de push bidireccional ya reparado; validación de experiencia en teléfono pendiente.

## Cambios v0.27.96 — datos públicos Firebase centralizados

- Recuperados los cuatro valores públicos del proyecto Firebase Android original de Nottas (Project ID, Sender ID, App ID y clave de cliente) de la configuración existente, sin regenerar proyecto ni alterar identidades.
- Configurados en Cloudflare Worker mediante las variables públicas FIREBASE_* del archivo wrangler.toml; no se incluye la clave privada del servicio FCM.
- /v1/client-config entrega la configuración común a ambos teléfonos. v0.27.95 incorporó reintentos automáticos al abrir Nottas, que esta versión conserva.
- El flujo de despliegue verifica que los valores públicos estén completos; pendiente prueba real de llegada de eventos y mensajes en el director.
- No se toca la sesión, Workspace Oficina, tareas ni ajustes de cuenta existentes.

## Cambios v0.27.95 — configuración automática de Firebase

- Detectado en captura del director: «Push no configurado» con formulario vacío, por lo que la sincronización Cloudflare funciona pero ese teléfono carece de recepción FCM.
- Identificado fallo local: autoconfiguración intentada solo una vez y silenciosamente abandonada cuando el Worker no suministraba los cuatro valores públicos.
- El cliente ahora inicia configuración desde el arranque normal, vuelve a revisar el estado nativo tras configurarse y reintenta cada 15 segundos únicamente mientras carezca de Firebase y la app esté visible; no hace polling de tareas.
- La interfaz distingue falta de configuración pública del Worker de la espera normal del token; no solicita crear una identidad nueva.
- El despliegue GitHub Actions ahora verifica el endpoint público Firebase sin publicar ninguno de los valores y advierte si faltan. Si el Worker no los tiene, el servidor debe configurarse una sola vez; el cliente por sí solo no puede inventarlos.
- Pendiente: verificar valores públicos de Worker y recepción automática en el director en dispositivo real.

## Cambios v0.27.94 — recuperación del token FCM rechazado

- Localizada debilidad: el servidor aceptaba el registro de un token Firebase sin comprobar que FCM aún lo reconociera. Aunque Firebase lo rechazara, Android podía volver a registrar el mismo token local obsoleto indefinidamente.
- Todo registro FCM realiza una comprobación real mediante la misma cuenta Firebase y envío que las llamadas, los mensajes y la sincronización. Si el token es definitivamente inválido (404/410 o UNREGISTERED), el servidor lo desactiva y responde con un código específico.
- Android elimina el token rechazado, solicita uno nuevo y registra el nuevo token automáticamente. Se conserva la identidad del usuario, el espacio Oficina, los permisos y los datos.
- Al reconocer un token nuevo, el Worker envía inmediatamente una señal sync a todos los espacios autorizados de la cuenta, además del mensaje reciente pendiente no leído, para recuperar cambios que quedaron sin aviso cuando el destinatario no tenía token.
- La verificación se realiza en primer plano y no usa sondeo cada 15 segundos. Los tokens registrados y válidos no provocan reenvíos de mensajes antiguos.
- Se retiró la pantalla pasiva «Respuesta guardada, aviso no confirmado» tras la confirmación de guardado; el receptor recibe el aviso recuperado cuando restablece su registro FCM.
- Nuevas pruebas de registro de token válido, inválido, error de servidor y registro repetido sin duplicaciones.
- Pendiente validación en ambos teléfonos de recepción instantánea; una aceptación de FCM no es una garantía física de entrega ni de apertura de pantalla completa bajo restricciones de Android.

## Cambios v0.27.93 — FCM simétrico y autorreparación del destinatario

- Confirmada discrepancia de código: las llamadas limpian tokens FCM inválidos; los avisos generales de sincronización los ignoraban y descartaban sus errores.
- El Worker usa la misma ruta para llamadas, avisos, mensajes y cambios. Informa intentos y aceptaciones FCM (no confirma que el sistema haya mostrado una pantalla).
- Se verifica y renueva la asociación token-dispositivo-cuenta al volver a primer plano; se revisa periódicamente (solo en primer plano, mínimo 2 minutos) sin polling de contenido de 15 s.
- Mensajes de estado diferencian correctamente guardado en la nube y aceptación del aviso por Firebase.
- Pruebas automatizadas de envío asistente→director añadidas. Sigue pendiente prueba real en director con permisos Android, FCM y conectividad.
- No se borra el espacio Oficina, no se cambian identidades ni se limpian datos.

## Cambios v0.27.92 — sincronización de eliminaciones y respuestas

- La sincronización completa en Cloudflare ahora incluye bajas de tareas/notas, filtrando por espacio y comprobando que el snapshot esté completo.
- El cliente protege eliminaciones locales pendientes contra copias remotas antiguas; no se borran datos ni cuentas durante la migración.
- Las respuestas Android distinguen «guardada» de «push aceptado». Se agrega recuperación de notificaciones recientes no leídas mientras la aplicación está visible.
- Dependencia: confirmar despliegue del Worker en GitHub Actions; la cuenta Cloudflare conectada a esta conversación no expone la D1 de Nottas.
- Pendientes pruebas reales en ambos teléfonos, especialmente recepción de avisos con la aplicación en segundo plano.

## Cambios v0.27.91 — recuperación de sincronía y lista

- La ordenación distingue fecha programada, creación y modificación; se preservan las preferencias existentes y se adopta «próximas primero» para nuevas configuraciones.
- Se añadió reintento de fallos con backoff, conciliación en primer plano cada 75 s como respaldo de FCM y actualización al deslizar hacia abajo.
- Los cambios locales pendientes se conservan hasta confirmación remota. No se reintroduce polling cada 15 s ni consultas en segundo plano.
- Requiere prueba en ambos teléfonos, con Firebase disponible/ausente, red intermitente y cambios simultáneos.

## Cambios v0.27.90 — espaciado del logotipo en Acerca de

- Reducido de 12 a 4 px el margen inferior del ícono azul para acercar el logotipo monocromático «Nottas» sin cambiar sus dimensiones ni el subtítulo.
- La corrección se limita a «Acerca de»; íconos, marca lateral, notificaciones, datos y funciones sin modificaciones.
- APK firmada mediante GitHub Actions para distribución desde Releases por Obtainium; revisión visual en Android pendiente.

## Cambios v0.27.89 — marca de la barra lateral y Acerca de

- La marca lateral usa el vector de las dos «t» actualizado en azul y naranja, alineadas con la N sin sobresalir, manteniendo letras oscuras.
- Acerca de Nottas: logotipo secundario monocromático reducido; se eliminan fondos negros bajo el ícono azul y se recorta el borde exterior al presentarlo.
- Ícono principal Android y recurso de notificaciones preservados; APK se publica mediante GitHub Actions, pendiente revisión visual en dispositivo.

## Cambios v0.27.88 — símbolo de notificaciones

- Nuevo vector monocromático de las dos «t», trazado a partir del recurso aprobado y conservando los huecos del check y calendario.
- Se mantiene `ic_nottas_status` para notificaciones Android/Firebase y acceso rápido, sin tocar el ícono principal.
- Se ha solicitado publicación de APK 0.27.88 mediante GitHub Actions; comprobar su resultado y la actualización desde Obtainium.

## Ajuste de configuración del equipo — 1 de noviembre de 2026

- La pantalla «Equipo de trabajo» conserva el lenguaje visual de Nottas, con separación uniforme entre sus tarjetas y controles más compactos.
- «Calendarios» pasa a la sección propia «Integraciones», fuera de los detalles e integrantes del equipo; conserva el panel y las acciones existentes de Google Calendar.
- La sección «Integraciones» solo se muestra al seleccionar un espacio, manteniendo estado de conexión y notificaciones.
- Commit inicial del cambio: `b0ebb478de7756b32e9b1c7541f33755f256fb37`. Pendiente validación visual en Android; no se ha confirmado APK publicada.

## Fuente de referencia

- Repositorio: `barccelo/nottas`, rama `main`.
- Versión del código Android: **0.27.117** (`versionCode 198`), confirmada en Gradle, GitHub Actions y APK firmada en Releases el 5 de noviembre de 2026.
- La publicación de la APK firmada depende del resultado de GitHub Actions; la versión del código no demuestra por sí sola que la APK esté disponible.
- Arquitectura: aplicación Android con interfaz WebView local-first; datos y copias locales; integración optativa de espacios compartidos y calendario mediante Cloudflare.

## Funcionalidades implementadas (visión general)

- Tareas y notas con categorías, etiquetas, búsqueda, prioridades, subtareas y edición enriquecida.
- Fechas, recurrencia, recordatorios, calendario (día, semana, mes y agenda), eventos multidía y Google Calendar en modo consulta.
- Captura rápida, gestos, presentación al encender/desbloquear, horarios de trabajo, temas claro/oscuro, importación y exportación JSON.
- Espacio compartido de dirección y asistencia: propuestas y estados de reuniones, sincronización, mensajes y avisos a pantalla completa, llamadas y notificaciones.

## Cambios v0.27.77 — orden estable entre notas y subtareas

- Corregida la posición de «Notas / descripción» al activar la herramienta Subtareas desde los íconos compactos.
- Tanto en la vista compacta como con «Mostrar todas las herramientas», la descripción permanece antes de la lista de subtareas.
- Se conserva un único contenedor de subtareas: no se recrean nodos, se cambia contenido ni se altera el guardado o los checks.
- Pendiente verificar la interfaz en Android, con subtareas colapsadas y expandidas, y comprobar la publicación de la APK.

## Cambios v0.27.76 — ícono principal de la aplicación

- Sustituido el ícono de inicio por el nuevo diseño azul con la N plegada, calendario, lista y check proporcionado por el usuario.
- Se retiró el blanco exterior; el nuevo WebP 512 × 512 mantiene transparencias en las esquinas y colores del diseño.
- No se modifica el ícono de la barra de notificaciones, el Manifest ni el nombre del recurso utilizado por Android.
- Publicación por GitHub Actions pendiente de verificación.

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

1. Actualizar ambos teléfonos a v0.27.77 tras verificar la publicación de la APK firmada en Obtainium.
2. Comprobar categorías en «Personal» y «Oficina», incluidos los ajustes y el selector de cada evento.
3. Sincronizar desde ambos dispositivos; cerrar y reabrir la aplicación para comprobar persistencia.
4. Verificar que las categorías existentes conservan nombres, colores, iconos y asociaciones de tareas/eventos.
5. Si quedan categorías invisibles, examinar una copia de seguridad o la sincronización antes de modificar registros.

## Regla de publicación

Toda nueva versión deberá actualizar este archivo, `PENDIENTES.md` y `CHANGELOG.md` en el mismo conjunto de cambios del código. La APK solo se considera publicada tras verificar el resultado de GitHub Actions.


## Actualización 0.27.79
El controlador de jerarquía permite sangría horizontal por swipe (derecha para anidar, izquierda para subir de nivel). Mantiene pulsación larga para arrastrar y controles del menú; verificar en Android tras publicación en Obtainium.

## Actualización 0.27.80 — controlador de subtareas
Corregido el fallo de 0.27.79: el gesto estaba asociado al menú de tres puntos a la derecha y no capturaba confiablemente el dedo. Ahora las subtareas tienen asa de seis puntos a la izquierda, swipe horizontal con vista previa y captura, pulsación prolongada vertical para ordenar; sin botón + por fila. Selección múltiple disponible desde «Opciones de subtareas > Seleccionar elementos > Acciones». Sintaxis JavaScript validada; pendiente prueba en Android y confirmar APK publicada en Releases para Obtainium.

## Actualización 0.27.81 — simplificación de control de listas

- Subtareas: únicamente asa izquierda + check + texto. Tap en asa abre las opciones de esa fila, swipe horizontal cambia sangría y movimiento vertical desde asa reubica la fila sin esperar pulsación prolongada. Pulsación prolongada sigue habilitada.
- Los tres puntos ya no se repiten por fila. Menús generales de descripción y subtareas usan la misma iconografía, en los encabezados; descripción controla el bloque enfocado.
- Se mantienen jerarquías, selección múltiple, menús contextual/general y deshacer. Pendiente prueba de interacción Android y confirmar publicación firmada en Releases para Obtainium.

## 0.27.82 — Encabezados de fechas en vista cronológica
- El filtro «Pendientes» con una única tarea mostraba la hora pero no el día; en «Todas» con varios días sí aparecía.
- Causa: condición `dayCounts.size>1` ocultaba todo encabezado de fecha si solo había un grupo.
- Corregido para mostrar siempre el día en modo cronológico, incluidos «Hoy», «Sin fecha» y un único evento pendiente. No altera agrupaciones por hora ni la tarjeta de tarea.
- Pendiente validar APK firmada y comportamiento en teléfono.

## 0.27.83 — Acceso de nuevos integrantes (2-11-2026)
- En «Equipo de trabajo» → equipo seleccionado, el administrador dispone de «Invitar a una persona», código y «Copiar código». Tras crear un equipo se expande esa sección automáticamente.
- Integrantes sin rol de administrador ven una explicación de permisos, sin acceso al código reservado al creador/director.
- Si falta un código en respuesta del servidor, se ofrece recuperar el dato mediante GET /v1/workspaces para la cuenta autenticada.
- Se separa explícitamente invitación de recuperación de cuenta; formulario de creación no se cierra ante error de servidor.
- Pendiente validar en dispositivos distintos y confirmar release firmada v0.27.83.

## 0.27.84 — Equipo de trabajo y diagnóstico
- UI: tarjetas principales más separadas; la invitación de «Oficina» ya no es una subtarjeta gris, sus filas comparten el diseño y las divisiones de Nottas.
- Acceso a Soporte/diagnóstico corregido: antes estaba oculto por CSS. Panel reordenado en sincronización, recuperación, gestión avanzada y opciones técnicas plegadas. El botón de comprobación llama a /v1/me con la sesión existente.
- Campo de código de recuperación de dueño se oculta si la cuenta ya es dueña; recuperación, ocultar espacio, eliminación definitiva con confirmaciones, notificaciones y compatibilidad permanecen funcionalmente disponibles.
- Pendiente comprobar diseño, desplazamiento y funciones en teléfono Android. No se cambian datos ni esquemas del Worker.

## v0.27.85 — Identidad visual en barra lateral y Acerca de Nottas
- Se añadió el asset SVG nottas_wordmark.svg, usando las letras de la imagen aportada y el icono exacto de dos Ts de ic_nottas_status.xml en lugar de las Ts originales.
- Barra lateral: logo gráfico en vez de título de texto, subtítulo «Espacios y organización» sin cambio.
- Acerca de Nottas: icono del launcher ic_nottas_launcher.webp cargado del recurso Android y mostrado en escala de grises; fallback vectorial local. El nombre se muestra como el wordmark.
- No se tocaron los recursos de icono de launcher/notificación. Pendiente confirmar WebView en Android, diseño vertical y modo oscuro. Obtener APK firmada en Releases.

## 0.27.86 — Corrección de marca en Acerca de Nottas
- Icono cuadrado: el mismo launcher de la aplicación, a todo color, sin filtro grayscale.
- Logo de texto inferior: monocromático (negro en claro, blanco en oscuro), con dos T del icono de notificaciones. El wordmark de la barra lateral conserva sus colores.
- Sin cambio de recursos Android de iconos, de usuarios o de datos. Validación visual pendiente en Android y publicación vía Obtainium.

## 0.27.87 — Vista cronológica de tareas
- En agrupación por fecha/hora: «Sin fecha» aparece al principio, luego siguen los días en el orden cronológico seleccionado. El cambio es del comparador usado por la vista agrupada, no del orden general.
- Espacios compactados con clase específica `taskChronologicalList` (gap 5 px, margen superior del grupo día 9 px, del grupo hora 0). La clase se elimina al ver notas para evitar estilos residuales.
- Pendiente prueba en Android, incluido modo oscuro, fechas múltiples, grupos con y sin hora.
