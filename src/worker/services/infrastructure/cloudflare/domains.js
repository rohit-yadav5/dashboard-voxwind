import { cfFetch } from "./client.js";

export async function listDomains(credentials) {
  // Cloudflare Zones endpoint (assumes Domains = Zones for this context)
  const data = await cfFetch("/zones?account.id={account_id}", credentials);
  if (!data) return [];
  
  return data.map(zone => ({
    resource_type: "domain",
    resource_id: zone.id,
    resource_name: zone.name,
    metadata: {
      status: zone.status,
      plan: zone.plan?.name || "Free"
    }
  }));
}