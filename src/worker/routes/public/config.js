import { runtimeEnvironment } from "../../lib/env.js";
import { json } from "../../lib/response.js";
import { getCachedJson, publicCacheHeaders } from "../../services/cache.js";
import { createPublishPreview } from "../../services/config-publisher.js";

const names = {
  "/api/public/tools": "tools",
  "/api/public/homepage": "homepage",
  "/api/public/feature-flags": "feature-flags",
  "/api/public/config": "config"
};

export async function handlePublicConfig(request, env) {
  const url = new URL(request.url);
  const name = names[url.pathname];
  if (!name || request.method !== "GET") return null;

  const environment = runtimeEnvironment(env, url);
  let payload = await getCachedJson(env, environment, name);

  if (!payload) {
    const preview = await createPublishPreview(env, environment);
    const snapshot = preview.snapshot;
    payload = name === "config"
      ? snapshot
      : name === "feature-flags"
        ? snapshot.featureFlags
        : snapshot[name];
  }

  const payloadKey = name === "feature-flags" ? "featureFlags" : name;
  return json({ ok: true, environment, [payloadKey]: payload }, request, env, {
    headers: publicCacheHeaders(60)
  });
}
