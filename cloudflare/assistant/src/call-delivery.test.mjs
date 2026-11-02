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

function fixture({ candidates = [], devices = {}, fcmStatuses = {}, actor = "boss", proposals = [] } = {}) {
  const statements = [];
  const requests = [];
  const db = {
    prepare(sql) {
      return {
        async run() { statements.push({sql,params:[]});return {meta:{changes:1}}; },
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
              if (sql.includes("FROM assistant_calls WHERE id=?")) return {id:"call-1",workspace_id:"ws",from_user_id:"boss",to_user_id:"assistant-new",status:"sent"};
              if (sql.includes("SELECT kind,owner_user_id FROM workspaces WHERE id=?")) return {kind:"assistant",owner_user_id:"boss"};
              if (sql.includes("FROM assistant_messages WHERE id=?")) return {from_user_id:"boss",to_user_id:"assistant-new"};
              if (sql.includes("SELECT updated_at FROM devices WHERE id=?")) return (devices[actor]||[]).length ? {updated_at:700} : null;
              if (sql.includes("SELECT kind FROM workspaces WHERE id=? AND owner_user_id=?")) return { kind: "assistant" };
              if (sql.includes("SELECT w.owner_user_id AS user_id")) return { user_id: "boss" };
              return null;
            },
            async all() {
              if (sql.includes("MAX(d.updated_at) AS last_push_at")) return { results: candidates };
              if (sql.includes("SELECT id,fcm_token FROM devices")) return { results: devices[params[0]] || [] };
              if (sql.includes("SELECT user_id FROM workspace_members")) return { results: [] };
              if (sql.includes("json_extract(payload_json")) return { results: proposals.filter(p=>p.approvalStatus==="proposed").map(p=>({ id:p.id, payload_json:JSON.stringify(p), updated_at:p.updatedAt||0 })) };
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

test("assistant notice reaches workspace owner only and confirms FCM acceptance", async () => {
  const f = fixture({
    actor: "assistant-new",
    devices: { boss: [{ id: "boss-phone", fcm_token: "boss-token" }] }
  });
  try {
    const response = await worker.fetch(call({ message: "Hay alguien que quiere verte" }, "/v1/workspaces/ws/notice"), f.env);
    const json = await response.json();
    assert.equal(response.status, 201);
    assert.equal(json.pushAccepted, true);
    const request = f.requests.find(r => r.url.includes("fcm.googleapis.com"));
    assert.ok(request);
    const message = JSON.parse(request.body).message;
    assert.equal(message.token, "boss-token");
    assert.equal(message.data.type, "assistant_notice");
    assert.equal(message.data.message, "Hay alguien que quiere verte");
  } finally { f.restore(); }
});

test("only workspace assistants can send boss notices", async () => {
  const f = fixture({ actor: "boss", devices: { boss: [{ id: "own-phone", fcm_token: "boss-token" }] } });
  try {
    const response = await worker.fetch(call({ message: "No autorizado" }, "/v1/workspaces/ws/notice"), f.env);
    assert.equal(response.status, 403);
    assert.equal(f.requests.filter(r => r.url.includes("fcm.googleapis.com")).length, 0);
  } finally { f.restore(); }
});

test("notices reject empty messages and never claim FCM failures are delivered", async () => {
  const f = fixture({ actor: "assistant-new", devices: { boss: [{ id: "boss-phone", fcm_token: "blocked" }] }, fcmStatuses: { blocked: 401 } });
  try {
    const invalid = await worker.fetch(call({ message: "  " }, "/v1/workspaces/ws/notice"), f.env);
    assert.equal(invalid.status, 400);
    const blocked = await worker.fetch(call({ message: "Por favor llama a recepción" }, "/v1/workspaces/ws/notice"), f.env);
    assert.equal(blocked.status, 502);
    assert.equal((await blocked.json()).error, "notice_not_delivered");
  } finally { f.restore(); }
});

test("director sees durable pending proposals from D1 and never approved tasks", async () => {
  const f = fixture({ actor:"boss", proposals:[
    {id:"task-1",text:"Reunión de las 12",approvalStatus:"proposed",dueDate:"2026-10-28",dueTime:"12:00",updatedAt:123},
    {id:"task-2",text:"Consulta",approvalStatus:"confirmed",dueDate:"2026-10-29",updatedAt:99}
  ] });
  try {
    const request = new Request("https://example.invalid/v1/workspaces/ws/pending-proposals", {
      headers:{ Authorization:"Bearer test-session" }
    });
    const response = await worker.fetch(request,f.env);
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.pending.length,1);
    assert.equal(body.pending[0].id,"task-1");
    assert.equal(body.pending[0].dueTime,"12:00");
  } finally { f.restore(); }
});

test("assistant cannot read director's approval inbox", async () => {
  const f=fixture({actor:"assistant-new"});
  try{
    const response=await worker.fetch(new Request("https://example.invalid/v1/workspaces/ws/pending-proposals",{
      headers:{Authorization:"Bearer test-session"}
    }),f.env);
    assert.equal(response.status,403);
  }finally{f.restore()}
});

test("assistant to director call reply uses the same invalid-token cleanup as director to assistant calls", async()=>{
  const f=fixture({
    actor:"assistant-new",
    devices:{boss:[
      {id:"boss-old",fcm_token:"stale-boss"},
      {id:"boss-current",fcm_token:"valid-boss"}
    ]},
    fcmStatuses:{"stale-boss":404}
  });
  try{
    const response=await worker.fetch(call({response:"coming"},"/v1/calls/call-1/respond"),f.env);
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.pushAccepted,true);
    assert.equal(body.acceptedDevices,1);
    const deliveries=f.requests.filter(x=>x.url.includes("fcm.googleapis.com"))
      .map(x=>JSON.parse(x.body).message);
    assert.deepEqual(new Set(deliveries.map(x=>x.token)),new Set(["stale-boss","valid-boss"]));
    assert.ok(f.statements.some(x=>x.sql.includes("UPDATE devices SET fcm_token=NULL")&&x.params[0]==="boss-old"));
  }finally{f.restore()}
});

test("assistant reply message is persisted and targeted to the director registered phone",async()=>{
  const f=fixture({actor:"assistant-new",devices:{boss:[{id:"boss-current",fcm_token:"boss-token"}]}});
  try{
    const response=await worker.fetch(call({message:"He recibido la llamada",replyToId:"prior-notice"},
      "/v1/workspaces/ws/messages"),f.env);
    assert.equal(response.status,201);
    const body=await response.json();
    assert.equal(body.recipientUserId,"boss");
    assert.equal(body.pushAccepted,true);
    assert.equal(body.acceptedDevices,1);
    assert.ok(f.requests.some(x=>x.url.includes("fcm.googleapis.com")&&
      JSON.parse(x.body).message.token==="boss-token"));
  }finally{f.restore()}
});

test("self push-status reports current registered session without exposing Firebase token",async()=>{
  const f=fixture({actor:"boss",devices:{boss:[{id:"boss-current",fcm_token:"private-token"}]}});
  try{
    const response=await worker.fetch(new Request("https://example.invalid/v1/devices/push-status",
      {headers:{Authorization:"Bearer test-session"}}),f.env);
    assert.equal(response.status,200);
    const info=await response.json();
    assert.equal(info.registered,true);
    assert.equal(info.updatedAt,700);
    assert.equal(JSON.stringify(info).includes("private-token"),false);
  }finally{f.restore()}
});
