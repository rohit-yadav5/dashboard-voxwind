import { Badge, Button, PageHeader } from "../components/ui.js";
import { Toggle, SearchInput } from "../components/forms.js";
import { Card, MetricCard } from "../components/cards.js";
import { closeModal, openModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { serializeForm } from "../core/form-helpers.js";
import {
  getAnalytics,
  listAnnouncements,
  listFlags,
  listHomepageSections,
  listSeoPages,
  listUsers,
  listConfigVersions,
  publishConfig,
  createFlag,
  updateFlag,
  archiveFlag,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  createHomepageSection,
  updateHomepageSection,
  archiveHomepageSection
} from "../services/admin-api.js";

// Design System mapping helpers
function badge(label, customTone) {
  if (customTone) {
    return Badge({ label, tone: customTone });
  }
  const toneMap = {
    live: "success",
    active: "success",
    published: "success",
    public: "success",
    enabled: "success",
    maintenance: "warning",
    beta: "warning",
    unlisted: "warning",
    draft: "default",
    internal: "default",
    archived: "danger",
    private: "danger",
    disabled: "danger"
  };
  const tone = toneMap[label] || "default";
  return Badge({ label, tone });
}

function switchEl(checked, label = "") {
  const id = "switch-" + Math.random().toString(36).substr(2, 9);
  return Toggle({ id, label: "", checked });
}

function metric(label, value) {
  return MetricCard({ label, value });
}

function section(title, subtitle, body, actions = "") {
  const children = subtitle ? `<p class="vw-text-muted" style="margin-bottom: var(--vw-space-4); font-size: 13px;">${subtitle}</p>${body}` : body;
  return Card({ title, children, actions });
}

// Common Confirmation Modal Helper
function openConfirmModal({ title, message, onConfirm }) {
  openModal({
    title,
    body: `<p style="margin:0;line-height:1.5;color:var(--vw-text);">${message}</p>`,
    actions: `
      ${Button({ label: "Confirm", variant: "primary", extraAttrs: 'id="confirm-ok-btn"' })}
      ${Button({ label: "Cancel", variant: "ghost", extraAttrs: 'data-close-modal' })}
    `
  });
  document.getElementById("confirm-ok-btn")?.addEventListener("click", async () => {
    closeModal();
    await onConfirm();
  });
}

// Common Publish Config Handler
async function handlePublishAction() {
  openModal({
    title: "Publish config snapshot",
    body: `
      <form id="publish-modal-form">
        <div class="vw-field">
          <label class="vw-label">Publish Notes</label>
          <input class="vw-input" name="notes" placeholder="e.g. updated hero headline and flags" required>
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
}

export function usersPage() {
  let searchTerm = "";
  
  return {
    render: async () => {
      const allUsers = await listUsers();
      
      const renderRows = (filteredUsers) => {
        if (filteredUsers.length === 0) {
          return `<tr><td colspan="4" style="text-align: center; padding: var(--vw-space-5); color: var(--vw-text-muted);">No users found</td></tr>`;
        }
        return filteredUsers.map((user) => `
          <tr>
            <td><strong>${user.name}</strong><br><span class="vw-text-muted vw-text-sm">${user.email}</span></td>
            <td>${badge(user.role)}</td>
            <td>${badge(user.status, user.status === "active" ? "success" : "default")}</td>
            <td>${user.createdAt}</td>
          </tr>
        `).join("");
      };

      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return `
        <div class="vw-page">
        ${PageHeader({ 
          title: "Users", 
          subtitle: "User management UI prepared for auth-voxwind integration." 
        })}
        <div class="vw-card">
          <p class="vw-text-muted" style="margin-top:0; margin-bottom: var(--vw-space-4);">Future actions: invite user, assign role, suspend user, inspect sessions.</p>
          
          <div style="margin-bottom: var(--vw-space-4); max-width: 320px;">
            ${SearchInput({ id: "user-search", placeholder: "Search users by name, email, role..." })}
          </div>

          <div class="vw-table-container">
            <table class="vw-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody id="users-table-body">
                ${renderRows(filtered)}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      `;
    },
    afterRender: () => {
      const searchEl = document.getElementById("user-search");
      if (searchEl) {
        searchEl.addEventListener("input", async (e) => {
          searchTerm = e.target.value;
          const allUsers = await listUsers();
          const filtered = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          const tbody = document.getElementById("users-table-body");
          if (tbody) {
            tbody.innerHTML = filtered.length === 0 
              ? `<tr><td colspan="4" style="text-align: center; padding: var(--vw-space-5); color: var(--vw-text-muted);">No users found</td></tr>`
              : filtered.map((user) => `
                  <tr>
                    <td><strong>${user.name}</strong><br><span class="vw-text-muted vw-text-sm">${user.email}</span></td>
                    <td>${badge(user.role)}</td>
                    <td>${badge(user.status, user.status === "active" ? "success" : "default")}</td>
                    <td>${user.createdAt}</td>
                  </tr>
                `).join("");
          }
        });
      }
    }
  };
}

// Homepage Sections Page
export function homepagePage() {
  return {
    render: async () => {
      const items = await listHomepageSections();
      return `
        <div class="vw-page">
        ${PageHeader({
          title: "Homepage",
          subtitle: "Config-driven homepage sections for future automatic publishing to voxwind.com.",
          actions: Button({ label: "New section", variant: "primary", extraAttrs: 'id="new-section-btn"' })
        })}
        <div class="vw-card">
          <div style="display: flex; flex-wrap: wrap; gap: var(--vw-space-3); align-items: center; margin-bottom: var(--vw-space-4);">
            ${Button({ label: "Publish config snapshot", variant: "ghost", extraAttrs: 'id="publish-config"' })}
            <span class="vw-text-muted vw-text-sm">Publishes all draft updates to the KV cache.</span>
          </div>
          <div class="vw-table-container">
            <table class="vw-table">
              <thead><tr><th>Order</th><th>Section Key</th><th>Title</th><th>Type</th><th>Status</th><th>Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                ${items.map((item) => `
                  <tr>
                    <td>${item.order}</td>
                    <td><strong>${item.key}</strong></td>
                    <td>
                      <strong>${item.name || "Untitled"}</strong><br>
                      <span class="vw-text-muted vw-text-sm">Draft v${item.draftVersion} · Published v${item.publishedVersion}</span>
                    </td>
                    <td>${item.type}</td>
                    <td>${badge(item.status)}</td>
                    <td><span data-toggle-section="${item.id}">${switchEl(item.enabled, `Toggle ${item.name}`)}</span></td>
                    <td>
                      <div style="display: flex; gap: var(--vw-space-2);">
                        ${Button({ label: "Edit", variant: "ghost", extraAttrs: `data-edit-section="${item.id}"` })}
                        ${Button({ label: "Archive", variant: "ghost", extraAttrs: `data-archive-section="${item.id}"` })}
                      </div>
                    </td>
                  </tr>
                `).join("") || '<tr><td colspan="7" class="vw-text-muted" style="text-align:center;">No homepage sections configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("publish-config")?.addEventListener("click", handlePublishAction);

      document.querySelectorAll("[data-toggle-section]").forEach((el) => {
        el.addEventListener("click", async () => {
          const secId = el.dataset.toggleSection;
          try {
            const items = await listHomepageSections();
            const item = items.find((s) => s.id === secId);
            if (item) {
              await updateHomepageSection(item.id, { ...item, enabled: !item.enabled });
              toast("Homepage section status updated");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          } catch (err) {
            toast(err.message || "Failed to toggle section");
          }
        });
      });

      document.getElementById("new-section-btn")?.addEventListener("click", () => {
        openHomepageSectionModal();
      });

      document.querySelectorAll("[data-edit-section]").forEach((el) => {
        el.addEventListener("click", async () => {
          const secId = el.dataset.editSection;
          try {
            const items = await listHomepageSections();
            const item = items.find((s) => s.id === secId);
            if (item) openHomepageSectionModal(item);
          } catch (err) {
            toast(err.message || "Failed to load section");
          }
        });
      });

      document.querySelectorAll("[data-archive-section]").forEach((el) => {
        el.addEventListener("click", async () => {
          const secId = el.dataset.archiveSection;
          openConfirmModal({
            title: "Archive section",
            message: "Are you sure you want to archive this homepage section? This will soft-delete the section from drafts.",
            onConfirm: async () => {
              try {
                await archiveHomepageSection(secId);
                toast("Homepage section archived");
                window.dispatchEvent(new PopStateEvent("popstate"));
              } catch (err) {
                toast(err.message || "Failed to archive section");
              }
            }
          });
        });
      });
    }
  };
}

function openHomepageSectionModal(item = null) {
  const isEdit = Boolean(item);
  const contentStr = item ? JSON.stringify(item.content || {}, null, 2) : "{}";
  openModal({
    title: isEdit ? "Edit homepage section" : "New homepage section",
    body: `
      <form id="section-modal-form" style="display: flex; flex-direction: column; gap: var(--vw-space-3);">
        <div class="vw-field">
          <label class="vw-label">Section Key</label>
          <input class="vw-input" name="section_key" value="${item ? item.key : ""}" placeholder="hero" ${isEdit ? "readonly" : ""}>
        </div>
        <div class="vw-field">
          <label class="vw-label">Title</label>
          <input class="vw-input" name="title" value="${item ? (item.name || "").replace(/"/g, "&quot;") : ""}" placeholder="Hero section">
        </div>
        <div class="vw-field">
          <label class="vw-label">Section Type</label>
          <input class="vw-input" name="section_type" value="${item ? item.type : "content"}" placeholder="hero">
        </div>
        <div class="vw-field">
          <label class="vw-label">Order Index</label>
          <input class="vw-input" type="number" name="order_index" value="${item ? item.order : 10}">
        </div>
        <div class="vw-field">
          <label class="vw-label">Content JSON</label>
          <textarea class="vw-textarea" name="content" placeholder='{ "headline": "VoxWind" }' style="font-family:monospace">${contentStr}</textarea>
        </div>
        <div class="vw-field" style="margin-top:4px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" name="enabled" style="width: 16px; height: 16px; accent-color: var(--vw-accent);" ${!item || item.enabled ? "checked" : ""}>
            <span class="vw-label">Section is enabled</span>
          </label>
        </div>
      </form>
    `,
    actions: `
      ${Button({ label: "Save draft", variant: "primary", extraAttrs: 'id="section-save-btn"' })}
      ${Button({ label: "Cancel", variant: "ghost", extraAttrs: 'data-close-modal' })}
    `
  });

  document.getElementById("section-save-btn")?.addEventListener("click", async () => {
    const form = document.getElementById("section-modal-form");
    if (!form) return;
    const raw = serializeForm(form);
    
    try {
      JSON.parse(raw.content || "{}");
    } catch {
      toast("Invalid Content JSON payload");
      return;
    }

    const payload = {
      section_key: raw.section_key,
      title: raw.title,
      section_type: raw.section_type,
      order_index: Number(raw.order_index || 100),
      draft_content: raw.content || "{}",
      enabled: Boolean(raw.enabled)
    };

    try {
      if (isEdit) {
        await updateHomepageSection(item.id, payload);
        toast("Homepage section draft updated");
      } else {
        await createHomepageSection(payload);
        toast("Homepage section draft created");
      }
      closeModal();
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      toast(err.message || "Failed to save homepage section");
    }
  });
}

// Announcements Page
export function announcementsPage() {
  return {
    render: async () => {
      const items = await listAnnouncements();
      return `
        <div class="vw-page">
        ${PageHeader({
          title: "Announcements",
          subtitle: "Manage public and internal announcements without code deployments.",
          actions: Button({ label: "New announcement", variant: "primary", extraAttrs: 'id="new-ann-btn"' })
        })}
        <div class="vw-card">
          <div style="display: flex; flex-wrap: wrap; gap: var(--vw-space-3); align-items: center; margin-bottom: var(--vw-space-4);">
            ${Button({ label: "Publish config snapshot", variant: "ghost", extraAttrs: 'id="publish-config"' })}
            <span class="vw-text-muted vw-text-sm">Publishes all draft updates to the KV cache.</span>
          </div>
          <div class="vw-table-container">
            <table class="vw-table">
              <thead><tr><th>Title</th><th>Audience</th><th>Status</th><th>Starts</th><th>Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                ${items.map((item) => `
                  <tr>
                    <td>
                      <strong>${item.title}</strong><br>
                      <span class="vw-text-muted vw-text-sm">Draft v${item.draftVersion} · Published v${item.publishedVersion}</span>
                    </td>
                    <td>${badge(item.audience)}</td>
                    <td>${badge(item.status)}</td>
                    <td>${item.startsAt || "Immediate"}</td>
                    <td><span data-toggle-announcement="${item.id}">${switchEl(item.enabled, `Toggle ${item.title}`)}</span></td>
                    <td>
                      <div style="display: flex; gap: var(--vw-space-2);">
                        ${Button({ label: "Edit", variant: "ghost", extraAttrs: `data-edit-announcement="${item.id}"` })}
                        ${Button({ label: "Archive", variant: "ghost", extraAttrs: `data-archive-announcement="${item.id}"` })}
                      </div>
                    </td>
                  </tr>
                `).join("") || '<tr><td colspan="6" class="vw-text-muted" style="text-align:center;">No announcements configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("publish-config")?.addEventListener("click", handlePublishAction);

      document.querySelectorAll("[data-toggle-announcement]").forEach((el) => {
        el.addEventListener("click", async () => {
          const annId = el.dataset.toggleAnnouncement;
          try {
            const items = await listAnnouncements();
            const item = items.find((a) => a.id === annId);
            if (item) {
              await updateAnnouncement(item.id, { ...item, enabled: !item.enabled });
              toast("Announcement status updated");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          } catch (err) {
            toast(err.message || "Failed to toggle announcement");
          }
        });
      });

      document.getElementById("new-ann-btn")?.addEventListener("click", () => {
        openAnnouncementModal();
      });

      document.querySelectorAll("[data-edit-announcement]").forEach((el) => {
        el.addEventListener("click", async () => {
          const annId = el.dataset.editAnnouncement;
          try {
            const items = await listAnnouncements();
            const item = items.find((a) => a.id === annId);
            if (item) openAnnouncementModal(item);
          } catch (err) {
            toast(err.message || "Failed to load announcement");
          }
        });
      });

      document.querySelectorAll("[data-archive-announcement]").forEach((el) => {
        el.addEventListener("click", async () => {
          const annId = el.dataset.archiveAnnouncement;
          openConfirmModal({
            title: "Archive announcement",
            message: "Are you sure you want to archive this announcement? This will soft-delete the announcement from drafts.",
            onConfirm: async () => {
              try {
                await archiveAnnouncement(annId);
                toast("Announcement archived");
                window.dispatchEvent(new PopStateEvent("popstate"));
              } catch (err) {
                toast(err.message || "Failed to archive announcement");
              }
            }
          });
        });
      });
    }
  };
}

function openAnnouncementModal(item = null) {
  const isEdit = Boolean(item);
  openModal({
    title: isEdit ? "Edit announcement" : "New announcement",
    body: `
      <form id="announcement-modal-form" style="display: flex; flex-direction: column; gap: var(--vw-space-3);">
        <div class="vw-field">
          <label class="vw-label">Title</label>
          <input class="vw-input" name="title" value="${item ? item.title.replace(/"/g, "&quot;") : ""}" placeholder="System maintenance">
        </div>
        <div class="vw-field">
          <label class="vw-label">Audience</label>
          <select class="vw-select" name="audience">
            <option value="public" ${item && item.audience === "public" ? "selected" : ""}>public</option>
            <option value="internal" ${item && item.audience === "internal" ? "selected" : ""}>internal</option>
          </select>
        </div>
        <div class="vw-field">
          <label class="vw-label">Starts At (YYYY-MM-DD or Unix Epoch)</label>
          <input class="vw-input" name="startsAt" value="${item ? item.startsAt || "" : ""}" placeholder="2026-06-01">
        </div>
        <div class="vw-field">
          <label class="vw-label">Body</label>
          <textarea class="vw-textarea" name="body" placeholder="Announcement details...">${item ? item.body || "" : ""}</textarea>
        </div>
        <div class="vw-field" style="margin-top:4px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" name="enabled" style="width: 16px; height: 16px; accent-color: var(--vw-accent);" ${!item || item.enabled ? "checked" : ""}>
            <span class="vw-label">Announcement is active/enabled</span>
          </label>
        </div>
      </form>
    `,
    actions: `
      ${Button({ label: "Save draft", variant: "primary", extraAttrs: 'id="ann-save-btn"' })}
      ${Button({ label: "Cancel", variant: "ghost", extraAttrs: 'data-close-modal' })}
    `
  });

  document.getElementById("ann-save-btn")?.addEventListener("click", async () => {
    const form = document.getElementById("announcement-modal-form");
    if (!form) return;
    const raw = serializeForm(form);
    
    const payload = {
      title: raw.title,
      audience: raw.audience,
      start_at: raw.startsAt || null,
      body: raw.body,
      enabled: Boolean(raw.enabled)
    };

    try {
      if (isEdit) {
        await updateAnnouncement(item.id, payload);
        toast("Announcement draft updated");
      } else {
        await createAnnouncement(payload);
        toast("Announcement draft created");
      }
      closeModal();
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      toast(err.message || "Failed to save announcement");
    }
  });
}

// Feature Flags Page
export function flagsPage() {
  return {
    render: async () => {
      const flags = await listFlags();
      return `
        <div class="vw-page">
        ${PageHeader({
          title: "Feature flags",
          subtitle: "Runtime controls for tools, auth, dashboard modules, and public config.",
          actions: Button({ label: "New flag", variant: "primary", extraAttrs: 'id="new-flag-btn"' })
        })}
        <div class="vw-card">
          <div style="display: flex; flex-wrap: wrap; gap: var(--vw-space-3); align-items: center; margin-bottom: var(--vw-space-4);">
            ${Button({ label: "Publish config snapshot", variant: "ghost", extraAttrs: 'id="publish-config"' })}
            <span class="vw-text-muted vw-text-sm">Publishes all draft updates to the KV cache.</span>
          </div>
          <div class="vw-table-container">
            <table class="vw-table">
              <thead><tr><th>Flag Key</th><th>Description</th><th>Scope</th><th>Rollout</th><th>Versions</th><th>Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                ${flags.map((flag) => `
                  <tr>
                    <td><strong>${flag.key}</strong></td>
                    <td>${flag.description}</td>
                    <td>${badge(flag.scope)}</td>
                    <td>${flag.rolloutPercentage}%</td>
                    <td><span class="vw-text-muted vw-text-sm">Draft v${flag.draftVersion} · Published v${flag.publishedVersion}</span></td>
                    <td><span data-toggle-flag="${flag.id}">${switchEl(flag.enabled, `Toggle ${flag.key}`)}</span></td>
                    <td>
                      <div style="display: flex; gap: var(--vw-space-2);">
                        ${Button({ label: "Edit", variant: "ghost", extraAttrs: `data-edit-flag="${flag.id}"` })}
                        ${Button({ label: "Archive", variant: "ghost", extraAttrs: `data-archive-flag="${flag.id}"` })}
                      </div>
                    </td>
                  </tr>
                `).join("") || '<tr><td colspan="7" class="vw-text-muted" style="text-align:center;">No feature flags configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("publish-config")?.addEventListener("click", handlePublishAction);

      document.querySelectorAll("[data-toggle-flag]").forEach((el) => {
        el.addEventListener("click", async () => {
          const flagId = el.dataset.toggleFlag;
          try {
            const flags = await listFlags();
            const flag = flags.find((f) => f.id === flagId);
            if (flag) {
              await updateFlag(flag.id, { ...flag, enabled: !flag.enabled });
              toast("Feature flag status updated");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          } catch (err) {
            toast(err.message || "Failed to toggle flag");
          }
        });
      });

      document.getElementById("new-flag-btn")?.addEventListener("click", () => {
        openFlagModal();
      });

      document.querySelectorAll("[data-edit-flag]").forEach((el) => {
        el.addEventListener("click", async () => {
          const flagId = el.dataset.editFlag;
          try {
            const flags = await listFlags();
            const flag = flags.find((f) => f.id === flagId);
            if (flag) openFlagModal(flag);
          } catch (err) {
            toast(err.message || "Failed to load flag");
          }
        });
      });

      document.querySelectorAll("[data-archive-flag]").forEach((el) => {
        el.addEventListener("click", async () => {
          const flagId = el.dataset.archiveFlag;
          openConfirmModal({
            title: "Archive feature flag",
            message: `Are you sure you want to archive the feature flag "${flagId}"? This will soft-delete the flag.`,
            onConfirm: async () => {
              try {
                await archiveFlag(flagId);
                toast("Feature flag archived");
                window.dispatchEvent(new PopStateEvent("popstate"));
              } catch (err) {
                toast(err.message || "Failed to archive flag");
              }
            }
          });
        });
      });
    }
  };
}

function openFlagModal(flag = null) {
  const isEdit = Boolean(flag);
  openModal({
    title: isEdit ? "Edit feature flag" : "New feature flag",
    body: `
      <form id="flag-modal-form" style="display: flex; flex-direction: column; gap: var(--vw-space-3);">
        <div class="vw-field">
          <label class="vw-label">Flag Key</label>
          <input class="vw-input" name="flag_key" value="${flag ? flag.key : ""}" placeholder="echo.translate" ${isEdit ? "readonly" : ""}>
        </div>
        <div class="vw-field">
          <label class="vw-label">Description</label>
          <input class="vw-input" name="description" value="${flag ? flag.description.replace(/"/g, "&quot;") : ""}" placeholder="Control translation features">
        </div>
        <div class="vw-field">
          <label class="vw-label">Scope</label>
          <input class="vw-input" name="scope" value="${flag ? flag.scope : "global"}" placeholder="tool:echo">
        </div>
        <div class="vw-field">
          <label class="vw-label">Rollout Percentage (0-100)</label>
          <input class="vw-input" type="number" min="0" max="100" name="rollout_percentage" value="${flag ? flag.rolloutPercentage : 100}">
        </div>
        <div class="vw-field" style="margin-top:4px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" name="enabled" style="width: 16px; height: 16px; accent-color: var(--vw-accent);" ${!flag || flag.enabled ? "checked" : ""}>
            <span class="vw-label">Flag is enabled</span>
          </label>
        </div>
      </form>
    `,
    actions: `
      ${Button({ label: "Save draft", variant: "primary", extraAttrs: 'id="flag-save-btn"' })}
      ${Button({ label: "Cancel", variant: "ghost", extraAttrs: 'data-close-modal' })}
    `
  });

  document.getElementById("flag-save-btn")?.addEventListener("click", async () => {
    const form = document.getElementById("flag-modal-form");
    if (!form) return;
    const raw = serializeForm(form);
    
    const payload = {
      flag_key: raw.flag_key,
      description: raw.description,
      scope: raw.scope,
      rollout_percentage: Number(raw.rollout_percentage || 0),
      enabled: Boolean(raw.enabled)
    };

    try {
      if (isEdit) {
        await updateFlag(flag.id, payload);
        toast("Feature flag draft updated");
      } else {
        await createFlag(payload);
        toast("Feature flag draft created");
      }
      closeModal();
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      toast(err.message || "Failed to save feature flag");
    }
  });
}

export function mediaPage() {
  return placeholderPage(
    "Media",
    "R2-backed media library planned for logos, OG images, homepage imagery, and generated assets.",
    [
      "Upload files to R2 through signed Worker routes.",
      "Store metadata, alt text, owner, and usage references in D1.",
      "Publish immutable public asset URLs through the config cache."
    ]
  );
}

export function seoPage() {
  return tablePage({
    title: "SEO",
    subtitle: "Central registry for page metadata, canonical URLs, robots state, and sitemap generation.",
    permissionNote: "Future actions: edit meta, preview SERP/social cards, publish sitemap.",
    headers: ["Path", "Title", "Status"],
    rows: async () => (await listSeoPages()).map((item) => [
      `<span class="vw-text-muted vw-text-sm">${item.path}</span>`,
      `<strong>${item.title}</strong>`,
      badge(item.status)
    ])
  });
}

// Settings Page with lightweight Config Version logs
export function settingsPage() {
  return {
    render: async () => {
      const versions = await listConfigVersions();
      return `
        <div class="vw-page">
        ${PageHeader({
          title: "Settings",
          subtitle: "Cloudflare-native runtime configuration planning surface."
        })}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--vw-space-4); margin-bottom: var(--vw-space-5);">
          ${section("Public config flow", "D1 remains the source of truth. KV serves fast runtime snapshots.", `
            <div class="timeline">
              ${["Dashboard writes record", "Worker validates permissions", "D1 transaction stores draft", "Publish refreshes KV", "Public APIs read cached snapshot"].map((item) => `
                <div class="timeline-item"><span class="timeline-dot"></span><div class="vw-text-muted vw-text-sm">${item}</div></div>
              `).join("")}
            </div>
          `)}
          ${section("Bindings prepared", "The Worker config is ready for future resources.", `
            <p style="margin-top:0;"><strong>D1</strong><br><span class="vw-text-muted vw-text-sm">DB source of truth for admin data.</span></p>
            <p><strong>KV</strong><br><span class="vw-text-muted vw-text-sm">CONFIG_CACHE and RATE_LIMIT namespaces.</span></p>
            <p style="margin-bottom:0;"><strong>R2</strong><br><span class="vw-text-muted vw-text-sm">MEDIA_BUCKET for uploaded assets.</span></p>
          `)}
        </div>
        <div>
          ${section("Config Version Registry", "Lightweight metadata log of previous configurations published from the dashboard.", `
            <div class="vw-table-container">
              <table class="vw-table" style="min-width: 100%">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Notes</th>
                    <th>Author ID</th>
                    <th>Created</th>
                    <th>Published At</th>
                  </tr>
                </thead>
                <tbody>
                  ${versions.map((v) => `
                    <tr>
                      <td><strong>v${v.version}</strong> ${badge(v.status, v.status === "published" ? "success" : "default")}</td>
                      <td>${v.notes || '<span class="vw-text-muted" style="font-style:italic">No notes provided</span>'}</td>
                      <td><code>${v.created_by || "system"}</code></td>
                      <td>${new Date(v.created_at * 1000).toLocaleString()}</td>
                      <td>${v.published_at ? new Date(v.published_at * 1000).toLocaleString() : "Never"}</td>
                    </tr>
                  `).join("") || '<tr><td colspan="5" class="vw-text-muted" style="text-align:center;">No version records found.</td></tr>'}
                </tbody>
              </table>
            </div>
          `)}
        </div>
        </div>
      `;
    },
    afterRender: () => {}
  };
}

export function analyticsPage() {
  return {
    render: async () => {
      const data = await getAnalytics();
      return `
        <div class="vw-page">
        ${PageHeader({
          title: "Analytics",
          subtitle: "Mock analytics placeholders for users, tools, API requests, and events."
        })}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--vw-space-4); margin-bottom: var(--vw-space-5);">
          ${metric("Users", data.totals.users.toLocaleString())}
          ${metric("Usage events", data.totals.toolUsage.toLocaleString())}
          ${metric("API requests", data.totals.apiRequests.toLocaleString())}
          ${metric("Active tools", data.totals.activeTools)}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: var(--vw-space-4);">
          ${section("Growth chart", "Mock monthly trend.", `
            <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding: var(--vw-space-4) var(--vw-space-3); background: var(--vw-surface); border: 1px solid var(--vw-border); border-radius: var(--vw-radius-md);">
              ${[40, 60, 45, 75, 55, 90, 80, 110, 95, 125, 120, 150].map((val, idx) => {
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const percent = (val / 150) * 100;
                return `
                  <div style="display: flex; flex-direction: column; align-items: center; flex: 1; gap: 8px;">
                    <div style="position: relative; width: 12px; height: 100px; background: rgba(10, 132, 255, 0.1); border-radius: 6px; overflow: hidden; display: flex; align-items: flex-end;">
                      <div style="width: 100%; height: ${percent}%; background: linear-gradient(180deg, var(--vw-info) 0%, rgba(10, 132, 255, 0.3) 100%); border-radius: 6px;"></div>
                    </div>
                    <span style="font-size: 10px; color: var(--vw-text-muted); font-weight: 500;">${months[idx]}</span>
                  </div>
                `;
              }).join("")}
            </div>
          `)}
          ${section("Top tools", "Future source: daily usage aggregates.", `
            <div class="vw-table-container">
              <table class="vw-table">
                <thead><tr><th>Tool</th><th>Usage</th></tr></thead>
                <tbody>${data.topTools.map((tool) => `<tr><td>${tool.name}</td><td>${tool.usage.toLocaleString()}</td></tr>`).join("")}</tbody>
              </table>
            </div>
          `)}
        </div>
        </div>
      `;
    },
    afterRender: () => {}
  };
}

function tablePage({ title, subtitle, permissionNote, headers, rows }) {
  return {
    render: async () => {
      const bodyRows = await rows();
      return `
        <div class="vw-page">
        ${PageHeader({ title, subtitle })}
        <div class="vw-card">
          <p class="vw-text-muted" style="margin-top:0; margin-bottom: var(--vw-space-4);">${permissionNote}</p>
          <div class="vw-table-container">
            <table class="vw-table">
              <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
              <tbody>
                ${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      `;
    },
    afterRender: () => {}
  };
}

function placeholderPage(title, subtitle, points) {
  return {
    render: () => `
      <div class="vw-page">
      ${PageHeader({ title, subtitle })}
      <div class="vw-card">
        <div class="vw-empty" style="margin-bottom: var(--vw-space-4);">
          <h2 class="vw-empty-title" style="margin-top:0">${title} foundation</h2>
          <p class="vw-empty-desc">${subtitle}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vw-space-4);">
          ${points.map((point) => `
            <div class="vw-metric-card">
              <div class="vw-metric-label">${point}</div>
            </div>
          `).join("")}
        </div>
      </div>
      </div>
    `,
    afterRender: () => {}
  };
}
