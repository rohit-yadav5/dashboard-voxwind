import { getIcon } from "../core/icons.js";
import { listSites, updateSite, archiveSite } from "../services/admin-api.js";
import { Badge, Button, PageHeader } from "../components/ui.js";
import { Card } from "../components/cards.js";
import { SearchInput } from "../components/forms.js";
import { EmptyState, SkeletonLoader } from "../components/feedback.js";
import { setActiveSite } from "../core/state.js";
import { navigate } from "../core/router.js";

export function sitesPage() {
  let sites = [];
  let loading = true;
  let error = null;
  let searchTerm = "";

  const renderContent = () => {
    if (loading) {
      return `<div style="margin-top: var(--vw-space-5);">${SkeletonLoader({ rows: 5 })}</div>`;
    }

    if (error) {
      return EmptyState({
        icon: "AlertCircle",
        title: "Failed to load sites",
        description: error,
        actions: Button({ label: "Try Again", variant: "secondary", extraAttrs: 'id="retry-btn"' })
      });
    }

    const filtered = sites.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filtered.length === 0) {
      if (searchTerm) {
        return EmptyState({
          icon: "Search",
          title: "No sites found",
          description: `No results matching "${searchTerm}"`
        });
      }
      return EmptyState({
        icon: "Sites",
        title: "No sites configured",
        description: "Create your first workspace to start managing resources.",
        actions: Button({ label: "Create Site", href: "/dashboard/sites/new", icon: "Plus" })
      });
    }

    const gridHtml = filtered.map(site => {
      const toneMap = { active: 'success', maintenance: 'warning', archived: 'default', draft: 'default' };
      const tone = toneMap[site.status] || 'default';
      const badgeHtml = Badge({ label: site.status, tone });
      const avatarHtml = `<div class="vw-avatar" style="background: var(--vw-primary); color: white;">${site.name.charAt(0).toUpperCase()}</div>`;
      
      return `
        <div class="vw-card" style="cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease;" data-site-id="${site.id}" class="site-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--vw-space-4);">
            ${avatarHtml}
            ${badgeHtml}
          </div>
          <h3 class="vw-h3" style="margin-bottom: var(--vw-space-2);">${site.display_name || site.name}</h3>
          <p class="vw-text-muted" style="margin-bottom: var(--vw-space-4); font-size: 13px;">${site.primary_domain || 'No primary domain'}</p>
          <div style="display: flex; gap: var(--vw-space-3); border-top: 1px solid var(--vw-border); padding-top: var(--vw-space-3);">
            <button class="vw-btn vw-btn-secondary switch-site-btn" data-id="${site.id}" style="flex: 1; justify-content: center;">Enter Workspace</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--vw-space-4); margin-top: var(--vw-space-5);">
        ${gridHtml}
      </div>
    `;
  };

  const reRender = () => {
    const container = document.getElementById("sites-content");
    if (container) {
      container.innerHTML = renderContent();
    }
  };

  return {
    render: async () => {
      // Initiate fetch but render skeleton immediately
      listSites().then(data => {
        sites = data;
        loading = false;
        reRender();
      }).catch(err => {
        error = err.message;
        loading = false;
        reRender();
      });

      return `
        ${PageHeader({
          title: "Sites",
          subtitle: "Manage your workspaces, APIs, and background workers.",
          actions: Button({ label: "Create Site", href: "/dashboard/sites/new", icon: "Plus" })
        })}
        
        <div style="display: flex; gap: var(--vw-space-3); margin-top: var(--vw-space-5); align-items: center;">
          <div style="width: 320px;">
            ${SearchInput({ id: "site-search", placeholder: "Search sites by name..." })}
          </div>
        </div>

        <div id="sites-content">
          ${renderContent()}
        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("site-search")?.addEventListener("input", (e) => {
        searchTerm = e.target.value;
        reRender();
      });

      document.getElementById("sites-content")?.addEventListener("click", (e) => {
        const switchBtn = e.target.closest(".switch-site-btn");
        if (switchBtn) {
          const siteId = switchBtn.getAttribute("data-id");
          const site = sites.find(s => s.id === siteId);
          if (site) {
            setActiveSite(site);
            navigate("/dashboard");
          }
        }

        if (e.target.id === "retry-btn") {
          loading = true;
          error = null;
          reRender();
          listSites().then(data => {
            sites = data;
            loading = false;
            reRender();
          }).catch(err => {
            error = err.message;
            loading = false;
            reRender();
          });
        }
      });
    }
  };
}