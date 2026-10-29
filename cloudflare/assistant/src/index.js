import { callback as googleCallback, routes as googleCalendarRoutes } from "./google-calendar.js";

let cachedGoogleToken = null;
let cachedGoogleTokenUntil = 0;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
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
  // Google redirects from the system browser; callback validation uses a single-use state.
  if (path === "/v1/google/oauth/callback" && request.method === "GET") {
    return googleCallback(request, env);
  }

  const auth = await authenticate(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const calendarResponse = await googleCalendarRoutes(request, url, auth, env);
  if (calendarResponse) return calendarResponse;

  if (path === "/v1/me" && request.method === "GET") return me(auth, env);
  if (path === "/v1/workspaces" && request.method === "GET") return listWorkspaces(auth, env);
  if (path === "/v1/workspaces" && request.method === "POST") return createWorkspace(request, auth, env);
  if (path === "/v1/workspaces/join" && request.method === "POST") return joinWorkspace(request, auth, env);
  if (path === "/v1/devices/push-token" && request.method === "POST") return registerPushToken(request, auth, env);
  if (path === "/v1/sync" && request.method === "GET") return pullSync(url, auth, env);
  if (path === "/v1/sync" && request.method === "POST") return pushSync(request, auth, env);
  if (path === "/v1/calls/pending" && request.method === "GET") return pendingCalls(auth, env);

  const workspaceDeletePreview = path.match(/^\/v1\/workspaces\/([^/]+)\/deletion-preview$/);
  if (workspaceDeletePreview && request.method === "GET") {
    return previewWorkspaceDeletion(decodeURIComponent(workspaceDeletePreview[1]), auth, env);
  }
  const workspaceDelete = path.match(/^\/v1\/workspaces\/([^/]+)$/);
  if (workspaceDelete && request.method === "DELETE") {
    return deleteAssistantWorkspace(request, decodeURIComponent(workspaceDelete[1]), auth, env);
  }

  const recoveryWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/restore-owner$/);
  if (recoveryWorkspace && request.method === "POST") {
    return restoreWorkspaceOwner(request, decodeURIComponent(recoveryWorkspace[1]), auth, env);
  }

  const removeMemberRoute = path.match(/^\/v1\/workspaces\/([^/]+)\/members\/([^/]+)\/remove$/);
  if (removeMemberRoute && request.method === "POST") {
    return removeAssistantMember(decodeURIComponent(removeMemberRoute[1]), decodeURIComponent(removeMemberRoute[2]), auth, env);
  }

  const proposalsWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/pending-proposals$/);
  if (proposalsWorkspace && request.method === "GET") {
    return pendingAssistantProposals(decodeURIComponent(proposalsWorkspace[1]), auth, env);
  }

  const activityWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/activity$/);
  if (activityWorkspace && request.method === "GET") {
    return workspaceActivity(decodeURIComponent(activityWorkspace[1]), auth, env);
  }

  const availabilityWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/availability$/);
  if (availabilityWorkspace && request.method === "GET") {
    return workspaceAvailability(url, decodeURIComponent(availabilityWorkspace[1]), auth, env);
  }

  const messagesWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/messages$/);
  if (messagesWorkspace) {
    const id = decodeURIComponent(messagesWorkspace[1]);
    if (request.method === "GET") return listAssistantMessages(id, auth, env);
    if (request.method === "POST") return createAssistantMessage(request, id, auth, env);
  }
  const readMessageRoute = path.match(/^\/v1\/workspaces\/([^/]+)\/messages\/([^/]+)\/read$/);
  if (readMessageRoute && request.method === "POST") {
    return readAssistantMessage(decodeURIComponent(readMessageRoute[1]), decodeURIComponent(readMessageRoute[2]), auth, env);
  }
  const noticeWorkspace = path.match(/^\/v1\/workspaces\/([^/]+)\/notice$/);
  if (noticeWorkspace && request.method === "POST") {
    return sendAssistantNotice(request, decodeURIComponent(noticeWorkspace[1]), auth, env);
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

// Recovery is a deliberate, audited ownership transfer, not a backup/import claim.
// Codes are generated only through the Cloudflare D1 administrator console; never from the app.
async function restoreWorkspaceOwner(request, workspaceId, auth, env) {
  const body = await bodyJson(request);
  const recoveryCode = textValue(body.recoveryCode, 100).toLowerCase();
  if (!/^[0-9a-f]{48}$/.test(recoveryCode)) return json({ error: "recovery_code_invalid" }, 400);

  const workspace = await env.DB.prepare(
    "SELECT id,kind,owner_user_id,name FROM workspaces WHERE id=? AND kind='assistant'"
  ).bind(workspaceId).first();
  if (!workspace) return json({ error: "workspace_not_found" }, 404);

  const already = await membership(workspaceId, auth.userId, env);
  if (workspace.owner_user_id === auth.userId && already?.role === "owner") {
    return json({ error: "already_owner" }, 409);
  }
  // One-time use is atomic; secrets expire 15 minutes after issue.
  const claimed = await env.DB.prepare(
    "UPDATE workspace_recovery_codes SET used_at=? " +
    "WHERE workspace_id=? AND code=? AND used_at IS NULL AND expires_at>? " +
    "RETURNING workspace_id"
  ).bind(Date.now(), workspaceId, recoveryCode, Date.now()).first();
  if (!claimed) return json({ error: "recovery_code_invalid_or_expired" }, 403);

  const when = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE workspace_members SET status='inactive' WHERE workspace_id=? AND role='owner' AND user_id<>?")
      .bind(workspaceId, auth.userId),
    env.DB.prepare(
      "INSERT INTO workspace_members(workspace_id,user_id,role,status,joined_at) VALUES(?,?,?,?,?) " +
      "ON CONFLICT(workspace_id,user_id) DO UPDATE SET role='owner',status='active'"
    ).bind(workspaceId, auth.userId, "owner", "active", when),
    env.DB.prepare("UPDATE workspaces SET owner_user_id=?,updated_at=? WHERE id=?")
      .bind(auth.userId, when, workspaceId)
  ]);
  await pushWorkspaceSync(workspaceId, auth.userId, env);
  return json({ workspace: { id: workspaceId, name: workspace.name, kind: "assistant", role: "owner" }, restored: true });
}

