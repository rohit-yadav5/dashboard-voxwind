import { all, decodeRow, decodeRows, first } from "../db/base.js";
import { nowSeconds } from "../lib/env.js";
import { id } from "../lib/ids.js";
import { validateToolInput } from "../validation/tool.js";

export async function listTools(env, environment, { includeDeleted = false } = {}) {
  const where = includeDeleted ? "environment = ?" : "environment = ? AND deleted_at IS NULL";
  const rows = await all(env.DB,
    `SELECT * FROM tools WHERE ${where} ORDER BY order_index ASC, created_at DESC`,
    [environment]
  );
  return decodeRows(rows);
}

export async function getTool(env, idOrSlug, environment) {
  const row = await first(env.DB,
    `SELECT * FROM tools WHERE environment = ? AND (id = ? OR slug = ?)`,
    [environment, idOrSlug, idOrSlug]
  );
  return decodeRow(row);
}

export async function createTool(env, environment, input, actor) {
  const now = nowSeconds();
  const record = validateToolInput(input);
  const tool = {
    id: id("tool"),
    ...record,
    environment,
    created_by: actor.id,
    created_at: now,
    updated_at: now
  };
  await env.DB.prepare(
    `INSERT INTO tools
     (id, name, slug, description, icon, category, lifecycle_state, status, visibility,
      homepage_visibility, featured, order_index, public_url, docs_url, admin_url,
      api_endpoints_json, limits_json, feature_flags_json, tags_json, analytics_key,
      environment, draft_config_json, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    tool.id, tool.name, tool.slug, tool.description, tool.icon, tool.category,
    tool.lifecycle_state, tool.status, tool.visibility, tool.homepage_visibility ? 1 : 0,
    tool.featured ? 1 : 0, tool.order_index, tool.public_url, tool.docs_url, tool.admin_url,
    tool.api_endpoints_json, tool.limits_json, tool.feature_flags_json, tool.tags_json,
    tool.analytics_key, tool.environment, tool.draft_config_json, tool.created_by,
    tool.created_at, tool.updated_at
  ).run();
  return getTool(env, tool.id, environment);
}

export async function updateTool(env, environment, idOrSlug, input) {
  const before = await getTool(env, idOrSlug, environment);
  if (!before || before.deleted_at) return { before, after: null };
  const next = validateToolInput({ ...before, ...input });
  const now = nowSeconds();
  await env.DB.prepare(
    `UPDATE tools SET
      name = ?, slug = ?, description = ?, icon = ?, category = ?, lifecycle_state = ?,
      status = ?, visibility = ?, homepage_visibility = ?, featured = ?, order_index = ?,
      public_url = ?, docs_url = ?, admin_url = ?, api_endpoints_json = ?, limits_json = ?,
      feature_flags_json = ?, tags_json = ?, analytics_key = ?, draft_config_json = ?,
      draft_version = draft_version + 1, updated_at = ?
     WHERE id = ? AND environment = ?`
  ).bind(
    next.name, next.slug, next.description, next.icon, next.category, next.lifecycle_state,
    next.status, next.visibility, next.homepage_visibility ? 1 : 0, next.featured ? 1 : 0,
    next.order_index, next.public_url, next.docs_url, next.admin_url, next.api_endpoints_json,
    next.limits_json, next.feature_flags_json, next.tags_json, next.analytics_key,
    next.draft_config_json, now, before.id, environment
  ).run();
  return { before, after: await getTool(env, before.id, environment) };
}

export async function archiveTool(env, environment, idOrSlug) {
  const before = await getTool(env, idOrSlug, environment);
  if (!before || before.deleted_at) return { before, after: null };
  const now = nowSeconds();
  await env.DB.prepare(
    `UPDATE tools SET deleted_at = ?, lifecycle_state = 'archived', status = 'archived', updated_at = ? WHERE id = ? AND environment = ?`
  ).bind(now, now, before.id, environment).run();
  return { before, after: await getTool(env, before.id, environment) };
}

export async function duplicateTool(env, environment, idOrSlug, actor) {
  const before = await getTool(env, idOrSlug, environment);
  if (!before || before.deleted_at) return null;
  const copy = await createTool(env, environment, {
    ...before,
    name: `${before.name} Copy`,
    slug: `${before.slug}-copy`,
    status: "draft",
    visibility: "private",
    featured: false,
    homepage_visibility: false,
    order_index: before.order_index + 1
  }, actor);
  return { before, after: copy };
}

export async function reorderTools(env, environment, orderedIds = []) {
  const now = nowSeconds();
  const statements = orderedIds.map((toolId, index) => env.DB.prepare(
    `UPDATE tools SET order_index = ?, updated_at = ?, draft_version = draft_version + 1 WHERE id = ? AND environment = ? AND deleted_at IS NULL`
  ).bind(index + 1, now, toolId, environment));
  if (statements.length) await env.DB.batch(statements);
  return listTools(env, environment);
}

export async function markToolsPublished(env, environment, version, publishedAt) {
  await env.DB.prepare(
    `UPDATE tools
     SET published_config_json = draft_config_json, published_version = ?, published_at = ?, status = CASE WHEN status = 'draft' THEN 'published' ELSE status END
     WHERE environment = ? AND deleted_at IS NULL`
  ).bind(version, publishedAt, environment).run();
}
