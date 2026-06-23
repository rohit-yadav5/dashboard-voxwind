import { navigate } from "../core/router.js";
import { appLayout, bindLayout } from "../components/layout.js";
import { pageHead } from "../components/ui.js";
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
        return appLayout(`
          ${pageHead("Edit tool", "Edit tool registry details.", `
            <a class="btn btn-ghost" href="/dashboard/tools" data-route>Back</a>
          `)}
          <div class="panel empty-state">
            <h2>No tool ID specified</h2>
            <p>Please return to the tools list and select a tool to edit.</p>
          </div>
        `);
      }

      try {
        const tools = await listTools();
        currentTool = tools.find((t) => t.id === toolId);
      } catch (err) {
        console.error("Error loading tool", err);
      }

      if (!currentTool) {
        return appLayout(`
          ${pageHead("Edit tool", "Edit tool registry details.", `
            <a class="btn btn-ghost" href="/dashboard/tools" data-route>Back</a>
          `)}
          <div class="panel empty-state">
            <h2>Tool not found</h2>
            <p>The tool with ID "${toolId}" could not be found or has been archived.</p>
          </div>
        `);
      }

      // Format array fields for display in inputs
      const apiEndpointsStr = (currentTool.apiEndpoints || []).join(", ");
      const featureFlagsStr = (currentTool.featureFlags || []).join(", ");
      const tagsStr = (currentTool.tags || []).join(", ");
      const limitsStr = JSON.stringify(currentTool.limits || {}, null, 2);

      return appLayout(`
        ${pageHead(`Edit tool: ${currentTool.name}`, "Modify the registry configuration for this VoxWind tool.", `
          <a class="btn btn-ghost" href="/dashboard/tools" data-route>Back</a>
        `)}
        <form class="panel" id="tool-form">
          <div class="form-grid">
            ${field("Name", "name", currentTool.name, "Echo")}
            ${field("Slug", "slug", currentTool.slug, "echo")}
            ${field("Icon", "icon", currentTool.icon, "E")}
            ${field("Category", "category", currentTool.category, "Audio")}
            ${selectField("Status", "status", ["draft", "beta", "live", "archived"], currentTool.status)}
            ${selectField("Visibility", "visibility", ["private", "public", "unlisted"], currentTool.visibility)}
            ${field("Public URL", "publicUrl", currentTool.urls?.public || "", "https://tool.voxwind.com")}
            ${field("API endpoints", "apiEndpoints", apiEndpointsStr, "/tool/action, /tool/config")}
            ${textarea("Description", "description", currentTool.description || "", "What this tool does and where it appears.")}
            ${textarea("Limits JSON", "limits", limitsStr, '{ "requestsPerHour": 100 }')}
            ${field("Feature flags", "featureFlags", featureFlagsStr, "tool.enabled, tool.beta")}
            ${field("Tags", "tags", tagsStr, "audio, utility")}
          </div>
          <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:16px">
            <label style="display:flex;align-items:center;gap:10px">
              <input type="checkbox" name="featured" ${currentTool.featured ? "checked" : ""}>
              <span>Feature on homepage when published</span>
            </label>
            <label style="display:flex;align-items:center;gap:10px">
              <input type="checkbox" name="homepageVisibility" ${currentTool.homepageVisibility ? "checked" : ""}>
              <span>Show in homepage tool sections</span>
            </label>
          </div>
          <div class="page-actions" style="margin-top:18px">
            <button class="btn btn-primary" type="submit">Save draft</button>
            <button class="btn btn-ghost" type="button" id="preview-config">Preview config JSON</button>
          </div>
        </form>
      `);
    },
    afterRender: () => {
      bindLayout();
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
          body: `<pre style="background:var(--bg);padding:14px;border-radius:6px;overflow:auto;max-height:300px;font-size:13px">${JSON.stringify(parsed, null, 2)}</pre>`
        });
      });
    }
  };
}

function field(label, name, value, placeholder) {
  return `<div class="field"><label>${label}</label><input class="input" name="${name}" value="${value.replace(/"/g, "&quot;")}" placeholder="${placeholder}"></div>`;
}

function textarea(label, name, value, placeholder) {
  return `<div class="field wide"><label>${label}</label><textarea class="textarea" name="${name}" placeholder='${placeholder}'>${value}</textarea></div>`;
}

function selectField(label, name, options, selected) {
  return `<div class="field"><label>${label}</label><select class="select" name="${name}">${options.map((item) => `<option value="${item}" ${selected === item ? "selected" : ""}>${item}</option>`).join("")}</select></div>`;
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
