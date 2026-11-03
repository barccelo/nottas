# Nottas Design System — 1.2 (catálogo + adopción puntual)

**Estado:** normas visuales en adopción progresiva. Rueda de hora, calendario del editor y encabezado de recordatorios tienen ajustes puntuales aplicados; el resto sigue pendiente.  
**Inicio:** 3 de noviembre de 2026.  
**Catálogo visual:** Ajustes → Acerca de Nottas → Componentes de Nottas.  
**Archivo:** `app/src/main/assets/componentes.html`.  
**Principio de implementación:** nunca rediseñar masivamente la interfaz operativa sin validar cada familia y probar Android.

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

## Fundamentos propuestos (pendientes de aprobación)

- **Color primario claro:** `#1677FF`; oscuro de referencia: `#4B9AFF`. No introducir un segundo azul sin token explícito.
- **Neutros claros:** fondo `#F5F5F7`, superficie `#FFFFFF`, texto `#1D1D1F`. Oscuro: fondo `#101012`, superficie `#1C1C1E`, texto `#F5F5F7`.
- **Tipografía:** Inter como candidata; el laboratorio incluye fallback del sistema. **La fuente Inter todavía NO está empaquetada.** Si se adopta, añadir el archivo local y preservar su licencia.
- **Iconos:** Lucide como biblioteca candidata, con trazo coherente de 1,8 px y tamaño base de 20–22 px. Los símbolos del laboratorio son una muestra SVG local, **no una integración completa de Lucide**; pendiente sustituir los iconos de producción de forma controlada y registrar la licencia de los recursos incorporados.
- **Espaciado:** escala 4, 8, 12, 16, 24 px; sin valores nuevos arbitrarios salvo casos justificados.
- **Geometría:** botones redondeados con 12 px; tarjetas 15–18 px; acciones circulares y áreas táctiles de al menos 44 × 44 px.
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

## Fases pendientes

1. Validar visualmente los ocho módulos del laboratorio, incluidos los selectores 1.2, corregir contraste, proporciones y comportamiento en dispositivos reales.
2. Confirmar biblioteca de iconos y fuente; empaquetar recursos localmente con avisos de licencia aplicables.
3. Crear tokens compartidos de CSS y funciones/componentes comunes, preservando los estilos existentes mientras se migra.
4. Completar los selectores de recordatorio/repetición; migrar encabezados y ventanas restantes bajo la norma posicional, sin modificar flujos ya validados.
5. Migrar con pruebas: Inicio → notas/tareas → captura rápida → calendario → asistente → ajustes → recordatorios Android nativos.
6. Comprobar consistencia visual, contraste, teclado, tamaños, gestos, rendimiento y sincronización; no introducir cambios funcionales accidentales.

## Fuentes y licencias candidatas

- Lucide Icons: https://lucide.dev/ — licencia ISC; verificar avisos de atribución al empaquetar.
- Inter: https://rsms.me/inter/ — SIL Open Font License.
- Vanilla Calendar: https://vanilla-calendar.pro/ — MIT; solo en evaluación, no instalado.
- Ionic Datetime: https://ionicframework.com/docs/api/datetime — MIT; solo en evaluación, no instalado.

**No se incorporaron librerías ni scripts de CDN.** Todos los ejemplos de la primera entrega residen dentro de la APK y funcionan sin conexión.

## Regla de continuidad

Al aprobar una familia, documentar aquí el estándar definitivo, desarrollar el componente reutilizable y sustituir instancias antiguas por etapas. Mantener `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md` sincronizados en cada publicación.