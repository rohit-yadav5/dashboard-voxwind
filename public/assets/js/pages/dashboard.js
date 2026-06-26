import { getIcon } from "../core/icons.js";
import { session } from "../core/state.js";
import { getEnvironment } from "../services/admin-api.js";

export function dashboardPage() {
  return {
    render: async () => {
      const user = session.user;
      const userName = user ? (user.displayName || user.email) : "Developer";
      const userRole = user ? user.role : "Guest";
      const env = getEnvironment();

      return `
        <div class="vw-page-header">
          <div>
            <h1 class="vw-h1">Welcome back, ${userName}</h1>
            <p class="vw-text-muted" style="margin-top: 8px;">
              You are signed in as <strong>${userRole}</strong> in the <strong>${env}</strong> environment.
            </p>
          </div>
          <div class="vw-page-actions">
            <button class="vw-btn vw-btn-primary" onclick="document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', metaKey: true}))">
              ${getIcon("Command")} Command Palette
            </button>
          </div>
        </div>

        <div style="margin-bottom: var(--vw-space-4);">
          <h2 class="vw-h3" style="margin-bottom: var(--vw-space-3);">Infrastructure Overview</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--vw-space-4);">
            <div class="vw-metric-card">
              <div class="vw-metric-label">Active Sites</div>
              <div class="vw-metric-value">0</div>
            </div>
            <div class="vw-metric-card">
              <div class="vw-metric-label">Cloudflare Workers</div>
              <div class="vw-metric-value">0</div>
            </div>
            <div class="vw-metric-card">
              <div class="vw-metric-label">D1 Databases</div>
              <div class="vw-metric-value">1</div>
            </div>
            <div class="vw-metric-card">
              <div class="vw-metric-label">KV Namespaces</div>
              <div class="vw-metric-value">1</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--vw-space-4);">
          <div class="vw-card">
            <h2 class="vw-h3" style="margin-bottom: var(--vw-space-4);">Quick Actions</h2>
            <div style="display: grid; gap: var(--vw-space-2);">
              <a href="/dashboard/sites" data-route class="vw-btn vw-btn-secondary" style="justify-content: flex-start;">
                ${getIcon("Sites")} View Sites
              </a>
              <a href="/dashboard/users" data-route class="vw-btn vw-btn-secondary" style="justify-content: flex-start;">
                ${getIcon("Users")} Manage Users
              </a>
              <a href="/dashboard/settings" data-route class="vw-btn vw-btn-secondary" style="justify-content: flex-start;">
                ${getIcon("Settings")} Platform Settings
              </a>
            </div>
          </div>
          
          <div class="vw-card">
            <h2 class="vw-h3" style="margin-bottom: var(--vw-space-4);">Recent Activity</h2>
            <div class="vw-empty" style="padding: var(--vw-space-4); border: none; background: var(--vw-bg); min-height: 140px;">
              <p class="vw-text-muted">No recent activity found in this environment.</p>
            </div>
          </div>
        </div>
      `;
    },
    afterRender: () => {}
  };
}
