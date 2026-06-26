import { navigate } from "../core/router.js";
import { Button, PageHeader } from "../components/ui.js";
import { TextInput, Textarea } from "../components/forms.js";
import { toast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { listTools, updateTool } from "../services/admin-api.js";
import { parseCommaList, parseJsonField, serializeForm } from "../core/form-helpers.js";

export function editToolPage() {
  let currentTool = null;

  return {
    render: async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const toolId = urlParams.get("id");

      if (!toolId) {
        return `
          <div class="vw-page">
          ${PageHeader({
            title: "Edit tool",
            subtitle: "Edit tool registry details.",
            actions: Button({ label: "Back", variant: "ghost", href: "/dashboard/tools" })
          })}
          <div class="vw-card">
            <div class="vw-empty">
              <h2 class="vw-empty-title">No tool ID specified</h2>
              <p class="vw-empty-desc">Please return to the tools list and select a tool to edit.</p>
            </div>
          </div>
          </div>
        `;
      }

      try {
        const tools = await listTools();
        currentTool = tools.find((t) => t.id === toolId);
      } catch (err) {
        console.error("Error loading tool", err);
      }

      if (!currentTool) {
        return `
          <div class="vw-page">
          ${PageHeader({
            title: "Edit tool",
            subtitle: "Edit tool registry details.",
            actions: Button({ label: "Back", variant: "ghost", href: "/dashboard/tools" })
          })}
          <div class="vw-card">
            <div class="vw-empty">
              <h2 class="vw-empty-title">Tool not found</h2>
              <p class="vw-empty-desc">The tool with ID "${toolId}" could not be found or has been archived.</p>
            </div>
          </div>
          </div>
        `;
      }

      // Format array fields for display in inputs
      const apiEndpointsStr = (currentTool.apiEndpoints || []).join(", ");
      const featureFlagsStr = (currentTool.featureFlags || []).join(", ");
      const tagsStr = (currentTool.tags || []).join(", ");
      const limitsStr = JSON.stringify(currentTool.limits || {}, null, 2);

      return `
        <div class="vw-page">
        ${PageHeader({
          title: `Edit tool: ${currentTool.name}`,
          subtitle: "Modify the registry configuration for this VoxWind tool.",
          actions: Button({ label: "Back", variant: "ghost", href: "/dashboard/tools" })
        })}
        <form class="vw-card" id="tool-form" style="display: flex; flex-direction: column; gap: var(--vw-space-4);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vw-space-4);">
            ${TextInput({ id: "name", label: "Name", value: currentTool.name, placeholder: "Echo" })}
            ${TextInput({ id: "slug", label: "Slug", value: currentTool.slug, placeholder: "echo" })}
            ${TextInput({ id: "icon", label: "Icon", value: currentTool.icon, placeholder: "E" })}
            ${TextInput({ id: "category", label: "Category", value: currentTool.category, placeholder: "Audio" })}
            ${selectField("Status", "status", ["draft", "beta", "live", "archived"], currentTool.status)}
            ${selectField("Visibility", "visibility", ["private", "public", "unlisted"], currentTool.visibility)}
            ${TextInput({ id: "publicUrl", label: "Public URL", value: currentTool.urls?.public || "", placeholder: "https://tool.voxwind.com" })}
            ${TextInput({ id: "apiEndpoints", label: "API endpoints", value: apiEndpointsStr, placeholder: "/tool/action, /tool/config" })}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: var(--vw-space-4);">
            ${Textarea({ id: "description", label: "Description", value: currentTool.description || "", placeholder: "What this tool does and where it appears." })}
            ${Textarea({ id: "limits", label: "Limits JSON", value: limitsStr, placeholder: '{ "requestsPerHour": 100 }' })}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vw-space-4);">
            ${TextInput({ id: "featureFlags", label: "Feature flags", value: featureFlagsStr, placeholder: "tool.enabled, tool.beta" })}
            ${TextInput({ id: "tags", label: "Tags", value: tagsStr, placeholder: "audio, utility" })}
          </div>

          <div style="display: flex; gap: var(--vw-space-4); flex-wrap: wrap; margin-top: var(--vw-space-2);">
            <label style="display: flex; align-items: center; gap: var(--vw-space-2); cursor: pointer;">
              <input type="checkbox" name="featured" style="width: 16px; height: 16px; accent-color: var(--vw-accent);" ${currentTool.featured ? "checked" : ""}>
              <span class="vw-label">Feature on homepage when published</span>
            </label>
            <label style="display: flex; align-items: center; gap: var(--vw-space-2); cursor: pointer;">
              <input type="checkbox" name="homepageVisibility" style="width: 16px; height: 16px; accent-color: var(--vw-accent);" ${currentTool.homepageVisibility ? "checked" : ""}>
              <span class="vw-label">Show in homepage tool sections</span>
            </label>
          </div>

          <div style="display: flex; gap: var(--vw-space-3); margin-top: var(--vw-space-4);">
            ${Button({ label: "Save changes", extraAttrs: 'type="submit"' })}
            ${Button({ label: "Preview config JSON", variant: "ghost", extraAttrs: 'type="button" id="preview-config"' })}
          </div>
        </form>
        </div>
      `;
    },
    afterRender: () => {
      const form = document.getElementById("tool-form");
      if (!form || !currentTool) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const raw = serializeForm(form);
        const parsed = normalizeToolPayload(raw);

        try {
          await updateTool(currentTool.id, parsed);
          toast("Tool draft updated successfully");
          navigate("/dashboard/tools");
        } catch (err) {
          toast(err.message || "Failed to update tool draft");
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

function selectField(label, name, options, selected) {
  return `
    <div class="vw-field">
      <label class="vw-label">${label}</label>
      <select class="vw-select" name="${name}">
        ${options.map((item) => `<option value="${item}" ${selected === item ? "selected" : ""}>${item}</option>`).join("")}
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
