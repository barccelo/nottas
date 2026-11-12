# Pendientes de Nottas

## Verificar correcciones v0.27.119 (12/11/2026)

- [x] Sustituir flecha tipográfica por SVG Nottas en web y Android.
- [x] Separar scroll de subtareas del botón de agregar en web y publicar Worker conservando respaldos.
- [x] En Android, abrir tareas y notas sin teclado solo si tienen título; con título vacío solicitar teclado.
- [x] Android 0.27.119 publicada, firmada y comprobada en Release para Obtainium (Actions `43275668042`).
- [ ] Probar tarea «Mejoras» de 69 subtareas: botón visible, salto al final, marcadas plegables y temas claro/oscuro, en distintos tamaños.
- [ ] Probar teclado Android con tareas y notas nuevas, existentes con título y sin título; verificar que no hay reapertura imprevista.
- [ ] Verificar actualización real de Obtainium y conservación de datos locales, además de prueba offline de la versión anterior.


## Verificar correcciones v0.27.119 (12/11/2026)

- [x] Sustituir flecha tipográfica por SVG Nottas en web y Android.
- [x] Separar scroll de subtareas del botón de agregar en web y publicar Worker conservando respaldos.
- [x] En Android, abrir tareas y notas sin teclado solo si tienen título; con título vacío solicitar teclado.
- [ ] Probar tarea «Mejoras» de 69 subtareas, comprobar botón visible, salto al final, marcadas plegables y tema claro/oscuro, en tamaños pequeño/grande.
- [ ] Probar teclado Android con tarea y nota nuevas, existentes con título y sin título; verificar que no hay reapertura imprevista al navegar.
- [ ] Verificar firma, Release v0.27.119 y descarga de Obtainium; luego comprobar actualización en dispositivo físico.


## Validación urgente de guardado offline y editor (12/11/2026)

- [x] Evitar que snapshots/conflictos sustituyan ediciones Android pendientes, y reconocer solo la revisión exacta enviada.
- [x] Añadir subtarea de ancho total, acceso al final de lista al expandir, abrir editores sin teclado automático según tipo de nota.
- [x] Replicar controles aplicables en web y publicar Worker conservando respaldos.
- [ ] **Prueba crítica en Android:** activar modo avión, modificar una nota existente varias veces, salir, cerrar y reabrir Nottas, reconectar y revisar íntegra la nota en Android y web.
- [ ] Reproducir cambios concurrentes desde web/Android para verificar retención de edición offline y eventual aceptación del servidor (sin pérdida silenciosa ni sobrescritura).
- [ ] Validar teclado (nuevo/antiguo sin título), botón ancho y «Ir al final» en listas largas Android y web.
- [x] CI Android 0.27.118: compilación, firma y publicación confirmadas en Actions `43272639018`, APK presente en Release `v0.27.118` para Obtainium.
- [ ] Verificar instalación/actualización real desde Obtainium y retención de datos locales.


## Verificación del editor web (12/11/2026)

- [x] Aplicar CSS de scroll interno a subtareas y contención de overscroll.
- [x] Indicador azul de B/I/U/S según selección en contenido editable; alinear chevrón selector y simplificar superficie del texto.
- [ ] Verificar scroll sobre subtareas con rueda/trackpad/táctil, incluyendo límite superior e inferior y móvil.
- [ ] Probar indicador de formato en selección parcial, texto mixto y después de guardar/reabrir; probar menú de tipo de bloque.
- [x] Desplegar frontend actualizado a Cloudflare y comprobar assets publicados y respaldos `/stable` y `/classic` por lectura de Worker. Pruebas de sincronización en dispositivos pendientes.


Última revisión: 10 de noviembre de 2026 · sincronización Android ↔ Web confirmada por el usuario; faltan pruebas complementarias.

**Resumen para chats nuevos:** [CONTINUIDAD.md](CONTINUIDAD.md) reúne la prioridad vigente. Leer primero los pendientes de la versión actual; los bloques históricos pueden representar verificaciones antiguas y no necesariamente errores aún activos.

## Verificaciones de correcciones de editor web (12/11/2026)

- [x] Ocultar selector inerte «Tipo/Tarea» al editar, sin perder los botones «Nueva nota» y «Tarea».
- [x] Sustituir selector de formato nativo por menú Nottas propio (Texto, Título, Subtítulo, Casilla, Viñeta, Número, Cita).
- [x] Mostrar todas las subtareas anidadas, sin límite de profundidad 12; 69 nodos probados con 31 marcados y árbol profundo 69.
- [x] Preservar metadatos originales de los nodos al normalizar y evitar agrupar como finalizados los padres con hijos pendientes.
- [x] Textos largos de subtareas con textarea de altura automática y superficies sin sombras HTML.
- [x] Publicado frontend en Cloudflare; `/stable`, FCM/WSS y sesión persistente preservados, sin polling ni cambio APK.
- [ ] **Prueba real:** abrir «Mejoras» en navegador, verificar visibles todos los 38 pendientes y posibilidad de expandir los 31 marcados; revisar distribución y scroll con textos largos.
- [ ] Verificar selección de tipos de bloque, formato de texto, teclado móvil, saltos de línea y guardado Android↔Web en tarea real. Verificar que campos ricos y jerarquías se conserven.
- [ ] Revisión estética final de otras pantallas web para detectar sombras nativas remanentes, espacios y menús HTML no personalizados.

## Nottas Web — verificar nueva interfaz espejo (12/11/2026)

