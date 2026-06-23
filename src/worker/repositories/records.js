import { all, decodeRow, decodeRows, first } from "../db/base.js";
import { nowSeconds } from "../lib/env.js";
import { id } from "../lib/ids.js";
import { announcementInput, featureFlagInput, homepageSectionInput } from "../validation/simple-records.js";

const specs = {
  feature_flags: {
    idPrefix: "flag",
    validate: featureFlagInput,
    key: "flag_key",
    columns: ["flag_key", "description", "scope", "enabled", "rollout_percentage", "rules_json"]
  },
  announcements: {
    idPrefix: "ann",
    validate: announcementInput,
    key: "id",
    columns: ["title", "body", "audience", "status", "enabled", "start_at", "end_at"]
  },
  homepage_sections: {
    idPrefix: "home",
    validate: homepageSectionInput,
    key: "section_key",
    columns: ["section_key", "section_type", "title", "draft_content", "status", "enabled", "order_index"]
  }
};

export async function listRecords(env, table, environment) {
  assertTable(table);
  const order = table === "homepage_sections" ? "order_index ASC, created_at DESC" : "created_at DESC";
  const rows = await all(env.DB, `SELECT * FROM ${table} WHERE environment = ? AND deleted_at IS NULL ORDER BY ${order}`, [environment]);
  return decodeRows(rows);
}

export async function getRecord(env, table, recordId, environment) {
  assertTable(table);
  const row = await first(env.DB, `SELECT * FROM ${table} WHERE environment = ? AND id = ?`, [environment, recordId]);
  return decodeRow(row);
}

export async function createRecord(env, table, environment, input, actor) {
  assertTable(table);
  const spec = specs[table];
  const now = nowSeconds();
  const record = spec.validate(input);
  const recordId = id(spec.idPrefix);
  const cols = ["id", "environment", ...spec.columns, "created_at", "updated_at"];
  const values = [recordId, environment, ...spec.columns.map((col) => record[col]), now, now];
  if (table === "announcements") {
    cols.push("created_by");
    values.push(actor.id);
  }
  const placeholders = cols.map(() => "?").join(", ");
  await env.DB.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`).bind(...values).run();
  return getRecord(env, table, recordId, environment);
}

export async function updateRecord(env, table, environment, recordId, input) {
  assertTable(table);
  const before = await getRecord(env, table, recordId, environment);
  if (!before || before.deleted_at) return { before, after: null };
  const spec = specs[table];
  const next = spec.validate({ ...before, ...input });
  const now = nowSeconds();
  const sets = spec.columns.map((col) => `${col} = ?`);
  sets.push("draft_version = draft_version + 1", "updated_at = ?");
  await env.DB.prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ? AND environment = ?`)
    .bind(...spec.columns.map((col) => next[col]), now, before.id, environment)
    .run();
  return { before, after: await getRecord(env, table, before.id, environment) };
}

export async function archiveRecord(env, table, environment, recordId) {
  assertTable(table);
  const before = await getRecord(env, table, recordId, environment);
  if (!before || before.deleted_at) return { before, after: null };
  const now = nowSeconds();
  await env.DB.prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ? AND environment = ?`)
    .bind(now, now, before.id, environment)
    .run();
  return { before, after: await getRecord(env, table, before.id, environment) };
}

export async function markRecordsPublished(env, environment, version, publishedAt) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE feature_flags SET published_version = ?, published_at = ? WHERE environment = ? AND deleted_at IS NULL`).bind(version, publishedAt, environment),
    env.DB.prepare(`UPDATE announcements SET published_version = ?, published_at = ?, status = CASE WHEN status = 'draft' THEN 'published' ELSE status END WHERE environment = ? AND deleted_at IS NULL`).bind(version, publishedAt, environment),
    env.DB.prepare(`UPDATE homepage_sections SET published_content = draft_content, published_version = ?, published_at = ?, status = CASE WHEN status = 'draft' THEN 'published' ELSE status END WHERE environment = ? AND deleted_at IS NULL`).bind(version, publishedAt, environment)
  ]);
}

function assertTable(table) {
  if (!specs[table]) throw new Error("Unsupported table");
}
