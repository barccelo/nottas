-- Run once in Cloudflare D1 database nottas-assistant before opening Google events.
-- Read-only event snapshot cache scoped to each workspace and source calendar.
CREATE TABLE IF NOT EXISTS google_calendar_event_windows (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  month TEXT NOT NULL,
  events_json TEXT NOT NULL,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY(workspace_id,calendar_id,month),
  FOREIGN KEY(workspace_id,calendar_id) REFERENCES google_calendar_sources(workspace_id,calendar_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_gcal_event_windows_ws ON google_calendar_event_windows(workspace_id,month);
