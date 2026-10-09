let cachedGoogleToken = null;
let cachedGoogleTokenUntil = 0;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    try {
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return json({ error: "server_error", message: String(error?.message || error) }, 500);
    }
  }
};

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/health" && request.method === "GET") {
    return json({ ok: true, service: "nottas-assistant", env: env.APP_ENV || "unknown" });
  }

  if (path === "/v1/auth/register" && request.method === "POST") {
    return register(request, env);
  }

  const auth = await authenticate(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);

  if (path === "/v1/me" && request.method === "GET") return me(auth, env);
  if (path === "/v1/workspaces" && request.method === "GET") return listWorkspaces(auth, env);
  if (path === "/v1/workspaces" && request.method === "POST") return createWorkspace(request, auth, env);
  if (path === "/v1/workspaces/join" && request.method === "POST") return joinWorkspace(request, auth, env);
  if (path === "/v1/devices/push-token" && request.method === "POST") return registerPushToken(request, auth, env);
  if (path === "/v1/sync" && request.method === "GET") return pullSync(url, auth, env);
  if (path === "/v1/sync" && request.method === "POST") return pushSync(request, auth, env);
  if (path === "/v1/calls/pending" && request.method === "GET") return pendingCalls(auth, env);

  const activityWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/activity$/);
  if (activityWorkspace && request.method === "GET") {
    return workspaceActivity(decodeURIComponent(activityWorkspace[1]), auth, env);
  }

  const availabilityWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/availability$/);
  if (availabilityWorkspace && request.method === "GET") {
    return workspaceAvailability(url, decodeURIComponent(availabilityWorkspace[1]), auth, env);
  }

  const callWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/call$/);
  if (callWorkspace && request.method === "POST") {
    return createAssistantCall(request, decodeURIComponent(callWorkspace[1]), auth, env);
  }

  const callResponse = path.match(/^\/v1\/calls\/([^/]+)\/respond$/);
  if (callResponse && request.method === "POST") {
    return respondAssistantCall(request, decodeURIComponent(callResponse[1]), auth, env);
  }

  return json({ error: "not_found" }, 404);
}

async function register(request, env) {
  const body = await bodyJson(request);
  const displayName = textValue(body.displayName, 80);
  const deviceId = textValue(body.deviceId, 120);
  const deviceLabel = textValue(body.deviceLabel || "Android", 80);
  if (!displayName || !deviceId) return json({ error: "display_name_and_device_id_required" }, 400);

  const now = Date.now();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const token = randomToken();
  const tokenHash = await sha256(token);

  await env.DB.batch([
    env.DB.prepare("INSERT INTO users(id, display_name, created_at) VALUES(?,?,?)")
      .bind(userId, displayName, now),
    env.DB.prepare("INSERT INTO workspaces(id, name, kind, owner_user_id, invite_code, created_at, updated_at) VALUES(?,?,?,?,NULL,?,?)")
      .bind(workspaceId, "Personal", "personal", userId, now, now),
    env.DB.prepare("INSERT INTO workspace_members(workspace_id, user_id, role, status, joined_at) VALUES(?,?,?,?,?)")
      .bind(workspaceId, userId, "owner", "active", now),
    env.DB.prepare("INSERT INTO sessions(token_hash, user_id, device_id, created_at, last_seen_at) VALUES(?,?,?,?,?)")
      .bind(tokenHash, userId, deviceId, now, now),
    env.DB.prepare("INSERT INTO devices(id, user_id, label, platform, updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,label=excluded.label,updated_at=excluded.updated_at")
      .bind(deviceId, userId, deviceLabel, "android", now)
  ]);

  return json({
    user: { id: userId, displayName },
    sessionToken: token,
    personalWorkspace: { id: workspaceId, name: "Personal", kind: "personal", role: "owner" }
  }, 201);
}

