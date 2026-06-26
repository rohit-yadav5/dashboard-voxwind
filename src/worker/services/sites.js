import { archiveSiteRecord, getSite, insertSite, listSites, updateSiteRecord } from "../repositories/sites.js";
import { nowSeconds } from "../lib/env.js";
import { id } from "../lib/ids.js";

// Basic slugify function for generated slugs
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function fetchAllSites(env) {
  // Can expand later with pagination/filtering logic
  return listSites(env, { includeArchived: false });
}

export async function fetchSite(env, idOrSlug) {
  return getSite(env, idOrSlug);
}

export async function createNewSite(env, input, actor) {
  // Validate input
  if (!input.name) throw new Error("Site name is required");

  // Slug generation and uniqueness check
  let slug = input.slug ? slugify(input.slug) : slugify(input.name);
  if (!slug) throw new Error("Invalid slug");
  
  const existing = await getSite(env, slug);
  if (existing) {
    throw new Error("A site with this slug already exists.");
  }

  const now = nowSeconds();
  const siteId = id("site");

  const siteRecord = {
    id: siteId,
    name: input.name.trim(),
    slug: slug,
    display_name: input.display_name || input.name.trim(),
    primary_domain: input.primary_domain || null,
    status: input.status || "draft",
    visibility: input.visibility || "private",
    icon: input.icon || null,
    description: input.description || null,
    created_at: now,
    updated_at: now
  };

  const created = await insertSite(env, siteRecord);
  return created;
}

export async function updateExistingSite(env, siteId, input) {
  const existing = await getSite(env, siteId);
  if (!existing || existing.archived_at) throw new Error("Site not found or archived");

  // Prevent slug modifications
  if (input.slug && input.slug !== existing.slug) {
    throw new Error("Site slug cannot be modified after creation.");
  }

  const next = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    display_name: input.display_name !== undefined ? input.display_name.trim() : existing.display_name,
    primary_domain: input.primary_domain !== undefined ? input.primary_domain : existing.primary_domain,
    status: input.status || existing.status,
    visibility: input.visibility || existing.visibility,
    icon: input.icon !== undefined ? input.icon : existing.icon,
    description: input.description !== undefined ? input.description : existing.description
  };

  return updateSiteRecord(env, existing.id, next);
}

export async function archiveExistingSite(env, siteId) {
  const existing = await getSite(env, siteId);
  if (!existing || existing.archived_at) throw new Error("Site not found or already archived");
  
  return archiveSiteRecord(env, existing.id);
}