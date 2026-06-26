import { getSite, listSiteResources, syncSiteResources } from "../services/admin-api.js";
import { PageHeader, Badge, Button } from "../components/ui.js";
import { SkeletonLoader, EmptyState } from "../components/feedback.js";
import { getIcon } from "../core/icons.js";

function renderResourceGroup(provider, type, resources) {
  const cards = resources.map(res => {
    let metaHtml = "";
    if (res.metadata) {
      metaHtml = Object.entries(res.metadata).map(([k, v]) => `
        <div style="font-size: 11px; color: var(--vw-text-muted);">
          <span style="text-transform: capitalize;">${k.replace(/_/g, ' ')}</span>: <span style="color: var(--vw-text);">${v}</span>
        </div>
      `).join('');
    }

    return `
      <div class="vw-card" style="padding: var(--vw-space-3);">
        <div style="font-weight: 500; color: var(--vw-text); font-size: 14px; margin-bottom: var(--vw-space-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${res.resource_name}">
          ${res.resource_name}
        </div>
        ${metaHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom: var(--vw-space-5);">
      <h3 class="vw-h3" style="text-transform: capitalize; margin-bottom: var(--vw-space-3); font-size: 14px; color: var(--vw-text-muted); border-bottom: 1px solid var(--vw-border); padding-bottom: 8px;">
        ${type === 'd1' ? 'D1 Databases' : type === 'kv' ? 'KV Namespaces' : type + 's'}
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
          <h2 class="vw-h2">Overview</h2>
          <p class="vw-text-muted" style="margin-top: var(--vw-space-2);">Site ID: ${site.id}</p>
          <p class="vw-text-muted">Slug: ${site.slug}</p>
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
        infraHtml += `<h2 class="vw-h2" style="margin-bottom: var(--vw-space-4); text-transform: capitalize; display: flex; align-items: center; gap: 8px;">${getIcon("Cloud")} ${provider}</h2>`;
        
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
        
        <div id="site-tabs-container" class="vw-tabs" style="margin-top: var(--vw-space-4); border-bottom: 1px solid var(--vw-border); display: flex; gap: var(--vw-space-4);">
          <button class="vw-tab ${currentTab === 'overview' ? 'active' : ''}" data-tab="overview" style="background: none; border: none; padding: 8px 0; cursor: pointer; color: ${currentTab === 'overview' ? 'var(--vw-primary)' : 'var(--vw-text-muted)'}; font-weight: 500; border-bottom: 2px solid ${currentTab === 'overview' ? 'var(--vw-primary)' : 'transparent'};">Overview</button>
          <button class="vw-tab ${currentTab === 'infrastructure' ? 'active' : ''}" data-tab="infrastructure" style="background: none; border: none; padding: 8px 0; cursor: pointer; color: ${currentTab === 'infrastructure' ? 'var(--vw-primary)' : 'var(--vw-text-muted)'}; font-weight: 500; border-bottom: 2px solid ${currentTab === 'infrastructure' ? 'var(--vw-primary)' : 'transparent'};">Infrastructure</button>
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
            t.style.color = "var(--vw-text-muted)";
            t.style.borderBottomColor = "transparent";
          });
          tabBtn.style.color = "var(--vw-primary)";
          tabBtn.style.borderBottomColor = "var(--vw-primary)";
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
          } catch (err) {
            toast("Sync failed: " + err.message);
          } finally {
            isSyncing = false;
            reRender();
          }
        }
      });
    }
  };
}