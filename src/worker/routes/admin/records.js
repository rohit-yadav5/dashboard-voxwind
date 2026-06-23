import { runtimeEnvironment } from "../../lib/env.js";
import { json, readJson } from "../../lib/response.js";
import { can } from "../../lib/guards.js";
import { audit } from "../../services/audit.js";
import { archiveRecord, createRecord, listRecords, updateRecord } from "../../repositories/records.js";

const routeMap = {
  "/api/admin/feature-flags": { table: "feature_flags", resourceType: "feature_flag", permission: "flags:write" },
  "/api/admin/announcements": { table: "announcements", resourceType: "announcement", permission: "content:write" },
  "/api/admin/homepage-sections": { table: "homepage_sections", resourceType: "homepage_section", permission: "content:write" }
};

export async function handleAdminRecords(request, env, ctx, auth) {
  const url = new URL(request.url);
  const environment = runtimeEnvironment(env, url);
  const match = Object.keys(routeMap).find((base) => url.pathname === base || url.pathname.startsWith(`${base}/`));
  if (!match) return null;
  const spec = routeMap[match];
  const suffix = url.pathname.slice(match.length).split("/").filter(Boolean);
  const recordId = suffix[0];
  const action = suffix[1];

  if (!recordId && request.method === "GET") {
    return json({ ok: true, environment, records: await listRecords(env, spec.table, environment) }, request, env);
  }

  if (!recordId && request.method === "POST") {
    if (!can(auth.user, spec.permission)) return json({ ok: false, error: `Missing ${spec.permission} permission` }, request, env, { status: 403 });
    const record = await createRecord(env, spec.table, environment, await readJson(request), auth.user);
    ctx.waitUntil(audit(env, request, auth.user, { action: `${spec.resourceType}.create`, resourceType: spec.resourceType, resourceId: record.id, after: record, metadata: { environment } }));
    return json({ ok: true, record }, request, env, { status: 201 });
  }

  if (recordId && (request.method === "PUT" || request.method === "PATCH") && !action) {
    if (!can(auth.user, spec.permission)) return json({ ok: false, error: `Missing ${spec.permission} permission` }, request, env, { status: 403 });
    const result = await updateRecord(env, spec.table, environment, decodeURIComponent(recordId), await readJson(request));
    if (!result.after) return json({ ok: false, error: "Record not found" }, request, env, { status: 404 });
    ctx.waitUntil(audit(env, request, auth.user, { action: `${spec.resourceType}.update`, resourceType: spec.resourceType, resourceId: result.after.id, before: result.before, after: result.after, metadata: { environment } }));
    return json({ ok: true, record: result.after }, request, env);
  }

  if (recordId && request.method === "POST" && action === "archive") {
    if (!can(auth.user, spec.permission)) return json({ ok: false, error: `Missing ${spec.permission} permission` }, request, env, { status: 403 });
    const result = await archiveRecord(env, spec.table, environment, decodeURIComponent(recordId));
    if (!result.after) return json({ ok: false, error: "Record not found" }, request, env, { status: 404 });
    ctx.waitUntil(audit(env, request, auth.user, { action: `${spec.resourceType}.archive`, resourceType: spec.resourceType, resourceId: result.after.id, before: result.before, after: result.after, metadata: { environment } }));
    return json({ ok: true, record: result.after }, request, env);
  }

  return json({ ok: false, error: "Record route not found" }, request, env, { status: 404 });
}