async function authenticate(request, env) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const tokenHash = await sha256(match[1]);
  const row = await env.DB.prepare(
    "SELECT s.user_id, s.device_id, u.display_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?"
  ).bind(tokenHash).first();
  if (!row) return null;
  await env.DB.prepare("UPDATE sessions SET last_seen_at=? WHERE token_hash=?")
    .bind(Date.now(), tokenHash).run();
  return { userId: row.user_id, deviceId: row.device_id, displayName: row.display_name };
}

async function me(auth, env) {
  const workspaces = await workspaceRows(auth.userId, env);
  return json({
    user: { id: auth.userId, displayName: auth.displayName },
    deviceId: auth.deviceId,
    workspaces
  });
}

async function listWorkspaces(auth, env) {
  return json({ workspaces: await workspaceRows(auth.userId, env) });
}

async function workspaceRows(userId, env) {
  const result = await env.DB.prepare(
    "SELECT w.id,w.name,w.kind,w.owner_user_id,w.invite_code,w.updated_at,m.role,m.status " +
    "FROM workspace_members m JOIN workspaces w ON w.id=m.workspace_id " +
    "WHERE m.user_id=? AND m.status='active' ORDER BY CASE w.kind WHEN 'personal' THEN 0 ELSE 1 END,w.created_at"
  ).bind(userId).all();
  return (result.results || []).map(r => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    ownerUserId: r.owner_user_id,
    inviteCode: r.role === "owner" ? (r.invite_code || "") : "",
    role: r.role,
    status: r.status,
    updatedAt: r.updated_at
  }));
}

async function createWorkspace(request, auth, env) {
  const body = await bodyJson(request);
  const name = textValue(body.name || "Asistente", 100);
  if (!name) return json({ error: "name_required" }, 400);
  const now = Date.now();
  const id = crypto.randomUUID();
  const inviteCode = randomInviteCode();

  await env.DB.batch([
    env.DB.prepare("INSERT INTO workspaces(id,name,kind,owner_user_id,invite_code,created_at,updated_at) VALUES(?,?,?,?,?,?,?)")
      .bind(id, name, "assistant", auth.userId, inviteCode, now, now),
    env.DB.prepare("INSERT INTO workspace_members(workspace_id,user_id,role,status,joined_at) VALUES(?,?,?,?,?)")
      .bind(id, auth.userId, "owner", "active", now)
  ]);
  return json({ workspace: { id, name, kind: "assistant", role: "owner", inviteCode } }, 201);
}

async function joinWorkspace(request, auth, env) {
  const body = await bodyJson(request);
  const inviteCode = textValue(body.inviteCode, 32).toUpperCase();
  if (!inviteCode) return json({ error: "invite_code_required" }, 400);
  const workspace = await env.DB.prepare(
    "SELECT id,name,kind,owner_user_id FROM workspaces WHERE invite_code=? AND kind='assistant'"
  ).bind(inviteCode).first();
  if (!workspace) return json({ error: "invalid_invite_code" }, 404);
  if (workspace.owner_user_id === auth.userId) return json({ error: "owner_cannot_join_as_assistant" }, 409);

  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO workspace_members(workspace_id,user_id,role,status,joined_at) VALUES(?,?,?,?,?) " +
    "ON CONFLICT(workspace_id,user_id) DO UPDATE SET role='assistant',status='active'"
  ).bind(workspace.id, auth.userId, "assistant", "active", now).run();

  await env.DB.prepare("UPDATE workspaces SET updated_at=? WHERE id=?").bind(now, workspace.id).run();
  await pushWorkspaceSync(workspace.id, auth.userId, env);
  return json({ workspace: { id: workspace.id, name: workspace.name, kind: workspace.kind, role: "assistant" } });
}

async function registerPushToken(request, auth, env) {
  const body = await bodyJson(request);
  const fcmToken = textValue(body.fcmToken, 4096);
  const label = textValue(body.deviceLabel || "Android", 80);
  if (!fcmToken) return json({ error: "fcm_token_required" }, 400);
  await env.DB.prepare(
    "INSERT INTO devices(id,user_id,label,fcm_token,platform,updated_at) VALUES(?,?,?,?,?,?) " +
    "ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,label=excluded.label,fcm_token=excluded.fcm_token,platform=excluded.platform,updated_at=excluded.updated_at"
  ).bind(auth.deviceId, auth.userId, label, fcmToken, "android", Date.now()).run();
  return json({ ok: true });
}

