import { listWorkers } from "./workers.js";
import { listKV } from "./kv.js";
import { listD1 } from "./d1.js";
import { listR2 } from "./r2.js";
import { listDomains } from "./domains.js";

// Internal CF fetch wrapper
export async function cfFetch(path, credentials) {
  if (!credentials?.apiToken || !credentials?.accountId) {
    throw new Error("Missing Cloudflare API Token or Account ID");
  }

  // Replace {account_id} with actual
  const finalPath = path.replace("{account_id}", credentials.accountId);
  const url = `https://api.cloudflare.com/client/v4${finalPath}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${credentials.apiToken}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    const errorMsg = data?.errors?.[0]?.message || `Cloudflare API Error: ${res.status}`;
    throw new Error(errorMsg);
  }

  return data.result;
}

// Full Cloudflare Sync for a Site
export async function syncCloudflare(env, credentials, siteId) {
  // If credentials missing, fallback to mock mode safely
  if (!credentials?.apiToken || !credentials?.accountId) {
    console.warn("No Cloudflare credentials found. Returning empty discovery.");
    return {
      status: "success",
      resourcesFound: 0,
      resources: [],
      error: null
    };
  }

  try {
    // Run all discovery concurrently to save CPU wall time
    const [workers, kv, d1, r2, domains] = await Promise.all([
      listWorkers(credentials).catch(e => { console.error("CF Workers Sync Error", e); return []; }),
      listKV(credentials).catch(e => { console.error("CF KV Sync Error", e); return []; }),
      listD1(credentials).catch(e => { console.error("CF D1 Sync Error", e); return []; }),
      listR2(credentials).catch(e => { console.error("CF R2 Sync Error", e); return []; }),
      listDomains(credentials).catch(e => { console.error("CF Domains Sync Error", e); return []; }),
    ]);

    const resources = [...workers, ...kv, ...d1, ...r2, ...domains];

    return {
      status: "success",
      resourcesFound: resources.length,
      resources: resources,
      error: null
    };
  } catch (error) {
    return {
      status: "failed",
      resourcesFound: 0,
      resources: [],
      error: error.message
    };
  }
}