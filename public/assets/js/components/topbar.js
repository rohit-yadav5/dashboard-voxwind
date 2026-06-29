import { getIcon } from "../core/icons.js";
import { session } from "../core/state.js";
import { getEnvironment, setEnvironment } from "../services/admin-api.js";
import { currentPath, navigate } from "../core/router.js";

export function Topbar() {
  const env = getEnvironment();
  const userName = session.user ? session.user.displayName : "";
  const userInitial = userName ? userName[0].toUpperCase() : "V";

  return `
    <header class="vw-topbar">
      <div class="vw-topbar-left">
        <button class="vw-icon-btn vw-mobile-toggle" id="nav-toggle" aria-label="Toggle Menu">
          ${getIcon("Menu")}
        </button>
      </div>
      
      <div class="vw-topbar-center">
        <!-- Global Search Trigger -->
        <button id="cmd-palette-trigger" class="vw-topbar-search">
          <div class="vw-topbar-search-inner">
            <div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon("Search")}
            </div>
            <span class="vw-topbar-search-text">Search...</span>
          </div>
          <div style="display: flex; align-items: center; flex-shrink: 0;">
            <kbd class="vw-topbar-search-kbd">⌘K</kbd>
          </div>
        </button>
      </div>

      <div class="vw-topbar-right">
        <div class="vw-env-selector">
          <!-- Environment Selector -->
          <button id="env-selector-trigger" class="vw-env-trigger vw-btn-ghost" aria-haspopup="true" aria-expanded="false" style="display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--vw-success); box-shadow: 0 0 6px rgba(42, 122, 42, 0.4);"></div>
            <span style="text-transform: capitalize;">${env}</span>
            <div style="display: flex; align-items: center; justify-content: center; color: var(--vw-text-muted);">
              ${getIcon("ChevronsUpDown")}
            </div>
          </button>
          
          <div id="env-selector-dropdown" class="vw-dropdown open-down">
            <button class="vw-dropdown-item env-option ${env === 'production' ? 'active' : ''}" data-env="production">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--vw-success);"></div>
                <span>Production</span>
              </div>
              ${env === 'production' ? getIcon("Check") : ""}
            </button>
            <button class="vw-dropdown-item env-option" data-env="staging">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--vw-gray-300);"></div>
                <span>Staging</span>
              </div>
              <span style="font-size: 11px; background: var(--vw-surface-hover); border: 1px solid var(--vw-border); padding: 2px 6px; border-radius: 99px; color: var(--vw-text-muted);">Soon</span>
            </button>
            <button class="vw-dropdown-item env-option" data-env="development">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--vw-gray-300);"></div>
                <span>Development</span>
              </div>
              <span style="font-size: 11px; background: var(--vw-surface-hover); border: 1px solid var(--vw-border); padding: 2px 6px; border-radius: 99px; color: var(--vw-text-muted);">Soon</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

let isEnvDropdownBound = false;

export function bindTopbar() {
  document.getElementById("nav-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
    document.getElementById("sidebar-overlay")?.classList.toggle("open");
  });
  
  const trigger = document.getElementById("env-selector-trigger");
  const dropdown = document.getElementById("env-selector-dropdown");
  
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

  document.querySelectorAll(".env-option").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const selectedEnv = e.currentTarget.getAttribute("data-env");
      if (selectedEnv === "production") {
        setEnvironment(selectedEnv);
        navigate(currentPath());
      } else {
        import("./toast.js").then(({ toast }) => toast(`${selectedEnv} environment is coming soon.`, "info"));
      }
      if (dropdown) dropdown.style.display = "none";
    });
  });

  if (!isEnvDropdownBound) {
    document.addEventListener("click", () => {
      const dd = document.getElementById("env-selector-dropdown");
      const trigger = document.getElementById("env-selector-trigger");
      if (dd && dd.classList.contains("open")) {
        dd.classList.remove("open");
      }
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    isEnvDropdownBound = true;
  }

  document.getElementById("cmd-palette-trigger")?.addEventListener("click", () => {
    const palette = document.getElementById("command-palette");
    if (palette) {
      palette.classList.add("open");
      palette.querySelector("input")?.focus();
    }
  });
}