async function pullSync(url, auth, env) {
  const since = Math.max(0, Number(url.searchParams.get("since") || 0) || 0);
  const full = url.searchParams.get("full") === "1";
  const memberships = await memberWorkspaceIds(auth.userId, env);
  if (!memberships.size) return json({ cursor: since, changes: [], workspaces: [] });

  const latest = await env.DB.prepare("SELECT COALESCE(MAX(seq),0) AS seq FROM changes").first();
  const latestCursor = Number(latest?.seq || 0);

  if (full) {
    const items = await env.DB.prepare(
      "SELECT id,workspace_id,entity_type,payload_json,updated_at,updated_by FROM items WHERE deleted_at IS NULL ORDER BY updated_at ASC LIMIT 5000"
    ).all();
    const snapshot = [];
    for (const row of (items.results || [])) {
      if (!memberships.has(row.workspace_id)) continue;
      snapshot.push({
        seq: 0,
        workspaceId: row.workspace_id,
        entityType: row.entity_type,
        entityId: row.id,
        op: "snapshot",
        payload: safeJson(row.payload_json, {}),
        createdAt: row.updated_at,
        actorUserId: row.updated_by
      });
    }
    return json({ cursor: latestCursor, changes: snapshot, workspaces: await workspaceRows(auth.userId, env), full: true });
  }

  const result = await env.DB.prepare(
    "SELECT seq,workspace_id,entity_type,entity_id,op,payload_json,created_at,actor_user_id FROM changes WHERE seq>? ORDER BY seq ASC LIMIT 500"
  ).bind(since).all();
  let cursor = since;
  const changes = [];
  for (const row of (result.results || [])) {
    cursor = Math.max(cursor, Number(row.seq) || cursor);
    if (!memberships.has(row.workspace_id)) continue;
    changes.push({
      seq: row.seq,
      workspaceId: row.workspace_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      op: row.op,
      payload: safeJson(row.payload_json, {}),
      createdAt: row.created_at,
      actorUserId: row.actor_user_id
    });
  }
  if ((result.results || []).length < 500) cursor = Math.max(cursor, latestCursor);
  return json({ cursor, changes, workspaces: await workspaceRows(auth.userId, env) });
}

