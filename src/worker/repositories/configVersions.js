import { all, decodeRows, first } from "../db/base.js";
import { nowSeconds } from "../lib/env.js";
import { id } from "../lib/ids.js";
import { stringify } from "../lib/json.js";

export async function nextVersion(env, environment) {
  const row = await first(env.DB, `SELECT MAX(version) AS version FROM config_versions WHERE environment = ?`, [environment]);
  return Number(row?.version || 0) + 1;
}

export async function createConfigVersion(env, environment, snapshot, hash, actor, notes = "") {
  const version = await nextVersion(env, environment);
  const createdAt = nowSeconds();
  const recordId = id("cfgver");
  await env.DB.prepare(
    `INSERT INTO config_versions (id, environment, version, snapshot_hash, snapshot_json, status, created_by, created_at, notes)
     VALUES (?, ?, ?, ?, ?, 'created', ?, ?, ?)`
  ).bind(recordId, environment, version, hash, stringify(snapshot), actor.id, createdAt, notes).run();
  return { id: recordId, environment, version, snapshotHash: hash, createdAt };
}

export async function markVersionPublished(env, environment, version, publishedAt) {
  await env.DB.prepare(
    `UPDATE config_versions SET status = 'published', published_at = ? WHERE environment = ? AND version = ?`
  ).bind(publishedAt, environment, version).run();
}

export async function createPublishedSnapshot(env, environment, version, kvKey, hash, actor, rollbackOfVersion = null) {
  const publishedAt = nowSeconds();
  await env.DB.prepare(
    `INSERT INTO published_snapshots
     (id, environment, version, kv_key, snapshot_hash, published_by, published_at, rollback_of_version, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}')`
  ).bind(id("pubsnap"), environment, version, kvKey, hash, actor.id, publishedAt, rollbackOfVersion).run();
  return { environment, version, kvKey, snapshotHash: hash, publishedAt };
}

export async function listConfigVersions(env, environment) {
  const rows = await all(env.DB,
    `SELECT id, environment, version, snapshot_hash, status, created_by, created_at, published_at, notes
     FROM config_versions WHERE environment = ? ORDER BY version DESC LIMIT 25`,
    [environment]
  );
  return decodeRows(rows);
}