async function removeAssistantMember(workspaceId, userId, auth, env) {
  const actor = await membership(workspaceId, auth.userId, env);
  if (actor?.role !== "owner") return json({ error: "owner_required" }, 403);
  const member = await membership(workspaceId, userId, env);
  if (!member || member.role !== "assistant" || userId === auth.userId) {
    return json({ error: "only_assistants_can_be_removed" }, 400);
  }
  const result = await env.DB.prepare(
    "UPDATE workspace_members SET status='inactive' " +
    "WHERE workspace_id=? AND user_id=? AND role='assistant' AND status='active'"
  ).bind(workspaceId, userId).run();
  if (!result.meta?.changes) return json({ error: "member_already_inactive" }, 409);
  await env.DB.prepare("UPDATE workspaces SET updated_at=? WHERE id=?").bind(Date.now(),workspaceId).run();
  await pushWorkspaceSync(workspaceId, auth.userId, env);
  return json({ ok: true, removedUserId: userId });
}

// Administrator-free cleanup for workspace owners. Only explicit deletion can
// cascade shared tasks, notes, calls and Calendar OAuth data. No personal
// workspace can ever be deleted through these routes.
async function workspaceDeletionPermission(workspaceId, auth, env) {
  const ws = await env.DB.prepare(
    "SELECT id,name,kind,owner_user_id FROM workspaces WHERE id=?"
  ).bind(workspaceId).first();
  if (!ws) return { error: json({ error: "workspace_not_found" }, 404) };
  if (ws.kind !== "assistant") return { error: json({ error: "personal_workspace_protected" }, 403) };
  const member = await membership(workspaceId, auth.userId, env);
  if (ws.owner_user_id !== auth.userId || member?.role !== "owner") {
    return { error: json({ error: "owner_required" }, 403) };
  }
  return { ws };
}