async function pushSync(request, auth, env) {
  const body = await bodyJson(request);
  const changes = Array.isArray(body.changes) ? body.changes.slice(0, 200) : [];
  const membershipRoles = await memberWorkspaceRoles(auth.userId, env);
  const memberships = new Set(membershipRoles.keys());
  const accepted = [];
  const conflicts = [];
  const touchedWorkspaces = new Set();

  for (const change of changes) {
    const workspaceId = textValue(change.workspaceId, 100);
    const entityType = change.entityType === "note" ? "note" : change.entityType === "task" ? "task" : change.entityType === "category" ? "category" : "";
    const entityId = textValue(change.entityId || change.payload?.id, 120);
    if (!workspaceId || !entityType || !entityId || !memberships.has(workspaceId)) continue;

    const payload = change.payload && typeof change.payload === "object" ? { ...change.payload } : {};
    payload.id = entityId;
    payload.workspaceId = workspaceId;
    payload.updatedBy = auth.userId;
    const incomingRev = Math.max(1, Number(change.rev || payload.rev || 1) || 1);
    const incomingUpdatedAt = Math.max(1, Number(change.updatedAt || payload.updatedAt || Date.now()) || Date.now());
    const deletedAt = change.deletedAt || payload.deletedAt || null;

    const current = await env.DB.prepare(
      "SELECT payload_json,rev,updated_at,deleted_at FROM items WHERE workspace_id=? AND entity_type=? AND id=?"
    ).bind(workspaceId, entityType, entityId).first();

    if (entityType === "task" && membershipRoles.get(workspaceId) === "assistant") {
      const currentPayload = current ? safeJson(current.payload_json, {}) : null;
      const currentStatus = currentPayload?.approvalStatus || "confirmed";
      const requestedStatus = payload.approvalStatus || currentStatus;
      const scheduleChanged = !!currentPayload && (
        String(currentPayload.dueDate || "") !== String(payload.dueDate || "") ||
        String(currentPayload.dueTime || "") !== String(payload.dueTime || "") ||
        String(currentPayload.endTime || "") !== String(payload.endTime || "")
      );
      if (!currentPayload) {
        payload.approvalStatus = "proposed";
        payload.requiresApproval = true;
      } else if (currentStatus === "confirmed" && scheduleChanged) {
        payload.approvalStatus = "proposed";
        payload.requiresApproval = true;
      } else if (["changes_requested", "rejected"].includes(currentStatus) && requestedStatus === "proposed") {
        payload.approvalStatus = "proposed";
        payload.requiresApproval = true;
      } else {
        payload.approvalStatus = currentStatus;
        payload.requiresApproval = currentStatus === "proposed" || currentStatus === "changes_requested";
      }
    }

    if (current && Number(current.updated_at) > incomingUpdatedAt && Number(current.rev) >= incomingRev) {
      conflicts.push({
        workspaceId, entityType, entityId,
        payload: safeJson(current.payload_json, {}),
        rev: current.rev, updatedAt: current.updated_at, deletedAt: current.deleted_at
      });
      continue;
    }

    const nextRev = current ? Math.max(Number(current.rev) + 1, incomingRev) : incomingRev;
    payload.rev = nextRev;
    payload.updatedAt = incomingUpdatedAt;
    payload.deletedAt = deletedAt;

    await env.DB.prepare(
      "INSERT INTO items(id,workspace_id,entity_type,payload_json,rev,updated_at,deleted_at,updated_by) VALUES(?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(workspace_id,entity_type,id) DO UPDATE SET payload_json=excluded.payload_json,rev=excluded.rev,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by"
    ).bind(entityId, workspaceId, entityType, JSON.stringify(payload), nextRev, incomingUpdatedAt, deletedAt, auth.userId).run();

    const op = deletedAt ? "delete" : (current ? "update" : "create");
    const inserted = await env.DB.prepare(
      "INSERT INTO changes(workspace_id,entity_type,entity_id,op,payload_json,created_at,actor_user_id) VALUES(?,?,?,?,?,?,?) RETURNING seq"
    ).bind(workspaceId, entityType, entityId, op, JSON.stringify(payload), Date.now(), auth.userId).first();
    accepted.push({ workspaceId, entityType, entityId, rev: nextRev, updatedAt: incomingUpdatedAt, seq: inserted?.seq || 0, payload });
    touchedWorkspaces.add(workspaceId);
  }

  for (const workspaceId of touchedWorkspaces) {
    await env.DB.prepare("UPDATE workspaces SET updated_at=? WHERE id=?").bind(Date.now(), workspaceId).run();
    const workspace = await env.DB.prepare("SELECT kind,owner_user_id FROM workspaces WHERE id=?").bind(workspaceId).first();
    if (workspace?.kind === "personal" && workspace.owner_user_id === auth.userId) {
      await pushAvailabilityChanged(auth.userId, env);
    } else {
      await pushWorkspaceSync(workspaceId, auth.userId, env);
    }
  }

  const latest = await env.DB.prepare("SELECT COALESCE(MAX(seq),0) AS seq FROM changes").first();
  return json({ ok: true, accepted, conflicts, cursor: Number(latest?.seq || 0) });
}

