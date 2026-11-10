import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker, { SyncHub } from "./index.js";

globalThis.crypto ??= webcrypto;

const origin = "https://nottas-web-preview.losrobles.workers.dev";
const token = "T".repeat(43);
function request({ currentOrigin = origin, session = token, upgrade = true } = {}) {
  const headers = { Origin: currentOrigin };
  if (upgrade) headers.Upgrade = "websocket";
  headers["Sec-WebSocket-Protocol"] = "nottas-sync-v1, nottas-token." + session;
  return new Request("https://example.invalid/v1/realtime", { headers });
}
function fixture({ authorized = true } = {}) {
  const delivered = [], lookups = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              if (sql.includes("FROM sessions s JOIN users")) {
                return authorized ? { user_id: "owner", device_id: "phone", display_name: "Owner" } : null;
              }
              return null;
            },
            async run() { return { meta: { changes: 1 } }; }
          };
        }
      };
    }
  };
  return {
    env: { DB,
      SYNC_HUB: { idFromName: userId => { lookups.push(userId); return userId; },
        get: () => ({ fetch: async req => {
          delivered.push({ path: new URL(req.url).pathname, protocol: req.headers.get("Sec-WebSocket-Protocol") });
          return new Response(null, { status: 200 });
        } }) }
    },
    delivered, lookups
  };
}

test("realtime requires same-origin browser and upgrade", async () => {
  const f = fixture();
  assert.equal((await worker.fetch(request({ currentOrigin: "https://evil.invalid" }), f.env)).status, 403);
  assert.equal((await worker.fetch(request({ upgrade: false }), f.env)).status, 426);
  assert.deepEqual(f.lookups, []);
});

test("realtime requires authenticated session and does not pass token to hub", async () => {
  const f = fixture();
  assert.equal((await worker.fetch(request({ session: "invalid" }), f.env)).status, 401);
  assert.equal((await worker.fetch(request(), fixture({ authorized: false }).env)).status, 401);
  const res = await worker.fetch(request(), f.env);
  assert.equal(res.status, 200);
  assert.deepEqual(f.lookups, ["owner"]);
  assert.deepEqual(f.delivered, [{ path: "/connect", protocol: "nottas-sync-v1" }]);
});

test("hub broadcasts content-free invalidation signal only on write event", async () => {
  const frames = [];
  const hub = new SyncHub({ getWebSockets: () => [
    { send: frame => frames.push(frame) }, { send: frame => frames.push(frame) }
  ] });
  assert.equal((await hub.fetch(new Request("https://internal/notify", { method: "POST" }))).status, 204);
  assert.deepEqual(frames.map(x => JSON.parse(x)), [{ type: "sync" }, { type: "sync" }]);
});
