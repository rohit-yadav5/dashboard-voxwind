import { appLayout, bindLayout } from "../components/layout.js";
import { badge, chart, metric, pageHead, section, switchEl } from "../components/ui.js";
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

// Common Confirmation Modal Helper (No browser confirm allowed)
function openConfirmModal({ title, message, onConfirm }) {
  openModal({
    title,
    body: `<p style="margin:0;line-height:1.5">${message}</p>`,
    actions: `
      <button class="btn btn-primary" id="confirm-ok-btn">Confirm</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
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
        <div class="field wide">
          <label>Publish Notes</label>
          <input class="input" name="notes" placeholder="e.g. updated hero headline and flags" required>
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
}

export function usersPage() {
  return tablePage({
    title: "Users",
    subtitle: "Placeholder user management UI prepared for auth-voxwind integration.",
    permissionNote: "Future actions: invite user, assign role, suspend user, inspect sessions.",
    headers: ["User", "Role", "Status", "Created"],
    rows: async () => (await listUsers()).map((user) => [
      `<strong>${user.name}</strong><br><span class="muted small">${user.email}</span>`,
      badge(user.role),
      badge(user.status, user.status === "active" ? "enabled" : "draft"),
      user.createdAt
    ])
  });
}

// Homepage Sections Page
export function homepagePage() {
  return {
    render: async () => {
      const items = await listHomepageSections();
      return appLayout(`
        ${pageHead("Homepage", "Config-driven homepage sections for future automatic publishing to voxwind.com.", `
          <button class="btn btn-primary" type="button" id="new-section-btn">New section</button>
        `)}
        <section class="panel">
          <div class="toolbar">
            <button class="btn btn-ghost" id="publish-config">Publish config snapshot</button>
            <span class="muted small">Publishes all draft updates to the KV cache.</span>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Order</th><th>Section Key</th><th>Title</th><th>Type</th><th>Status</th><th>Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                ${items.map((item) => `
                  <tr>
                    <td>${item.order}</td>
                    <td><strong>${item.key}</strong></td>
                    <td>
                      <strong>${item.name || "Untitled"}</strong><br>
                      <span class="muted small">Draft v${item.draftVersion} · Published v${item.publishedVersion}</span>
                    </td>
                    <td>${item.type}</td>
                    <td>${badge(item.status)}</td>
                    <td><span data-toggle-section="${item.id}">${switchEl(item.enabled, `Toggle ${item.name}`)}</span></td>
                    <td>
                      <div class="page-actions">
                        <button class="btn btn-ghost" data-edit-section="${item.id}">Edit</button>
                        <button class="btn btn-ghost" data-archive-section="${item.id}">Archive</button>
                      </div>
                    </td>
                  </tr>
                `).join("") || '<tr><td colspan="7" class="muted">No homepage sections configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
      `);
    },
    afterRender: () => {
      bindLayout();
      
      // Publish button
      document.getElementById("publish-config")?.addEventListener("click", handlePublishAction);

      // Toggle Switch
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

      // New Section Modal
      document.getElementById("new-section-btn")?.addEventListener("click", () => {
        openHomepageSectionModal();
      });

      // Edit Section Modal
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

      // Archive Section
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
      <form id="section-modal-form">
        <div class="field">
          <label>Section Key</label>
          <input class="input" name="section_key" value="${item ? item.key : ""}" placeholder="hero" ${isEdit ? "readonly" : ""}>
        </div>
        <div class="field">
          <label>Title</label>
          <input class="input" name="title" value="${item ? (item.name || "").replace(/"/g, "&quot;") : ""}" placeholder="Hero section">
        </div>
        <div class="field">
          <label>Section Type</label>
          <input class="input" name="section_type" value="${item ? item.type : "content"}" placeholder="hero">
        </div>
        <div class="field">
          <label>Order Index</label>
          <input class="input" type="number" name="order_index" value="${item ? item.order : 10}">
        </div>
        <div class="field wide">
          <label>Content JSON</label>
          <textarea class="textarea" name="content" placeholder='{ "headline": "VoxWind" }' style="font-family:monospace">${contentStr}</textarea>
        </div>
        <div class="field" style="margin-top:12px">
          <label style="display:flex;align-items:center;gap:10px">
            <input type="checkbox" name="enabled" ${!item || item.enabled ? "checked" : ""}>
            <span>Section is enabled</span>
          </label>
        </div>
      </form>
    `,
    actions: `
      <button class="btn btn-primary" id="section-save-btn">Save draft</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
    `
  });

  document.getElementById("section-save-btn")?.addEventListener("click", async () => {
    const form = document.getElementById("section-modal-form");
    if (!form) return;
    const raw = serializeForm(form);
    
    // Parse JSON safely
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
      return appLayout(`
        ${pageHead("Announcements", "Manage public and internal announcements without code deployments.", `
          <button class="btn btn-primary" type="button" id="new-ann-btn">New announcement</button>
        `)}
        <section class="panel">
          <div class="toolbar">
            <button class="btn btn-ghost" id="publish-config">Publish config snapshot</button>
            <span class="muted small">Publishes all draft updates to the KV cache.</span>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Title</th><th>Audience</th><th>Status</th><th>Starts</th><th>Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                ${items.map((item) => `
                  <tr>
                    <td>
                      <strong>${item.title}</strong><br>
                      <span class="muted small">Draft v${item.draftVersion} · Published v${item.publishedVersion}</span>
                    </td>
                    <td>${badge(item.audience)}</td>
                    <td>${badge(item.status)}</td>
                    <td>${item.startsAt || "Immediate"}</td>
                    <td><span data-toggle-announcement="${item.id}">${switchEl(item.enabled, `Toggle ${item.title}`)}</span></td>
                    <td>
                      <div class="page-actions">
                        <button class="btn btn-ghost" data-edit-announcement="${item.id}">Edit</button>
                        <button class="btn btn-ghost" data-archive-announcement="${item.id}">Archive</button>
                      </div>
                    </td>
                  </tr>
                `).join("") || '<tr><td colspan="6" class="muted">No announcements configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
      `);
    },
    afterRender: () => {
      bindLayout();

      // Publish button
      document.getElementById("publish-config")?.addEventListener("click", handlePublishAction);

      // Toggle Switch
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

      // New Announcement Modal
      document.getElementById("new-ann-btn")?.addEventListener("click", () => {
        openAnnouncementModal();
      });

      // Edit Announcement Modal
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

      // Archive Announcement
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
      <form id="announcement-modal-form">
        <div class="field">
          <label>Title</label>
          <input class="input" name="title" value="${item ? item.title.replace(/"/g, "&quot;") : ""}" placeholder="System maintenance">
        </div>
        <div class="field">
          <label>Audience</label>
          <select class="select" name="audience">
            <option value="public" ${item && item.audience === "public" ? "selected" : ""}>public</option>
            <option value="internal" ${item && item.audience === "internal" ? "selected" : ""}>internal</option>
          </select>
        </div>
        <div class="field">
          <label>Starts At (YYYY-MM-DD or Unix Epoch)</label>
          <input class="input" name="startsAt" value="${item ? item.startsAt || "" : ""}" placeholder="2026-06-01">
        </div>
        <div class="field wide">
          <label>Body</label>
          <textarea class="textarea" name="body" placeholder="Announcement details...">${item ? item.body || "" : ""}</textarea>
        </div>
        <div class="field" style="margin-top:12px">
          <label style="display:flex;align-items:center;gap:10px">
            <input type="checkbox" name="enabled" ${!item || item.enabled ? "checked" : ""}>
            <span>Announcement is active/enabled</span>
          </label>
        </div>
      </form>
    `,
    actions: `
      <button class="btn btn-primary" id="ann-save-btn">Save draft</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
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
      return appLayout(`
        ${pageHead("Feature flags", "Runtime controls for tools, auth, dashboard modules, and public config.", `
          <button class="btn btn-primary" type="button" id="new-flag-btn">New flag</button>
        `)}
        <section class="panel">
          <div class="toolbar">
            <button class="btn btn-ghost" id="publish-config">Publish config snapshot</button>
            <span class="muted small">Publishes all draft updates to the KV cache.</span>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Flag Key</th><th>Description</th><th>Scope</th><th>Rollout</th><th>Versions</th><th>Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                ${flags.map((flag) => `
                  <tr>
                    <td><strong>${flag.key}</strong></td>
                    <td>${flag.description}</td>
                    <td>${badge(flag.scope)}</td>
                    <td>${flag.rolloutPercentage}%</td>
                    <td><span class="muted small">Draft v${flag.draftVersion} · Published v${flag.publishedVersion}</span></td>
                    <td><span data-toggle-flag="${flag.id}">${switchEl(flag.enabled, `Toggle ${flag.key}`)}</span></td>
                    <td>
                      <div class="page-actions">
                        <button class="btn btn-ghost" data-edit-flag="${flag.id}">Edit</button>
                        <button class="btn btn-ghost" data-archive-flag="${flag.id}">Archive</button>
                      </div>
                    </td>
                  </tr>
                `).join("") || '<tr><td colspan="7" class="muted">No feature flags configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
      `);
    },
    afterRender: () => {
      bindLayout();

      // Publish button
      document.getElementById("publish-config")?.addEventListener("click", handlePublishAction);

      // Toggle Switch
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

      // New Flag Modal
      document.getElementById("new-flag-btn")?.addEventListener("click", () => {
        openFlagModal();
      });

      // Edit Flag Modal
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

      // Archive Flag
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
      <form id="flag-modal-form">
        <div class="field">
          <label>Flag Key</label>
          <input class="input" name="flag_key" value="${flag ? flag.key : ""}" placeholder="echo.translate" ${isEdit ? "readonly" : ""}>
        </div>
        <div class="field">
          <label>Description</label>
          <input class="input" name="description" value="${flag ? flag.description.replace(/"/g, "&quot;") : ""}" placeholder="Control translation features">
        </div>
        <div class="field">
          <label>Scope</label>
          <input class="input" name="scope" value="${flag ? flag.scope : "global"}" placeholder="tool:echo">
        </div>
        <div class="field">
          <label>Rollout Percentage (0-100)</label>
          <input class="input" type="number" min="0" max="100" name="rollout_percentage" value="${flag ? flag.rolloutPercentage : 100}">
        </div>
        <div class="field" style="margin-top:12px">
          <label style="display:flex;align-items:center;gap:10px">
            <input type="checkbox" name="enabled" ${!flag || flag.enabled ? "checked" : ""}>
            <span>Flag is enabled</span>
          </label>
        </div>
      </form>
    `,
    actions: `
      <button class="btn btn-primary" id="flag-save-btn">Save draft</button>
      <button class="btn btn-ghost" data-close-modal>Cancel</button>
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
      `<span class="muted small">${item.path}</span>`,
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
      return appLayout(`
        ${pageHead("Settings", "Cloudflare-native runtime configuration planning surface.")}
        <div class="grid grid-2">
          ${section("Public config flow", "D1 remains the source of truth. KV serves fast runtime snapshots.", `
            <div class="timeline">
              ${["Dashboard writes record", "Worker validates permissions", "D1 transaction stores draft", "Publish refreshes KV", "Public APIs read cached snapshot"].map((item) => `
                <div class="timeline-item"><span class="timeline-dot"></span><div>${item}</div></div>
              `).join("")}
            </div>
          `)}
          ${section("Bindings prepared", "The Worker config is ready for future resources.", `
            <p><strong>D1</strong><br><span class="muted">DB source of truth for admin data.</span></p>
            <p><strong>KV</strong><br><span class="muted">CONFIG_CACHE and RATE_LIMIT namespaces.</span></p>
            <p><strong>R2</strong><br><span class="muted">MEDIA_BUCKET for uploaded assets.</span></p>
          `)}
        </div>
        <div style="margin-top: 18px">
          ${section("Config Version Registry", "Lightweight metadata log of previous configurations published from the dashboard.", `
            <div class="table-wrap">
              <table class="table" style="min-width: 100%">
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
                      <td><strong>v${v.version}</strong> ${badge(v.status, v.status === "published" ? "live" : "draft")}</td>
                      <td>${v.notes || '<span class="muted" style="font-style:italic">No notes provided</span>'}</td>
                      <td><code>${v.created_by || "system"}</code></td>
                      <td>${new Date(v.created_at * 1000).toLocaleString()}</td>
                      <td>${v.published_at ? new Date(v.published_at * 1000).toLocaleString() : "Never"}</td>
                    </tr>
                  `).join("") || '<tr><td colspan="5" class="muted">No version records found.</td></tr>'}
                </tbody>
              </table>
            </div>
          `)}
        </div>
      `);
    },
    afterRender: bindLayout
  };
}

export function analyticsPage() {
  return {
    render: async () => {
      const data = await getAnalytics();
      return appLayout(`
        ${pageHead("Analytics", "Mock analytics placeholders for users, tools, API requests, and events.")}
        <div class="grid grid-4">
          ${metric("Users", data.totals.users.toLocaleString())}
          ${metric("Usage events", data.totals.toolUsage.toLocaleString())}
          ${metric("API requests", data.totals.apiRequests.toLocaleString())}
          ${metric("Active tools", data.totals.activeTools)}
        </div>
        <div class="grid grid-2" style="margin-top:16px">
          ${section("Growth chart", "Mock monthly trend.", chart(data.growth))}
          ${section("Top tools", "Future source: daily usage aggregates.", `
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Tool</th><th>Usage</th></tr></thead>
                <tbody>${data.topTools.map((tool) => `<tr><td>${tool.name}</td><td>${tool.usage.toLocaleString()}</td></tr>`).join("")}</tbody>
              </table>
            </div>
          `)}
        </div>
      `);
    },
    afterRender: bindLayout
  };
}

function tablePage({ title, subtitle, permissionNote, headers, rows }) {
  return {
    render: async () => {
      const bodyRows = await rows();
      return appLayout(`
        ${pageHead(title, subtitle)}
        <section class="panel">
          <p class="muted" style="margin-top:0">${permissionNote}</p>
          <div class="table-wrap">
            <table class="table">
              <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
              <tbody>
                ${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
      `);
    },
    afterRender: bindLayout
  };
}

function placeholderPage(title, subtitle, points) {
  return {
    render: () => appLayout(`
      ${pageHead(title, subtitle)}
      <section class="panel">
        <div class="empty-state">
          <h2 style="margin-top:0">${title} foundation</h2>
          <p>${subtitle}</p>
        </div>
        <div class="grid grid-3" style="margin-top:16px">
          ${points.map((point) => `<article class="card metric-card"><div class="metric-label">${point}</div></article>`).join("")}
        </div>
      </section>
    `),
    afterRender: bindLayout
  };
}