async function previewWorkspaceDeletion(workspaceId, auth, env) {
  const permission = await workspaceDeletionPermission(workspaceId, auth, env);
  if (permission.error) return permission.error;
  const [items, notes, changes, calls, members, google] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n FROM items WHERE workspace_id=?").bind(workspaceId).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM items WHERE workspace_id=? AND entity_type='note'").bind(workspaceId).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM changes WHERE workspace_id=?").bind(workspaceId).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM assistant_calls WHERE workspace_id=?").bind(workspaceId).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM workspace_members WHERE workspace_id=? AND status='active'").bind(workspaceId).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM google_calendar_connections WHERE workspace_id=?").bind(workspaceId).first()
  ]);
  return json({
    workspaceId, name: permission.ws.name,
    contentCount: Number(items?.n||0),
    noteCount: Number(notes?.n||0),
    changeCount: Number(changes?.n||0),
    callCount: Number(calls?.n||0),
    memberCount: Number(members?.n||0),
    googleConnected: Number(google?.n||0)>0
  });
}

async function deleteAssistantWorkspace(request, workspaceId, auth, env) {
  const permission = await workspaceDeletionPermission(workspaceId, auth, env);
  if (permission.error) return permission.error;
  const body = await bodyJson(request);
  if (body.workspaceId !== workspaceId ||
      body.workspaceName !== permission.ws.name ||
      body.confirmation !== "ELIMINAR" ||
      body.backupAcknowledged !== true) {
    return json({ error: "workspace_deletion_confirmation_required" }, 400);
  }
  // Members, unlike the workspace, are not destroyed as user accounts.
  const members = await env.DB.prepare(
    "SELECT user_id FROM workspace_members WHERE workspace_id=? AND status='active'"
  ).bind(workspaceId).all();
  // The D1 schema enforces cascading FKs for the workspace-owned records:
  // items, changes, memberships, calls, calendars, refresh tokens and codes.
  const result = await env.DB.prepare(
    "DELETE FROM workspaces WHERE id=? AND owner_user_id=? AND kind='assistant'"
  ).bind(workspaceId, auth.userId).run();
  if (!result.meta?.changes) return json({ error: "workspace_not_found" }, 404);
  await Promise.all((members.results||[])
    .filter(m=>m.user_id!==auth.userId)
    .map(m=>sendPushToUser(m.user_id,{
      type: "sync",
      workspaceId,
      changedBy: auth.userId,
      workspaceDeleted: "true"
    },env).catch(e=>console.error("Deleted workspace push",String(e?.message||e)))));
  return json({ ok: true, deletedWorkspaceId: workspaceId });
}

