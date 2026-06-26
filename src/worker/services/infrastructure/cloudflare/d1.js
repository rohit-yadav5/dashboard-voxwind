import { cfFetch } from "./client.js";

export async function listD1(credentials) {
  const data = await cfFetch("/accounts/{account_id}/d1/database", credentials);
  if (!data) return [];
  
  return data.map(db => ({
    resource_type: "d1",
    resource_id: db.uuid,
    resource_name: db.name,
    metadata: {
      version: db.version
    }
  }));
}