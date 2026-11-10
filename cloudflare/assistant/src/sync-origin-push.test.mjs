import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto, generateKeyPairSync } from "node:crypto";
import worker from "./index.js";

globalThis.crypto ??= webcrypto;

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const credentials = JSON.stringify({
  project_id: "sync-test",
  client_email: "fcm@example.invalid",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
});

function fixture({ kind = "personal", entityType = "note", deleting = false } = {}) {
  const events = [], realtimeEvents = [];
  const actor = "owner";
  const participants = kind === "personal" ? [actor] : [actor, "assistant"];
  const now = Date.now();
  const previous = deleting
    ? { id: "item-1", rev: 1, updatedAt: now - 2000, title: "Prueba", text: "Prueba" }
    : null;
  const db = {
    prepare(sql) {
      const exec = (...params) => ({
        async first() {
          if (sql.includes("FROM sessions s JOIN users")) {
            return { user_id: actor, device_id: "web-session", display_name: "Owner" };
          }
          if (sql.includes("SELECT payload_json,rev,updated_at,deleted_at FROM items")) {
            return previous
              ? { payload_json: JSON.stringify(previous), rev: 1, updated_at: previous.updatedAt, deleted_at: null }
              : null;
          }
          if (sql.includes("INSERT INTO changes(")) return { seq: 50 };
          if (sql.includes("MAX(seq)")) return { seq: 50 };
          if (sql.includes("SELECT kind,owner_user_id FROM workspaces")) {
            return { kind, owner_user_id: actor };
          }
          return null;
        },
        async all() {
          if (sql.includes("SELECT workspace_id,role FROM workspace_members")) {
            return { results: [{ workspace_id: "workspace-1", role: "owner" }] };
          }
          if (sql.includes("SELECT user_id FROM workspace_members")) {
            // Model the actor filter faithfully. This is the exact regression:
            // an actor-only personal workspace became a zero-recipient push.
            const users = sql.includes("user_id<>?")
              ? participants.filter(user => user !== params[1])
              : participants;
            return { results: users.map(user_id => ({ user_id })) };
          }
          if (sql.includes("SELECT id,fcm_token FROM devices")) {
            return { results: [{ id: params[0] + "-phone", fcm_token: params[0] + "-token" }] };
          }
          if (sql.includes("SELECT m.user_id,w.id AS workspace_id")) return { results: [] };
          return { results: [] };
        },
        async run() { return { meta: { changes: 1 } }; }
      });
      return { first: () => exec().first(), all: () => exec().all(), bind: (...params) => exec(...params) };
    }
  };

  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address.includes("oauth2.googleapis.com/token")) {
      return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), { status: 200 });
    }
    if (address.includes("fcm.googleapis.com")) {
      const message = JSON.parse(options.body).message;
      events.push({ token: message.token, data: message.data });
      return new Response(JSON.stringify({ name: "mock-message-id" }), { status: 200 });
    }
    throw new Error("Unexpected outbound request: " + address);
  };

  const payload = { id: "item-1", workspaceId: "workspace-1", updatedAt: now,
    rev: deleting ? 2 : 1,
    ...(entityType === "note" ? { title: "Prueba", body: "Texto" } : { text: "Prueba", dueDate: "", dueTime: "", reminders: [] }),
    ...(deleting ? { deletedAt: now } : {})
  };
  const request = new Request("https://example.invalid/v1/sync", {
    method: "POST",
    headers: { authorization: "Bearer session", "content-type": "application/json" },
    body: JSON.stringify({ changes: [{
      workspaceId: "workspace-1", entityType, entityId: payload.id,
      payload, rev: payload.rev, updatedAt: now, ...(deleting ? { deletedAt: now } : {})
    }] })
  });
  return { env: { DB: db, FCM_SERVICE_ACCOUNT_JSON: credentials,
    SYNC_HUB: { idFromName: userId => userId, get: userId => ({ fetch: async request => {
      realtimeEvents.push({ userId, path: new URL(request.url).pathname });
      return new Response(null, { status: 204 });
    } }) }
  },
    request, events, realtimeEvents, participants, restore: () => { globalThis.fetch = previousFetch; } };
}

for (const kind of ["personal", "assistant"]) {
  for (const deleting of [false, true]) {
    test(`sync notifies the author's Android for ${kind} ${deleting ? "delete" : "create"}`, async () => {
      const f = fixture({ kind, entityType: deleting ? "task" : "note", deleting });
      try {
        const response = await worker.fetch(f.request, f.env);
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data.accepted.length, 1);
        assert.equal(data.accepted[0].payload.deletedAt != null, deleting);
        assert.equal(data.pushDelivery.length, 1);
        assert.equal(data.pushDelivery[0].recipients, f.participants.length);
        assert.equal(data.pushDelivery[0].accepted, f.participants.length);
        const notifications = f.events.filter(event => event.data.type === "sync");
        assert.equal(notifications.length, f.participants.length);
        assert.deepEqual(new Set(notifications.map(event => event.token)),
          new Set(f.participants.map(user => user + "-token")));
        assert.ok(notifications.every(event => event.data.workspaceId === "workspace-1"));
        assert.equal(f.realtimeEvents.length, f.participants.length);
        assert.deepEqual(new Set(f.realtimeEvents.map(e => e.userId)), new Set(f.participants));
        assert.ok(f.realtimeEvents.every(e => e.path === "/notify"));
      } finally {
        f.restore();
      }
    });
  }
}
