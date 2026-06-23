import { navigate } from "../core/router.js";
import { appLayout, bindLayout } from "../components/layout.js";
import { pageHead } from "../components/ui.js";
import { toast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { createTool } from "../services/admin-api.js";
import { parseCommaList, parseJsonField, serializeForm } from "../core/form-helpers.js";

export function addToolPage() {
  return {
    render: () => appLayout(`
      ${pageHead("Add tool", "Register a future VoxWind tool without touching the public website code.", `
        <a class="btn btn-ghost" href="/dashboard/tools" data-route>Back</a>
      `)}
      <form class="panel" id="tool-form">
        <div class="form-grid">
          ${field("Name", "name", "Echo")}
          ${field("Slug", "slug", "echo")}
          ${field("Icon", "icon", "E")}
          ${field("Category", "category", "Audio")}
          ${selectField("Status", "status", ["draft", "beta", "live", "archived"])}
          ${selectField("Visibility", "visibility", ["private", "public", "unlisted"])}
          ${field("Public URL", "publicUrl", "https://tool.voxwind.com")}
          ${field("API endpoints", "apiEndpoints", "/tool/action, /tool/config")}
          ${textarea("Description", "description", "What this tool does and where it appears.")}
          ${textarea("Limits JSON", "limits", "{ \"requestsPerHour\": 100 }")}
          ${field("Feature flags", "featureFlags", "tool.enabled, tool.beta")}
          ${field("Tags", "tags", "audio, utility")}
        </div>
        <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:16px">
          <label style="display:flex;align-items:center;gap:10px">
            <input type="checkbox" name="featured">
            <span>Feature on homepage when published</span>
          </label>
          <label style="display:flex;align-items:center;gap:10px">
            <input type="checkbox" name="homepageVisibility">
            <span>Show in homepage tool sections</span>
          </label>
        </div>
        <div class="page-actions" style="margin-top:18px">
          <button class="btn btn-primary" type="submit">Save draft</button>
          <button class="btn btn-ghost" type="button" id="preview-config">Preview config JSON</button>
        </div>
      </form>
    `),
    afterRender: () => {
      bindLayout();
      const form = document.getElementById("tool-form");
      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const raw = serializeForm(form);
        const input = normalizeToolPayload(raw);
        try {
          await createTool(input);
          toast("Tool draft saved successfully");
          navigate("/dashboard/tools");
        } catch (err) {
          toast(err.message || "Failed to create tool draft");
        }
      });
      document.getElementById("preview-config")?.addEventListener("click", () => {
        const raw = serializeForm(form);
        const parsed = normalizeToolPayload(raw);
        openModal({
          title: "Preview tool config JSON",
          body: `<pre style="background:var(--bg);padding:14px;border-radius:6px;overflow:auto;max-height:300px;font-size:13px">${JSON.stringify(parsed, null, 2)}</pre>`
        });
      });
    }
  };
}

function field(label, name, placeholder) {
  return `<div class="field"><label>${label}</label><input class="input" name="${name}" placeholder="${placeholder}"></div>`;
}

function textarea(label, name, placeholder) {
  return `<div class="field wide"><label>${label}</label><textarea class="textarea" name="${name}" placeholder='${placeholder}'></textarea></div>`;
}

function selectField(label, name, options) {
  return `<div class="field"><label>${label}</label><select class="select" name="${name}">${options.map((item) => `<option value="${item}">${item}</option>`).join("")}</select></div>`;
}

function normalizeToolPayload(data) {
  return {
    name: data.name || "Untitled tool",
    slug: data.slug || "untitled-tool",
    icon: data.icon || "T",
    category: data.category || "Utility",
    status: data.status,
    visibility: data.visibility,
    featured: Boolean(data.featured),
    homepageVisibility: Boolean(data.homepageVisibility),
    description: data.description || "",
    urls: { public: data.publicUrl || "" },
    apiEndpoints: parseCommaList(data.apiEndpoints),
    featureFlags: parseCommaList(data.featureFlags),
    tags: parseCommaList(data.tags),
    limits: parseJsonField(data.limits, {})
  };
}
