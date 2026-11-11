# Nottas Design System — 1.3 (integración transversal)

**Estado:** integración transversal de superficies, tipografía, selección y alineación en las pantallas reales, con excepciones funcionales documentadas. La revisión visual en dispositivos reales sigue pendiente.  
**Inicio:** 3 de noviembre de 2026.  
**Catálogo visual:** Ajustes → Acerca de Nottas → Componentes de Nottas.  
**Archivos:** `app/src/main/assets/design-system.css` (estándares activos), `nottas.html` (estructura/comportamiento) y `componentes.html` (catálogo).  
**Principio:** componentes comunes usan tokens compartidos; los cambios no deben alterar gestos, datos, notificaciones, recordatorios ni sincronización.

## Componentes funcionales de la web (10/11/2026)

- Selector de espacios Personal/Oficina: botón 43–44 px, icono `ns-users`, nombre activo, chevrón simétrico y menú contextual personalizado con iniciales, roles y selección; no usar la flecha nativa de `<select>` visible que causaba una franja blanca.
- Editor web: bloques `paragraph`, `heading`, `subheading`, `quote`, `bullet`, `number`, `checklist` y formato inline; checks redondos azules Nottas, subtareas anidadas y acciones de reordenar. Usar los tipos de bloque originales de Android y conservar HTML no editado.
- Formularios: fecha/hora de inicio y fin, recurrencia, recordatorios múltiples y estado de reunión con la misma terminología de Android. Categorías y etiquetas se obtienen de D1 vía el snapshot `/v1/sync` ya existente.
- Tarjetas: checks accionables (completar, subtarea, checklist), metadatos secundarios y estados `Propuesta/Agendada/Diferida/Realizada` con contraste en tema claro/oscuro.
- Interacción del calendario: «Agendar» crea una tarea con la fecha seleccionada. Mantener estructura visual responsive de escritorio.
- **Límite:** es una adaptación funcional progresiva, no todo Nottas Android; mantener WSS + FCM, sesión persistente, ausencia de polling y fallback `/stable`. Sin pruebas manuales de permisos o flujos completos de reuniones todavía.

## Adaptación de escritorio — Nottas Web (10 de noviembre de 2026)

La web usa la **identidad existente**, no un diseño alternativo. El origen autoritativo sigue siendo `app/src/main/assets/design-system.css`, `nottas.html`, `nottas_wordmark.svg` y el presente documento.

- **Fuentes web** (rama `feature/nottas-web-initial`): `web/nottas-ui.css` adapta los tokens `#1677ff` / `#4b9aff`, neutros claros/oscuros, radios 12/16 px, ritmos 4/8/12/16/24, iconos de trazo consistente, objetivo táctil de 44 px, checks circulares y estados; `web/nottas-ui.js` compone las vistas de presentación sin modificar sincronización.
- **Recursos conservados:** `web/nottas_wordmark.svg` replica el recurso Android original; `web/nottas-icons.svg` contiene los 31 símbolos nativos `ns-*` y glifos de navegación de trazados extraídos de la app, sin incorporar librerías de iconos externas.
- **Responsive:** escritorio con sidebar fija, contenido de tarjetas y vistas independientes; en pantallas pequeñas sidebar desplegable, búsqueda y acciones compactas. Respetar foco, contraste, área táctil y `prefers-reduced-motion`.
- **Ajustes:** conservar las familias Apariencia, Notificaciones y recordatorios, Equipo de trabajo, Mensajes rápidos, Datos y respaldo, Acerca de Nottas. En la web solo se ofrecen controles funcionales (p. ej., tema local); no simular ajustes de Android exclusivos del sistema, llamadas o respaldos.
- **Calendario:** navegación Día/Semana/Mes/Agenda a partir de tareas internas con fecha. No confundir esta vista gráfica con la implementación completa Android/Google Calendar.
- **Preservación técnica:** el rediseño no altera `/v1/sync`, la sesión, el WebSocket ni FCM. No agregar polling. Conservar `/classic` como opción de recuperación durante validaciones.
- **Estado:** desplegado en Cloudflare y validado estáticamente; requiere comparación visual y pruebas de interacción en navegador y móvil antes de declarar paridad completa.

## Intención

