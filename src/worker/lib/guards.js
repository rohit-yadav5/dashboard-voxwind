const ADMIN_ROLES = new Set(["owner", "admin", "editor", "support"]);

export async function requireAdmin(request, env) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  // 1. Validate session with the core authentication service
  const authOrigin = env.AUTH_ORIGIN || "https://auth.voxwind.com";
  let authUser;
  try {
    const res = await fetch(`${authOrigin}/api/me`, {
      headers: { "Cookie": cookie }
    });
    if (!res.ok) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    const data = await res.json();
    authUser = data;
  } catch (err) {
    console.error("Auth service verification failed", err);
    return { ok: false, status: 500, error: "Authentication service connection failed" };
  }

  if (!authUser || !authUser.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  // 2. Query the user's role from the local dashboard database
  let userRole;
  try {
    userRole = await env.DB.prepare(
      `SELECT r.name FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`
    ).bind(authUser.id).first();
  } catch (err) {
    console.error("D1 role lookup failed", err);
    return { ok: false, status: 500, error: "Database error during authorization check" };
  }

  if (!userRole || !userRole.name) {
    return { ok: false, status: 403, error: "Admin role required" };
  }

  const user = {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.display_name || authUser.email.split("@")[0],
    role: userRole.name
  };

  if (!ADMIN_ROLES.has(user.role)) {
    return { ok: false, status: 403, error: "Admin role required" };
  }

  return { ok: true, user };
}

export function can(user, permission) {
  if (user.role === "owner") return true;
  const byRole = {
    admin: ["tools:write", "content:write", "flags:write", "analytics:read"],
    editor: ["tools:read", "content:write", "seo:write"],
    support: ["users:read", "analytics:read"]
  };
  return (byRole[user.role] || []).includes(permission);
}

