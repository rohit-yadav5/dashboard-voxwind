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
        <div class="vw-search" id="cmd-palette-trigger" style="cursor: pointer;">
          ${getIcon("Search")}
          <input type="text" class="vw-input" placeholder="Search or jump to... (⌘K)" readonly style="cursor: pointer; pointer-events: none;">
        </div>
      </div>
      <div class="vw-topbar-right">
        <select class="vw-select" id="runtime-env" style="width: 140px; min-height: 36px; padding: 6px 10px;">
          ${["production", "staging", "development"].map((e) => (
            `<option value="${e}" ${env === e ? "selected" : ""}>${e}</option>`
          )).join("")}
        </select>
      </div>
    </header>
  `;
}

export function bindTopbar() {
  document.getElementById("nav-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });
  
  document.getElementById("runtime-env")?.addEventListener("change", (event) => {
    setEnvironment(event.target.value);
    navigate(currentPath());
  });

  document.getElementById("cmd-palette-trigger")?.addEventListener("click", () => {
    const palette = document.getElementById("command-palette");
    if (palette) {
      palette.classList.add("open");
      palette.querySelector("input")?.focus();
    }
  });
}