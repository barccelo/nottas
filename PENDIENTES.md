# Pendientes de Nottas

Última revisión: 30 de octubre de 2026 · X9.

Estados: **Por verificar**, **Pendiente**, **En evaluación**. El contenido de esta lista no sustituye la comprobación del código ni las pruebas en Android.

## Prioridad inmediata

- [ ] **Por verificar · Categorías:** probar en Android la recuperación de categorías compartidas después de actualizar a v0.27.62 y realizar una sincronización.
- [ ] **Por verificar · Persistencia:** cerrar y reabrir Nottas; comprobar que las categorías mantienen espacio, nombre, color, icono y asignaciones.
- [ ] **Por verificar · Dos dispositivos:** comprobar visibilidad y sincronización de categorías en el director y el asistente.
- [ ] **Por verificar · Publicación:** revisar que la APK firmada de v0.27.62 esté publicada correctamente en GitHub Releases.

## Mejoras de interfaz y experiencia registradas en conversaciones previas

- [ ] **En evaluación:** terminar de pulir el formulario compacto de eventos y la apertura de herramientas sin desplazamiento horizontal.
- [ ] **En evaluación:** revisar la experiencia de edición rápida de fecha, hora, categoría y estado desde las tarjetas (incorporada al código en v0.27.61; pendiente de prueba de interacción).
- [ ] **Pendiente:** optimizar la vista de calendario según horas laborales y la interacción para crear eventos tocando las franjas de día/semana.
- [ ] **Pendiente:** continuar afinando los cuadros emergentes para que se cierren correctamente al tocar fuera, sin ejecutar acciones involuntarias.
- [ ] **En evaluación:** lista compacta/holgada y evolución de los filtros y navegación lateral.
- [ ] **En evaluación:** seguimiento de eventos diferidos, atrasados y multidiarios, con sus estados y acciones rápidas.

## Calidad y regresiones

- [ ] Probar importación/exportación JSON y recuperación de copias tras cambios de esquema.
- [ ] Probar la sincronización y el consumo de recursos de la asistencia sin sondeos innecesarios.
- [ ] Revisar que el teclado Android no tape controles ni mensajes en las pantallas completas.
- [ ] Incorporar una prueba repetible de normalización de categorías por espacio para prevenir una regresión similar.

## Uso de esta lista

Al implementar una mejora: actualizar su estado, registrar la versión y trasladar el resultado a `CHANGELOG.md` y `ESTADO.md`. No marcar elementos como terminados sin comprobación. Los pendientes históricos se revisarán progresivamente para distinguir lo ya implementado de lo que aún falte.
