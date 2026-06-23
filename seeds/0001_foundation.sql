INSERT OR IGNORE INTO roles (id, name, description, created_at) VALUES
  ('role_owner', 'owner', 'Full dashboard access', unixepoch()),
  ('role_admin', 'admin', 'Operational dashboard access', unixepoch()),
  ('role_editor', 'editor', 'Content and tool editing access', unixepoch()),
  ('role_support', 'support', 'Support and analytics access', unixepoch()),
  ('role_normal_user', 'normal_user', 'No dashboard access', unixepoch());

INSERT OR IGNORE INTO users (id, email, display_name, status, created_at, updated_at) VALUES
  ('usr_mock_owner', 'owner@voxwind.com', 'VoxWind Owner', 'active', unixepoch(), unixepoch());

INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by, assigned_at) VALUES
  ('usr_mock_owner', 'role_owner', 'system', unixepoch());

INSERT OR IGNORE INTO tools (
  id, name, slug, description, icon, category, lifecycle_state, status, visibility,
  homepage_visibility, featured, order_index, public_url, api_endpoints_json,
  limits_json, feature_flags_json, tags_json, environment, draft_config_json,
  created_by, created_at, updated_at
) VALUES
  (
    'tool_echo', 'Echo', 'echo', 'Text-to-speech generation with translation support.', 'E', 'Audio',
    'active', 'draft', 'public', 1, 1, 1, 'https://echo.voxwind.com',
    '["/echo/tts","/echo/translate"]',
    '{"textCharacters":1000,"requestsPerHour":20}',
    '["echo.enabled","echo.translate"]',
    '["tts","audio","google"]',
    'production',
    '{"provider":"google","mode":"free"}',
    'system', unixepoch(), unixepoch()
  ),
  (
    'tool_flow', 'Flow', 'flow', 'Peer-to-peer browser file transfer over WebRTC.', 'F', 'Transfer',
    'active', 'draft', 'public', 1, 0, 2, 'https://flow.voxwind.com',
    '["/flow/share/sessions","/flow/share/code/lookup"]',
    '{"sessionTtlSeconds":600,"codeTtlSeconds":120}',
    '["flow.enabled","flow.code_join"]',
    '["webrtc","files"]',
    'production',
    '{"turnEnabled":false}',
    'system', unixepoch(), unixepoch()
  );

INSERT OR IGNORE INTO feature_flags (
  id, flag_key, description, scope, environment, enabled, rollout_percentage,
  rules_json, created_at, updated_at
) VALUES
  ('flag_echo_enabled', 'echo.enabled', 'Echo public access', 'tool:echo', 'production', 1, 100, '{}', unixepoch(), unixepoch()),
  ('flag_flow_enabled', 'flow.enabled', 'Flow public access', 'tool:flow', 'production', 1, 100, '{}', unixepoch(), unixepoch()),
  ('flag_signup_enabled', 'signup.enabled', 'Allow new signups', 'auth', 'production', 1, 100, '{}', unixepoch(), unixepoch());

INSERT OR IGNORE INTO announcements (
  id, title, body, audience, environment, status, enabled, start_at,
  created_by, created_at, updated_at
) VALUES
  ('ann_foundation', 'Dashboard foundation in progress', 'The admin dashboard model is being prepared.', 'internal', 'production', 'draft', 1, unixepoch(), 'system', unixepoch(), unixepoch());

INSERT OR IGNORE INTO homepage_sections (
  id, section_key, environment, section_type, title, draft_content, status, enabled,
  order_index, created_at, updated_at
) VALUES
  ('home_hero', 'hero', 'production', 'hero', 'Hero', '{"headline":"Free online tools that do one thing well","ctaTool":"echo"}', 'draft', 1, 1, unixepoch(), unixepoch()),
  ('home_featured_tools', 'featured_tools', 'production', 'tool_grid', 'Featured tools', '{"source":"featured_tools"}', 'draft', 1, 2, unixepoch(), unixepoch());
