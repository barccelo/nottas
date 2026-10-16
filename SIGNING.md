# Firma privada de Nottas

Desde v0.27.3, las APK públicas se generan a partir de una compilación release sin firmar y se firman **después** con una clave privada reconstruida temporalmente desde GitHub Actions Repository Secrets. La clave, su Base64 y las contraseñas **no** se deben guardar en el repositorio ni en un commit.

## Importante: migración de la firma

Hasta v0.27.2, Nottas utilizaba `keystore/nottas-debug.keystore`, una clave incluida públicamente en el historial, y contraseñas visibles en `app/build.gradle.kts`. Borrar el archivo del último commit no elimina la exposición histórica. Esa clave **no** puede considerarse privada. Por eso hay que generar una **clave nueva**.

Las instalaciones firmadas con la clave anterior **no podrán instalar esta versión como actualización ordinaria**. Antes de desinstalar, exporta los datos de Nottas a JSON desde la aplicación, guarda el archivo fuera de ella y comprueba que se haya descargado. Después, desinstala la versión antigua, instala la nueva APK de Releases e importa el JSON. A partir de entonces, las versiones firmadas con la nueva clave podrán actualizarse normalmente con Obtainium (siempre que se conserve la misma clave y aumente `versionCode`).

## 1. Crear la clave fuera del repositorio

En GitHub Codespaces (o un terminal de confianza con Java JDK instalado), abre el directorio del repositorio y ejecuta:

```bash
mkdir -p .local-signing
keytool -genkeypair \
  -keystore .local-signing/nottas-release.jks \
  -storetype PKCS12 \
  -alias nottas-release \
  -keyalg RSA -keysize 3072 -validity 10000
```

Crea una contraseña fuerte e introduce los datos del certificado cuando se soliciten. En PKCS12, habitualmente la contraseña de la clave es la misma que la del almacén.

La carpeta `.local-signing/` está incluida en `.gitignore`. **No ejecutes `git add -f` sobre ella.**

Descarga `nottas-release.jks` desde el explorador de archivos de Codespaces (clic derecho → Download) y guarda una copia de seguridad privada, junto con la contraseña y el alias. No la adjuntes a un issue, chat público ni Release.

## 2. Configurar los cuatro secretos

Abre [Nottas → Settings → Secrets and variables → Actions](https://github.com/barccelo/nottas/settings/secrets/actions) y utiliza **New repository secret** para crear exactamente:

| Nombre | Valor |
|---|---|
| `NOTTAS_KEYSTORE_BASE64` | El contenido Base64 de la clave nueva |
| `NOTTAS_KEYSTORE_PASSWORD` | La contraseña elegida |
| `NOTTAS_KEY_ALIAS` | `nottas-release` |
| `NOTTAS_KEY_PASSWORD` | La contraseña de la clave (normalmente la misma de PKCS12) |

Para obtener el Base64, ejecuta en el mismo terminal:

```bash
base64 -w 0 .local-signing/nottas-release.jks
```

Copia **toda** la salida, sin espacios adicionales, en el secreto `NOTTAS_KEYSTORE_BASE64`. Nunca compartas ese texto en conversaciones ni lo subas a GitHub como archivo.

## 3. Publicar y comprobar la APK

Una vez guardados los cuatro secretos, entra en [Actions → Build Nottas Android APK](https://github.com/barccelo/nottas/actions/workflows/bootstrap.yml), selecciona **Run workflow** en la rama `main` y comprueba que la ejecución termina correctamente.

El flujo **falla antes de publicar** si falta cualquiera de los secretos, si el Base64 es inválido, si la clave no abre o si falla la verificación de `apksigner`. La Release nueva incluirá solamente la APK firmada. También se publica al enviar una nueva versión a `main`; hay que incrementar `versionName` y `versionCode`.

La huella SHA-256 del certificado puede consultarse en el paso de firma (`apksigner verify --print-certs`). Conviene guardarla como referencia para futuras versiones.

## Compilaciones locales

`gradle :app:assembleDebug` utiliza la firma local estándar de Android, que no sirve para actualizar una Release. `gradle :app:assembleRelease` genera una APK sin firmar; solo el workflow, mediante secretos, produce la APK pública definitiva.
