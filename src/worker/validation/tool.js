import { parseJson } from "../lib/json.js";

const STATUSES = new Set(["draft", "published", "beta", "live", "archived"]);
const VISIBILITIES = new Set(["private", "public", "unlisted"]);

export function validateToolInput(input = {}) {
  const name = string(input.name, 120) || "Untitled tool";
  const slug = slugify(input.slug || name);
  const status = STATUSES.has(input.status) ? input.status : "draft";
  const visibility = VISIBILITIES.has(input.visibility) ? input.visibility : "private";
  const endpoints = arrayFrom(input.apiEndpoints ?? input.api_endpoints_json);
  const flags = arrayFrom(input.featureFlags ?? input.feature_flags_json);
  const tags = arrayFrom(input.tags ?? input.tags_json);
  const limits = objectFrom(input.limits ?? input.limits_json);
  const draftConfig = objectFrom(input.draftConfig ?? input.draft_config_json ?? input.config);

  return {
    name,
    slug,
    description: string(input.description, 2000),
    icon: string(input.icon, 16) || "T",
    category: string(input.category, 80) || "Utility",
    lifecycle_state: string(input.lifecycle_state, 40) || "active",
    status,
    visibility,
    homepage_visibility: bool(input.homepage_visibility ?? input.homepageVisibility),
    featured: bool(input.featured),
    order_index: number(input.order_index ?? input.order, 100),
    public_url: string(input.public_url ?? input.urls?.public, 512),
    docs_url: string(input.docs_url ?? input.urls?.docs, 512),
    admin_url: string(input.admin_url ?? input.urls?.admin, 512),
    api_endpoints_json: JSON.stringify(endpoints),
    limits_json: JSON.stringify(limits),
    feature_flags_json: JSON.stringify(flags),
    tags_json: JSON.stringify(tags),
    analytics_key: string(input.analytics_key ?? input.analyticsKey, 120),
    draft_config_json: JSON.stringify(draftConfig)
  };
}

export function slugify(value) {
  return String(value || "tool")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "tool";
}

function string(value, max) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

function bool(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function number(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function arrayFrom(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    const parsed = parseJson(value, null);
    if (Array.isArray(parsed)) return parsed;
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function objectFrom(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") return parseJson(value, {});
  return {};
}
