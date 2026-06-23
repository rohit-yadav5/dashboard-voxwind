import {
  analytics,
  announcements as mockAnnouncements,
  featureFlags as mockFlags,
  homepageSections as mockHomepageSections,
  seoPages,
  tools as mockTools,
  users
} from "./mock-data.js";

const API_BASE = "";
let environment = localStorage.getItem("vw_dashboard_env") || "production";

export function getEnvironment() {
  return environment;
}

export function setEnvironment(value) {
  environment = value;
  localStorage.setItem("vw_dashboard_env", value);
}

async function request(path, options = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  url.searchParams.set("env", environment);
  const init = {
    method: options.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);
  const res = await fetch(url.toString(), init);
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function withFallback(fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    console.warn("API fallback in use", err?.message || err);
    return structuredClone(fallback);
  }
}

export async function listTools() {
  const data = await withFallback(() => request("/api/admin/tools"), { tools: mockTools });
  return (data.tools || []).map(normalizeTool).sort((a, b) => a.order - b.order);
}

export async function createTool(input) {
  const data = await request("/api/admin/tools", { method: "POST", body: input });
  return normalizeTool(data.tool);
}

export async function updateTool(id, input) {
  const data = await request(`/api/admin/tools/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  return normalizeTool(data.tool);
}

export async function archiveTool(id) {
  const data = await request(`/api/admin/tools/${encodeURIComponent(id)}/archive`, { method: "POST" });
  return normalizeTool(data.tool);
}

export async function duplicateTool(id) {
  const data = await request(`/api/admin/tools/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
  return normalizeTool(data.tool);
}

export async function publishConfig(notes = "") {
  return request("/api/admin/config/publish", { method: "POST", body: { notes } });
}

export async function previewConfig() {
  return request("/api/admin/config/preview");
}

export async function listConfigVersions() {
  const data = await withFallback(() => request("/api/admin/config/versions"), { versions: [] });
  return data.versions || [];
}

export async function listUsers() {
  return structuredClone(users);
}

export async function listFlags() {
  const data = await withFallback(() => request("/api/admin/feature-flags"), { records: mockFlags });
  return (data.records || []).map((flag) => ({
    id: flag.id || flag.key,
    key: flag.flag_key || flag.key,
    description: flag.description,
    enabled: Boolean(flag.enabled),
    scope: flag.scope,
    environment: flag.environment || getEnvironment(),
    rolloutPercentage: flag.rollout_percentage ?? flag.rolloutPercentage ?? 0,
    publishedVersion: flag.published_version || 0,
    draftVersion: flag.draft_version || 1
  }));
}

export async function createFlag(input) {
  const data = await request("/api/admin/feature-flags", { method: "POST", body: input });
  return data.record;
}

export async function updateFlag(id, input) {
  const data = await request(`/api/admin/feature-flags/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  return data.record;
}

export async function archiveFlag(id) {
  const data = await request(`/api/admin/feature-flags/${encodeURIComponent(id)}/archive`, { method: "POST" });
  return data.record;
}

export async function listAnnouncements() {
  const data = await withFallback(() => request("/api/admin/announcements"), { records: mockAnnouncements });
  return (data.records || []).map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    status: item.status,
    audience: item.audience,
    startsAt: item.start_at ? new Date(item.start_at * 1000).toISOString().slice(0, 10) : item.startsAt,
    enabled: Boolean(item.enabled),
    publishedVersion: item.published_version || 0,
    draftVersion: item.draft_version || 1
  }));
}

export async function createAnnouncement(input) {
  const data = await request("/api/admin/announcements", { method: "POST", body: input });
  return data.record;
}

export async function updateAnnouncement(id, input) {
  const data = await request(`/api/admin/announcements/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  return data.record;
}

export async function archiveAnnouncement(id) {
  const data = await request(`/api/admin/announcements/${encodeURIComponent(id)}/archive`, { method: "POST" });
  return data.record;
}

export async function listHomepageSections() {
  const data = await withFallback(() => request("/api/admin/homepage-sections"), { records: mockHomepageSections });
  return (data.records || []).map((item) => ({
    id: item.id,
    key: item.section_key || item.id,
    name: item.title || item.name,
    type: item.section_type || item.type,
    status: item.status,
    enabled: Boolean(item.enabled),
    content: typeof item.draft_content === "string" ? JSON.parse(item.draft_content) : item.draft_content,
    order: item.order_index || item.order,
    publishedVersion: item.published_version || 0,
    draftVersion: item.draft_version || 1
  }));
}

export async function createHomepageSection(input) {
  const data = await request("/api/admin/homepage-sections", { method: "POST", body: input });
  return data.record;
}

export async function updateHomepageSection(id, input) {
  const data = await request(`/api/admin/homepage-sections/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  return data.record;
}

export async function archiveHomepageSection(id) {
  const data = await request(`/api/admin/homepage-sections/${encodeURIComponent(id)}/archive`, { method: "POST" });
  return data.record;
}

export async function listSeoPages() {
  return structuredClone(seoPages);
}

export async function getAnalytics() {
  return structuredClone(analytics);
}

function normalizeTool(tool = {}) {
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description || "",
    icon: tool.icon || "T",
    category: tool.category || "Utility",
    status: tool.status || "draft",
    lifecycleState: tool.lifecycle_state || tool.lifecycleState || "active",
    visibility: tool.visibility || "private",
    homepageVisibility: Boolean(tool.homepage_visibility ?? tool.homepageVisibility),
    featured: Boolean(tool.featured),
    order: tool.order_index || tool.order || 100,
    urls: {
      public: tool.public_url || tool.urls?.public || "",
      docs: tool.docs_url || tool.urls?.docs || "",
      admin: tool.admin_url || tool.urls?.admin || ""
    },
    apiEndpoints: tool.api_endpoints || tool.apiEndpoints || [],
    limits: tool.limits || {},
    featureFlags: tool.feature_flags || tool.featureFlags || [],
    tags: tool.tags || [],
    draftVersion: tool.draft_version || 1,
    publishedVersion: tool.published_version || 0,
    publishedAt: tool.published_at || null,
    updatedAt: tool.updated_at || null
  };
}
