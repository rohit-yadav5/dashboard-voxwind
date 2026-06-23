-- dashboard-voxwind core admin schema
-- D1 is the source of truth. KV receives published runtime snapshots.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  assigned_by TEXT,
  assigned_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  lifecycle_state TEXT NOT NULL DEFAULT 'draft',
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'private',
  homepage_visibility INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 100,
  public_url TEXT,
  docs_url TEXT,
  admin_url TEXT,
  api_endpoints_json TEXT NOT NULL DEFAULT '[]',
  limits_json TEXT NOT NULL DEFAULT '{}',
  feature_flags_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  analytics_key TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  draft_config_json TEXT NOT NULL DEFAULT '{}',
  published_config_json TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  published_at INTEGER,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tools_environment ON tools(environment);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_deleted ON tools(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tools_order ON tools(environment, order_index);

CREATE TABLE IF NOT EXISTS tool_configs (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  config_key TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  draft_config_json TEXT NOT NULL DEFAULT '{}',
  published_config_json TEXT,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  UNIQUE(tool_id, config_key, environment),
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  flag_key TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'global',
  environment TEXT NOT NULL DEFAULT 'production',
  enabled INTEGER NOT NULL DEFAULT 0,
  rollout_percentage INTEGER NOT NULL DEFAULT 0,
  rules_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  published_at INTEGER,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0,
  UNIQUE(flag_key, environment)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted ON feature_flags(deleted_at);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  audience TEXT NOT NULL DEFAULT 'public',
  environment TEXT NOT NULL DEFAULT 'production',
  status TEXT NOT NULL DEFAULT 'draft',
  enabled INTEGER NOT NULL DEFAULT 0,
  start_at INTEGER,
  end_at INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  published_at INTEGER,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_announcements_environment ON announcements(environment);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(environment, status, enabled);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  section_key TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  section_type TEXT NOT NULL,
  title TEXT,
  draft_content TEXT NOT NULL DEFAULT '{}',
  published_content TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  enabled INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 100,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  published_at INTEGER,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0,
  UNIQUE(section_key, environment)
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_environment ON homepage_sections(environment, order_index);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'production',
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT,
  upload_url_expires_at INTEGER,
  mime_type TEXT,
  byte_size INTEGER,
  alt_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  uploaded_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  UNIQUE(bucket, object_key)
);

CREATE TABLE IF NOT EXISTS seo_pages (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'production',
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  canonical_url TEXT,
  og_image_asset_id TEXT,
  robots TEXT DEFAULT 'index, follow',
  schema_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  published_at INTEGER,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0,
  UNIQUE(path, environment)
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  price_json TEXT NOT NULL DEFAULT '{}',
  limits_json TEXT NOT NULL DEFAULT '{}',
  features_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS usage_stats (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'production',
  tool_id TEXT,
  user_id TEXT,
  metric_key TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  dimensions_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_period ON usage_stats(environment, metric_key, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_stats_tool ON usage_stats(environment, tool_id, period_start);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_json TEXT,
  after_json TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at);

CREATE TABLE IF NOT EXISTS config_versions (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'production',
  version INTEGER NOT NULL,
  snapshot_hash TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  created_by TEXT,
  created_at INTEGER NOT NULL,
  published_at INTEGER,
  notes TEXT,
  UNIQUE(environment, version)
);

CREATE INDEX IF NOT EXISTS idx_config_versions_environment ON config_versions(environment, version);

CREATE TABLE IF NOT EXISTS published_snapshots (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'production',
  version INTEGER NOT NULL,
  kv_key TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  published_by TEXT,
  published_at INTEGER NOT NULL,
  rollback_of_version INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(environment, version)
);

CREATE INDEX IF NOT EXISTS idx_published_snapshots_environment ON published_snapshots(environment, published_at);
