# Nottas Assistant backend

Cloudflare Worker + D1 backend for the shared **Assistant** workspace.

## What it provides

- Pilot device/session authentication.
- Personal and shared Assistant workspaces.
- Owner / assistant membership roles.
- Incremental task and note sync using a monotonically increasing change cursor.
- Workspace invite codes.
- FCM device registration.
- Assistant call delivery and call responses.
- Push-driven sync notifications; no background polling is required.

## Setup

1. Create a D1 database named `nottas-assistant`.
2. Put its id in `wrangler.toml`.
3. Apply `schema.sql` to the database.
4. Create a Firebase project for the Android app.
5. Add the Firebase service-account JSON as a Worker secret named `FCM_SERVICE_ACCOUNT_JSON`.
6. Deploy this directory with Wrangler.
7. In Nottas > Assistant settings, enter the deployed Worker URL and the public Android Firebase configuration.

The Android client initializes Firebase at runtime, so this repository does not require a committed `google-services.json`.

## Authentication note

The first testing build uses a random bearer session bound to a device. This is intentionally a pilot bootstrap layer. The API routes, workspace ids, membership checks and sync model are independent from it so passkeys/WebAuthn can replace the login bootstrap later without migrating collaborative data.

## FCM

The Worker uses the FCM HTTP v1 API. Set the complete Firebase service account JSON as a secret:

```
wrangler secret put FCM_SERVICE_ACCOUNT_JSON
```

The service account needs permission to send Firebase Cloud Messaging messages.


## Pilot deployment

From `cloudflare/assistant`:

1. Create the D1 database:

   ```bash
   npx wrangler d1 create nottas-assistant
   ```

2. Copy the returned database id into `wrangler.toml`.

3. Apply the schema:

   ```bash
   npx wrangler d1 execute nottas-assistant --remote --file=schema.sql
   ```

4. In Firebase, register an Android app using package name `com.nottas.app`. The Android app does not need a committed `google-services.json`; Nottas accepts the public Firebase Project ID, Sender ID, App ID and API key from Settings > Assistant.

5. Download a Firebase service-account JSON that can send FCM messages, then store it only in Cloudflare:

   ```bash
   cat firebase-service-account.json | npx wrangler secret put FCM_SERVICE_ACCOUNT_JSON
   ```

6. Deploy:

   ```bash
   npx wrangler deploy
   ```

7. Copy the resulting `https://...workers.dev` URL into Nottas > Settings > Assistant on both phones.

## Two-phone test

### Phone A — boss

1. Open Settings > Assistant.
2. Enter the Worker URL and the boss display name.
3. Tap **Registrar dispositivo**.
4. Create an Assistant workspace.
5. Copy the invite code.
6. Enter the four public Firebase Android values and tap **Configurar push**.
7. Use **Probar llamada en este teléfono** first to verify the full-screen call UI locally.

### Phone B — assistant

1. Open Settings > Assistant.
2. Enter the same Worker URL and the assistant display name.
3. Tap **Registrar dispositivo**.
4. Enter the invite code from Phone A and tap **Unirme**.
5. Enter the same public Firebase Android values and tap **Configurar push**.

### Collaboration checks

- On Phone B, switch from Personal to the shared Assistant workspace and create a dated task. It should be marked **Propuesta**.
- Phone A receives a push telling it there are shared changes. Opening Nottas pulls the delta; no background polling is used.
- On Phone A, open the proposed task and test **Aprobar**, **Posponer** and **Rechazar**.
- If Phone B changes the date/time of an already confirmed item, the Worker forces it back to **Propuesta**.
- Notes and custom categories created in the shared workspace synchronize only inside that workspace.
- From Phone A, use the green call button in the Assistant workspace. Phone B should receive the full-screen call UI with **Voy**, **En 5 min** and **No disponible**.
- The response is pushed back to Phone A.
- Settings > Assistant shows connected members and recent activity.

## Isolation checks

Personal and Assistant data use different workspace ids. During testing, verify that:

- personal tasks/notes do not appear in the Assistant workspace;
- custom personal categories do not appear in the Assistant workspace;
- shared tasks/notes/categories do not appear in Personal;
- an assistant cannot approve their own proposed scheduling change;
- only the workspace owner can use the remote **Llamar al asistente** endpoint.

## Current pilot limitation

Registration currently creates a random bearer session bound to the device. This is suitable for initial two-device testing but is not the intended production authentication. Passkeys/WebAuthn should replace only this bootstrap step; the D1 user/workspace/member/sync model is already designed so that collaborative data does not need to be migrated when authentication is upgraded.