async function workspaceAvailability(url, workspaceId, auth, env) {
  const member = await membership(workspaceId, auth.userId, env);
  if (!member) return json({ error: "workspace_forbidden" }, 403);

  const workspace = await env.DB.prepare(
    "SELECT owner_user_id,kind FROM workspaces WHERE id=?"
  ).bind(workspaceId).first();
  if (!workspace || workspace.kind !== "assistant") return json({ error: "assistant_workspace_required" }, 400);

  const start = textValue(url.searchParams.get("start"), 10);
  const end = textValue(url.searchParams.get("end"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) {
    return json({ error: "valid_start_and_end_required" }, 400);
  }
  const startDate = new Date(start + "T12:00:00Z");
  const endDate = new Date(end + "T12:00:00Z");
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate - startDate > 31 * 86400000) {
    return json({ error: "availability_range_too_large" }, 400);
  }

  const personal = await env.DB.prepare(
    "SELECT id FROM workspaces WHERE owner_user_id=? AND kind='personal' ORDER BY created_at LIMIT 1"
  ).bind(workspace.owner_user_id).first();
  if (!personal) return json({ start, end, busy: [] });

  const result = await env.DB.prepare(
    "SELECT payload_json FROM items WHERE workspace_id=? AND entity_type='task' AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 5000"
  ).bind(personal.id).all();

  const busy = [];
  for (const row of (result.results || [])) {
    const payload = safeJson(row.payload_json, {});
    const date = String(payload.dueDate || "");
    const dueTime = String(payload.dueTime || "");
    if (payload.done || !dueTime || date < start || date > end) continue;
    const startMinute = timeMinutes(dueTime);
    if (startMinute === null) continue;
    let endMinute = timeMinutes(String(payload.endTime || ""));
    if (endMinute === null || endMinute <= startMinute) endMinute = Math.min(1439, startMinute + 60);
    busy.push({ date, start: minutesTime(startMinute), end: minutesTime(endMinute) });
  }
  busy.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  return json({ start, end, busy });
}

async function workspaceActivity(workspaceId, auth, env) {
  const member = await membership(workspaceId, auth.userId, env);
  if (!member) return json({ error: "workspace_forbidden" }, 403);

  const membersResult = await env.DB.prepare(
    "SELECT m.user_id,m.role,m.joined_at,u.display_name FROM workspace_members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=? AND m.status='active' ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END,m.joined_at"
  ).bind(workspaceId).all();

  const changesResult = await env.DB.prepare(
    "SELECT c.seq,c.entity_type,c.entity_id,c.op,c.payload_json,c.created_at,c.actor_user_id,u.display_name FROM changes c JOIN users u ON u.id=c.actor_user_id WHERE c.workspace_id=? ORDER BY c.seq DESC LIMIT 40"
  ).bind(workspaceId).all();

  const callsResult = await env.DB.prepare(
    "SELECT c.id,c.status,c.response,c.created_at,c.responded_at,fu.display_name AS from_name,tu.display_name AS to_name FROM assistant_calls c JOIN users fu ON fu.id=c.from_user_id JOIN users tu ON tu.id=c.to_user_id WHERE c.workspace_id=? ORDER BY c.created_at DESC LIMIT 20"
  ).bind(workspaceId).all();

  const activity = [];
  for (const row of (changesResult.results || [])) {
    const payload = safeJson(row.payload_json, {});
    activity.push({
      kind: "change",
      seq: row.seq,
      entityType: row.entity_type,
      entityId: row.entity_id,
      op: row.op,
      title: textValue(payload.text || payload.title || payload.name || row.entity_type, 140),
      actorUserId: row.actor_user_id,
      actorName: row.display_name,
      createdAt: row.created_at
    });
  }
  for (const row of (callsResult.results || [])) {
    activity.push({
      kind: "call",
      id: row.id,
      status: row.status,
      response: row.response || "",
      fromName: row.from_name,
      toName: row.to_name,
      createdAt: row.created_at,
      respondedAt: row.responded_at || null
    });
  }
  activity.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  return json({
    members: (membersResult.results || []).map(r => ({
      userId: r.user_id,
      displayName: r.display_name,
      role: r.role,
      joinedAt: r.joined_at
    })),
    activity: activity.slice(0, 50)
  });
}

