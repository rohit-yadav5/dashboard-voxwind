export function json(body, request, env, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const origin = request.headers.get("Origin");
  if (origin && origin === env.DASHBOARD_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }

  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers
  });
}

export function notFound(request, env) {
  return json({ ok: false, error: "Not found" }, request, env, { status: 404 });
}

export async function readJson(request, maxBytes = 32 * 1024) {
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > maxBytes) throw new Error("Payload too large");
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error("Payload too large");
  return raw ? JSON.parse(raw) : {};
}
