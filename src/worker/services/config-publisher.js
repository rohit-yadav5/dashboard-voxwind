import { cacheKey, nowSeconds } from "../lib/env.js";
import { sha256Hex } from "../lib/ids.js";
import { parseJson, stringify } from "../lib/json.js";
import { putCachedJson } from "./cache.js";
import { createConfigVersion, createPublishedSnapshot, markVersionPublished } from "../repositories/configVersions.js";
import { listTools, markToolsPublished } from "../repositories/tools.js";
import { listRecords, markRecordsPublished } from "../repositories/records.js";

export async function buildPublicConfigSnapshot(env, environment) {
  const [tools, flags, announcements, homepageSections] = await Promise.all([
    listTools(env, environment),
    listRecords(env, "feature_flags", environment),
    listRecords(env, "announcements", environment),
    listRecords(env, "homepage_sections", environment)
  ]);

  return {
    environment,
    generatedAt: new Date().toISOString(),
    tools: tools
      .filter((tool) => tool.visibility === "public" && !tool.deleted_at && tool.status !== "archived")
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        icon: tool.icon,
        category: tool.category,
        status: tool.status === "draft" ? "published" : tool.status,
        featured: Boolean(tool.featured),
        homepageVisibility: Boolean(tool.homepage_visibility),
        order: tool.order_index,
        publicUrl: tool.public_url,
        tags: tool.tags || [],
        config: tool.draft_config || {}
      })),
    featureFlags: Object.fromEntries(flags
      .filter((flag) => !flag.deleted_at)
      .map((flag) => [flag.flag_key, {
        enabled: Boolean(flag.enabled),
        rolloutPercentage: flag.rollout_percentage,
        scope: flag.scope,
        rules: flag.rules || {}
      }])),
    homepage: {
      sections: homepageSections
        .filter((section) => !section.deleted_at && section.enabled)
        .map((section) => ({
          key: section.section_key,
          type: section.section_type,
          title: section.title,
          order: section.order_index,
          content: typeof section.draft_content === "string" ? parseJson(section.draft_content, {}) : (section.draft_content || {})
        }))
    },
    announcements: announcements
      .filter((ann) => !ann.deleted_at && ann.enabled && ann.audience === "public")
      .map((ann) => ({
        id: ann.id,
        title: ann.title,
        body: ann.body,
        startAt: ann.start_at,
        endAt: ann.end_at
      }))
  };
}

export async function createPublishPreview(env, environment) {
  const snapshot = await buildPublicConfigSnapshot(env, environment);
  const hash = await sha256Hex(stableStringify(snapshot));
  return { snapshot, hash };
}

export async function publishPublicConfig(env, environment, actor, notes = "") {
  const { snapshot, hash } = await createPublishPreview(env, environment);
  const version = await createConfigVersion(env, environment, snapshot, hash, actor, notes);
  const publishedAt = nowSeconds();
  const versionedSnapshot = { ...snapshot, version: version.version, snapshotHash: hash, publishedAt };

  await Promise.all([
    putCachedJson(env, environment, "config", versionedSnapshot, { version: String(version.version), hash }),
    putCachedJson(env, environment, "tools", versionedSnapshot.tools, { version: String(version.version), hash }),
    putCachedJson(env, environment, "homepage", versionedSnapshot.homepage, { version: String(version.version), hash }),
    putCachedJson(env, environment, "feature-flags", versionedSnapshot.featureFlags, { version: String(version.version), hash })
  ]);

  await markVersionPublished(env, environment, version.version, publishedAt);
  await createPublishedSnapshot(env, environment, version.version, cacheKey(environment, "config"), hash, actor);
  await markToolsPublished(env, environment, version.version, publishedAt);
  await markRecordsPublished(env, environment, version.version, publishedAt);

  return { ...version, publishedAt, snapshotHash: hash, snapshot: versionedSnapshot };
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return stringify(value);
}
