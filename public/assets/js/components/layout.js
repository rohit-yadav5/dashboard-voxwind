import { Sidebar, bindSidebar } from "./sidebar.js";
import { Topbar, bindTopbar } from "./topbar.js";
import { CommandPalette, bindCommandPalette } from "./command-palette.js";

let shellMounted = false;

export function AppShell() {
  shellMounted = false;
  return `
    <div class="vw-app-shell">
      <div id="sidebar-overlay" class="vw-sidebar-overlay"></div>
      ${Sidebar()}
      
      <div class="vw-main-area">
        ${Topbar()}
        
        <main class="vw-content-wrapper" id="main-content">
          <!-- Page content injected here -->
        </main>
      </div>
    </div>
    
    ${CommandPalette()}
    
    <div id="modal-root"></div>
  `;
}


export function bindAppShell() {
  if (shellMounted) return;
  bindSidebar();
  bindTopbar();
  bindCommandPalette();

  const overlay = document.getElementById("sidebar-overlay");
  const sidebar = document.getElementById("sidebar");

  if (overlay && sidebar) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
      }
    });
  }

  shellMounted = true;
}

export function updateSidebarActiveState(path) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  
  if (!sidebar) return;
  
  sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  
  const links = sidebar.querySelectorAll(".vw-nav-item");
  links.forEach(link => {
    if (link.getAttribute("href") === path) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
