import { navigate } from "../core/router.js";
import { Button, PageHeader } from "../components/ui.js";
import { TextInput, Textarea } from "../components/forms.js";
import { toast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { createTool } from "../services/admin-api.js";
import { parseCommaList, parseJsonField, serializeForm } from "../core/form-helpers.js";

export function addToolPage() {
  return {
    render: () => `
      <div class="vw-page">
      ${PageHeader({
        title: "Add tool",
        subtitle: "Register a future VoxWind tool without touching the public website code.",
        actions: Button({ label: "Back", variant: "ghost", href: "/dashboard/tools" })
      })}
      <form class="vw-card" id="tool-form" style="display: flex; flex-direction: column; gap: var(--vw-space-4);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vw-space-4);">
          ${TextInput({ id: "name", label: "Name", placeholder: "Echo" })}
          ${TextInput({ id: "slug", label: "Slug", placeholder: "echo" })}
          ${TextInput({ id: "icon", label: "Icon", placeholder: "E" })}
          ${TextInput({ id: "category", label: "Category", placeholder: "Audio" })}
          ${selectField("Status", "status", ["draft", "beta", "live", "archived"])}
          ${selectField("Visibility", "visibility", ["private", "public", "unlisted"])}
          ${TextInput({ id: "publicUrl", label: "Public URL", placeholder: "https://tool.voxwind.com" })}
          ${TextInput({ id: "apiEndpoints", label: "API endpoints", placeholder: "/tool/action, /tool/config" })}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--vw-space-4);">
          ${Textarea({ id: "description", label: "Description", placeholder: "What this tool does and where it appears." })}
          ${Textarea({ id: "limits", label: "Limits JSON", placeholder: '{ "requestsPerHour": 100 }' })}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vw-space-4);">
          ${TextInput({ id: "featureFlags", label: "Feature flags", placeholder: "tool.enabled, tool.beta" })}
          ${TextInput({ id: "tags", label: "Tags", placeholder: "audio, utility" })}
        </div>

        <div style="display: flex; gap: var(--vw-space-4); flex-wrap: wrap; margin-top: var(--vw-space-2);">
          <label style="display: flex; align-items: center; gap: var(--vw-space-2); cursor: pointer;">
            <input type="checkbox" name="featured" style="width: 16px; height: 16px; accent-color: var(--vw-accent);">
            <span class="vw-label">Feature on homepage when published</span>
          </label>
          <label style="display: flex; align-items: center; gap: var(--vw-space-2); cursor: pointer;">
            <input type="checkbox" name="homepageVisibility" style="width: 16px; height: 16px; accent-color: var(--vw-accent);">
            <span class="vw-label">Show in homepage tool sections</span>
          </label>
        </div>

        <div style="display: flex; gap: var(--vw-space-3); margin-top: var(--vw-space-4);">
          ${Button({ label: "Save draft", extraAttrs: 'type="submit"' })}
          ${Button({ label: "Preview config JSON", variant: "ghost", extraAttrs: 'type="button" id="preview-config"' })}
        </div>
      </form>
      </div>
    `,
    afterRender: () => {
      const form = document.getElementById("tool-form");
      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const raw = serializeForm(form);
        const input = normalizeToolPayload(raw);
        try {
          await createTool(input);
          toast("Tool draft saved successfully", "success");
          navigate("/dashboard/tools");
        } catch (err) {
          toast(err.message || "Failed to create tool draft", "error");
        }
      });
      document.getElementById("preview-config")?.addEventListener("click", () => {
        const raw = serializeForm(form);
        const parsed = normalizeToolPayload(raw);
        openModal({
          title: "Preview tool config JSON",
          body: `<pre style="background: var(--vw-bg); padding: var(--vw-space-4); border: 1px solid var(--vw-border); border-radius: var(--vw-radius-sm); overflow: auto; max-height: 300px; font-family: monospace; font-size: 13px;">${JSON.stringify(parsed, null, 2)}</pre>`
        });
      });
    }
  };
}

function selectField(label, name, options) {
  return `
    <div class="vw-field">
      <label class="vw-label">${label}</label>
      <select class="vw-select" name="${name}">
        ${options.map((item) => `<option value="${item}">${item}</option>`).join("")}
      </select>
    </div>
  `;
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