async function registerPushToken(request, auth, env) {
  const body = await bodyJson(request);
  const fcmToken = textValue(body.fcmToken, 4096);
  const label = textValue(body.deviceLabel || "Android", 80);
  if (!fcmToken) return json({ error: "fcm_token_required" }, 400);
  // After reinstallation the native device ID can change. A Firebase token may
  // not belong to two user sessions simultaneously; transfer the token safely.
  await env.DB.prepare(
    "UPDATE devices SET fcm_token=NULL WHERE fcm_token=? AND id<>?"
  ).bind(fcmToken, auth.deviceId).run();
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
  const proposalSignals = new Map();

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
    // Authenticated authorship is immutable; a client cannot impersonate the boss.
    if (!current) payload.createdBy = auth.userId;
    else payload.createdBy = safeJson(current.payload_json, {}).createdBy || auth.userId;

    if (entityType === "task" && membershipRoles.get(workspaceId) === "assistant") {
      const currentPayload = current ? safeJson(current.payload_json, {}) : null;
      const currentStatus = currentPayload?.approvalStatus || "confirmed";
      const requestedStatus = payload.approvalStatus || currentStatus;
      const assistantIsAuthor = !currentPayload || currentPayload.createdBy === auth.userId;
      const requestsDirectScheduling = requestedStatus === "scheduled" && assistantIsAuthor;
      const requestsProposal = requestedStatus === "proposed" && assistantIsAuthor;
      const scheduleChanged = !!currentPayload && (
        String(currentPayload.dueDate || "") !== String(payload.dueDate || "") ||
        String(currentPayload.endDate || "") !== String(payload.endDate || "") ||
        String(currentPayload.dueTime || "") !== String(payload.dueTime || "") ||
        String(currentPayload.endTime || "") !== String(payload.endTime || "")
      );
      // Authorized members may update meeting outcomes; approval remains protected.
      if (currentPayload) {
        const oldHistory = Array.isArray(currentPayload.meetingHistory)
          ? currentPayload.meetingHistory.slice(-49) : [];
        payload.meetingTracked = typeof currentPayload.meetingTracked === "boolean" ? currentPayload.meetingTracked : !!(currentPayload.dueDate && currentPayload.dueTime);
        payload.meetingStatus = ["scheduled", "deferred", "realized", "cancelled"].includes(payload.meetingStatus)
          ? payload.meetingStatus : (currentPayload.meetingStatus || "scheduled");
        payload.meetingNote = String(payload.meetingNote || "").slice(0,500);
        const proposedHistory = Array.isArray(payload.meetingHistory) ? payload.meetingHistory : [];
        const prefixValid = oldHistory.every((entry, index) =>
          JSON.stringify(entry) === JSON.stringify(proposedHistory[index]));
        const extraEntries = prefixValid ? proposedHistory.slice(oldHistory.length, oldHistory.length + 10) : [];
        payload.meetingHistory = [...oldHistory, ...extraEntries.map(entry => ({
          at: Date.now(), by: auth.userId, action: textValue(entry?.action || "Cambio", 100),
          from: entry?.from || null, to: entry?.to || null,
          note: textValue(entry?.note || "", 500)
        }))].slice(-50);
        if (scheduleChanged && payload.meetingTracked) {
          payload.meetingHistory = [...oldHistory, {
            at: Date.now(), by: auth.userId, action: "Horario propuesto",
            from: {
              dueDate: String(currentPayload.dueDate || ""), endDate: String(currentPayload.endDate || ""),
              dueTime: String(currentPayload.dueTime || ""), endTime: String(currentPayload.endTime || ""),
              status: String(currentPayload.meetingStatus || "scheduled")
            },
            to: {
              dueDate: String(payload.dueDate || ""), endDate: String(payload.endDate || ""),
              dueTime: String(payload.dueTime || ""), endTime: String(payload.endTime || ""),
              status: String(currentPayload.meetingStatus || "scheduled")
            },
            note: String(currentPayload.meetingNote || "").slice(0,500)
          }];
        }
      } else {
        payload.meetingStatus = ["scheduled", "deferred", "realized", "cancelled"].includes(payload.meetingStatus) ? payload.meetingStatus : "scheduled";
        payload.meetingHistory = [];
      }
      if (!currentPayload) {
        // An assistant may explicitly schedule a new task without approval.
        payload.approvalStatus = requestsDirectScheduling ? "scheduled" : "proposed";
        payload.requiresApproval = !requestsDirectScheduling;
      } else if (currentStatus === "confirmed" && scheduleChanged) {
        // Changes to a task approved by the boss still require approval.
        payload.approvalStatus = "proposed";
        payload.requiresApproval = true;
      } else if (currentStatus === "scheduled" && requestsProposal) {
        payload.approvalStatus = "proposed";
        payload.requiresApproval = true;
      } else if (currentStatus === "proposed" && requestsDirectScheduling) {
        // Only the task's original assistant may change its approval mode.
        payload.approvalStatus = "scheduled";
        payload.requiresApproval = false;
      } else if (["changes_requested", "rejected"].includes(currentStatus) && requestedStatus === "proposed") {
        payload.approvalStatus = "proposed";
        payload.requiresApproval = true;
      } else {
        // Never let an assistant override the boss's confirmed/rejected state.
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
    if(entityType==="task" && membershipRoles.get(workspaceId)==="assistant" &&
       !deletedAt && payload.approvalStatus==="proposed" &&
       (!current || safeJson(current.payload_json, {}).approvalStatus!=="proposed" ||
        String(safeJson(current.payload_json, {}).dueDate||"")!==String(payload.dueDate||"") ||
        String(safeJson(current.payload_json, {}).dueTime||"")!==String(payload.dueTime||""))) {
      proposalSignals.set(workspaceId, {
        id: entityId, title: textValue(payload.text||"Nueva propuesta",120)
      });
    }
  }

  for (const workspaceId of touchedWorkspaces) {
    await env.DB.prepare("UPDATE workspaces SET updated_at=? WHERE id=?").bind(Date.now(), workspaceId).run();
    const workspace = await env.DB.prepare("SELECT kind,owner_user_id FROM workspaces WHERE id=?").bind(workspaceId).first();
    if (workspace?.kind === "personal" && workspace.owner_user_id === auth.userId) {
      await pushAvailabilityChanged(auth.userId, env);
    } else {
      const proposal=proposalSignals.get(workspaceId);
      await pushWorkspaceSync(workspaceId, auth.userId, env);
      if(proposal&&workspace.kind==="assistant"&&workspace.owner_user_id!==auth.userId) {
        await sendPushToUser(workspace.owner_user_id,{
          type:"director_proposal",workspaceId,proposalId:proposal.id,title:proposal.title
        },env);
      }
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
    const last = String(payload.endDate || "") > date ? String(payload.endDate) : date;
    const dueTime = String(payload.dueTime || "");
    if (payload.done || !dueTime || date > end || last < start) continue;
    const startMinute = timeMinutes(dueTime);
    if (startMinute === null) continue;
    let endMinute = timeMinutes(String(payload.endTime || ""));
    if (endMinute === null || endMinute <= startMinute) endMinute = Math.min(1439, startMinute + 60);
    const from = date > start ? date : start;
    const until = last < end ? last : end;
    for (let day = from; day <= until;) {
      busy.push({ date: day, start: minutesTime(startMinute), end: minutesTime(endMinute) });
      const d = new Date(day + "T12:00:00Z");d.setUTCDate(d.getUTCDate() + 1);
      day = d.toISOString().slice(0, 10);
    }
  }
  busy.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  return json({ start, end, busy });
}

// Durable inbox: derive pending notifications from D1 task approval state.
async function pendingAssistantProposals(workspaceId, auth, env) {
  const member = await membership(workspaceId, auth.userId, env);
  if (!member || member.role !== "owner") return json({ error: "owner_required" }, 403);
  const workspace = await env.DB.prepare(
    "SELECT kind FROM workspaces WHERE id=? AND owner_user_id=?"
  ).bind(workspaceId, auth.userId).first();
  if (workspace?.kind !== "assistant") return json({ error: "assistant_workspace_required" }, 400);
  const result = await env.DB.prepare(
    "SELECT id,payload_json,updated_at FROM items WHERE workspace_id=? AND entity_type='task' AND deleted_at IS NULL " +
    "AND json_extract(payload_json,'$.approvalStatus')='proposed' AND json_extract(payload_json,'$.deletedAt') IS NULL ORDER BY updated_at DESC LIMIT 250"
  ).bind(workspaceId).all();
  const proposals = (result.results || []).map(row => {
    const p = safeJson(row.payload_json, {});
    return {
      id: row.id, title: textValue(p.text || "Sin título", 160),
      dueDate: textValue(p.dueDate, 10), endDate: textValue(p.endDate, 10),
      dueTime: textValue(p.dueTime, 5), endTime: textValue(p.endTime, 5),
      locationText: textValue(p.locationText, 160),
      message: textValue(p.proposalMessage, 280),
      createdBy: textValue(p.createdBy, 120),
      updatedAt: Number(row.updated_at) || 0
    };
  });
  return json({ workspaceId, pending: proposals, count: proposals.length });
}

async function workspaceActivity(workspaceId, auth, env) {
  const member = await membership(workspaceId, auth.userId, env);
  if (!member) return json({ error: "workspace_forbidden" }, 403);

  const membersResult = await env.DB.prepare(
    "SELECT m.user_id,m.role,m.joined_at,u.display_name," +
    "(SELECT MAX(d.updated_at) FROM devices d WHERE d.user_id=m.user_id AND d.fcm_token IS NOT NULL AND d.fcm_token<>'') AS last_push_at," +
    "(SELECT COUNT(*) FROM devices d WHERE d.user_id=m.user_id AND d.fcm_token IS NOT NULL AND d.fcm_token<>'') AS push_devices " +
    "FROM workspace_members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=? AND m.status='active' " +
    "ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END,m.joined_at"
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
      joinedAt: r.joined_at,
      lastPushAt: Number(r.last_push_at) || null,
      pushDeviceCount: Number(r.push_devices) || 0
    })),
    activity: activity.slice(0, 50)
  });
}


