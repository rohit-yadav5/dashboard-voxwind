import { getIcon } from "../core/icons.js";

export function CommandPalette() {
  return `
    <div class="vw-cmd-palette" id="command-palette">
      <div class="vw-cmd-dialog">
        <div style="display: flex; align-items: center; border-bottom: 1px solid var(--vw-border);">
          <div style="padding-left: 20px; color: var(--vw-text-muted);">
            ${getIcon("Search")}
          </div>
          <input type="text" class="vw-cmd-input" placeholder="What do you need?" style="border-bottom: none;" autocomplete="off">
        </div>
        <div class="vw-cmd-results">
          <div class="vw-cmd-item selected">
            ${getIcon("Sites")}
            <span>Go to Sites</span>
          </div>
          <div class="vw-cmd-item">
            ${getIcon("Users")}
            <span>Go to Users</span>
          </div>
          <div class="vw-cmd-item">
            ${getIcon("Settings")}
            <span>Go to Settings</span>
          </div>
        </div>
        <div style="padding: 12px 20px; border-top: 1px solid var(--vw-border); font-size: 11px; color: var(--vw-text-subtle); display: flex; justify-content: space-between;">
          <span>Navigation and search coming soon</span>
          <span><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>
  `;
}

let isPaletteKeydownBound = false;

export function bindCommandPalette() {
  const palette = document.getElementById("command-palette");
  if (!palette) return;

  // Close on backdrop click
  palette.addEventListener("click", (e) => {
    if (e.target === palette) {
      palette.classList.remove("open");
    }
  });

  if (!isPaletteKeydownBound) {
    document.addEventListener("keydown", (e) => {
      const activePalette = document.getElementById("command-palette");
      if (!activePalette) return;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        activePalette.classList.toggle("open");
        if (activePalette.classList.contains("open")) {
          activePalette.querySelector("input")?.focus();
        }
      }
      if (e.key === "Escape" && activePalette.classList.contains("open")) {
        activePalette.classList.remove("open");
      }
    });
    isPaletteKeydownBound = true;
  }
}