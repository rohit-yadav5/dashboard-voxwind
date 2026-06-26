import { cfFetch } from "./client.js";

export async function listR2(credentials) {
  // R2 buckets endpoint
  const data = await cfFetch("/accounts/{account_id}/r2/buckets", credentials);
  // data might be wrapped or just an array
  const buckets = data?.buckets || data || [];
  if (!Array.isArray(buckets)) return [];
  
  return buckets.map(b => ({
    resource_type: "r2",
    resource_id: b.name,
    resource_name: b.name,
    metadata: {
      region: b.location || "auto"
    }
  }));
}