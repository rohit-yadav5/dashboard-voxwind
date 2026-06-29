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
  
  const siteName = session.activeSite ? (session.activeSite.displayName || session.activeSite.name) : "VoxWind Console";
  const siteDomain = session.activeSite?.primaryDomain || "Select a workspace";

  return `
    <aside class="vw-sidebar" id="sidebar">
      <!-- Site Switcher -->
      <a href="/dashboard/sites" data-route class="vw-sidebar-header">
        <div class="vw-sidebar-header-info">
          <div class="vw-avatar vw-avatar-sm" style="background: var(--vw-gray-800); color: #ffffff;">
            ${siteName.charAt(0).toUpperCase()}
          </div>
          <div class="vw-sidebar-header-text">
            <div class="vw-brand-title">${siteName}</div>
            <div class="vw-brand-subtitle">${siteDomain}</div>
          </div>
        </div>
        <div style="color: var(--vw-text-muted); flex-shrink: 0;">
          ${getIcon("ChevronsUpDown")}
        </div>
      </a>
      
      <!-- Navigation -->
      <nav class="vw-sidebar-nav">
        ${sections.map(section => `
          <details class="vw-nav-details" open>
            <summary class="vw-nav-title">
              <span>${section}</span>
              ${getIcon("ChevronDown")}
            </summary>
            <div class="vw-nav-group">
              ${navItems.filter(item => item.section === section).map(item => `
                <a href="${item.route}" data-route class="vw-nav-item ${path === item.route ? 'active' : ''}">
                  ${getIcon(item.icon)}
                  <span>${item.title}</span>
                </a>
              `).join('')}
            </div>
          </details>
        `).join('')}
      </nav>

      <!-- User Profile -->
      <div class="vw-sidebar-footer">
        <button id="profile-trigger" class="vw-profile-trigger" aria-haspopup="true" aria-expanded="false">
          <div class="vw-profile-info">
            <div class="vw-avatar vw-avatar-sm" style="background: var(--vw-surface-hover); color: var(--vw-gray-800); border: 1px solid var(--vw-border);">
              ${session.user ? (session.user.displayName || session.user.email || 'U').charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="vw-profile-text">
              <div class="vw-profile-name">
                ${session.user ? (session.user.displayName || session.user.email) : 'Guest'}
              </div>
              <div class="vw-profile-role">
                ${session.user ? session.user.role : 'Read-only'}
              </div>
            </div>
          </div>
          <div style="color: var(--vw-text-muted); flex-shrink: 0;">
            ${getIcon("ChevronsUpDown")}
          </div>
        </button>
        
        <!-- Profile Dropdown -->
        <div id="profile-dropdown" class="vw-dropdown open-up">
          <div class="vw-dropdown-header">
            <div class="vw-dropdown-title">${session.user ? (session.user.displayName || session.user.email) : 'Guest'}</div>
            <div class="vw-dropdown-subtitle">${session.user ? session.user.email : ''}</div>
          </div>
          <a href="/dashboard/settings" data-route class="vw-dropdown-item">
            ${getIcon("User")} <span>Account Settings</span>
          </a>
          <a href="/dashboard/settings" data-route class="vw-dropdown-item">
            ${getIcon("Settings")} <span>Platform Settings</span>
          </a>
          <div class="vw-dropdown-divider"></div>
          <button id="sign-out-btn" class="vw-dropdown-item danger">
            ${getIcon("LogOut")} <span>Sign Out</span>
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
      const isVisible = dropdown.classList.contains("open");
      if (isVisible) {
        dropdown.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      } else {
        dropdown.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  }

  if (!isDropdownClickBound) {
    document.addEventListener("click", () => {
      const dropdown = document.getElementById("profile-dropdown");
      const trigger = document.getElementById("profile-trigger");
      if (dropdown && dropdown.classList.contains("open")) {
        dropdown.classList.remove("open");
      }
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    isDropdownClickBound = true;
  }

  document.getElementById("sign-out-btn")?.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        localStorage.clear();
        sessionStorage.clear();
        toast("Signed out successfully", "success");
        window.location.href = "/login";
      } else {
        toast("Sign out failed", "error");
      }
    } catch (err) {
      toast("Sign out failed: " + err.message, "error");
    }
  });
}