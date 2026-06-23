import { runtimeEnvironment } from "../../lib/env.js";
import { json, readJson } from "../../lib/response.js";
import { can } from "../../lib/guards.js";
import { audit } from "../../services/audit.js";
import {
  archiveTool,
  createTool,
  duplicateTool,
  getTool,
  listTools,
  reorderTools,
  updateTool
} from "../../repositories/tools.js";

export async function handleAdminTools(request, env, ctx, auth) {
  const url = new URL(request.url);
  const environment = runtimeEnvironment(env, url);
  const parts = url.pathname.split("/").filter(Boolean);
  const toolId = parts[3];
  const action = parts[4];

  if (url.pathname === "/api/admin/tools" && request.method === "GET") {
    return json({ ok: true, environment, tools: await listTools(env, environment) }, request, env);
  }

  if (url.pathname === "/api/admin/tools" && request.method === "POST") {
    if (!can(auth.user, "tools:write")) return json({ ok: false, error: "Missing tools:write permission" }, request, env, { status: 403 });
    const body = await readJson(request);
    const tool = await createTool(env, environment, body, auth.user);
    ctx.waitUntil(audit(env, request, auth.user, { action: "tool.create", resourceType: "tool", resourceId: tool.id, after: tool, metadata: { environment } }));
    return json({ ok: true, tool }, request, env, { status: 201 });
  }

  if (url.pathname === "/api/admin/tools/reorder" && request.method === "POST") {
    if (!can(auth.user, "tools:write")) return json({ ok: false, error: "Missing tools:write permission" }, request, env, { status: 403 });
    const body = await readJson(request);
    const tools = await reorderTools(env, environment, Array.isArray(body.orderedIds) ? body.orderedIds : []);
    ctx.waitUntil(audit(env, request, auth.user, { action: "tool.reorder", resourceType: "tool", resourceId: "bulk", after: body.orderedIds, metadata: { environment } }));
    return json({ ok: true, tools }, request, env);
  }

  if (!toolId) return json({ ok: false, error: "Tool route not found" }, request, env, { status: 404 });

  if (request.method === "GET" && !action) {
    const tool = await getTool(env, decodeURIComponent(toolId), environment);
    if (!tool || tool.deleted_at) return json({ ok: false, error: "Tool not found" }, request, env, { status: 404 });
    return json({ ok: true, tool }, request, env);
  }

  if ((request.method === "PUT" || request.method === "PATCH") && !action) {
    if (!can(auth.user, "tools:write")) return json({ ok: false, error: "Missing tools:write permission" }, request, env, { status: 403 });
    const body = await readJson(request);
    const { before, after } = await updateTool(env, environment, decodeURIComponent(toolId), body);
    if (!after) return json({ ok: false, error: "Tool not found" }, request, env, { status: 404 });
    ctx.waitUntil(audit(env, request, auth.user, { action: "tool.update", resourceType: "tool", resourceId: after.id, before, after, metadata: { environment } }));
    return json({ ok: true, tool: after }, request, env);
  }

  if (request.method === "POST" && action === "archive") {
    if (!can(auth.user, "tools:write")) return json({ ok: false, error: "Missing tools:write permission" }, request, env, { status: 403 });
    const { before, after } = await archiveTool(env, environment, decodeURIComponent(toolId));
    if (!after) return json({ ok: false, error: "Tool not found" }, request, env, { status: 404 });
    ctx.waitUntil(audit(env, request, auth.user, { action: "tool.archive", resourceType: "tool", resourceId: after.id, before, after, metadata: { environment } }));
    return json({ ok: true, tool: after }, request, env);
  }

  if (request.method === "POST" && action === "duplicate") {
    if (!can(auth.user, "tools:write")) return json({ ok: false, error: "Missing tools:write permission" }, request, env, { status: 403 });
    const result = await duplicateTool(env, environment, decodeURIComponent(toolId), auth.user);
    if (!result) return json({ ok: false, error: "Tool not found" }, request, env, { status: 404 });
    ctx.waitUntil(audit(env, request, auth.user, { action: "tool.duplicate", resourceType: "tool", resourceId: result.after.id, before: result.before, after: result.after, metadata: { environment } }));
    return json({ ok: true, tool: result.after }, request, env, { status: 201 });
  }

  return json({ ok: false, error: "Tool route not found" }, request, env, { status: 404 });
}
