import { syncProviderResources } from "./infrastructure/provider.js";
import { listSiteResources, insertSyncHistory, replaceProviderResources } from "../repositories/resources.js";
import { nowSeconds } from "../lib/env.js";
import { id } from "../lib/ids.js";
import { getSite } from "../repositories/sites.js";

export async function getCachedResources(env, siteId) {
  const site = await getSite(env, siteId);
  if (!site) throw new Error("Site not found");

  return listSiteResources(env, siteId);
}

export async function syncResourcesForProvider(env, siteId, provider) {
  const site = await getSite(env, siteId);
  if (!site) throw new Error("Site not found");

  const start = nowSeconds();
  const syncId = id("sync");

  try {
    const result = await syncProviderResources(env, provider, siteId);
    const end = nowSeconds();

    if (result.status === "success") {
      // Normalize and prepare for DB insertion
      const toInsert = result.resources.map(res => ({
        id: id("res"),
        resource_type: res.resource_type,
        resource_id: res.resource_id,
        resource_name: res.resource_name,
        metadata_json: JSON.stringify(res.metadata || {})
      }));

      // Cache resources in DB
      await replaceProviderResources(env, siteId, provider, toInsert, end);

      // Record History
      await insertSyncHistory(env, {
        id: syncId,
        site_id: siteId,
        provider: provider,
        started_at: start,
        completed_at: end,
        duration: end - start,
        resources_found: result.resourcesFound,
        status: "success",
        error_message: null
      });

      return { ok: true, syncId, resourcesFound: result.resourcesFound };
    } else {
      throw new Error(result.error || "Unknown provider error");
    }
  } catch (error) {
    const end = nowSeconds();
    await insertSyncHistory(env, {
      id: syncId,
      site_id: siteId,
      provider: provider,
      started_at: start,
      completed_at: end,
      duration: end - start,
      resources_found: 0,
      status: "error",
      error_message: error.message
    });
    throw error;
  }
}