# Continuidad operativa de Nottas

**Actualizado:** 5 de noviembre de 2026.  
**Objetivo:** retomar el desarrollo en un chat nuevo sin depender del historial de conversaciones. Este archivo es una ficha de entrada, **no** reemplaza al código, las pruebas ni a los documentos de detalle.

## Punto de reanudación

- **Repositorio/rama:** `barccelo/nottas` · `main`.
- **Versión del código Android:** `0.27.116` (`versionCode 197`), confirmada en `app/build.gradle.kts`.
- **Publicación:** Release firmada `v0.27.116` con `Nottas-v0.27.116.apk` **confirmada en GitHub** el 5 de noviembre de 2026; la instalación y comportamiento en Obtainium/Android continúan por verificar. Cada versión posterior requiere su propia comprobación.
- **Última entrega funcional documentada:** subtareas inicialmente contraídas con tarjeta-resumen; orden «Añadir subtarea» antes de «Elementos marcados»; indicador activo en herramientas de formato; corrección del flujo Diferida → Propuesta/Agendada y solicitud de nueva fecha; actualización de alarmas nativas mediante FCM `sync_task`.
- **Backend:** `ESTADO.md` indica que el Worker de Cloudflare fue actualizado para enviar `sync_task`; el funcionamiento extremo a extremo entre dispositivos continúa **por verificar**.
- **Situación:** v0.27.115 y v0.27.116 publicadas como APK firmadas en Releases; continúan pendientes las pruebas reales del funcionamiento y actualización por Obtainium.

## Última intervención — v0.27.116 (5 de noviembre)

- Corrección de tarjeta duplicada de subtareas (conservar el resumen de Design System), scroll de selectores de fecha/hora anclado al inicio, notas con título sin teclado automático e icono de actualización unificado.
- Cambios de interfaz guardados en `app/src/main/assets/nottas.html`. No se han modificado datos ni servicios.
- **Siguiente paso:** validar visualmente la APK v0.27.116 en Android y su actualización por Obtainium; continuar pruebas director–asistente/FCM pendientes. La publicación confirmada no acredita pruebas físicas.

## Siguiente trabajo prioritario

1. **Diferidas / director-asistente:** en dos móviles probar diferir → fecha → hora, reagendar, reproponer, solicitar nueva fecha y confirmar; revisar estados, bandejas y avisos sin bloqueos.
2. **FCM / alarmas:** con el director en segundo plano o pantalla apagada, verificar propuesta → agendada, edición/cancelación remota, orden de mensajes, reconexión, reinicio y permisos.
3. **Editor:** validar subtareas colapsadas, posición estable de la descripción, elementos marcados, orden de controles e indicadores de formato con teclado físico y virtual.
4. **Entrega Android:** comprobar resultado de GitHub Actions, firma, Release y actualización por Obtainium conservando los datos; no dar por publicada una versión solo por cambiar Gradle.
5. **Regresiones visuales:** revisar modos claro/oscuro, calendario, selectores, navegación y recordatorios, respetando `DESIGN_SYSTEM.md`.

El desglose detallado y los pendientes históricos están en `PENDIENTES.md`. No interpretarlos todos como errores activos: varios son **pruebas por verificar** de versiones anteriores.

## Decisiones estables

- Nottas es **Android local-first**, con notas, tareas, calendario, recordatorios nativos y colaboración optativa mediante espacios compartidos. Evitar cambios que comprometan datos, sincronización, alarmas o funcionamiento sin red.
- Identidad **«Apple-like»** significa pulida, limpia, orgánica y coherente; **no** copiar literalmente iOS. Mantener los componentes, tokens y reglas editoriales del Design System existente.
- Preservar la marca acordada: icono principal de la N, símbolo monocromático de las dos T para notificaciones, wordmark discreto y checks circulares. No sustituir recursos sin petición expresa.
- Distinguir siempre **solicitado**, **implementado**, **verificado en Android** y **publicado para Obtainium**. Nunca convertir automáticamente uno de esos estados en otro.

## Qué consultar y para qué

| Archivo | Función |
| --- | --- |
| `CONTINUIDAD.md` | **Leer primero.** Estado compacto y siguiente paso. |
| `ESTADO.md` | Estado técnico y cambios recientes; consultar encabezado y secciones relevantes, no necesariamente todo el histórico. |
| `PENDIENTES.md` | Checklist activo, validaciones y propuestas; priorizar el bloque de la versión actual. |
| `CHANGELOG.md` | Historial de cambios implementados por versión; no equivale a publicación confirmada. |
| `DESIGN_SYSTEM.md` | Reglas visuales, tokens y componentes para trabajo de interfaz. |
| `README.md` | Acceso general, instalación y firma. |

## Protocolo para cada nuevo chat

1. Con acceso a GitHub, **leer primero este archivo** y contrastar las cabeceras recientes de `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md`. Abrir `DESIGN_SYSTEM.md` si el trabajo es visual. Si no hay conexión, pedir acceso en vez de inventar el estado.
2. Revisar los **archivos de código implicados** y la versión de Gradle antes de editar. La documentación puede estar desactualizada.
3. Trabajar por cambios focalizados; evitar pegar archivos completos, logs extensos o historial repetido en el chat. Informar resultados y diferencias concretas.
4. Tras implementar, registrar qué se cambió, qué se comprobó y qué falta comprobar. Para cambios de aplicación: mantener `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md` al día; comprobar firma y Release antes de anunciar Obtainium.
5. **Actualizar este archivo al finalizar cada intervención relevante**, manteniéndolo breve: versión, último cambio, bloqueos, pruebas y siguiente acción. Tras una actualización documental sin código, no inventar una nueva versión.
6. Si los documentos se contradicen, priorizar código y evidencias de compilación/publicación, señalar la discrepancia y corregirla. Nunca eliminar pendientes solo por figurar «corregidos» sin verificación.

**Para reanudar:** basta indicar «Continuemos Nottas» y conectar el repositorio; este documento es la ficha de entrada prevista, aunque su consulta requiere acceso a GitHub en la conversación.
