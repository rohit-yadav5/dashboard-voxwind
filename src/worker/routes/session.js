import { requireAdmin } from "../lib/guards.js";
import { json } from "../lib/response.js";

export async function handleSession(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, request, env, { status: auth.status });
  }

  const permissions = auth.user.role === "owner" ? ["*"] : getPermissionsForRole(auth.user.role);
  return json({
    ok: true,
    user: auth.user,
    permissions,
    mode: "production"
  }, request, env);
}

function getPermissionsForRole(role) {
  const byRole = {
    admin: ["tools:write", "content:write", "flags:write", "analytics:read"],
    editor: ["tools:read", "content:write", "seo:write"],
    support: ["users:read", "analytics:read"]
  };
  return byRole[role] || [];
}