async function createAssistantCall(request, workspaceId, auth, env) {
  const membership = await membership(workspaceId, auth.userId, env);
  if (!membership || membership.role !== "owner") return json({ error: "owner_required" }, 403);

  const body = await bodyJson(request);
  let toUserId = textValue(body.toUserId, 100);
  if (!toUserId) {
    const target = await env.DB.prepare(
      "SELECT user_id FROM workspace_members WHERE workspace_id=? AND role='assistant' AND status='active' ORDER BY joined_at LIMIT 1"
    ).bind(workspaceId).first();
    toUserId = target?.user_id || "";
  }
  if (!toUserId) return json({ error: "assistant_not_connected" }, 409);
  const targetMembership = await membership(workspaceId, toUserId, env);
  if (!targetMembership || targetMembership.role !== "assistant") return json({ error: "invalid_target" }, 400);

  const callId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO assistant_calls(id,workspace_id,from_user_id,to_user_id,status,created_at) VALUES(?,?,?,?,?,?)"
  ).bind(callId, workspaceId, auth.userId, toUserId, "sent", now).run();

  const workspace = await env.DB.prepare("SELECT name FROM workspaces WHERE id=?").bind(workspaceId).first();
  await sendPushToUser(toUserId, {
    type: "assistant_call",
    callId,
    workspaceId,
    workspaceName: workspace?.name || "Asistente",
    callerName: auth.displayName
  }, env);

  return json({ call: { id: callId, workspaceId, fromUserId: auth.userId, toUserId, status: "sent", createdAt: now } }, 201);
}

async function respondAssistantCall(request, callId, auth, env) {
  const body = await bodyJson(request);
  const response = ["coming", "five_min", "unavailable"].includes(body.response) ? body.response : "";
  if (!response) return json({ error: "invalid_response" }, 400);

  const call = await env.DB.prepare(
    "SELECT id,workspace_id,from_user_id,to_user_id,status FROM assistant_calls WHERE id=?"
  ).bind(callId).first();
  if (!call) return json({ error: "call_not_found" }, 404);
  if (call.to_user_id !== auth.userId) return json({ error: "not_call_target" }, 403);

  const now = Date.now();
  await env.DB.prepare(
    "UPDATE assistant_calls SET status='responded',response=?,responded_at=? WHERE id=?"
  ).bind(response, now, callId).run();

  await sendPushToUser(call.from_user_id, {
    type: "assistant_call_response",
    callId,
    workspaceId: call.workspace_id,
    response,
    fromName: auth.displayName
  }, env);

  return json({ ok: true, callId, response, respondedAt: now });
}

async function pendingCalls(auth, env) {
  const result = await env.DB.prepare(
    "SELECT c.id,c.workspace_id,c.from_user_id,c.to_user_id,c.status,c.response,c.created_at,u.display_name AS caller_name,w.name AS workspace_name " +
    "FROM assistant_calls c JOIN users u ON u.id=c.from_user_id JOIN workspaces w ON w.id=c.workspace_id " +
    "WHERE c.to_user_id=? AND c.status='sent' ORDER BY c.created_at DESC LIMIT 20"
  ).bind(auth.userId).all();
  return json({ calls: (result.results || []).map(r => ({
    id: r.id, workspaceId: r.workspace_id, fromUserId: r.from_user_id, toUserId: r.to_user_id,
    status: r.status, response: r.response, createdAt: r.created_at,
    callerName: r.caller_name, workspaceName: r.workspace_name
  })) });
}

async function membership(workspaceId, userId, env) {
  return env.DB.prepare(
    "SELECT role,status FROM workspace_members WHERE workspace_id=? AND user_id=? AND status='active'"
  ).bind(workspaceId, userId).first();
}

