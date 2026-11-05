# Nottas

Aplicación Android local-first de notas y tareas con interfaz inspirada en la MiniApp y un overlay al encender/desbloquear el dispositivo.

## Continuidad técnica entre versiones y chats

**Para iniciar un chat nuevo sobre Nottas, leer primero [CONTINUIDAD.md](CONTINUIDAD.md).** Resume la versión comprobada del código, el último trabajo, las validaciones abiertas y el protocolo de reanudación.

- [CONTINUIDAD.md](CONTINUIDAD.md): ficha operativa breve y primer punto de lectura entre conversaciones.
- [ESTADO.md](ESTADO.md): estado técnico, funciones y diagnóstico detallado.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): sistema visual en evaluación, inventario de componentes y etapas de adopción.
- [PENDIENTES.md](PENDIENTES.md): mejoras, errores y verificaciones pendientes.
- [CHANGELOG.md](CHANGELOG.md): historial de los cambios incluidos en cada versión.

**Regla de continuidad:** actualizar `CONTINUIDAD.md` al cerrar cada intervención relevante, incluso sin cambio de versión. Para cambios de aplicación, mantener también `ESTADO.md`, `PENDIENTES.md` y `CHANGELOG.md`. Confirmar la APK firmada en GitHub Actions/Releases antes de afirmar que ya está disponible en Obtainium.

## Incluye

- Tareas y notas, categorías, filtros, búsqueda y prioridades.
- Fechas, recordatorios y papelera.
- Importación y exportación JSON.
- Datos locales persistentes mediante WebView DOM storage.
- Overlay a pantalla completa al encender/desbloquear el dispositivo.
- Servicio en primer plano que escucha los eventos de pantalla y arranca después de reiniciar el teléfono.
- Ajuste para activar/desactivar la aparición automática.

## Primer inicio

1. Instala la APK firmada desde [GitHub Releases](https://github.com/barccelo/nottas/releases).
2. Abre Nottas.
3. Concede el permiso **Mostrar sobre otras aplicaciones** cuando Android lo solicite.
4. Deja habilitado **Mostrar al encender/desbloquear** en Ajustes.
5. Apaga y vuelve a encender la pantalla para probar el overlay.

## Compilación y firma privada

GitHub Actions compila una APK de tipo `release` sin firmar y la firma con una clave privada almacenada exclusivamente mediante los secretos de GitHub Actions. Publica la APK firmada en Releases para permitir las actualizaciones desde Obtainium. Si faltan los secretos, no se publica ninguna APK.

**Migración a v0.27.3:** la firma anterior estaba expuesta en el historial público del repositorio. Para empezar a usar la nueva firma privada, las instalaciones antiguas requieren exportar sus datos a JSON, reinstalar la aplicación e importar los datos. A partir de la primera instalación con firma privada, las siguientes versiones podrán actualizarse sin reinstalar, siempre que conserven la clave.

Consulta [SIGNING.md](SIGNING.md) para generar la clave nueva, añadir los cuatro secretos y ejecutar una publicación.

## Datos

La aplicación es local-first. No requiere MacroDroid ni un servidor para su funcionamiento local.