Nottas conserva su identidad actual: sobria, limpia, orgánica, con calidad de detalle y consistencia entre pantallas, sin reproducir literalmente iOS. Se conserva el logotipo, las dos T de notificaciones, el wordmark y los gestos característicos. El laboratorio solo muestra ejemplos; no edita notas, tareas, eventos, ajustes ni sincronización.

## Inventario de familias

| N.º | Familia | Elementos |
|---|---|---|
| 01 | Marca | Logotipo, wordmark, monocromático, icono de aplicación, icono de notificación |
| 02 | Tipografía | Encabezados, títulos, texto, metadatos, fechas, números |
| 03 | Iconografía | Navegación, flechas, acciones, estado, herramientas y categorías |
| 04 | Botones | Primarios, secundarios, peligrosos, contorno, icono, flotantes |
| 05 | Selección | Checks circulares, switches, pestañas, filtros, opciones |
| 06 | Tarjetas | Notas, tareas, eventos, propuestas, recordatorios y mensajes |
| 07 | Campos | Búsqueda, título, contenido, subtareas, etiquetas, edición enriquecida |
| 08 | Selectores | Hora, fecha, categoría, recordatorio, repetición, colores |
| 09 | Calendario | Día, Semana, Mes, Agenda y navegación temporal |
| 10 | Navegación | Encabezados, barra lateral, barra inferior, volver, menús |
| 11 | Ventanas | Hojas inferiores, modales, diálogos, paneles |
| 12 | Estados | Activo, seleccionado, pendiente, completado, diferido, error, deshabilitado |
| 13 | Interacciones | Swipe, drag, feedback, animación, gestos, avisos a pantalla completa |
| 14 | Posicionamiento | Ejes, márgenes, centros ópticos, safe areas, alineación de títulos y acciones |

## Fundamentos visuales

- **Color primario claro:** `#1677FF`; oscuro de referencia: `#4B9AFF`. No introducir un segundo azul sin token explícito.
- **Neutros claros:** fondo `#F5F5F7`, superficie `#FFFFFF`, texto `#1D1D1F`. Oscuro: fondo `#101012`, superficie `#1C1C1E`, texto `#F5F5F7`.
- **Tipografía:** familia nativa del sistema Android (Roboto y equivalentes), normalizada en formularios, tarjetas y controles. **Inter sigue en evaluación y no está empaquetada.**
- **Iconos:** Lucide como biblioteca candidata, con trazo coherente de 1,8 px y tamaño base de 20–22 px. Los símbolos del laboratorio son una muestra SVG local, **no una integración completa de Lucide**; pendiente sustituir los iconos de producción de forma controlada y registrar la licencia de los recursos incorporados.
- **Espaciado:** escala 4, 8, 12, 16, 24 px; sin valores nuevos arbitrarios salvo casos justificados.
- **Geometría:** controles de 12 px, tarjetas de 16 px, encabezados de 56 px y áreas táctiles principales de 44 × 44 px cuando el ancho lo permite. Eventos del calendario conservan geometría temporal específica.
- **Checks:** redondos en tareas, listas y subtareas. **Switches:** azules; nunca usar verde decorativo por defecto.
- **Sombras/transparencias:** discretas, solo cuando expresan jerarquía.
- **Tema oscuro:** usar equivalentes semánticos por token, no inversiones ad hoc.
- **Animación:** rápida, sin efectos invasivos; respetar `prefers-reduced-motion`.
- **Accesibilidad:** contraste verificable, foco visible, etiquetas accesibles, objetivos táctiles, ajuste a pantallas pequeñas.

## Primera entrega: laboratorio visual

La pantalla «Componentes de Nottas» presenta seis módulos: (1) tipografía, (2) iconografía, (3) botones, (4) checks/switches y filtros, (5) tarjetas, (6) colores/superficies. Incluye previsualización de tema claro/oscuro y controles demostrativos, aislados en un iframe dentro de Ajustes.

- El tema de la muestra inicia a partir del tema activo de Nottas, pero los cambios en la muestra no modifican los ajustes reales.
- El laboratorio no ejecuta operaciones de almacenamiento, sincronización, alarmas ni notificaciones.
- Se accede desde «Acerca de Nottas»; el botón volver de Ajustes y Back de Android deben regresar a esa pantalla.
- Los ejemplos son **propuestas de referencia**, no componentes ya migrados a las pantallas operativas.

