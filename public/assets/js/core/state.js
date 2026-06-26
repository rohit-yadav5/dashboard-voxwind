export const session = {
  isAuthenticated: false,
  user: null,
  permissions: [],
  activeSite: null
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
  if (session.user?.role === "owner") return true;
  return session.permissions.includes(permission);
}

export function requirePermission(permission) {
  if (!session.isAuthenticated) return { ok: false, redirect: "/login" };
  if (!can(permission)) return { ok: false, forbidden: true };
  return { ok: true };
}

export function setActiveSite(site) {
  session.activeSite = {
    id: site.id,
    slug: site.slug,
    displayName: site.display_name || site.displayName || site.name,
    primaryDomain: site.primary_domain || site.primaryDomain || null,
    status: site.status,
    permissions: site.permissions || []
  };
  localStorage.setItem("vw_active_site", JSON.stringify(session.activeSite));
  document.dispatchEvent(new CustomEvent("site:changed", { detail: session.activeSite }));
}

export function loadActiveSite() {
  try {
    const cached = localStorage.getItem("vw_active_site");
    if (cached) {
      session.activeSite = JSON.parse(cached);
    }
  } catch (err) {
    console.error("Failed to load active site from cache", err);
  }
}

// Call load automatically on init
loadActiveSite();
