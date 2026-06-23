import { appLayout, bindLayout } from "../components/layout.js";
import { badge, pageHead, switchEl } from "../components/ui.js";
import { toast } from "../components/toast.js";
import { closeModal, openModal } from "../components/modal.js";
import { serializeForm } from "../core/form-helpers.js";
import { archiveTool, duplicateTool, listTools, publishConfig, updateTool } from "../services/admin-api.js";

let filter = "all";

export function toolsPage() {
  return {
    render: async () => {
      const tools = await listTools();
      const filtered = filter === "all" ? tools : tools.filter((tool) => tool.status === filter || tool.category === filter);
      return appLayout(`
        ${pageHead("Tools", "Dynamic registry for every current and future VoxWind tool.", `
          <a class="btn btn-primary" href="/dashboard/tools/add" data-route>Add tool</a>
        `)}
        <section class="panel">
          <div class="toolbar">
            <select class="select" id="tool-filter" style="width:180px">
              ${["all", "live", "beta", "draft", "Audio", "Transfer", "Utility"].map((item) => `<option value="${item}" ${filter === item ? "selected" : ""}>${item}</option>`).join("")}
            </select>
            <button class="btn btn-ghost" id="publish-config">Publish config snapshot</button>
            <span class="muted small">Publishes D1 drafts into the environment KV cache.</span>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:28px">Order</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Featured</th>
                  <th>Versions</th>
                  <th>Endpoints</th>
                  <th>Flags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((tool) => `
                  <tr>
                    <td>${tool.order}</td>
                    <td>
                      <div class="tool-cell">
                        <span class="tool-icon">${tool.icon}</span>
                        <div>
                          <strong>${tool.name}</strong><br>
                          <span class="muted small">/${tool.slug} · ${tool.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>${badge(tool.status)}</td>
                    <td>${badge(tool.visibility)}</td>
                    <td><span data-toggle-featured="${tool.id}">${switchEl(tool.featured, `Toggle featured for ${tool.name}`)}</span></td>
                    <td><span class="muted small">Draft v${tool.draftVersion} · Published v${tool.publishedVersion}</span></td>
                    <td><span class="muted small">${tool.apiEndpoints.join(", ") || "None yet"}</span></td>
                    <td><span class="muted small">${tool.featureFlags.join(", ")}</span></td>
                    <td>
                      <div class="page-actions">
                        <a class="btn btn-ghost" href="/dashboard/tools/edit?id=${tool.id}" data-route>Edit</a>
                        <button class="btn btn-ghost" data-duplicate-tool="${tool.id}">Duplicate</button>
                        <button class="btn btn-ghost" data-archive-tool="${tool.id}">Archive</button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
      `);
    },
    afterRender: () => {
      bindLayout();
      document.getElementById("tool-filter")?.addEventListener("change", (event) => {
        filter = event.target.value;
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      document.getElementById("publish-config")?.addEventListener("click", () => {
        openModal({
          title: "Publish config snapshot",
          body: `
            <form id="publish-modal-form">
              <div class="field wide">
                <label>Publish Notes</label>
                <input class="input" name="notes" placeholder="e.g. updated tool limits or category" required>
              </div>
            </form>
          `,
          actions: `
            <button class="btn btn-primary" id="publish-ok-btn">Publish</button>
            <button class="btn btn-ghost" data-close-modal>Cancel</button>
          `
        });

        document.getElementById("publish-ok-btn")?.addEventListener("click", async () => {
          const form = document.getElementById("publish-modal-form");
          if (!form) return;
          const raw = serializeForm(form);
          if (!raw.notes) {
            toast("Notes are required to publish");
            return;
          }
          closeModal();
          try {
            const result = await publishConfig(raw.notes);
            toast(`Published config version ${result.version}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Publish failed");
          }
        });
      });
      document.querySelectorAll("[data-toggle-featured]").forEach((el) => {
        el.addEventListener("click", async () => {
          try {
            const tool = (await listTools()).find((item) => item.id === el.dataset.toggleFeatured);
            await updateTool(tool.id, { ...tool, featured: !tool.featured });
            toast("Tool draft updated");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Update failed");
          }
        });
      });
      document.querySelectorAll("[data-duplicate-tool]").forEach((el) => {
        el.addEventListener("click", async () => {
          try {
            await duplicateTool(el.dataset.duplicateTool);
            toast("Tool duplicated as draft");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Duplicate failed");
          }
        });
      });
      document.querySelectorAll("[data-archive-tool]").forEach((el) => {
        el.addEventListener("click", async () => {
          try {
            await archiveTool(el.dataset.archiveTool);
            toast("Tool archived");
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (err) {
            toast(err.message || "Archive failed");
          }
        });
      });
    }
  };
}
