-- Apply using the Cloudflare D1 remote SQL console BEFORE deploying v0.27.6.
-- This table contains one-time 192-bit random recovery codes, not OAuth secrets.
CREATE TABLE IF NOT EXISTS workspace_recovery_codes (
  code TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_workspace_recovery_expiry ON workspace_recovery_codes(expires_at);

-- Administrator recovery procedure:
-- 1. Identify the exact original shared workspace:
-- SELECT id,name,owner_user_id FROM workspaces WHERE kind='assistant' ORDER BY created_at;
-- 2. Substitute the verified workspace UUID for <WORKSPACE_ID> in the statement below,
--    execute it in Cloudflare D1, then copy the generated one-time code to Nottas.
-- INSERT INTO workspace_recovery_codes(code,workspace_id,expires_at)
-- SELECT lower(hex(randomblob(24))), id, (unixepoch() * 1000) + 900000
-- FROM workspaces WHERE id='<WORKSPACE_ID>' AND kind='assistant'
-- RETURNING code,workspace_id;
-- Codes expire after 15 minutes and can be redeemed only once.
