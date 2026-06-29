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

    const filtered = sites.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.display_name && s.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
      const avatarHtml = `<div class="vw-avatar" style="width: 32px; height: 32px; font-size: 14px; background: var(--vw-surface-hover); color: var(--vw-gray-800); border: 1px solid var(--vw-border); border-radius: 6px; font-weight: 600;">${site.name.charAt(0).toUpperCase()}</div>`;
      
      return `
        <div class="vw-card site-card" style="cursor: pointer; padding: 16px; transition: border-color var(--vw-transition-fast), box-shadow var(--vw-transition-fast); display: flex; flex-direction: column; justify-content: space-between;" data-site-id="${site.id}">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
              ${avatarHtml}
              <div style="min-width: 0; overflow: hidden;">
                <h3 class="vw-h3" style="margin: 0 0 2px 0; font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${site.display_name || site.name}</h3>
                <p class="vw-text-muted" style="margin: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${site.primary_domain || 'No primary domain'}</p>
              </div>
            </div>
            <div style="flex-shrink: 0; margin-left: 8px;">
              ${badgeHtml}
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--vw-text-muted);">
              ${getIcon("Server")} <span style="font-weight: 500; color: var(--vw-text);">Edge Network</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--vw-text-muted);">
              ${getIcon("Clock")} <span>Synced 2 mins ago</span>
            </div>
          </div>

          <div style="display: flex; gap: var(--vw-space-2); border-top: 1px solid var(--vw-border); padding-top: 12px; margin-top: auto;">
            <button class="vw-btn vw-btn-ghost switch-site-btn" data-id="${site.id}" style="flex: 1; justify-content: center; background: var(--vw-surface-hover); min-height: 28px; height: 28px; font-size: 12px; padding: 0 8px;">Enter Workspace</button>
            <button class="vw-icon-btn" style="border: 1px solid var(--vw-border); border-radius: 6px; padding: 0; width: 28px; height: 28px;">
              ${getIcon("MoreHorizontal")}
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="vw-grid-auto" style="margin-top: var(--vw-space-5);">
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
        <div class="vw-page">
          ${PageHeader({
            title: "Sites",
            subtitle: "Manage your workspaces, APIs, and background workers.",
            actions: Button({ label: "Create Site", href: "/dashboard/sites/new", icon: "Plus" })
          })}
          
          <div style="display: flex; gap: var(--vw-space-3); margin-top: var(--vw-space-5); align-items: center;">
            <div style="width: 320px; max-width: 100%;">
              ${SearchInput({ id: "site-search", placeholder: "Search sites by name..." })}
            </div>
          </div>

          <div id="sites-content">
            ${renderContent()}
          </div>
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
        const card = e.target.closest(".site-card");
        
        let siteId = null;
        if (switchBtn) {
          siteId = switchBtn.getAttribute("data-id");
        } else if (card) {
          siteId = card.getAttribute("data-site-id");
        }
        
        if (siteId) {
          const site = sites.find(s => s.id === siteId);
          if (site) {
            setActiveSite(site);
            navigate("/dashboard/sites/" + site.id);
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