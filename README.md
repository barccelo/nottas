# Nottas

Primera versión Android independiente de la miniapp local-first de notas y tareas.

## Incluye

- Interfaz basada en la MiniApp local-first v8.
- Tareas y notas.
- Categorías, filtros, búsqueda y prioridades.
- Fechas para tareas y notas fijadas.
- Papelera.
- Importación y exportación JSON.
- Datos locales persistentes mediante WebView DOM storage.
- Overlay a pantalla completa al encender/desbloquear el dispositivo.
- Servicio en primer plano para escuchar los eventos de pantalla.
- Arranque del servicio después de reiniciar el teléfono.
- Interruptor dentro de Ajustes para activar/desactivar la aparición automática.

## Primer inicio

1. Instala la APK.
2. Abre Nottas.
3. Concede el permiso **Mostrar sobre otras aplicaciones** cuando Android lo solicite.
4. Deja habilitado **Mostrar al encender/desbloquear** en Ajustes.
5. Apaga y vuelve a encender la pantalla para probar el overlay.

## Compilación en GitHub

El workflow `.github/workflows/android.yml` genera `app-debug.apk` automáticamente en cada push a `main` y también puede ejecutarse manualmente desde Actions.

## Datos

La aplicación es local-first. No necesita MacroDroid ni servidor. La sincronización web se deja para una fase posterior.