async function memberWorkspaceIds(userId, env) {
  const result = await env.DB.prepare(
    "SELECT workspace_id FROM workspace_members WHERE user_id=? AND status='active'"
  ).bind(userId).all();
  return new Set((result.results || []).map(r => r.workspace_id));
}

async function memberWorkspaceRoles(userId, env) {
  const result = await env.DB.prepare(
    "SELECT workspace_id,role FROM workspace_members WHERE user_id=? AND status='active'"
  ).bind(userId).all();
  return new Map((result.results || []).map(r => [r.workspace_id, r.role]));
}

async function pushAvailabilityChanged(ownerUserId, env) {
  const result = await env.DB.prepare(
    "SELECT m.user_id,w.id AS workspace_id FROM workspaces w JOIN workspace_members m ON m.workspace_id=w.id WHERE w.kind='assistant' AND w.owner_user_id=? AND m.role='assistant' AND m.status='active'"
  ).bind(ownerUserId).all();
  await Promise.all((result.results || []).map(r => sendPushToUser(r.user_id, {
    type: "availability_changed",
    workspaceId: r.workspace_id
  }, env)));
}

async function pushWorkspaceSync(workspaceId, actorUserId, env) {
  const result = await env.DB.prepare(
    "SELECT user_id FROM workspace_members WHERE workspace_id=? AND status='active' AND user_id<>?"
  ).bind(workspaceId, actorUserId).all();
  await Promise.all((result.results || []).map(r => sendPushToUser(r.user_id, {
    type: "sync",
    workspaceId,
    changedBy: actorUserId
  }, env)));
}

async function sendPushToUser(userId, data, env) {
  const devices = await env.DB.prepare(
    "SELECT fcm_token FROM devices WHERE user_id=? AND fcm_token IS NOT NULL AND fcm_token<>''"
  ).bind(userId).all();
  const tokens = (devices.results || []).map(r => r.fcm_token).filter(Boolean);
  if (!tokens.length) return;
  await Promise.all(tokens.map(token => sendFcm(token, data, env).catch(error => console.error("FCM", error))));
}

async function sendFcm(token, data, env) {
  if (!env.FCM_SERVICE_ACCOUNT_JSON) return;
  const serviceAccount = safeJson(env.FCM_SERVICE_ACCOUNT_JSON, null);
  if (!serviceAccount?.project_id || !serviceAccount?.client_email || !serviceAccount?.private_key) return;
  const accessToken = await googleAccessToken(serviceAccount);
  const stringData = {};
  for (const [key, value] of Object.entries(data || {})) stringData[key] = String(value ?? "");

  const response = await fetch(
    "https://fcm.googleapis.com/v1/projects/" + encodeURIComponent(serviceAccount.project_id) + "/messages:send",
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + accessToken,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: {
          token,
          data: stringData,
          android: { priority: "HIGH" }
        }
      })
    }
  );
  if (!response.ok) throw new Error("FCM " + response.status + ": " + (await response.text()));
}

async function googleAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedGoogleToken && cachedGoogleTokenUntil > now + 90) return cachedGoogleToken;

  const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
  const payload = base64UrlJson({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  });
  const signingInput = header + "." + payload;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  const assertion = signingInput + "." + base64UrlBytes(new Uint8Array(signature));

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  if (!tokenResponse.ok) throw new Error("Google OAuth " + tokenResponse.status + ": " + (await tokenResponse.text()));
  const tokenJson = await tokenResponse.json();
  cachedGoogleToken = tokenJson.access_token;
  cachedGoogleTokenUntil = now + Number(tokenJson.expires_in || 3600);
  return cachedGoogleToken;
}

function pemToArrayBuffer(pem) {
  const base64 = String(pem).replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlBytes(bytes);
}

function randomInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
}

async function bodyJson(request) {
  try { return await request.json(); } catch (_) { return {}; }
}

function timeMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function minutesTime(value) {
  const safe = Math.max(0, Math.min(1439, Number(value) || 0));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
}

function textValue(value, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function safeJson(value, fallback) {
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch (_) { return fallback; }
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
