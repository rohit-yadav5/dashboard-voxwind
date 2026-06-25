import { getUserContext } from "../services/permissions.js";

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

    if (!data.user) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    authUser = data.user;
  } catch (err) {
    console.error("Auth service verification failed", err);
    return { ok: false, status: 500, error: "Authentication service connection failed" };
  }

  if (!authUser || !authUser.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  // 2. Query the user's context (role & permissions) from D1
  let userContext;
  try {
    userContext = await getUserContext(env.DB, authUser.id);
  } catch (err) {
    console.error("getUserContext failed", err);
    return { ok: false, status: 500, error: "Database error during authorization check" };
  }

  if (!userContext || !userContext.roles || !userContext.roles.length) {
    return { ok: false, status: 403, error: "Admin role required" };
  }

  const primaryRole = userContext.roles[0];
  if (!ADMIN_ROLES.has(primaryRole)) {
    return { ok: false, status: 403, error: "Admin role required" };
  }

  const user = {
    id: userContext.user.id,
    email: userContext.user.email,
    displayName: userContext.user.displayName || userContext.user.email.split("@")[0],
    role: primaryRole,
    permissions: userContext.permissions
  };

  return { ok: true, user };
}

export function can(user, permission) {
  if (user.role === "owner") return true;
  return (user.permissions || []).includes(permission);
}


