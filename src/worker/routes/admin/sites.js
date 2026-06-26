import { json } from "../../lib/response.js";
import { fetchAllSites, fetchSite, createNewSite, updateExistingSite, archiveExistingSite } from "../../services/sites.js";

export async function handleAdminSites(request, env, ctx, auth) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // GET /api/admin/sites
    if (request.method === "GET" && path === "/api/admin/sites") {
      const sites = await fetchAllSites(env);
      return json({ ok: true, sites }, request, env);
    }

    // POST /api/admin/sites
    if (request.method === "POST" && path === "/api/admin/sites") {
      const input = await request.json();
      const site = await createNewSite(env, input, auth.user);
      return json({ ok: true, site }, request, env, { status: 201 });
    }

    const match = path.match(/^\/api\/admin\/sites\/([^\/]+)(?:\/(.*))?$/);
    if (match) {
      const idOrSlug = match[1];
      const action = match[2];

      // GET /api/admin/sites/:id
      if (request.method === "GET" && !action) {
        const site = await fetchSite(env, idOrSlug);
        if (!site) return json({ ok: false, error: "Site not found" }, request, env, { status: 404 });
        return json({ ok: true, site }, request, env);
      }

      // PATCH /api/admin/sites/:id
      if (request.method === "PATCH" && !action) {
        const input = await request.json();
        const site = await updateExistingSite(env, idOrSlug, input);
        return json({ ok: true, site }, request, env);
      }

      // POST /api/admin/sites/:id/archive
      if (request.method === "POST" && action === "archive") {
        const site = await archiveExistingSite(env, idOrSlug);
        return json({ ok: true, site }, request, env);
      }

      // GET /api/admin/sites/:id/resources
      if (request.method === "GET" && action === "resources") {
        const { getCachedResources } = await import("../../services/site-resources.js");
        const resources = await getCachedResources(env, idOrSlug);
        return json({ ok: true, resources }, request, env);
      }

      // POST /api/admin/sites/:id/sync
      if (request.method === "POST" && action === "sync") {
        const { syncResourcesForProvider } = await import("../../services/site-resources.js");
        const input = await request.json().catch(() => ({}));
        // Use provided provider, default to cloudflare
        const provider = input.provider || "cloudflare";
        const result = await syncResourcesForProvider(env, idOrSlug, provider);
        return json(result, request, env);
      }
    }

    return null; // Let the main router return 404 if no match
  } catch (error) {
    return json({ ok: false, error: error.message }, request, env, { status: 400 });
  }
}