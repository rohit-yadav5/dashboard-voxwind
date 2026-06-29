import { json, notFound } from "./lib/response.js";
import { requireAdmin } from "./lib/guards.js";
import { handleSession } from "./routes/session.js";
import { handleAdminTools } from "./routes/admin/tools.js";
import { handleAdminRecords } from "./routes/admin/records.js";
import { handleAdminConfig } from "./routes/admin/config.js";
import { handleAdminMedia } from "./routes/admin/media.js";
import { handleAdminSites } from "./routes/admin/sites.js";
import { handlePublicConfig } from "./routes/public/config.js";

const API_PREFIX = "/api/admin";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "dashboard-voxwind", env: env.APP_ENV || "unknown" }, request, env);
    }

    if (url.pathname.startsWith("/api/public/")) {
      const publicResponse = await handlePublicConfig(request, env);
      if (publicResponse) return publicResponse;
    }

    if (url.pathname === `${API_PREFIX}/session`) {
      return handleSession(request, env);
    }

    if (url.pathname === `${API_PREFIX}/logout` && request.method === "POST") {
      const authOrigin = env.AUTH_ORIGIN || "https://auth.voxwind.com";
      const cookie = request.headers.get("Cookie");
      
      const reqHeaders = new Headers();
      if (cookie) {
        reqHeaders.set("Cookie", cookie);
      }
      
      try {
        const authRes = await fetch(`${authOrigin}/api/logout`, {
          method: "POST",
          headers: reqHeaders
        });
        
        const resHeaders = new Headers();
        if (authRes.headers.getSetCookie) {
          for (const cookieVal of authRes.headers.getSetCookie()) {
            resHeaders.append("Set-Cookie", cookieVal);
          }
        } else {
          const setCookie = authRes.headers.get("Set-Cookie");
          if (setCookie) {
            resHeaders.set("Set-Cookie", setCookie);
          }
        }
        
        const body = await authRes.json().catch(() => ({ ok: true }));
        return json(body, request, env, { status: authRes.status, headers: resHeaders });
      } catch (err) {
        console.error("Logout request forwarding failed", err);
        return json({ ok: false, error: "Logout failed" }, request, env, { status: 500 });
      }
    }


    if (url.pathname.startsWith(API_PREFIX)) {
      const auth = await requireAdmin(request, env);
      if (!auth.ok) return json({ ok: false, error: auth.error }, request, env, { status: auth.status });

      if (url.pathname.startsWith(`${API_PREFIX}/tools`)) {
        return handleAdminTools(request, env, ctx, auth);
      }
      
      if (url.pathname.startsWith(`${API_PREFIX}/sites`)) {
        const response = await handleAdminSites(request, env, ctx, auth);
        if (response) return response;
      }

      if (url.pathname.startsWith(`${API_PREFIX}/config`)) {
        const response = await handleAdminConfig(request, env, ctx, auth);
        if (response) return response;
      }

      const recordsResponse = await handleAdminRecords(request, env, ctx, auth);
      if (recordsResponse) return recordsResponse;

      const mediaResponse = await handleAdminMedia(request, env, ctx, auth);
      if (mediaResponse) return mediaResponse;

      return json({ ok: false, error: "Admin route not found" }, request, env, { status: 404 });
    }

    return env.ASSETS.fetch(request).catch(() => notFound(request, env));
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  };
  if (origin) {
    const allowed = env.DASHBOARD_ORIGIN || "https://dashboard.voxwind.com";
    const isDev = env.APP_ENV === "development" && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"));
    if (origin === allowed || isDev) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  }
  return headers;
}