- [x] Tarjeta fija desplegable de subtareas en cards y editor, visible aunque esté cerrada, con contador y sin aplanar los hijos.
- [x] Elementos marcados al final de la lista, con flecha independiente para mostrar/ocultar (nivel principal).
- [x] Editor con chips Nottas y contenido primero; campos HTML secundarios bajo «Más opciones».
- [x] Paneles propios de calendario, rueda hora/minuto, recordatorios, categoría, prioridad, estado, repetición y tags, abiertos desde tarjeta (guardado directo) o desde editor (borrador).
- [x] Web publicada en Cloudflare con fallback `/stable` y `/classic`. Sesión, API, backend, WSS y FCM sin cambios. Verificación estática y de despliegue.
- [ ] **Prueba con navegador real:** interacción táctil y mouse, foco/cierre en formularios flotantes, rueda y calendario en Android/Windows, tarjetas en tema claro/oscuro y responsive.
- [ ] **Prueba cruzada:** guardado de una fecha/hora, varios recordatorios, completado y marcado de subtareas, jerarquía con hijos marcados, eliminar/crear desde ambos dispositivos sin actualización manual.
- [ ] **Validar permisos Oficina:** eventos propuestas/agendadas/diferidas y confirmaciones del director/asistente; no presumir paridad completa de estados compartidos.
- [ ] **Pendiente de paridad total:** píldoras in situ de captura rápida, formularios específicos avanzados de Android, Google Calendar y otros módulos colaborativos/nativos. Evitar sustituir controles probados por HTML genérico o introducir sondeos de cuota.

## Nottas Web — validar categorías y captura táctil (12/11/2026)

- [x] Renderizar categorías con iconos SVG `ns-event-*` oficiales, color y emoji, en tarjetas y selector personalizado, a partir de los registros sincronizados.
- [x] Adaptar reconocimiento de fecha/hora de Android (`hoy`, `mañana`, `pasado mañana`, días, `dd/mm`, `2p`, `430p`, horas normales), en forma de sugerencia aplicable en tareas nuevas.
- [x] Accesos rápidos Hoy/Mañana/Pasado mañana/sin fecha, horas 9/12/15/18, abrir selectores nativos por toque y recordatorios con resumen/quitar.
- [x] Chips de tarjeta clicables para fecha/hora, fin, alerta, categoría, estado, prioridad y etiquetas. Completar tarea/subtarea/casilla con cambio optimista y reversión cuando falla D1. Sin nuevos sondeos.
- [x] Probar parser de fecha con reloj controlado, check de tarea/subtarea exitoso y error/conflicto simulado, sintaxis JS/refs DOM/iconos y despliegue Worker; respaldo `/stable` disponible.
- [ ] **Prueba real en navegador:** check de completar desde tarjeta, nueva tarea `mañana 2p`, toques de fecha/hora/cierre, recordatorios y categorías con SVG; verificar envío y recepción Android.
- [ ] **Prueba de regresión:** sesión persistente, colaboración Personal/Oficina, sincronización automática Web↔Android, y que la alarma Android se programa con el array de minutos.
- [ ] Paridad futura aún no implementada: píldoras *in situ* editables dentro del título como Android, rueda circular propia de hora, categorías con creación y edición desde web, reglas completas de diferidas/propuestas, recordatorios avanzados nativos y Google Calendar. No describir estas funciones como terminadas.
- [ ] Inspección táctil responsive en Chrome/Opera/Android, tema oscuro y enfoque de campos con `showPicker`.

## Nottas Web — validar editor y casillas reales (10/11/2026)

- [x] Reemplazar menú Personal/Oficina con UI propia de Nottas; eliminar franja blanca del navegador.
- [x] Hacer clicables los checks de tareas y subelementos de tarjetas y dar acceso al editor completo de subtareas.
- [x] Integrar editor por bloques (incluye checklist, citas, viñetas, números y formato), subtareas recursivas y programación de fechas/horas, recordatorios múltiples, recurrencia, prioridad, categorías y etiquetas usando esquema Android.
- [x] Mostrar estado de propuesta/reunión en tarjetas y editor, permitir agendar la propuesta desde rol dueño; atajo Agendar desde Calendario.
- [x] Mantener WSS/FCM y sesión persistente, sin polling, guardado backend no modificado; desplegar con respaldo en `/stable`.
- [ ] **Prueba manual en navegador:** editar una tarea con muchas subtareas y varios niveles, marcar y desmarcar desde tarjeta/editor y comprobar que se refleje en Android sin pérdidas de formato.
- [ ] **Prueba funcional:** crear/editar fecha/hora, cierre, diferidas, estados de propuesta/agendada, repetición y alarmas Android reales; revisar rol dueño/asistente y reprogramación de propuesta.
- [ ] **Prueba notas:** editar bloques múltiples con énfasis, viñetas, numeración, checklist y etiquetas; comprobar restauración tras recargar.
- [ ] **Prueba de regresión:** sesión persistente F5, FCM Web→Android y WSS Android→Web, altas/bajas sin «Actualizar».
- [ ] Paridad aún pendiente: Google Calendar en web, chat en tiempo real, llamadas, ajustes nativos Android, categorías administrables en web y gestión avanzada de eventos; no simular funciones no implementadas.
- **Recuperación:** `/stable` conserva la interfaz anterior con WSS/sesión propia, sin quedar afectada por los nuevos assets del editor.

## Sesión persistente web — revisión de uso (10/11/2026)

