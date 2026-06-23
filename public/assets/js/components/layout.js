import { currentPath, navigate } from "../core/router.js";
import { session, setMockRole } from "../core/state.js";
import { getEnvironment, setEnvironment } from "../services/admin-api.js";

const nav = [
  { label: "Overview", path: "/dashboard", icon: "⌁", group: "Operate" },
  { label: "Tools", path: "/dashboard/tools", icon: "◇", group: "Operate" },
  { label: "Users", path: "/dashboard/users", icon: "○", group: "Operate" },
  { label: "Analytics", path: "/dashboard/analytics", icon: "▥", group: "Operate" },
  { label: "Homepage", path: "/dashboard/homepage", icon: "▤", group: "Content" },
  { label: "Announcements", path: "/dashboard/announcements", icon: "◌", group: "Content" },
  { label: "SEO", path: "/dashboard/seo", icon: "⌕", group: "Content" },
  { label: "Media", path: "/dashboard/media", icon: "□", group: "Content" },
  { label: "Feature Flags", path: "/dashboard/feature-flags", icon: "◐", group: "System" },
  { label: "Settings", path: "/dashboard/settings", icon: "⚙", group: "System" }
];

export function appLayout(content) {
  return `
    <div class="dashboard-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="brand-mark" style="margin:0">V</div>
          <div>
            <strong>VoxWind</strong><br>
            <span>Dashboard</span>
          </div>
        </div>
        ${renderNav()}
        <div style="margin-top:auto;padding:10px;color:var(--muted-2);font-size:12px;line-height:1.5">
          Ecosystem role: <code>${session.user ? session.user.role : 'guest'}</code>
        </div>
      </aside>
      <div class="main-area">
        <header class="topbar">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-ghost mobile-nav-btn" type="button" id="nav-toggle">Menu</button>
            <input class="input search-box" placeholder="Search tools, users, settings" aria-label="Search">
          </div>
          <div class="user-pill">
            <select class="select" id="runtime-env" style="min-height:34px;width:132px" aria-label="Environment">
              ${["production", "staging", "development"].map((env) => (
                `<option value="${env}" ${getEnvironment() === env ? "selected" : ""}>${env}</option>`
              )).join("")}
            </select>
            <div>
              <strong>${session.user ? session.user.displayName : ""}</strong><br>
              <span>${session.user ? session.user.email : ""}</span>
            </div>
            <div class="avatar">${session.user ? (session.user.displayName || "V")[0].toUpperCase() : "V"}</div>
          </div>
        </header>
        <main class="content">${content}</main>
      </div>
    </div>
  `;
}

export function bindLayout() {
  document.getElementById("nav-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });
  document.getElementById("runtime-env")?.addEventListener("change", (event) => {
    setEnvironment(event.target.value);
    navigate(currentPath());
  });
}


function renderNav() {
  const path = currentPath();
  const groups = [...new Set(nav.map((item) => item.group))];
  return groups.map((group) => `
    <nav class="nav-group" aria-label="${group}">
      <div class="nav-label">${group}</div>
      ${nav.filter((item) => item.group === group).map((item) => `
        <a class="nav-link ${path === item.path ? "active" : ""}" href="${item.path}" data-route>
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join("")}
    </nav>
  `).join("");
}
