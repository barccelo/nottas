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