/** Durable, authorized one-to-one message exchange between owner and assistant.
 * Creating the D1 table lazily makes this update safe for existing installations,
 * without requiring a destructive migration of workspaces or task data.
 */
async function ensureAssistantMessagesTable(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS assistant_messages (" +
    "id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE," +
    "from_user_id TEXT NOT NULL REFERENCES users(id), to_user_id TEXT NOT NULL REFERENCES users(id)," +
    "reply_to_id TEXT, body TEXT NOT NULL, created_at INTEGER NOT NULL, read_at INTEGER)"
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_assistant_messages_workspace ON assistant_messages(workspace_id,created_at DESC)"
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_assistant_messages_unread ON assistant_messages(to_user_id,read_at,created_at DESC)"
  ).run();
}
async function assistantMessageAccess(workspaceId, auth, env) {
  const member = await membership(workspaceId, auth.userId, env);
  if (!member || !["owner","assistant"].includes(member.role)) return null;
  const workspace = await env.DB.prepare("SELECT kind,owner_user_id FROM workspaces WHERE id=?")
    .bind(workspaceId).first();
  return workspace?.kind==="assistant" ? { ...member,workspace } : null;
}
function publicAssistantMessage(row, currentUserId) {
  return {
    id:row.id,workspaceId:row.workspace_id,fromUserId:row.from_user_id,toUserId:row.to_user_id,
    fromName:row.from_name||"",body:row.body,replyToId:row.reply_to_id||"",
    createdAt:Number(row.created_at),readAt:Number(row.read_at)||null,
    mine:row.from_user_id===currentUserId
  };
}
async function listAssistantMessages(workspaceId, auth, env) {
  const access = await assistantMessageAccess(workspaceId,auth,env);
  if (!access) return json({error:"workspace_forbidden"},403);
  await ensureAssistantMessagesTable(env);
  const rows=await env.DB.prepare(
    "SELECT m.*,u.display_name AS from_name FROM assistant_messages m " +
    "JOIN users u ON u.id=m.from_user_id WHERE m.workspace_id=? " +
    "AND (m.from_user_id=? OR m.to_user_id=?) ORDER BY m.created_at DESC LIMIT 60"
  ).bind(workspaceId,auth.userId,auth.userId).all();
  const unread=await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM assistant_messages WHERE workspace_id=? AND to_user_id=? AND read_at IS NULL"
  ).bind(workspaceId,auth.userId).first();
  return json({messages:(rows.results||[]).reverse().map(row=>publicAssistantMessage(row,auth.userId)),unread:Number(unread?.n)||0});
}
async function readAssistantMessage(workspaceId,messageId,auth,env) {
  const access=await assistantMessageAccess(workspaceId,auth,env);
  if (!access) return json({error:"workspace_forbidden"},403);
  await ensureAssistantMessagesTable(env);
  const result=await env.DB.prepare(
    "UPDATE assistant_messages SET read_at=COALESCE(read_at,?) WHERE id=? AND workspace_id=? AND to_user_id=?"
  ).bind(Date.now(),messageId,workspaceId,auth.userId).run();
  if (!result.meta?.changes) return json({error:"message_not_found"},404);
  return json({ok:true});
}
async function createAssistantMessage(request,workspaceId,auth,env) {
  const access=await assistantMessageAccess(workspaceId,auth,env);
  if (!access) return json({error:"workspace_forbidden"},403);
  const body=await bodyJson(request);
  const message=String(body.message||"").trim();
  if(!message||message.length>280)return json({error:"invalid_message",message:"Escribe entre 1 y 280 caracteres."},400);
  await ensureAssistantMessagesTable(env);
  const replyToId=textValue(body.replyToId,80);
  let target=null;
  if(replyToId){
    const previous=await env.DB.prepare(
      "SELECT from_user_id,to_user_id FROM assistant_messages WHERE id=? AND workspace_id=?"
    ).bind(replyToId,workspaceId).first();
    if(!previous||previous.to_user_id!==auth.userId||previous.from_user_id===auth.userId)
      return json({error:"invalid_reply_target"},403);
    target=previous.from_user_id;
  }else if(access.role==="assistant"){
    target=access.workspace.owner_user_id;
  }else{
    const result=await env.DB.prepare(
      "SELECT m.user_id FROM workspace_members m LEFT JOIN devices d ON d.user_id=m.user_id " +
      "AND d.fcm_token IS NOT NULL AND d.fcm_token<>'' " +
      "WHERE m.workspace_id=? AND m.role='assistant' AND m.status='active' " +
      "GROUP BY m.user_id,m.joined_at " +
      "ORDER BY CASE WHEN MAX(d.updated_at) IS NULL THEN 1 ELSE 0 END," +
      "MAX(d.updated_at) DESC,m.joined_at DESC LIMIT 1"
    ).bind(workspaceId).first();
    target=result?.user_id;
  }
  if(!target)return json({error:"recipient_not_connected",message:"No hay un destinatario activo en este espacio."},409);
  const active=await membership(workspaceId,target,env);
  if(!active)return json({error:"recipient_not_member"},403);
  const id=crypto.randomUUID(),at=Date.now();
  await env.DB.prepare(
    "INSERT INTO assistant_messages(id,workspace_id,from_user_id,to_user_id,reply_to_id,body,created_at) " +
    "VALUES(?,?,?,?,?,?,?)"
  ).bind(id,workspaceId,auth.userId,target,replyToId||null,message,at).run();
  // Persist first: push delivery can fail while the recipient is offline.
  let pushed=0;
  try{
    const result=await sendAssistantCallPush(target,{
      type:"assistant_notice",noticeId:id,workspaceId,
      fromName:auth.displayName|| (access.role==="owner"?"Jefe":"Asistente"),
      fromRole:access.role,
      message
    },env);
    pushed=result.accepted;
  }catch(error){console.error("Assistant message push:",String(error?.message||error).slice(0,180))}
  return json({ok:true,id,createdAt:at,recipientUserId:target,pushAccepted:pushed>0,acceptedDevices:pushed},201);
}
// Keep existing older clients functional on assistant-to-owner notices.
async function sendAssistantNotice(request,workspaceId,auth,env) {
  const access=await assistantMessageAccess(workspaceId,auth,env);
  if(!access||access.role!=="assistant")return json({error:"assistant_required"},403);
  return createAssistantMessage(request,workspaceId,auth,env);
}

