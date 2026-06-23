import { runtimeEnvironment } from "../../lib/env.js";
import { json, readJson } from "../../lib/response.js";
import { can } from "../../lib/guards.js";
import { audit } from "../../services/audit.js";
import { createPublishPreview, publishPublicConfig } from "../../services/config-publisher.js";
import { listConfigVersions } from "../../repositories/configVersions.js";

export async function handleAdminConfig(request, env, ctx, auth) {
  const url = new URL(request.url);
  const environment = runtimeEnvironment(env, url);

  if (url.pathname === "/api/admin/config/preview" && request.method === "GET") {
    const preview = await createPublishPreview(env, environment);
    return json({ ok: true, environment, ...preview }, request, env);
  }

  if (url.pathname === "/api/admin/config/versions" && request.method === "GET") {
    return json({ ok: true, environment, versions: await listConfigVersions(env, environment) }, request, env);
  }

  if (url.pathname === "/api/admin/config/publish" && request.method === "POST") {
    if (!can(auth.user, "content:write")) return json({ ok: false, error: "Missing content:write permission" }, request, env, { status: 403 });
    const body = await readJson(request).catch(() => ({}));
    const result = await publishPublicConfig(env, environment, auth.user, body.notes || "");
    ctx.waitUntil(audit(env, request, auth.user, {
      action: "config.publish",
      resourceType: "public_config",
      resourceId: String(result.version),
      after: { version: result.version, snapshotHash: result.snapshotHash },
      metadata: { environment }
    }));
    return json({ ok: true, environment, version: result.version, snapshotHash: result.snapshotHash, publishedAt: result.publishedAt }, request, env);
  }

  return null;
}
