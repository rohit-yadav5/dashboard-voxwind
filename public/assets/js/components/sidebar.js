import { getIcon } from "../core/icons.js";
import { currentPath } from "../core/router.js";
import { getSections, getVisibleNavigation } from "../core/navigation.js";
import { session } from "../core/state.js";
import { Button, Badge } from "./ui.js";
import { toast } from "./toast.js";

export function Sidebar() {
  const path = currentPath();
  const permissions = session.user ? session.user.permissions : [];
  const navItems = getVisibleNavigation(permissions);
  const sections = [...new Set(navItems.map(i => i.section))];
  
  const siteName = session.activeSite ? session.activeSite.displayName : "VoxWind Console";
  const siteDomain = session.activeSite?.primaryDomain || "Select a workspace";

  return `
    <aside class="vw-sidebar" id="sidebar">
      <!-- Site Switcher -->
      <a href="/dashboard/sites" data-route class="vw-sidebar-brand" style="cursor: pointer; padding: 16px; display: flex; align-items: center; justify-content: space-between; text-decoration: none; color: inherit;">
        <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
          <div class="vw-avatar" style="border-radius: 6px; flex-shrink: 0; background: var(--vw-primary); color: white;">
            ${siteName.charAt(0).toUpperCase()}
          </div>
          <div style="overflow: hidden; text-align: left;">
            <div class="vw-brand-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${siteName}</div>
            <div style="font-size: 11px; color: var(--vw-text-muted);">${siteDomain}</div>
          </div>
        </div>
        ${getIcon("ChevronsUpDown")}
      </a>
      
      <!-- Navigation -->
      <nav class="vw-sidebar-nav" style="flex: 1; overflow-y: auto;">
        ${sections.map(section => `
          <div class="vw-nav-section">
            <div class="vw-nav-title">${section}</div>
            ${navItems.filter(item => item.section === section).map(item => `
              <a href="${item.route}" data-route class="vw-nav-item ${path === item.route ? 'active' : ''}">
                ${getIcon(item.icon)}
                <span>${item.title}</span>
              </a>
            `).join('')}
          </div>
        `).join('')}
      </nav>

      <!-- User Profile -->
      <div style="position: relative; border-top: 1px solid var(--vw-border);">
        <div id="profile-trigger" style="padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s;">
          <div class="vw-avatar" style="flex-shrink: 0;">${session.user ? session.user.displayName?.charAt(0).toUpperCase() || 'U' : 'U'}</div>
          <div style="overflow: hidden; flex: 1; text-align: left;">
            <div style="font-size: 13px; font-weight: 500; color: var(--vw-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${session.user ? session.user.displayName || session.user.email : 'Guest'}
            </div>
            <div style="font-size: 11px; color: var(--vw-text-muted);">
              ${session.user ? session.user.role : 'Read-only'}
            </div>
          </div>
          ${getIcon("ChevronUp")}
        </div>
        
        <!-- Profile Dropdown -->
        <div id="profile-dropdown" style="display: none; position: absolute; bottom: 100%; left: 16px; right: 16px; background: var(--vw-surface); border: 1px solid var(--vw-border); border-radius: var(--vw-radius-md); box-shadow: var(--vw-shadow-lg); z-index: 10; margin-bottom: 8px; padding: 8px; flex-direction: column; gap: 4px;">
          <div style="padding: 8px 12px; border-bottom: 1px solid var(--vw-border); margin-bottom: 4px; text-align: left;">
            <div style="font-weight: 600; color: var(--vw-text); font-size: 13px;">${session.user ? session.user.displayName || session.user.email : 'Guest'}</div>
            <div style="font-size: 11px; color: var(--vw-text-muted); word-break: break-all; margin-top: 2px;">${session.user ? session.user.email : ''}</div>
            <div style="margin-top: 6px;">
              ${Badge({ label: session.user ? session.user.role : 'Guest', tone: 'default' })}
            </div>
          </div>
          ${Button({ label: "Manage Account", href: "/dashboard/settings", variant: "ghost", extraAttrs: 'style="justify-content: flex-start; min-height: 32px; padding: 0 8px; font-size: 13px; width: 100%;"' })}
          <button id="profile-settings-btn" class="vw-btn vw-btn-ghost" style="justify-content: flex-start; min-height: 32px; padding: 0 8px; font-size: 13px; width: 100%; cursor: pointer;">
            ${getIcon("Sliders")} Profile Settings
          </button>
          <button id="sign-out-btn" class="vw-btn vw-btn-ghost" style="justify-content: flex-start; min-height: 32px; padding: 0 8px; font-size: 13px; width: 100%; color: var(--vw-danger); cursor: pointer;">
            ${getIcon("LogOut")} Sign Out
          </button>
        </div>
      </div>
    </aside>
  `;
}
let isDropdownClickBound = false;

export function bindSidebar() {
  const trigger = document.getElementById("profile-trigger");
  const dropdown = document.getElementById("profile-dropdown");
  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === "flex";
      dropdown.style.display = isVisible ? "none" : "flex";
    });
  }

  if (!isDropdownClickBound) {
    document.addEventListener("click", () => {
      const dropdown = document.getElementById("profile-dropdown");
      if (dropdown) {
        dropdown.style.display = "none";
      }
    });
    isDropdownClickBound = true;
  }

  document.getElementById("profile-settings-btn")?.addEventListener("click", () => {
    toast("Profile settings are currently under development.");
  });

  document.getElementById("sign-out-btn")?.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        localStorage.clear();
        sessionStorage.clear();
        toast("Signed out successfully");
        window.location.href = "/login";
      } else {
        toast("Sign out failed");
      }
    } catch (err) {
      toast("Sign out failed: " + err.message);
    }
  });
}