## Extensión de laboratorio 1.1 — rueda de hora y calendario (3 de noviembre de 2026)

- **07 · Selector de hora:** prototipo autónomo con rueda de 24 horas y 60 minutos, scroll-snap vertical, resaltado central y escritura directa tocando el número seleccionado. «Restablecer» vuelve a 09:30, sin afectar la hora guardada en Nottas.
- **08 · Calendario / selector de fecha:** cuadrícula mensual con semana iniciada el lunes, meses anterior/siguiente, selección de día, botón «Hoy» y resumen de fecha. Cabecera de referencia con Día/Semana/Mes/Agenda: los botones muestran la selección visual, pero no son versiones funcionales de esas cuatro vistas.
- Ejemplos de datos ficticios y estado local dentro de `componentes.html`; ninguna operación de escritura, modificación de eventos, alarmas, Google Calendar o preferencias.
- Criterio de implementación: **no reemplazar la rueda actual de Nottas ni su calendario sin aprobación de este prototipo y pruebas funcionales en Android**.
- Pendiente comprobar scroll rápido/lento, toque de edición directa, entrada de 00–23 y 00–59, selección de fechas entre años y meses, tamaños reducidos, tema oscuro, retorno y accesibilidad.
- La evaluación de Vanilla Calendar/Ionic continúa siendo opcional: no se han introducido dependencias de terceros en esta ampliación.

## Design System 1.2 — decisiones de posición y selectores (3 de noviembre de 2026)

### Norma de posicionamiento y simetría

La identidad gráfica incluye **dónde se coloca** cada componente, no solo cómo se dibuja:

- **Rejilla:** múltiplos de 4 px para ritmo y alineación; espacios recurrentes 8/12/16/24 px. Evitar offsets individuales sin justificación óptica.
- **Encabezado de pantalla:** altura visual de referencia **56 dp**, control de navegación con objetivo táctil **44 × 44 dp**, icono centrado geométricamente en su objetivo y separación fija **8 dp** respecto al inicio del título o wordmark. Alinear por eje vertical compartido antes de compensaciones.
- **Alineación óptica:** cuando un recurso vectorial contiene espacio interno desigual, es admisible una corrección leve del propio recurso documentada; no desplazar por separado el botón y el título a ojo. En recordatorios, el wordmark tiene una corrección vertical de -3 dp por su viewport.
- **Margen de contenido:** 16 px por defecto en vistas Web; 20 dp en los encabezados nativos de recordatorios actuales. El componente de encabezado gobierna su alineación; no usar márgenes ad hoc según pantalla.
- **Anclajes:** flecha/título, fecha/hora, check/texto, icono/etiqueta y acciones comparten ejes estables. El centro óptico se prueba en pantallas reales con los dos temas.
- **Safe areas/teclado:** respetar barras de sistema y área de navegación; controles flotantes no deben tapar campos ni acciones.
- **Estado:** la regla del encabezado ya se aplica al recordatorio nativo. La unificación de todos los demás encabezados queda como migración posterior.

### Selector de hora ligero

- Rueda de dos columnas hora/minuto y separador centrado; selección indicada principalmente por peso y contraste.
- **Sin recuadro azul** ni contenedor visual opaco alrededor del valor; los números adyacentes usan gris suave.
- Conservar scroll vertical y edición directa tocando el valor central; durante la edición, selección de texto neutra, sin foco azul invasivo.
- Aplicación puntual al prototipo y a la rueda real del formulario existente; conservar su lógica de confirmación y recordatorios.

### Selector de fecha mensual y detallado

- Vista mensual con encabezado **«Noviembre 2026»** (sin «de» y con mayúscula inicial), flechas de mes y día seleccionado circular.
- Tocar el título de mes/año abre **ruedas de mes / día / año**, desplazables y pulsables, con tipografía de selección marcada y vecinos atenuados.
- En la galería, todo es demostrativo; en el editor de tareas, **«Listo» confirma la fecha** mediante las funciones existentes de inicio/fin, respetando la validación del fin y el historial.
- Soporte de 1900 a 2100 en las ruedas; los días se ajustan automáticamente al mes y a los años bisiestos. La navegación por meses sigue disponible.
- La fecha en encabezados mensuales y Agenda usa el mismo formato sin «de». Las fechas largas en otras posiciones conservan su redacción natural en español.
- No se altera el esquema de datos, la sincronización ni los recordatorios nativos.

