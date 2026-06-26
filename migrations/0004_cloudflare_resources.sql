-- D1 database migration: Infrastructure Discovery

CREATE TABLE IF NOT EXISTS site_resources (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  metadata_json TEXT,
  last_synced_at INTEGER NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE (site_id, provider, resource_type, resource_id)
);

CREATE TABLE IF NOT EXISTS resource_sync_history (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration INTEGER,
  resources_found INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);