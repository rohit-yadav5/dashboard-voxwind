import { runtimeEnvironment, nowSeconds } from "../../lib/env.js";
import { json, readJson } from "../../lib/response.js";
import { can } from "../../lib/guards.js";
import { audit } from "../../services/audit.js";
import { buildUploadIntent, createSignedUploadUrl } from "../../services/media/index.js";

export async function handleAdminMedia(request, env, ctx, auth) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/admin/media")) return null;
  const environment = runtimeEnvironment(env, url);

  if (url.pathname === "/api/admin/media/upload-intent" && request.method === "POST") {
    if (!can(auth.user, "content:write")) return json({ ok: false, error: "Missing content:write permission" }, request, env, { status: 403 });
    const body = await readJson(request);
    const asset = await createSignedUploadUrl(env, {
      ...buildUploadIntent({ environment, fileName: body.fileName, mimeType: body.mimeType }),
      uploadUrlExpiresAt: nowSeconds() + 900
    });
    ctx.waitUntil(audit(env, request, auth.user, { action: "media.upload_intent", resourceType: "media_asset", resourceId: asset.id, after: asset, metadata: { environment } }));
    return json({ ok: true, asset, note: "R2 signed upload generation is intentionally scaffolded for a later phase." }, request, env, { status: 201 });
  }

  return json({ ok: false, error: "Media route not found" }, request, env, { status: 404 });
}