### Validación de esta entrega

- [ ] Comprobar en Android la galería: hora sin fondo ni borde azul, calendario mensual, abrir/cerrar ruedas, elegir valores y «Hoy», modo claro/oscuro.
- [ ] Comprobar en el editor de eventos/tareas: mes pulsable, selección mediante scroll/toque, «Listo», inicio/fin, límites, año bisiesto, retorno/back y ausencia de cambios hasta confirmar.
- [ ] Comprobar encabezado de recordatorio simple y agrupado: alineación de flecha y wordmark, márgenes, barras y distintos tamaños.
- [ ] Verificar teclado/IME, accesibilidad, áreas táctiles, dispositivo estrecho y ausencia de regresiones de guardado, alarma o sincronización.

## Integración 1.3 — sistema visual compartido (3 de noviembre de 2026)

### Fuente de verdad

- `app/src/main/assets/design-system.css` se carga **después** de los estilos históricos de `nottas.html`, con tokens CSS para colores claro/oscuro, superficies, tipografía, radios, rellenos, espacios y áreas táctiles. El catálogo `componentes.html` consume los mismos tokens; ningún elemento de producción debe recibir estilos exclusivos de la galería.
- Objetivo: sustituir estilos aislados progresivamente; los valores comunes viven en tokens `--ns-*` y las excepciones deben ser explícitas.
- Los controles nativos de Android (por ejemplo `ReminderActivity.kt`) no consumen CSS: deben traducir los mismos tamaños a dp y conservar sus correcciones ópticas justificadas.

### Componentes alineados

| Familia | Integración actual |
|---|---|
| Notas y tareas | Tarjetas base, títulos, contenido secundario, radios, relleno, separación y checks |
| Calendario (filas/agenda) | Tarjetas, títulos, metadatos, espaciado, navegación e indicadores circulares |
| Propuestas y seguimiento | Superficies y metadatos ajustados al lenguaje de tarjetas |
| Equipo de trabajo | Paneles, tarjetas de estado y acciones consistentes |
| Ajustes | Encabezados, navegación, filas, controles, espaciados y secciones más compactas |
| Editor | Alineación de volver, check, título y estrella; rueda/fecha de la fase 1.2 |
| Barra lateral | Alineación de filas y jerarquía de etiquetas |
| Filtros, ventanas y diálogos | Botones, esquinas, separación y objetivos táctiles coherentes |
| Selección | Checks circulares de calendario, notas y subtareas, todos con acento azul |

**Excepciones intencionales:** los bloques de Día/Semana requieren alturas, solapamientos y anchuras propias; las tarjetas con gestos conservan su contenedor y animación; los estados y categorías pueden usar colores semánticos. No imponer el mismo tamaño a controles que tienen funciones distintas.

### Regla editorial: interfaz sin texto de relleno

- La acción se entiende por su **nombre visible** y por el propio control. No escribir subtítulos que digan de nuevo «configura», «elige», «organiza», «puedes…» o describan obviedades.
- Una fila ordinaria muestra: **título + control + estado**, sin explicación si el resultado es evidente.
- Mostrar texto secundario **solo cuando añade un dato**: estado real, alcance de un ajuste, restricción de roles, condición para ejecutar la acción, gesto no descubrible o consecuencia importante.
- Conservar advertencias de eliminación irreversible, pérdida de datos, seguridad, permisos, sincronización, respaldo y limitaciones de solo lectura.
- Los mensajes vacíos informan de la ausencia de datos; no deben adoptar tono publicitario ni instruccional.
- Los textos del catálogo y los documentos de desarrollo pueden seguir describiendo las decisiones visuales porque son material de evaluación, no interfaz de uso cotidiano.

### Validaciones requeridas

- [ ] Comparar notas, tareas, eventos y propuestas en claro/oscuro, con títulos y metadatos largos, en pantallas estrechas y grandes.
- [ ] Comprobar alineación óptica de iconos, encabezados y checks, sin recortes ni desplazamiento de texto al cambiar estados.
- [ ] Probar teclado, editor enriquecido, filtros, barra lateral, gestos de edición/eliminación, recordatorios a pantalla completa.
- [ ] Confirmar que el nuevo CSS se carga desde recursos APK sin red, y que la galería comparte tokens con producción.
- [ ] Verificar contraste, tamaños táctiles, narración accesible y esquemas de color de categorías.
- [ ] Validar los roles director/asistente, sincronización, propuestas y lectura de Google Calendar sin regresiones.

