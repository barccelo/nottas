# Nottas Design System — 1.0 (laboratorio)

**Estado:** propuesta en revisión, no adoptada en toda la aplicación.  
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

## Fases pendientes

1. Validar visualmente en teléfonos Android los seis módulos del laboratorio y ajustar proporciones, contraste, tipografía y variantes.
2. Confirmar biblioteca de iconos y fuente; empaquetar recursos localmente con avisos de licencia aplicables.
3. Crear tokens compartidos de CSS y funciones/componentes comunes, preservando los estilos existentes mientras se migra.
4. Incorporar selectores de fecha/hora y ventanas/encabezados al laboratorio, respetando la rueda de hora y el calendario desarrollados en Nottas.
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