import { id } from "../lib/ids.js";
import { nowSeconds } from "../lib/env.js";
import { stringify } from "../lib/json.js";

export async function audit(env, request, actor, entry) {
  if (!env.DB) return;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = request.headers.get("User-Agent") || "";
  await env.DB.prepare(
    `INSERT INTO audit_logs
     (id, actor_id, actor_user_id, action, resource_type, resource_id, before_json, after_json, metadata_json, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id("audit"),
    actor?.id || null,
    actor?.id || null,
    entry.action,
    entry.resourceType,
    entry.resourceId || null,
    entry.before === undefined ? null : stringify(entry.before, null),
    entry.after === undefined ? null : stringify(entry.after, null),
    entry.metadata === undefined ? null : stringify(entry.metadata, {}),
    ip,
    ua.slice(0, 512),
    nowSeconds()
  ).run();
}