## Regla de apertura y posición del contenido (5 de noviembre de 2026)

- Al abrir una pantalla de edición o un selector integrado, **mantener visible el encabezado y los controles superiores**. Si el contenido excede el alto de la pantalla, el desplazamiento debe ocurrir hacia abajo, nunca cortando automáticamente la parte superior.
- Evitar invocar `scrollIntoView` de un panel al abrirlo dentro de un formulario de pantalla completa: puede desplazar al usuario al final. Restaurar el scroll del contenedor de edición al inicio en aperturas pertinentes y permitir desplazamiento manual para continuar.
- Una herramienta no debe duplicar tarjetas-resumen de contenido ya existente. Mantener una sola representación canónica, con iconografía, márgenes, radios y jerarquía compartidos.
- Las notas ya tituladas abren en modo lectura sin teclado; las nuevas y sin título permiten entrada inmediata.
- Indicadores temporales, como actualizar al deslizar, usan iconos vectoriales simétricos (viewBox 24, trazo aprox. 1.8, extremos redondeados, objetivo de alineación óptica).

## Selectores y controles persistentes — 5 de noviembre de 2026

- Una tarjeta que representa un conjunto existente (p. ej. subtareas) permanece presente durante los estados **expandido/contraído**; el mismo componente alterna esos estados y conserva su resumen, sin duplicación visual.
- Los selectores de hora tienen dos objetivos independientes (inicio y fin). Tocar el otro objetivo cambia el destino del selector **sin cerrarlo**; volver a tocar el objetivo activo puede cerrarlo.
- Los botones de los objetivos del selector se consideran parte de la interacción interna, aunque estén fuera del panel desplegado. Un toque exterior real sí lo cierra.
- Tocar directamente una opción de rueda aplica ese valor sin depender de una animación de scroll posterior. Al editar por teclado el valor central, lo visible y lo guardado deben coincidir.
- Los movimientos programáticos y el enfoque no deben modificar involuntariamente valores ni desplazar fuera de pantalla el encabezado.

## Fases pendientes

1. Validar visualmente los ocho módulos del laboratorio, incluidos los selectores 1.2, corregir contraste, proporciones y comportamiento en dispositivos reales.
2. Confirmar biblioteca de iconos y fuente; empaquetar recursos localmente con avisos de licencia aplicables.
3. Reducir gradualmente los estilos históricos duplicados ahora que existe `design-system.css`, sin alterar posicionamiento ni interacciones.
4. Completar los selectores de recordatorio/repetición; migrar encabezados y ventanas restantes bajo la norma posicional, sin modificar flujos ya validados.
5. Completar el ajuste fino de pantallas y variantes que siguen con estilos específicos; la base común ya está aplicada a Inicio, listas, formularios, calendario, asistente, ajustes y navegación.
6. Comprobar consistencia visual, contraste, teclado, tamaños, gestos, rendimiento y sincronización; no introducir cambios funcionales accidentales.

## Fuentes y licencias candidatas

- Lucide Icons: https://lucide.dev/ — licencia ISC; verificar avisos de atribución al empaquetar.
- Inter: https://rsms.me/inter/ — SIL Open Font License.
- Vanilla Calendar: https://vanilla-calendar.pro/ — MIT; solo en evaluación, no instalado.
- Ionic Datetime: https://ionicframework.com/docs/api/datetime — MIT; solo en evaluación, no instalado.

**No se incorporaron librerías ni scripts de CDN.** Todos los ejemplos de la primera entrega residen dentro de la APK y funcionan sin conexión.

## Regla de continuidad

Al aprobar una familia, documentar aquí el estándar definitivo, desarrollar el componente reutilizable y sustituir instancias antiguas por etapas. Mantener `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md` sincronizados en cada publicación. En chats nuevos, consultar primero [`CONTINUIDAD.md`](CONTINUIDAD.md) para el punto de reanudación, y después este documento para las decisiones visuales.