import { cacheKey } from "../lib/env.js";

export async function getCachedJson(env, environment, name) {
  if (!env.CONFIG_CACHE) return null;
  const raw = await env.CONFIG_CACHE.get(cacheKey(environment, name));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function putCachedJson(env, environment, name, value, metadata = {}) {
  if (!env.CONFIG_CACHE) return;
  await env.CONFIG_CACHE.put(cacheKey(environment, name), JSON.stringify(value), {
    metadata: { environment, name, ...metadata }
  });
}

export function publicCacheHeaders(maxAge = 60) {
  return {
    "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=300`
  };
}