- [x] Conservar token de sesión de vinculación por navegador (con opción «Mantener sesión iniciada» predeterminada y conmutador de Ajustes), sin clave nueva ni polling.
- [x] Recuperar sesión existente por `/v1/me` al cargar y volver a conectar WSS; conservarla ante fallos de red y eliminarla ante 401.
- [x] Añadir cierre de sesión que revoca solo el token del navegador (PR #12, pruebas y despliegue correctos); mantener sesión Android intacta.
- [x] Publicar la web modificada y verificar sintaxis, controles DOM y presencia de autenticación, WSS y ausencia de sondeo.
- [ ] **Prueba real:** vincular una sola vez, recargar con F5, cerrar/abrir navegador, repetir en tema claro/oscuro y comprobar que no solicita otra clave.
- [ ] **Prueba seguridad/función:** desactivar «Mantener sesión» y recargar, cerrar sesión desde Ajustes, confirmar que exige vinculación posterior y Android permanece conectado.
- [ ] **Prueba de regresión:** creación/eliminación de notas y tareas Android ↔ Web sin botón Actualizar tras restaurar sesión.
- **Protección:** no volver a guardar credenciales en una variable efímera exclusivamente ni introducir credenciales permanentes adicionales; advertir contra equipos compartidos.

## Nottas Web — revisión del espejo visual (10/11/2026)

- [x] Adaptar navegación, wordmark, iconografía y tokens originales del Design System 1.3 a escritorio y móvil web.
- [x] Publicar tarjetas/controles, filtros, calendario visual de tareas, vista de espacios y Ajustes basados en las secciones Android; tema oscuro local.
- [x] Preservar de forma exacta la lógica original de guardado y WebSocket, sin polling ni cambios en Android; publicar `/classic` como respaldo.
- [x] Validar sintaxis JS, IDs, iconos, recursos y despliegue con Cloudflare.
- [ ] **Validar visualmente en navegador real** Chrome/Edge, ambos temas y distintos tamaños (header, wordmark, sidebar, calendario y diálogos).
- [ ] **Pruebas de regresión reales** después del rediseño: crear y eliminar nota/tarea en ambas direcciones, Actualizar, reconexión, Personal y Oficina; comparación con `/classic`.
- [ ] Revisar paridad funcional pendiente: editor enriquecido y subtareas editables, ajustes y categorías sincronizadas, calendario completo y Google Calendar, mensajes y llamadas; la UI actual no simula funciones que no existen.
- [ ] Tras validación, decidir promoción de la web experimental a versión estable; no fusionar a `main` basándose solo en revisión estática.

## Sincronización bidireccional — configuración conservada (10/11/2026)

- [x] Usuario confirma sincronización automática Android ↔ Web tras implementar canal WSS (PR #11) y reparar avisos FCM del mismo usuario (PR #10).
- [x] Confirmación funcional en uso real por el usuario; no depende únicamente del éxito de GitHub Actions.
- [x] Sin polling periódico: WebSocket hibernable `SYNC_HUB` emite invalidación, y la web consulta el estado al recibir el evento; Android mantiene FCM.
- [ ] Pruebas complementarias antes de cambios: reconexión tras cierre/segundo plano, desconexión de red, múltiples miembros Oficina, permisos y conflictos simultáneos. No se debe interpretar como regresión ya observada.
- [ ] Convertir en pruebas automatizadas completas la matriz de creación/edición/eliminación de nota/tarea desde ambos dispositivos; proteger la entrega FCM al autor y el canal WSS.
- **Regla:** mantener esta configuración como versión de referencia; jamás reintroducir polling de 8 s/1,5 s ni revertir a la web sin WebSocket como «solución».

## Prioridad vigente — validar tiempo real Android → Web

- [x] Implementar canal de eventos en navegador (WebSocket autenticado + Durable Object con hibernación) sin polling periódico; PR #11 fusionado, backend y web publicados.
- [x] Probar autenticación, separación por usuario y avisos de creación/eliminación en CI (`42905553337`); backend desplegado (`42905627037`), recurso DO registrado.
- [ ] Verificar en navegador real Android→Web al crear, editar y eliminar **nota y tarea** de Personal y Oficina; comprobar reconexión tras pestaña oculta y red interrumpida.
- [ ] Verificar que Web→Android (FCM) siga siendo automático al crear/eliminar nota/tarea; no modificar este flujo para solucionar un problema del receptor web.
- [ ] Si falla la conexión WSS, inspeccionar petición WebSocket, subprotocolo de autenticación, respuesta 101, Origin, CSP y binding `SYNC_HUB`. No reinstaurar polling como solución improvisada.
- [ ] Vigilar cuota del Durable Object (eventos y conexiones); no hay sondeo periódico D1.

## Prioridad vigente — validar reparación FCM del PR #10

- [x] Encontrar fallo exacto: `pushWorkspaceSync` excluía al propio autor; en Personal no notificaba a ningún dispositivo de la misma cuenta.
- [x] Corregir backend sin tocar web ni Android, con tests de alta y baja en espacios Personal y Oficina.
- [x] Suite de pruebas de GitHub Actions en PR y despliegue Cloudflare confirmados; verificación del código vivo.
- [ ] **Prueba real en Android:** desde web crear y eliminar nota y tarea, verificar que Android recibe cambios inmediatamente sin intervención; repetir en Personal y Oficina. Si falla, comprobar registro FCM y recepción nativa.
- [ ] Si recepción FCM falla en un móvil, inspeccionar `pushDelivery.accepted`, `/v1/devices/push-status` y el tratamiento Android de `sync` sin introducir nuevas modificaciones de interfaz.
- [ ] Mantener pruebas de regresión obligatorias; no volver a reemplazar `web/index.html` como intento de arreglar notificaciones.
- [ ] Canal real Android→web basado en eventos requiere diseño independiente; la base web seleccionada sigue sin polling ni Web Push.

## Prioridad actual — versión base protegida

- [x] Recuperar la versión web exacta de `0305339` («Acceder desde otro teléfono»), no la posterior `46429cac`; desplegada en Cloudflare y versión fijada en documentación.
- [ ] Comprobar en Android que creación y eliminación de nota/tarea desde la web disparen FCM y aparezcan sin gesto manual; identificar si la variación se debe a entrega FCM, registro de dispositivo o ejecución del sync.
- [ ] Decidir y diseñar notificación push en navegador solo tras validar la base; esta versión web **no** consulta periódicamente ni tiene Web Push.
- [ ] Añadir pruebas de regresión para altas/bajas, Personal/Oficina y subtareas, y publicarlas como puerta de validación antes de nuevas funciones.
- [ ] No reincorporar por ahora sondeo 8 s/1,5 s ni editor web ampliado; apartados siguientes son históricos.

## Prioridad inmediata — validación Nottas Web (previsualización)

- [x] Revertir cambio web de sondeo de 1,5 s tras regresión reportada; versión previa desplegada (10-11-2026).
- [ ] Confirmar con Android que creación Web→Android recuperó actualización sin gesto manual y verificar borrado Web→Android. Analizar entrega real FCM, registro del dispositivo y procesamiento de `sync` sin reintroducir regresiones.
- [ ] Diseñar canal push real Android→Web con autorización y bajo consumo de cuota (la web actual usa sondeo, no FCM); verificar capacidad antes de sustituirlo.


- [x] Reducir refresco de la web de 8 s a 1,5 s y actualizar localmente tras POST confirmado, con defensa contra respuestas de sync antiguas (10-11-2026).
- [ ] Confirmar en navegador real que las altas/bajas Android→web aparezcan sin refresco manual y que las notas web→Android se sincronicen consistentemente (el usuario reportó una nota de 20 s y una eliminación no reflejada).
- [ ] Evaluar un transporte web push autenticado (SSE/WebSocket/Web Push) si sigue siendo imprescindible latencia subsegundo sin sondeo frecuente.


- [x] Publicar Worker web independiente con acceso HTTPS y separación visible Personal/Oficina.
- [x] Mostrar subtareas de tareas y casillas de notas, incluida anidación, sin perder el payload.
- [x] Programar refresco automático de la web, también al recuperar foco.
- [x] Fusionar y desplegar corrección de avisos FCM de cambios de la misma cuenta (run 42862252735).
- [ ] Probar crear tarea/nota en web y comprobar aparición en Android sin actualizar manualmente; repetir Android→web y borrado desde ambos.
- [ ] Verificar espacios Personal/Oficina, permisos director/asistente, tareas propuestas, aprobación y no contaminación de datos entre espacios.
- [ ] Confirmar que la nota con subtareas/casillas reportada en Android conserva texto, estados, indentación y edición desde web.
- [ ] Revisar conflictos, desconexiones, pestaña dormida, borrado/recuperación, permisos push y recordatorios Android.
- [ ] Validar editor y tema claro/oscuro en Chrome/Edge y pantallas distintas; completar edición enriquecida y UI escritorio.
- [ ] Revisar seguridad/caducidad/revocación de sesiones web antes de producción; no fusionar PR #8 sin validar.
- [ ] Comprobar que Cloudflare responde a la previsualización desde navegador real y que el contenido creado vuelve a persistir correctamente.

## Prioridad inmediata — v0.27.117

- [ ] **Subtareas:** abrir tarea con subtareas y alternar contraer/expandir repetidamente con la misma tarjeta. Confirmar que **no desaparece**, siempre conserva progreso y cantidad, y no se duplica con las herramientas.
- [ ] **Barra de herramientas:** pulsar Subtareas para expandir/contraer; cambiar a otra herramienta y regresar sin ocultar accidentalmente la lista ni mover la descripción debajo de ella.
- [ ] **Rueda:** tocar horas/minutos distintos (sin arrastrar) y confirmar que se actualiza el campo al instante, sin saltos ni valores intermedios. Comprobar pulsación del número central y teclado numérico, incluso en tarea sin hora previa.
- [ ] **Inicio/fin:** abrir hora inicial, tocar hora final con rueda abierta y teclado abierto, volver a inicio. No debe cerrarse inesperadamente ni descartar el valor. Solo pulsar el campo ya activo debe cerrar el selector.
- [ ] **Regresión:** respetar encabezado visible, cierre con toque externo real, gestos de scroll, accesibilidad, tema oscuro y guardado de fechas/horas en Android.
- [x] **Publicación:** v0.27.117 (`versionCode 198`) compilada y firmada; APK verificada en GitHub Releases para Obtainium.
- [ ] **Actualización Android:** instalar desde Obtainium y comprobar que conserva datos y que los gestos funcionan en dispositivo real.

## Prioridad inmediata — v0.27.116

- [ ] Abrir tarea con subtareas existentes; comprobar **una sola tarjeta** de resumen en modo contraído, incluso después de pulsar la herramienta Subtareas, contraer/expandir y regresar al editor.
- [ ] Diferir o reprogramar evento con y sin fecha: verificar que selector de fecha y luego selector de hora se abren mostrando **el encabezado y campos superiores completos**, sin desplazamiento automático. Comprobar pantallas de distintas alturas, teclado visible y Back.
- [ ] Abrir nota existente con título: no aparece teclado. Notas nuevas o sin título: el campo correspondiente recibe el foco. Confirmar navegación entre notas sin teclado residual.
- [ ] Deslizar para actualizar la lista de notas y tareas, comprobar icono, alineación, animación de carga y contraste en modo claro/oscuro.
- [x] Confirmados Gradle v0.27.116 (`versionCode 197`), compilación y firma y Release con APK en GitHub.
- [ ] Comprobar actualización por Obtainium en Android, sin pérdida de datos; las pruebas funcionales no se deducen del éxito de CI.

## Prioridad inmediata — v0.27.115

- [ ] **Subtareas:** abrir una tarea con elementos y comprobar que aparece la tarjeta resumen contraída; tocarla expande los elementos sin desplazar la descripción al final.
- [ ] **Orden:** comprobar «Añadir subtarea» antes de «Elementos marcados»; expandir elementos completados, editar sus textos, desmarcar y arrastrar sin perder datos.
- [ ] **Formato:** seleccionar y cambiar negrita, cursiva, tachado, subrayado; comprobar estado visual, foco y selección tanto con teclado físico como virtual.
- [ ] **Diferidas:** diferir tarea → elegir fecha → se abre hora; re-agendar, reproponer, solicitar nueva fecha y aprobar desde director, comprobando que el estado no queda bloqueado.
- [ ] **Solicitud de nueva fecha:** comprobar aviso y aparición en bandeja del director con la aplicación cerrada o pantalla apagada.
- [ ] **FCM:** director con pantalla apagada mientras asistente pasa Propuesta → Agendada: Android programa alarma y la muestra a su hora, sin abrir la app; comprobar edición y cancelación remotas.
- [ ] **Sincronización:** probar alarmas personales y de otros espacios simultáneas, mensajes FCM fuera de orden, modo avión, reconexión, reinicio de Android, permiso de alarmas y revocación de notificaciones.
- [ ] **Worker:** corroborar en producción la recepción de sync_task y la notificación director_proposal; verificar tokens push y errores antes de considerar resuelto completamente.
- [ ] **Release:** compilar APK firmada, validar versiónCode 196 y publicación v0.27.115 para Obtainium.

## Prioridad inmediata — v0.27.114

- [ ] Comprobar tarea con hora inicial y sin fin: borde rojo y fecha roja al llegar la hora sin cerrar la aplicación.
- [ ] Verificar hora final explícita, fecha sin hora y duración de varios días.
- [ ] Confirmar que tareas completadas o cerradas no vencen y «Pendiente de verificar» no cambia.
- [ ] Comprobar transición automática a otro día y regreso desde segundo plano, y consistencia en calendario.
- [ ] Confirmar compilación firmada, Release v0.27.114 y actualización segura por Obtainium.

## Prioridad inmediata — v0.27.113

- [ ] **Pantallas:** comparar tarjetas de tareas/notas, filas de calendario, propuestas, Ajustes, barra lateral, equipo y filtros para verificar radios, rellenos, tipografía y alineación.
- [ ] **Checks:** comprobar círculos en subtareas, notas con listas y filas del calendario en ambos temas, incluido estado completado.
- [ ] **Gestos:** editar/eliminar por swipe, arrastrar subtareas, abrir tarjetas, pulsar metadatos y navegar el calendario sin interferencias de CSS.
- [ ] **Encabezados:** flecha y texto en el mismo eje; verificar tamaños mínimos, diálogos, recordatorios nativos, tareas y notas.
- [ ] **Estética:** revisar contraste y colores semánticos, textos largos, pantallas estrechas, teclado y modo oscuro.
- [ ] **Copy:** comprobar que ayudas redundantes no reaparecen por renderizado dinámico; se conservan estados y advertencias de datos, roles y sincronización.
- [ ] **Publicación:** validar compilación, firma, Release v0.27.113 y Obtainium manteniendo los datos.
- [ ] **Próximas adopciones:** reducir CSS histórico duplicado con pruebas, evaluar recursos Inter/Lucide empaquetados localmente si se aprueban.

## Prioridad inmediata — v0.27.112

- [ ] **Galería de hora:** comprobar rueda 24 h/60 min, edición directa sin borde azul, scroll suave y no afectar ajustes reales.
- [ ] **Galería de fecha:** título «Noviembre 2026» sin «de», tocar título abre ruedas de mes/día/año; mover por scroll y toque, pulsar «Listo», navegar meses, «Hoy» y cerrar/abrir.
- [ ] **Editor real:** selector fecha detallado desde el encabezado, aplicar fecha de inicio/fin, comprobar validación de fin anterior a inicio, duración máxima, cambio de meses de 28/29/30/31 días y 29 de febrero.
- [ ] **Navegación:** Android Back primero cierra el selector detallado, después el panel de fecha, sin descartar edición; entrada numérica de hora y teclado sin bordes azules.
- [ ] **Calendario:** comprobar encabezados Mes y Agenda con formato «Noviembre 2026».
- [ ] **Recordatorios:** verificar flecha y wordmark centrados ópticamente tanto en pantalla simple como en apilados, sin interferir con barra de estado o controles.
- [ ] **Publicación:** comprobar GitHub Actions, firma, Release v0.27.112, actualización vía Obtainium y persistencia de datos.

## Prioridad inmediata — selectores del laboratorio v0.27.111

- [ ] **Rueda de hora:** comprobar scroll vertical lento/rápido y centrado exacto de horas/minutos.
- [ ] **Edición directa:** tocar el número central, editar de 00–23 y 00–59, confirmar, cancelar y usar el teclado sin que salte el valor.
- [ ] **Fecha:** avanzar/retroceder meses y años, pulsar días contiguos y «Hoy», comprobar selección y año bisiesto.
- [ ] **Temas:** verificar ambos selectores en claro/oscuro y en un teléfono de pantalla estrecha.
- [ ] **Aislamiento:** comprobar que las vistas de muestra no alteran el calendario real, las alarmas, el tema ni los datos guardados.
- [ ] **Obtainium:** verificar APK firmada, publicación, actualización y conservación de datos.

## Prioridad inmediata — Nottas Design System

- [ ] **v0.27.110 · Acceso:** Ajustes → Acerca de Nottas → Componentes de Nottas debe abrir la galería sin afectar otras secciones.
- [ ] **v0.27.110 · Navegación:** flecha atrás y Back Android regresan a «Acerca de Nottas»; al cerrar Ajustes se vuelve a la interfaz normal.
- [ ] **v0.27.110 · Contenido:** seis módulos visibles y legibles; el scroll dentro de la galería responde con normalidad en pantallas pequeñas y grandes.
- [ ] **v0.27.110 · Temas:** previsualización clara/oscura con contraste correcto; al cambiar el tema de la muestra NO se modifica el tema real de Nottas.
- [ ] **v0.27.110 · Controles:** botones, checks, interruptores, pestañas y filtros de la muestra responden sin crear/editar datos ni disparar alarmas.
- [ ] **v0.27.110 · Publicación:** validar compilación, firma, GitHub Release y actualización por Obtainium conservando datos.
- [ ] **Decisión estética:** revisar y aprobar tipografía, símbolos, tamaños, botones, tarjetas, color y contrastes del catálogo.
- [ ] **Fase siguiente:** confirmar Inter/Lucide, incorporar activos locales y licencias, extraer tokens reutilizables; después extender el catálogo con selectores, navegación, ventanas y calendario.
- [ ] **Migración:** sustituir controles de producción progresivamente, sin rediseños generales ni regresiones de navegación, recordatorios o sincronización. Ver `DESIGN_SYSTEM.md`.

Estados: **Por verificar**, **Pendiente**, **En evaluación**. El contenido de esta lista no sustituye la comprobación del código ni las pruebas en Android.

## Prioridad inmediata

- [ ] **v0.27.109 · Estado:** pulsar Propuesta en tarjeta y editor, comprobar cambio inmediato a Agendada; segundo toque abre opciones. Validar autorización, sincronización e historial.
- [ ] **v0.27.109 · Recordatorio:** pulsar el metadato de alerta de la tarjeta; comprobar selección múltiple, «Sin aviso», persistencia y acceso a opciones personalizadas.
- [ ] **v0.27.109 · Alarmas:** verificar que añadir o quitar avisos desde la tarjeta actualiza las alarmas de Android sin duplicados.
- [ ] **v0.27.109 · Obtainium:** comprobar APK firmada y actualización preservando datos.


- [ ] **v0.27.108 · Identidad monocromática:** verificar que el encabezado individual y múltiple usa exactamente el acabado negro de «Acerca de», sin tonos originales y con opacidad discreta; flecha y proporciones intactas.
- [ ] **v0.27.108 · Obtainium:** verificar firma, publicación y actualización sin pérdida de datos.


- [ ] **v0.27.107 · Encabezado de recordatorios:** comprobar el mismo wordmark del sidebar, colores y dos T sin bordes ni deformaciones, tamaño discreto, flecha simétrica y centrado vertical en recordatorio individual y múltiple.
- [ ] **v0.27.107 · Volver:** verificar que el chevrón regresa sin completar ni posponer y no afecta los gestos del recordatorio.
- [ ] **v0.27.107 · Obtainium:** comprobar APK firmada, actualización y persistencia de datos.


- [ ] **v0.27.106 · Fondo inferior:** verificar desenfoque progresivo detrás de búsqueda, espacio intermedio y dock; la lista debe permanecer insinuada, sin banda sólida ni separación abrupta.
- [ ] **v0.27.106 · Interacción:** búsqueda, botón +, calendario y menú inferior siguen respondiendo, sin capa que intercepte toques; comprobar scroll de tareas tras la barra.
- [ ] **v0.27.106 · Temas y estados:** comprobar claro/oscuro, apertura de teclado, búsqueda activa y papelera; no aplicar el blur a texto o controles del frente.
- [ ] **v0.27.106 · Obtainium:** comprobar publicación de APK firmada y actualización conservando los datos.


- [ ] **v0.27.105 · Caso Test:** abrir Oficina en ambos móviles tras actualizar, sincronizar; verificar que el evento rechazado del 02/11 17:00 no vuelva a activar ni mostrar recordatorios.
- [ ] **v0.27.105 · Estados:** probar rechazo/cancelación, petición de cambios, diferimiento, realización y eliminación, tanto local como desde el otro rol; confirmar cancelación de alarmas programadas y notificaciones visibles.
- [ ] **v0.27.105 · Búsqueda:** «Test» debe localizar registros de Oficina rechazados en otras coincidencias, sin aparecer en Pendientes/Todas/Hoy.
- [ ] **v0.27.105 · Recordatorios válidos:** confirmar que tareas confirmadas propias/compartidas y múltiples recordatorios/snoozes siguen funcionando; probar reinicio del teléfono y cortes de conectividad.
- [ ] **v0.27.105 · Obtainium:** validar APK firmada, actualización conservando datos y sincronización inicial.


- [ ] **v0.27.104 · Simetría:** comprobar que «Elegir» se extiende hasta el margen derecho igual que calendario/recordatorio en pantallas pequeñas, modo claro/oscuro y con teclado abierto.
- [ ] **v0.27.104 · Handle del selector de recordatorios:** deslizar hacia abajo sobre el handle y encabezado debe desplazar y cerrar la hoja, sin cambiar el recordatorio; gesto insuficiente debe volver a su posición, deslizamiento hacia arriba no debe expandir.
- [ ] **v0.27.104 · Switches:** verificar que interruptores grandes y compactos usan solo azul de Nottas en Ajustes, rueda de hora, agenda y otras vistas, incluso con modo oscuro.
- [ ] **v0.27.104 · Obtainium:** verificar firma, publicación APK y actualización sin pérdida de datos.


- [ ] **v0.27.103 · Ruedas:** verificar que hora y minuto se centran exactamente, sin número duplicado, durante scroll lento, rápido, inercia, taps y cambios de valor.
- [ ] **v0.27.103 · Interacción:** tocar el número central abre edición directa; deslizar desde el centro hace scroll sin bloquear el gesto; comprobar compatibilidad con teclado y guardado al pulsar «Listo».
- [ ] **v0.27.103 · Interfaz:** evaluar handle, alturas, secciones de recordatorio y contraste de fila seleccionada en claro y oscuro.
- [ ] **v0.27.103 · Captura rápida:** contrastar simetría de iconos calendario/campana y colocación de badge; revisar el chevrón SVG del botón «Elegir».
- [ ] **v0.27.103 · Obtainium:** verificar la APK firmada y la actualización sin pérdida de datos.


- [ ] **v0.27.102 · Recordatorios:** verificar alineación exacta del icono campana con el calendario y las fechas en pantallas pequeñas, teclado abierto y tema oscuro.
- [ ] **v0.27.102 · Categorías automáticas:** «Consejo Directivo» selecciona su categoría sin borrar título; prueba frases con categoría, borrado de coincidencia, tildes y selección manual persistente.
- [ ] **v0.27.102 · Calendario en captura rápida:** abrir las vistas Día, Semana, Mes y Agenda con eventos; cerrar y volver al borrador, también tras entrar y salir del editor de un evento y usar Back.
- [ ] **v0.27.102 · Rueda de hora:** comprobar scroll horizontal/vertical, elección de minutos, ajuste de recordatorios y ausencia del selector nativo Android; verificar que no interfiera con la edición de tareas existente.
- [ ] **v0.27.102 · Obtainium:** verificar nueva APK con firma permanente y conservación de los datos.


- [ ] **v0.27.101 · Categorías:** comprobar carrusel visible con teclado, deslizamiento horizontal, categoría marcada y guardado correcto en tarea y nota.
- [ ] **v0.27.101 · Horas compactas:** probar 2p, 2a, 430p, 430a, 02p, 02a, 0430p y 0430a; también 12a, 12p y horas inválidas. Verificar marcador dentro del título.
- [ ] **v0.27.101 · Acto presencial:** confirmar nuevo símbolo de atril, categoría distinta de Actividad, migración única y sincronización en ambos dispositivos.
- [ ] **v0.27.101 · Obtainium:** verificar publicación firmada y actualización conservando datos.


- [ ] **v0.27.100 · Marcadores dentro del título:** comprobar «Test mañana» → «Test [mañana]» dentro del mismo campo, con espacio conservado en la edición; al guardar se almacena «Test» sin espacio final. Probar horas, fechas, varias palabras y tema oscuro.
- [ ] **v0.27.100 · Recuperación:** al pulsar X o retroceso junto a la píldora debe volver «mañana» como palabra editable; borrar una parte o toda la palabra y reescribirla debe volver a sugerirla.
- [ ] **v0.27.100 · Obtainium:** comprobar publicación firmada y actualización sobre v0.27.99 sin pérdida de datos.


- [ ] **v0.27.99 · Captura rápida:** confirmar extracción de hoy, mañana, fechas y horas del título, render de píldoras junto al campo, recuperación de palabras con X/Backspace y nueva detección al borrar parcialmente o reescribir el texto.
- [ ] **v0.27.99 · Descarte visual:** comprobar indicación y desplazamiento de las tarjetas, apertura exclusiva del menú al soltar el dedo y scroll vertical normal.
- [ ] **v0.27.99 · Obtainium:** comprobar publicación de APK firmada y actualización conservando datos.

- [ ] **v0.27.98 · Regresión swipe:** comprobar que un gesto horizontal abre únicamente «¿Qué deseas descartar?» y no abre el editor del evento.
- [ ] **v0.27.98 · Revisar después:** comprobar que el botón cierra la revisión sin cambiar estados y que los avisos siguen pendientes en la campanita y Android.
- [ ] **v0.27.98 · Obtainium:** confirmar publicación firmada y actualización sin borrar los datos.



- [ ] **Probar v0.27.97:** subtareas de una y varias líneas alineadas verticalmente; revisar tanto tema claro como oscuro.
- [ ] **Probar captura rápida:** «hoy» y «mañana» como palabras normales al quitar su píldora por X o Backspace, sin perder el texto ni reaplicar la fecha; verificar fecha/hora guardada cuando se mantiene marcador.
- [ ] **Probar bandeja director:** tocar X y deslizar: menú Solo notificación / Rechazar evento. Verificar que ocultar aviso no cambia el evento compartido y que rechazar sí lo retira de pendientes, Inicio, Calendario y Agenda de ambos dispositivos.
- [ ] **Probar propuesta múltiple:** al abrir Nottas el director debe ver lista completa con Confirmar, Rechazar y cierre para Revisar después; no duplicar al abrir varias veces la app.
- [ ] **Probar Android:** notificación persistente mientras haya propuestas visibles; tocarla abre bandeja directamente y no Inicio; cuando se resuelven todos, desaparece. Respetar restricciones Android.
- [ ] **Regresión de sincronización:** crear/rechazar/aprobar desde ambos teléfonos, sin refrescar manualmente, usando el mismo Firebase centralizado.
- [ ] **Distribución:** comprobar compilación y APK firmada v0.27.97 en GitHub Releases y actualización desde Obtainium.



- [ ] **Verificación urgente · v0.27.96:** confirmar deploy Worker y validación del endpoint GET /v1/client-config (sin registrar valores concretos).
- [ ] **Verificación urgente · director:** actualizar el teléfono a 0.27.96, abrir Nottas con Internet, comprobar que Proyecto/Sender/App/API se autocompletan y pasa de «Push no configurado» a token disponible.
- [ ] **Verificación urgente · mensajes y tareas:** probar creación de tarea y mensaje desde Asistente hacia Director sin refrescar manualmente; repetir sentido inverso.
- [ ] **Regresión · reintentos:** desconectar al primer inicio, restablecer red y comprobar que auto-config vuelve a intentar sin recrear identidad.
- [ ] **Seguridad:** conservar FCM_SERVICE_ACCOUNT_JSON únicamente como secreto del Worker; revisar restricciones de la clave pública Firebase Android si procede.



- [ ] **Bloqueante · Firebase del director:** revisar el aviso «Push no configurado» y el informe GitHub Actions del endpoint /v1/client-config; si faltan los cuatro valores públicos en el Worker, configurarlos una sola vez en Cloudflare (sin exponer la clave privada FCM). No crear una cuenta nueva ni desinstalar.
- [ ] **Validar v0.27.95:** tras completar configuración pública, abrir Nottas en el director y comprobar que los cuatro campos se autocompletan, Firebase inicializa, obtiene token y el servidor lo reconoce.
- [ ] **Validar entrega inmediata:** tarea y mensaje asistente→director, director→asistente, con Nottas abierta y con app en segundo plano. No considerar que actualización manual equivale a push.
- [ ] **Regresión:** asegurar que autoconfiguración se reintenta al fallar la red en el primer inicio y se detiene al obtener Firebase (sin sondeo cada 15 s).
- [ ] **Obtainium:** validar compilación, firma y publicación 0.27.95.



- [ ] **Validación prioritaria v0.27.94:** actualizar ambos teléfonos, abrir ambos una vez para validar token, probar creación de tarea Oficina asistente→director y mensaje asistente→director con recepción directa sin actualizar.
- [ ] **Recuperación FCM:** simular 404/410 de token, comprobar respuesta 409, eliminación del token nativo, emisión de nuevo token y reenvío automático de sync/mensaje pendiente.
- [ ] **Bidireccionalidad:** comprobar los dos sentidos con la misma rutina FCM y tiempos de recepción medibles.
- [ ] **Cierre de calidad:** asegurar todas las pruebas GitHub Actions, despliegue Worker y APK firmada v0.27.94; no borrar datos.
- [ ] **Restricción Android:** si FCM acepta push pero no se recibe en director, investigar servicio Firebase y permisos de notificación/pantalla completa; no seguir sustituyendo push por polling.



- [ ] **Crítico · v0.27.93:** asegurar despliegue del Worker y APK de GitHub Actions. No declarar arreglo final sin comprobar ambos.
- [ ] **Crítico · FCM director:** con Nottas abierta en ambos teléfonos y misma versión, crear tarea y enviar mensaje asistente→director; comprobar recepción sin tocar actualizar. Repetir con director en segundo plano.
- [ ] **Crítico · direcciones simétricas:** comprobar director→asistente y asistente→director para tareas, notas, avisos y respuestas a llamadas.
- [ ] **Crítico · tokens obsoletos:** comprobar que los tokens rechazados 404/410 se depuren, que cada teléfono vuelva a registrar su token al reabrir y que no haya notificaciones duplicadas por dispositivos antiguos.
- [ ] **Crítico · Diagnóstico:** si el servidor informa 0 avisos FCM aceptados, investigar registro Firebase, sesión y permisos de notificaciones del director. Si informa aceptados pero no llega, investigar recepción del servicio Android y políticas del sistema.
- [ ] **Validación · batería:** las notificaciones son impulsadas por FCM; no introducir sondeo del contenido cada 15 s.



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

Al implementar una mejora: actualizar su estado, registrar la versión y trasladar el resultado a `CHANGELOG.md` y `ESTADO.md`; resumir el punto de reanudación en `CONTINUIDAD.md`. No marcar elementos como terminados sin comprobación. Los pendientes históricos se revisarán progresivamente para distinguir lo ya implementado de lo que aún falte.


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
