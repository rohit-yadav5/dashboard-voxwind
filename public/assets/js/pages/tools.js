import { Badge, Button, PageHeader } from "../components/ui.js";
import { Toggle } from "../components/forms.js";
import { toast } from "../components/toast.js";
import { closeModal, openModal } from "../components/modal.js";
import { serializeForm } from "../core/form-helpers.js";
import { archiveTool, duplicateTool, listTools, publishConfig, updateTool } from "../services/admin-api.js";

let filter = "all";

function badge(label) {
  const toneMap = {
    live: "success",
    active: "success",
    published: "success",
    public: "success",
    maintenance: "warning",
    beta: "warning",
    unlisted: "warning",
    draft: "default",
    internal: "default",
    archived: "danger",
    private: "danger"
  };
  const tone = toneMap[label] || "default";
  return Badge({ label, tone });
}

function switchEl(checked, label = "") {
  const id = "switch-" + Math.random().toString(36).substr(2, 9);
  return Toggle({ id, label: "", checked });
}

export function toolsPage() {
  return {
    render: async () => {
      const tools = await listTools();
      const filtered = filter === "all" ? tools : tools.filter((tool) => tool.status === filter || tool.category === filter);
      return `
        <div class="vw-page">
          ${PageHeader({
            title: "Tools",
            subtitle: "Dynamic registry for every current and future VoxWind tool.",
            actions: Button({ label: "Add tool", href: "/dashboard/tools/add", variant: "primary", icon: "Plus" })
          })}
          
          <div class="vw-card">
            <div style="display: flex; flex-wrap: wrap; gap: var(--vw-space-3); align-items: center; margin-bottom: var(--vw-space-4);">
              <select class="vw-select" id="tool-filter" style="width: 160px;">
                ${["all", "live", "beta", "draft", "Audio", "Transfer", "Utility"].map((item) => `<option value="${item}" ${filter === item ? "selected" : ""}>${item}</option>`).join("")}
              </select>
              ${Button({ label: "Publish config snapshot", variant: "ghost", extraAttrs: 'id="publish-config"' })}
              <span class="vw-text-muted vw-text-sm">Publishes D1 drafts into the environment KV cache.</span>
            </div>
            
            <div class="vw-table-container">
              <table class="vw-table">
                <thead>
                  <tr>
                    <th style="width: 60px;">Order</th>
                    <th>Tool</th>
                    <th>Status</th>
                    <th>Visibility</th>
                    <th>Featured</th>
                    <th>Versions</th>
                    <th>Endpoints</th>
                    <th>Flags</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map((tool) => `
                    <tr>
                      <td>${tool.order}</td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <div class="vw-avatar" style="width: 28px; height: 28px; font-size: 13px; border-radius: 4px; background: var(--vw-surface-hover); color: var(--vw-text); font-weight: 700; flex-shrink: 0;">
                            ${tool.icon || 'T'}
                          </div>
                          <div>
                            <strong style="color: var(--vw-text); font-size: 13px;">${tool.name}</strong><br>
                            <span class="vw-text-muted vw-text-sm">/${tool.slug} · ${tool.description || 'No description'}</span>
                          </div>
                        </div>
                      </td>
                      <td>${badge(tool.status)}</td>
                      <td>${badge(tool.visibility)}</td>
                      <td><span data-toggle-featured="${tool.id}">${switchEl(tool.featured, `Toggle featured for ${tool.name}`)}</span></td>
                      <td><span class="vw-text-muted vw-text-sm">Draft v${tool.draftVersion} · Pub v${tool.publishedVersion}</span></td>
                      <td><span class="vw-text-muted vw-text-sm" style="font-family: var(--vw-font-mono);">${tool.apiEndpoints.join(", ") || "None"}</span></td>
                      <td><span class="vw-text-muted vw-text-sm" style="font-family: var(--vw-font-mono);">${tool.featureFlags.join(", ") || "None"}</span></td>
                      <td>
                        <div style="display: flex; gap: var(--vw-space-2); justify-content: flex-end;">
                          ${Button({ label: "Edit", href: `/dashboard/tools/edit?id=${tool.id}`, variant: "ghost", extraAttrs: 'style="height: 28px; min-height: 28px; padding: 0 8px; font-size: 12px;"' })}
                          ${Button({ label: "Duplicate", variant: "ghost", extraAttrs: `data-duplicate-tool="${tool.id}" style="height: 28px; min-height: 28px; padding: 0 8px; font-size: 12px;"` })}
                          ${Button({ label: "Archive", variant: "ghost", extraAttrs: `data-archive-tool="${tool.id}" style="height: 28px; min-height: 28px; padding: 0 8px; font-size: 12px; color: var(--vw-danger);"` })}
                        </div>
                      </td>
                    </tr>
                  `).join("") || '<tr><td colspan="9" style="text-align: center; color: var(--vw-text-muted); padding: var(--vw-space-5);">No tools registered.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("tool-filter")?.addEventListener("change", (event) => {
        filter = event.target.value;
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      
      document.getElementById("publish-config")?.addEventListener("click", () => {
        openModal({
          title: "Publish config snapshot",
          body: `
            <form id="publish-modal-form">
              <div class="vw-field">
                <label class="vw-label">Publish Notes</label>
                <input class="vw-input" name="notes" placeholder="e.g. updated tool limits or category" required autofocus>
              </div>
            </form>
          `,
          actions: `
            ${Button({ label: "Publish", variant: "primary", extraAttrs: 'id="publish-ok-btn"' })}
            ${Button({ label: "Cancel", variant: "ghost", extraAttrs: 'data-close-modal' })}
          `
        });

        document.getElementById("publish-ok-btn")?.addEventListener("click", async () => {
          const form = document.getElementById("publish-modal-form");
          if (!form) return;
          const raw = serializeForm(form);
          if (!raw.notes) {
            toast("Notes are required to publish", "warning");
            return;
          }
          closeModal();
          try {
            const result = await publishConfig(raw.notes);
            toast(`Published config version ${result.version}`, "success");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Publish failed", "error");
          }
        });
      });
      
      document.querySelectorAll("[data-toggle-featured]").forEach((el) => {
        el.addEventListener("click", async () => {
          try {
            const tool = (await listTools()).find((item) => item.id === el.dataset.toggleFeatured);
            await updateTool(tool.id, { ...tool, featured: !tool.featured });
            toast("Tool featured status updated", "success");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Update failed", "error");
          }
        });
      });
      
      document.querySelectorAll("[data-duplicate-tool]").forEach((el) => {
        el.addEventListener("click", async () => {
          try {
            await duplicateTool(el.dataset.duplicateTool);
            toast("Tool duplicated as draft", "success");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Duplicate failed", "error");
          }
        });
      });
      
      document.querySelectorAll("[data-archive-tool]").forEach((el) => {
        el.addEventListener("click", async () => {
          try {
            await archiveTool(el.dataset.archiveTool);
            toast("Tool archived successfully", "success");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Archive failed", "error");
          }
        });
      });
    }
  };
}
