import { getSite, listSiteResources, syncSiteResources } from "../services/admin-api.js";
import { PageHeader, Badge, Button } from "../components/ui.js";
import { SkeletonLoader, EmptyState } from "../components/feedback.js";
import { getIcon } from "../core/icons.js";
import { toast } from "../components/toast.js";

function renderResourceGroup(provider, type, resources) {
  const cards = resources.map(res => {
    let metaHtml = "";
    if (res.metadata) {
      metaHtml = Object.entries(res.metadata).map(([k, v]) => `
        <div style="font-size: 11px; color: var(--vw-text-muted); margin-top: 4px;">
          <span style="text-transform: capitalize; font-weight: 500;">${k.replace(/_/g, ' ')}</span>: <span style="color: var(--vw-text); font-family: var(--vw-font-mono);">${v}</span>
        </div>
      `).join('');
    }

    return `
      <div class="vw-card" style="padding: var(--vw-space-3); background: var(--vw-bg);">
        <div style="font-weight: 600; color: var(--vw-text); font-size: 13px; margin-bottom: var(--vw-space-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${res.resource_name}">
          ${res.resource_name}
        </div>
        ${metaHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom: var(--vw-space-5);">
      <h3 class="vw-h3" style="text-transform: capitalize; margin-bottom: var(--vw-space-3); font-size: 13px; color: var(--vw-text-muted); border-bottom: 1px solid var(--vw-border); padding-bottom: var(--vw-space-2); display: flex; align-items: center; gap: 8px;">
        <span>${type === 'd1' ? 'D1 Databases' : type === 'kv' ? 'KV Namespaces' : type + 's'}</span>
        ${Badge({ label: resources.length, tone: "default" })}
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--vw-space-3);">
        ${cards}
      </div>
    </div>
  `;
}

export function siteDetailsPage(idOrSlug) {
  let site = null;
  let resources = [];
  let loading = true;
  let isSyncing = false;
  let error = null;
  let currentTab = "infrastructure"; // Defaulting to infra for this sprint

  const renderContent = () => {
    if (loading) return `<div style="margin-top: var(--vw-space-5);">${SkeletonLoader({ rows: 6 })}</div>`;
    if (error) return EmptyState({ icon: "AlertCircle", title: "Error", description: error });

    if (currentTab === "overview") {
      return `
        <div class="vw-card" style="margin-top: var(--vw-space-4);">
          <h3 class="vw-h3" style="margin-bottom: var(--vw-space-3); font-weight: 600;">Workspace Identity</h3>
          <div style="display: grid; gap: var(--vw-space-3); font-size: 13px;">
            <div><span style="color: var(--vw-text-muted); font-weight: 500;">Site ID:</span> <code style="font-family: var(--vw-font-mono); color: var(--vw-text);">${site.id}</code></div>
            <div><span style="color: var(--vw-text-muted); font-weight: 500;">Unique Slug:</span> <code style="font-family: var(--vw-font-mono); color: var(--vw-text);">${site.slug}</code></div>
            <div><span style="color: var(--vw-text-muted); font-weight: 500;">Domain Configured:</span> <span style="color: var(--vw-text);">${site.primary_domain || 'None'}</span></div>
          </div>
        </div>
      `;
    }

    if (currentTab === "infrastructure") {
      if (resources.length === 0) {
        return `
          <div style="margin-top: var(--vw-space-4);">
            ${EmptyState({
              icon: "Cloud",
              title: "No Infrastructure Discovered",
              description: "This workspace has no cached infrastructure resources.",
              actions: Button({ label: isSyncing ? "Syncing..." : "Sync with Cloudflare", extraAttrs: isSyncing ? "disabled" : 'id="sync-cf-btn"', icon: "RefreshCw" })
            })}
          </div>
        `;
      }

      // Group by provider, then by type
      const providers = [...new Set(resources.map(r => r.provider))];
      let infraHtml = `<div style="margin-bottom: var(--vw-space-4); display: flex; justify-content: flex-end;">
         ${Button({ label: isSyncing ? "Syncing..." : "Sync Resources", extraAttrs: isSyncing ? "disabled" : 'id="sync-cf-btn"', icon: "RefreshCw", variant: "secondary" })}
      </div>`;

      providers.forEach(provider => {
        infraHtml += `<div class="vw-card" style="margin-bottom: var(--vw-space-5); padding: var(--vw-space-4);">`;
        infraHtml += `<h2 class="vw-h2" style="margin-bottom: var(--vw-space-4); text-transform: capitalize; display: flex; align-items: center; gap: 8px;">
          <span style="display: flex; align-items: center; color: var(--vw-text-subtle);">${getIcon("Cloud")}</span>
          <span style="font-weight: 600;">${provider}</span>
        </h2>`;
        
        const providerRes = resources.filter(r => r.provider === provider);
        const types = [...new Set(providerRes.map(r => r.resource_type))];
        
        types.forEach(type => {
          const typedRes = providerRes.filter(r => r.resource_type === type);
          infraHtml += renderResourceGroup(provider, type, typedRes);
        });

        infraHtml += `</div>`;
      });

      return infraHtml;
    }
  };

  const reRender = () => {
    const container = document.getElementById("site-details-content");
    if (container) {
      container.innerHTML = renderContent();
    }
  };

  return {
    render: async () => {
      Promise.all([
        getSite(idOrSlug).catch(() => null),
        listSiteResources(idOrSlug).catch(() => [])
      ]).then(([s, r]) => {
        site = s;
        resources = r;
        loading = false;
        if (!site) error = "Site not found";

        const headerContainer = document.getElementById("site-header-container");
        if (headerContainer) {
          if (site) {
            headerContainer.innerHTML = PageHeader({
              title: site.display_name || site.name,
              subtitle: site.primary_domain || "Workspace Management",
              actions: Badge({ label: site.status, tone: site.status === 'active' ? 'success' : 'default' })
            });
          } else {
            headerContainer.innerHTML = PageHeader({ title: "Error", subtitle: "Could not load site" });
          }
        }
        reRender();
      });

      return `
        <div id="site-header-container">
          ${PageHeader({ title: "Loading...", subtitle: "Fetching workspace details..." })}
        </div>
        
        <div id="site-tabs-container" class="vw-tabs" style="margin-top: var(--vw-space-4);">
          <button class="vw-tab ${currentTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
          <button class="vw-tab ${currentTab === 'infrastructure' ? 'active' : ''}" data-tab="infrastructure">Infrastructure</button>
        </div>

        <div id="site-details-content" style="margin-top: var(--vw-space-4);">
          ${renderContent()}
        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("site-tabs-container")?.addEventListener("click", (e) => {
        const tabBtn = e.target.closest(".vw-tab");
        if (tabBtn) {
          currentTab = tabBtn.getAttribute("data-tab");
          document.querySelectorAll(".vw-tab").forEach(t => {
            t.classList.remove("active");
          });
          tabBtn.classList.add("active");
          reRender();
        }
      });

      document.getElementById("site-details-content")?.addEventListener("click", async (e) => {
        if (e.target.closest("#sync-cf-btn")) {
          if (isSyncing || !site) return;
          isSyncing = true;
          reRender();
          try {
            await syncSiteResources(site.id, "cloudflare");
            resources = await listSiteResources(site.id);
            toast("Infrastructure sync successful", "success");
          } catch (err) {
            toast("Sync failed: " + err.message, "error");
          } finally {
            isSyncing = false;
            reRender();
          }
        }
      });
    }
  };
}