async function createAssistantCall(request, workspaceId, auth, env) {
  const callerMembership = await membership(workspaceId, auth.userId, env);
  if (!callerMembership || callerMembership.role !== "owner") return json({ error: "owner_required" }, 403);

  const body = await bodyJson(request);
  const requestedId = textValue(body.toUserId, 100);
  // New registrations create new identities. Pick the assistant with the most
  // recently registered FCM device, not the first member ever invited.
  const candidates = await env.DB.prepare(
    "SELECT m.user_id,u.display_name,MAX(d.updated_at) AS last_push_at " +
    "FROM workspace_members m JOIN users u ON u.id=m.user_id " +
    "LEFT JOIN devices d ON d.user_id=m.user_id AND d.fcm_token IS NOT NULL AND d.fcm_token<>'' " +
    "WHERE m.workspace_id=? AND m.role='assistant' AND m.status='active' " +
    "GROUP BY m.user_id,u.display_name,m.joined_at " +
    "ORDER BY CASE WHEN MAX(d.updated_at) IS NULL THEN 1 ELSE 0 END," +
    "MAX(d.updated_at) DESC,m.joined_at DESC LIMIT 20"
  ).bind(workspaceId).all();
  const members = (candidates.results || []);
  if (!members.length) return json({ error: "assistant_not_connected", message: "No hay ningún asistente vinculado a este espacio." }, 409);
  const eligible = requestedId ? members.filter(x => x.user_id === requestedId) : members;
  if (!eligible.length) return json({ error: "invalid_target" }, 400);
  const ready = eligible.filter(x => x.last_push_at != null);
  if (!ready.length) {
    return json({
      error: "assistant_push_not_registered",
      message: "El asistente está unido, pero ningún dispositivo tiene el token push registrado en el servidor. Abre Nottas en el segundo teléfono y actualiza su push."
    }, 409);
  }

  const callId = crypto.randomUUID(), now = Date.now();
  const workspace = await env.DB.prepare("SELECT name FROM workspaces WHERE id=?").bind(workspaceId).first();
  await env.DB.prepare(
    "INSERT INTO assistant_calls(id,workspace_id,from_user_id,to_user_id,status,created_at) VALUES(?,?,?,?,?,?)"
  ).bind(callId, workspaceId, auth.userId, ready[0].user_id, "sent", now).run();

  for (const candidate of ready) {
    if (candidate.user_id !== ready[0].user_id) {
      await env.DB.prepare("UPDATE assistant_calls SET to_user_id=? WHERE id=?").bind(candidate.user_id, callId).run();
    }
    const push = await sendAssistantCallPush(candidate.user_id, {
      type: "assistant_call",
      callId,
      workspaceId,
      workspaceName: workspace?.name || "Asistente",
      callerName: auth.displayName
    }, env);
    if (push.accepted > 0) {
      return json({
        call: { id: callId, workspaceId, fromUserId: auth.userId, toUserId: candidate.user_id, status: "sent", createdAt: now },
        recipientName: candidate.display_name,
        pushAccepted: true,
        acceptedDevices: push.accepted
      }, 201);
    }
  }
  await env.DB.prepare("UPDATE assistant_calls SET status='failed' WHERE id=?").bind(callId).run();
  return json({
    error: "assistant_push_delivery_failed",
    message: "Firebase rechazó la entrega a los dispositivos registrados. Comprueba la configuración push del asistente."
  }, 502);
}

