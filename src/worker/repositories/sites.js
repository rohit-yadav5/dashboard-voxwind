import { all, decodeRow, decodeRows, first } from "../db/base.js";
import { nowSeconds } from "../lib/env.js";

export async function listSites(env, { includeArchived = false } = {}) {
  const where = includeArchived ? "1=1" : "archived_at IS NULL";
  const rows = await all(env.DB,
    `SELECT * FROM sites WHERE ${where} ORDER BY created_at DESC`
  );
  return decodeRows(rows);
}

export async function getSite(env, idOrSlug) {
  const row = await first(env.DB,
    `SELECT * FROM sites WHERE id = ? OR slug = ?`,
    [idOrSlug, idOrSlug]
  );
  return decodeRow(row);
}

export async function insertSite(env, site) {
  await env.DB.prepare(
    `INSERT INTO sites
     (id, name, slug, display_name, primary_domain, status, visibility, icon, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    site.id, site.name, site.slug, site.display_name, site.primary_domain,
    site.status, site.visibility, site.icon, site.description, site.created_at, site.updated_at
  ).run();
  return getSite(env, site.id);
}

export async function updateSiteRecord(env, id, next) {
  const now = nowSeconds();
  await env.DB.prepare(
    `UPDATE sites SET
      name = ?, slug = ?, display_name = ?, primary_domain = ?,
      status = ?, visibility = ?, icon = ?, description = ?, updated_at = ?
     WHERE id = ?`
  ).bind(
    next.name, next.slug, next.display_name, next.primary_domain,
    next.status, next.visibility, next.icon, next.description, now, id
  ).run();
  return getSite(env, id);
}

export async function archiveSiteRecord(env, id) {
  const now = nowSeconds();
  await env.DB.prepare(
    `UPDATE sites SET archived_at = ?, status = 'archived', updated_at = ? WHERE id = ?`
  ).bind(now, now, id).run();
  return getSite(env, id);
}

export async function insertSiteDomain(env, domainRecord) {
  await env.DB.prepare(
    `INSERT INTO site_domains (id, site_id, domain, is_primary, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    domainRecord.id, domainRecord.site_id, domainRecord.domain,
    domainRecord.is_primary, domainRecord.created_at
  ).run();
}