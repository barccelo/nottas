-- Run once against remote D1 before deploying the new Worker.
CREATE TABLE IF NOT EXISTS google_calendar_oauth_states (
  state_hash TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gcal_oauth_expiration ON google_calendar_oauth_states(expires_at);
CREATE TABLE IF NOT EXISTS google_calendar_connections (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  account_email TEXT NOT NULL,
  refresh_cipher TEXT NOT NULL,
  connected_by TEXT NOT NULL REFERENCES users(id),
  connected_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS google_calendar_sources (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  background_color TEXT NOT NULL,
  access_role TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (workspace_id,calendar_id)
);
CREATE INDEX IF NOT EXISTS idx_gcal_sources_ws ON google_calendar_sources(workspace_id,selected);
