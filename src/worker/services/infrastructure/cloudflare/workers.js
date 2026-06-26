import { cfFetch } from "./client.js";

export async function listWorkers(credentials) {
  const data = await cfFetch("/accounts/{account_id}/workers/scripts", credentials);
  if (!data) return [];
  
  return data.map(script => ({
    resource_type: "worker",
    resource_id: script.id,
    resource_name: script.id, // Workers API uses ID as name usually
    metadata: {
      last_modified: script.modified_on,
      compatibility_date: script.compatibility_date || null
    }
  }));
}