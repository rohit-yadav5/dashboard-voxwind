import { all, decodeRows } from "../db/base.js";

export async function listSiteResources(env, siteId) {
  const rows = await all(env.DB,
    `SELECT * FROM site_resources WHERE site_id = ? ORDER BY provider ASC, resource_type ASC`,
    [siteId]
  );
  // Parse JSON metadata
  const decoded = decodeRows(rows);
  return decoded.map(row => ({
    ...row,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {}
  }));
}

export async function getSyncHistory(env, siteId, limit = 10) {
  const rows = await all(env.DB,
    `SELECT * FROM resource_sync_history WHERE site_id = ? ORDER BY started_at DESC LIMIT ?`,
    [siteId, limit]
  );
  return decodeRows(rows);
}

export async function insertSyncHistory(env, record) {
  await env.DB.prepare(
    `INSERT INTO resource_sync_history (id, site_id, provider, started_at, completed_at, duration, resources_found, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    record.id, record.site_id, record.provider, record.started_at,
    record.completed_at, record.duration, record.resources_found, record.status, record.error_message
  ).run();
}

export async function replaceProviderResources(env, siteId, provider, resources, timestamp) {
  // Simple full replace for now, wrapped in a batch transaction
  // "Structure the code so incremental syncs can be introduced later"
  // We'll delete existing provider resources and insert the newly discovered ones.
  const statements = [];
  
  statements.push(
    env.DB.prepare(`DELETE FROM site_resources WHERE site_id = ? AND provider = ?`).bind(siteId, provider)
  );

  for (const res of resources) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO site_resources (id, site_id, provider, resource_type, resource_id, resource_name, metadata_json, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        res.id, siteId, provider, res.resource_type, res.resource_id, res.resource_name,
        res.metadata_json, timestamp
      )
    );
  }

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
}