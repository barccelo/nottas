import { test, before } from "node:test";
import assert from "node:assert/strict";
import { webcrypto, generateKeyPairSync } from "node:crypto";
import worker from "./index.js";

globalThis.crypto ??= webcrypto;
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const envConfig = {
  FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({
    project_id: "mock-project",
    client_email: "test@example.invalid",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
  })
};

function fixture({ candidates = [], devices = {}, fcmStatuses = {}, actor = "boss" } = {}) {
  const statements = [];
  const requests = [];
  const db = {
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              if (sql.includes("FROM sessions s JOIN users")) return { user_id: actor, device_id: "device-boss", display_name: "Jefe" };
              if (sql.includes("FROM workspace_members WHERE workspace_id=? AND user_id=?")) {
                if (params[1] === "boss") return { role: "owner", status: "active" };
                if (params[1].startsWith("assistant")) return { role: "assistant", status: "active" };
                return null;
              }
              if (sql.includes("SELECT name FROM workspaces")) return { name: "Oficina" };
              return null;
            },
            async all() {
              if (sql.includes("MAX(d.updated_at) AS last_push_at")) return { results: candidates };
              if (sql.includes("SELECT id,fcm_token FROM devices")) return { results: devices[params[0]] || [] };
              if (sql.includes("SELECT user_id FROM workspace_members")) return { results: [] };
              return { results: [] };
            },
            async run() {
              statements.push({ sql, params });
              return { meta: { changes: 1 } };
            }
          };
        }
      };
    }
  };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), body: String(options.body || "") });
    if (String(url).includes("oauth2.googleapis.com/token")) return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    if (String(url).includes("fcm.googleapis.com")) {
      const fcmToken = JSON.parse(options.body).message.token;
      return new Response(JSON.stringify({ ok: true }), { status: fcmStatuses[fcmToken] || 200 });
    }
    throw new Error("Unexpected external fetch " + url);
  };
  return {
    env: { ...envConfig, DB: db },
    statements,
    requests,
    restore() { globalThis.fetch = previousFetch; }
  };
}

function call(body = {}, path = "/v1/workspaces/ws/call") {
  return new Request("https://example.invalid" + path, {
    method: "POST",
    headers: { Authorization: "Bearer test-session", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("call targets assistant with newest registered FCM device", async () => {
  const f = fixture({
    candidates: [
      { user_id: "assistant-new", display_name: "David", last_push_at: 200 },
      { user_id: "assistant-old", display_name: "David", last_push_at: null }
    ],
    devices: { "assistant-new": [{ id: "fresh-device", fcm_token: "fresh" }] }
  });
  try {
    const response = await worker.fetch(call(), f.env);
    const result = await response.json();
    assert.equal(response.status, 201);
    assert.equal(result.call.toUserId, "assistant-new");
    assert.equal(result.pushAccepted, true);
    assert.equal(f.requests.filter(x => x.url.includes("fcm.googleapis.com")).length, 1);
  } finally { f.restore(); }
});

test("no push means an actionable error, never a fake sent success", async () => {
  const f = fixture({ candidates: [{ user_id: "assistant-old", display_name: "David", last_push_at: null }] });
  try {
    const response = await worker.fetch(call(), f.env);
    assert.equal(response.status, 409);
    const result = await response.json();
    assert.equal(result.error, "assistant_push_not_registered");
    assert.equal(f.statements.some(x => x.sql.includes("INSERT INTO assistant_calls")), false);
  } finally { f.restore(); }
});

test("FCM rejection marks call failed and reports delivery error", async () => {
  const f = fixture({
    candidates: [{ user_id: "assistant-new", display_name: "David", last_push_at: 400 }],
    devices: { "assistant-new": [{ id: "fresh-device", fcm_token: "rejected" }] },
    fcmStatuses: { rejected: 401 }
  });
  try {
    const response = await worker.fetch(call(), f.env);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, "assistant_push_delivery_failed");
    assert.ok(f.statements.some(x => x.sql.includes("UPDATE assistant_calls SET status='failed'")));
  } finally { f.restore(); }
});

test("invalid old FCM token can fall back to rejoined assistant", async () => {
  const f = fixture({
    candidates: [
      { user_id: "assistant-old", display_name: "David", last_push_at: 500 },
      { user_id: "assistant-new", display_name: "David", last_push_at: 400 }
    ],
    devices: {
      "assistant-old": [{ id: "old-device", fcm_token: "stale" }],
      "assistant-new": [{ id: "new-device", fcm_token: "fresh" }]
    },
    fcmStatuses: { stale: 404 }
  });
  try {
    const response = await worker.fetch(call(), f.env);
    const result = await response.json();
    assert.equal(response.status, 201);
    assert.equal(result.call.toUserId, "assistant-new");
    assert.ok(f.statements.some(x => x.sql.includes("UPDATE devices SET fcm_token=NULL")));
    assert.ok(f.statements.some(x => x.sql.includes("UPDATE assistant_calls SET to_user_id")));
  } finally { f.restore(); }
});

test("owner can revoke stale assistant membership without deleting content", async () => {
  const f = fixture();
  try {
    const response = await worker.fetch(call({}, "/v1/workspaces/ws/members/assistant-old/remove"), f.env);
    assert.equal(response.status, 200);
    assert.ok(f.statements.some(x => x.sql.includes("UPDATE workspace_members SET status='inactive'")));
    assert.equal(f.statements.some(x => x.sql.includes("DELETE FROM items") || x.sql.includes("DELETE FROM users")), false);
  } finally { f.restore(); }
});
