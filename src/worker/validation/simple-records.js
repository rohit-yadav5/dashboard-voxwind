import { stringify } from "../lib/json.js";

export function featureFlagInput(input = {}) {
  return {
    flag_key: text(input.flag_key || input.key, 160) || "feature.enabled",
    description: text(input.description, 1000),
    scope: text(input.scope, 120) || "global",
    enabled: input.enabled ? 1 : 0,
    rollout_percentage: clamp(Number(input.rollout_percentage ?? input.rolloutPercentage ?? 0), 0, 100),
    rules_json: stringify(input.rules || {})
  };
}

export function announcementInput(input = {}) {
  return {
    title: text(input.title, 180) || "Untitled announcement",
    body: text(input.body, 4000),
    audience: text(input.audience, 80) || "public",
    status: text(input.status, 40) || "draft",
    enabled: input.enabled ? 1 : 0,
    start_at: epoch(input.start_at ?? input.startAt),
    end_at: epoch(input.end_at ?? input.endAt)
  };
}

export function homepageSectionInput(input = {}) {
  return {
    section_key: text(input.section_key || input.key, 120) || "section",
    section_type: text(input.section_type || input.type, 80) || "content",
    title: text(input.title, 180),
    draft_content: stringify(input.draft_content || input.content || {}),
    status: text(input.status, 40) || "draft",
    enabled: input.enabled === false ? 0 : 1,
    order_index: Number.isFinite(Number(input.order_index ?? input.order)) ? Number(input.order_index ?? input.order) : 100
  };
}

function text(value, max) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

function epoch(value) {
  if (!value) return null;
  if (Number.isFinite(Number(value))) return Number(value);
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
