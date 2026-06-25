-- D1 database migration: Add permissions and role_permissions tables, and seed roles/permissions mapping

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Seed permissions
INSERT OR IGNORE INTO permissions (id, name, description, created_at) VALUES
  ('perm_dash_access', 'dashboard.access', 'Access the dashboard console', unixepoch()),
  ('perm_tools_read', 'tools.read', 'Read tools configs', unixepoch()),
  ('perm_tools_write', 'tools.write', 'Modify tools registries', unixepoch()),
  ('perm_content_read', 'content.read', 'Read announcements and sections', unixepoch()),
  ('perm_content_write', 'content.write', 'Modify announcements and sections', unixepoch()),
  ('perm_flags_read', 'flags.read', 'Read feature flags', unixepoch()),
  ('perm_flags_write', 'flags.write', 'Modify feature flags', unixepoch()),
  ('perm_users_read', 'users.read', 'View user accounts logs', unixepoch()),
  ('perm_analytics_read', 'analytics.read', 'Read usage analytics charts', unixepoch()),
  ('perm_profile_read', 'profile.read', 'Read admin user profile details', unixepoch()),
  ('perm_profile_write', 'profile.write', 'Modify admin user profile details', unixepoch());

-- Map Role Permissions

-- 1. dashboard.access for EVERY role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('role_admin', 'perm_dash_access', unixepoch()),
  ('role_editor', 'perm_dash_access', unixepoch()),
  ('role_support', 'perm_dash_access', unixepoch()),
  ('role_normal_user', 'perm_dash_access', unixepoch());

-- 2. profile.read and profile.write for EVERY role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('role_admin', 'perm_profile_read', unixepoch()),
  ('role_admin', 'perm_profile_write', unixepoch()),
  ('role_editor', 'perm_profile_read', unixepoch()),
  ('role_editor', 'perm_profile_write', unixepoch()),
  ('role_support', 'perm_profile_read', unixepoch()),
  ('role_support', 'perm_profile_write', unixepoch()),
  ('role_normal_user', 'perm_profile_read', unixepoch()),
  ('role_normal_user', 'perm_profile_write', unixepoch());

-- 3. admin role permissions
-- dashboard.access, profile.read, profile.write, tools.write, content.write, flags.read, flags.write, users.read, analytics.read
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('role_admin', 'perm_tools_write', unixepoch()),
  ('role_admin', 'perm_content_write', unixepoch()),
  ('role_admin', 'perm_flags_read', unixepoch()),
  ('role_admin', 'perm_flags_write', unixepoch()),
  ('role_admin', 'perm_users_read', unixepoch()),
  ('role_admin', 'perm_analytics_read', unixepoch());

-- 4. editor role permissions
-- dashboard.access, profile.read, profile.write, tools.read, content.read, content.write
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('role_editor', 'perm_tools_read', unixepoch()),
  ('role_editor', 'perm_content_read', unixepoch()),
  ('role_editor', 'perm_content_write', unixepoch());

-- 5. support role permissions
-- dashboard.access, profile.read, profile.write, users.read, analytics.read
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('role_support', 'perm_users_read', unixepoch()),
  ('role_support', 'perm_analytics_read', unixepoch());
