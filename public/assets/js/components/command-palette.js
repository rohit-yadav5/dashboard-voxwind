import { getIcon } from "../core/icons.js";
import { navigationConfig } from "../core/navigation.js";
import { navigate } from "../core/router.js";

export function CommandPalette() {
  return `
    <div class="vw-cmd-palette" id="command-palette">
      <div class="vw-cmd-dialog">
        <div style="display: flex; align-items: center; border-bottom: 1px solid var(--vw-border); padding: 0 16px;">
          <div style="color: var(--vw-text-subtle); display: flex; align-items: center; justify-content: center;">
            ${getIcon("Search")}
          </div>
          <input type="text" id="cmd-input" class="vw-cmd-input" placeholder="Search pages, configurations, and tools..." style="border-bottom: none;" autocomplete="off">
        </div>
        <div class="vw-cmd-results" id="cmd-results">
          <!-- Populated dynamically via JS -->
        </div>
        <div style="padding: 12px 20px; border-top: 1px solid var(--vw-border); font-size: 11px; color: var(--vw-text-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--vw-surface);">
          <span style="display: flex; gap: 8px; align-items: center;">
            <span>Navigate: <kbd style="font-family: var(--vw-font-sans); padding: 1px 4px; border: 1px solid var(--vw-border); border-radius: 3px; background: var(--vw-bg);">↑</kbd><kbd style="font-family: var(--vw-font-sans); padding: 1px 4px; border: 1px solid var(--vw-border); border-radius: 3px; background: var(--vw-bg); margin-left: 2px;">↓</kbd></span>
            <span>Select: <kbd style="font-family: var(--vw-font-sans); padding: 1px 4px; border: 1px solid var(--vw-border); border-radius: 3px; background: var(--vw-bg);">↵</kbd></span>
          </span>
          <span>Close: <kbd style="font-family: var(--vw-font-sans); padding: 1px 4px; border: 1px solid var(--vw-border); border-radius: 3px; background: var(--vw-bg);">esc</kbd></span>
        </div>
      </div>
    </div>
  `;
}

let isPaletteKeydownBound = false;

export function bindCommandPalette() {
  const palette = document.getElementById("command-palette");
  const input = document.getElementById("cmd-input");
  const resultsContainer = document.getElementById("cmd-results");
  
  if (!palette || !input || !resultsContainer) return;

  const items = [
    ...navigationConfig.map(nav => ({ type: 'route', category: 'Navigation', title: 'Go to ' + nav.title, route: nav.route, icon: nav.icon })),
    { type: 'action', category: 'Actions', title: 'Create new workspace', route: '/dashboard/sites/new', icon: 'Sites' },
    { type: 'action', category: 'Actions', title: 'Add new platform tool', route: '/dashboard/tools/add', icon: 'Tools' },
    { type: 'action', category: 'Actions', title: 'Invite team user', route: '/dashboard/users', icon: 'Users' }
  ];

  let selectedIndex = 0;
  let filteredItems = [...items];

  function renderResults() {
    resultsContainer.innerHTML = '';
    if (filteredItems.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 24px 20px; text-align: center; color: var(--vw-text-muted); font-size: 13px;">No matching sections found.</div>';
      return;
    }

    let lastCategory = "";
    filteredItems.forEach((item, index) => {
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        const header = document.createElement("div");
        header.style = "padding: 12px 16px 6px; font-size: 10px; font-weight: 600; color: var(--vw-text-subtle); text-transform: uppercase; letter-spacing: 0.05em;";
        header.textContent = lastCategory;
        resultsContainer.appendChild(header);
      }

      const el = document.createElement("div");
      el.className = "vw-cmd-item" + (index === selectedIndex ? " selected" : "");
      el.dataset.index = index;
      el.innerHTML = `
        ${getIcon(item.icon)}
        <span style="flex: 1;">${item.title}</span>
        <span style="font-size: 11px; color: var(--vw-text-subtle);">Jump</span>
      `;
      el.addEventListener("click", () => {
        closePalette();
        navigate(item.route);
      });
      el.addEventListener("mouseenter", () => {
        selectedIndex = index;
        updateSelection();
      });
      resultsContainer.appendChild(el);
    });

    // Ensure selected item is scrolled into view
    const selectedEl = resultsContainer.querySelector(".vw-cmd-item.selected");
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }

  function updateSelection() {
    resultsContainer.querySelectorAll(".vw-cmd-item").forEach((el) => {
      const idx = parseInt(el.dataset.index, 10);
      if (idx === selectedIndex) {
        el.classList.add("selected");
      } else {
        el.classList.remove("selected");
      }
    });
  }

  function closePalette() {
    palette.classList.remove("open");
    input.value = "";
    input.blur();
    filteredItems = [...items];
    selectedIndex = 0;
  }

  // Bind input for filtering
  input.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    filteredItems = items.filter(item => item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
    selectedIndex = 0;
    renderResults();
  });

  // Keydown on input for navigation
  input.addEventListener("keydown", (e) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredItems.length;
      updateSelection();
      const selectedEl = resultsContainer.querySelector(`.vw-cmd-item[data-index="${selectedIndex}"]`);
      if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
      updateSelection();
      const selectedEl = resultsContainer.querySelector(`.vw-cmd-item[data-index="${selectedIndex}"]`);
      if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = filteredItems[selectedIndex];
      if (selectedItem) {
        closePalette();
        navigate(selectedItem.route);
      }
    }
  });

  // Close on backdrop click
  palette.addEventListener("click", (e) => {
    if (e.target === palette) {
      closePalette();
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
          const inp = document.getElementById("cmd-input");
          if (inp) inp.value = "";
          filteredItems = [...items];
          selectedIndex = 0;
          renderResults();
          inp?.focus();
        } else {
          closePalette();
        }
      }
      if (e.key === "Escape" && activePalette.classList.contains("open")) {
        closePalette();
      }
    });
    isPaletteKeydownBound = true;
  }
}