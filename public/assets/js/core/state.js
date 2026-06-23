export const session = {
  isAuthenticated: false,
  user: null,
  permissions: []
};

export const roles = {
  normal_user: [],
  support: ["users:read", "analytics:read"],
  editor: ["content:read", "content:write", "tools:read", "seo:write"],
  admin: ["content:write", "tools:write", "users:read", "flags:write", "analytics:read"],
  owner: ["*"]
};

export async function initializeSession() {
  try {
    const res = await fetch("/api/admin/session", { credentials: "include" });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.ok) {
        session.isAuthenticated = true;
        session.user = data.user;
        session.permissions = data.permissions;
      } else {
        session.isAuthenticated = false;
        session.user = null;
        session.permissions = [];
      }
    } else {
      session.isAuthenticated = false;
      session.user = null;
      session.permissions = [];
    }
  } catch (err) {
    console.error("Session verification failed", err);
    session.isAuthenticated = false;
    session.user = null;
    session.permissions = [];
  }
}

export function can(permission) {
  if (!session.isAuthenticated) return false;
  return session.permissions.includes("*") || session.permissions.includes(permission);
}

export function requirePermission(permission) {
  if (!session.isAuthenticated) return { ok: false, redirect: "/login" };
  if (!can(permission)) return { ok: false, forbidden: true };
  return { ok: true };
}

export function setMockRole(role) {
  if (!roles[role]) return;
  if (session.user) {
    session.user.role = role;
    session.permissions = roles[role] || [];
  }
}

