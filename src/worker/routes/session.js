import { requireAdmin } from "../lib/guards.js";
import { json } from "../lib/response.js";

const ALL_SYSTEM_PERMISSIONS = [
  "dashboard.access", "tools.read", "tools.write", 
  "content.read", "content.write", "flags.read", "flags.write", 
  "users.read", "analytics.read", "profile.read", "profile.write"
];

export async function handleSession(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, request, env, { status: auth.status });
  }

  const permissions = auth.user.role === "owner" 
    ? ALL_SYSTEM_PERMISSIONS
    : auth.user.permissions;

  return json({
    ok: true,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      displayName: auth.user.displayName,
      role: auth.user.role
    },
    permissions,
    mode: "production"
  }, request, env);
}