// Unlike ordinary sync pushes, calls must report whether Firebase accepted them.
async function sendAssistantCallPush(userId, payload, env) {
  const rows = await env.DB.prepare(
    "SELECT id,fcm_token FROM devices WHERE user_id=? AND fcm_token IS NOT NULL AND fcm_token<>'' ORDER BY updated_at DESC LIMIT 12"
  ).bind(userId).all();
  let accepted = 0;
  await Promise.all((rows.results || []).map(async device => {
    try {
      await sendFcm(device.fcm_token, payload, env);
      accepted++;
    } catch (error) {
      console.error("Assistant call FCM delivery failed", String(error?.message || error).slice(0,180));
      // Only definitive 404/410 token failures justify removing a stale token.
      if (error?.fcmStatus === 404 || error?.fcmStatus === 410) {
        await env.DB.prepare("UPDATE devices SET fcm_token=NULL WHERE id=? AND fcm_token=?")
          .bind(device.id, device.fcm_token).run();
      }
    }
  }));
  return { accepted };
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
  if (!env.FCM_SERVICE_ACCOUNT_JSON) throw new Error("fcm_credentials_missing");
  const serviceAccount = safeJson(env.FCM_SERVICE_ACCOUNT_JSON, null);
  if (!serviceAccount?.project_id || !serviceAccount?.client_email || !serviceAccount?.private_key) throw new Error("fcm_credentials_invalid");
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
  if (!response.ok) {
    const error = new Error("FCM HTTP " + response.status);
    error.fcmStatus = response.status;
    throw error;
  }
  return true;
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
