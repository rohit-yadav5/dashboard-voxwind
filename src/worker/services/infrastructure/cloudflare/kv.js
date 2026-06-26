import { cfFetch } from "./client.js";

export async function listKV(credentials) {
  const data = await cfFetch("/accounts/{account_id}/storage/kv/namespaces", credentials);
  if (!data) return [];
  
  return data.map(ns => ({
    resource_type: "kv",
    resource_id: ns.id,
    resource_name: ns.title,
    metadata: {}
  }));
}