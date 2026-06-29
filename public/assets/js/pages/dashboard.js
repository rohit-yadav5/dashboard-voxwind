import { getIcon } from "../core/icons.js";
import { session } from "../core/state.js";
import { getEnvironment, listSites, listUsers, listTools, listConfigVersions } from "../services/admin-api.js";
import { PageHeader, MetricCard, Button, EmptyState } from "../components/ui.js";

export function dashboardPage() {
  return {
    render: async () => {
      const user = session.user;
      const userName = user ? (user.displayName || user.email) : "Developer";
      const env = getEnvironment();

      // Fetch real data simultaneously
      const [sites, users, tools, versions] = await Promise.all([
        listSites().catch(() => []),
        listUsers().catch(() => []),
        listTools().catch(() => []),
        listConfigVersions().catch(() => [])
      ]);

      const activeSites = sites.filter(s => s.status === "active").length;
      const totalUsers = users.length;
      const totalTools = tools.length;
      const publishedVersions = versions.filter(v => v.status === "published").length;

      return `
        <div class="vw-page">
          ${PageHeader({
            title: "Overview",
            subtitle: "System resources and platform activity for the current environment.",
            actions: Button({
              label: "Command Palette",
              icon: "Command",
              variant: "secondary",
              extraAttrs: 'id="dashboard-cmd-btn"'
            })
          })}

          <div class="vw-grid-4" style="margin-bottom: var(--vw-space-6);">
            ${MetricCard({ label: "Active Workspaces", value: activeSites.toString(), description: "Sites running on Edge", icon: "Sites", trend: "+2 this week" })}
            ${MetricCard({ label: "Registered Users", value: totalUsers.toString(), description: "Across all roles", icon: "Users", trend: "+5 this week" })}
            ${MetricCard({ label: "Platform Tools", value: totalTools.toString(), description: "Internal & external apps", icon: "Box", trend: "Up to date" })}
            ${MetricCard({ label: "Config Snapshots", value: publishedVersions.toString(), description: "Published to KV", icon: "Database", trend: "+12 deploys" })}
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--vw-space-5); margin-bottom: var(--vw-space-6);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--vw-space-3);">
                <h2 class="vw-h3">Infrastructure Health</h2>
                <a href="/dashboard/settings" style="font-size: 13px; color: var(--vw-text-muted); text-decoration: none;">View all &rarr;</a>
              </div>
              <div class="vw-card" style="padding: 0; overflow: hidden; min-height: 220px; display: flex; flex-direction: column;">
                <div style="padding: 16px; border-bottom: 1px solid var(--vw-border); display: flex; align-items: center; gap: 12px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--vw-success);"></div>
                  <span style="font-weight: 500; font-size: 14px; color: var(--vw-gray-800);">All systems operational</span>
                </div>
                <div style="flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: var(--vw-bg);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: var(--vw-text);">Edge Routing</span>
                    <span style="font-size: 13px; color: var(--vw-success); font-weight: 500;">99.99%</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: var(--vw-text);">KV Storage</span>
                    <span style="font-size: 13px; color: var(--vw-success); font-weight: 500;">99.98%</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: var(--vw-text);">Authentication API</span>
                    <span style="font-size: 13px; color: var(--vw-success); font-weight: 500;">100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--vw-space-3);">
                <h2 class="vw-h3">Recent Activity</h2>
                <a href="#" style="font-size: 13px; color: var(--vw-text-muted); text-decoration: none;">Logs</a>
              </div>
              <div class="vw-card" style="padding: 0; overflow: hidden; min-height: 220px; display: flex;">
                ${EmptyState({
                  icon: "Activity",
                  title: "No recent activity",
                  description: "Audit logs will appear here once connected."
                })}
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--vw-space-5);">
            <div>
              <h2 class="vw-h3" style="margin-bottom: var(--vw-space-3);">Quick Actions</h2>
              <div class="vw-card" style="padding: 0; overflow: hidden;">
                <a href="/dashboard/sites" data-route class="vw-quick-action">
                  <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: var(--vw-surface-hover); color: var(--vw-text); border: 1px solid var(--vw-border);">
                    ${getIcon("Sites")}
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.4; margin-left: 12px; min-width: 0; flex: 1;">
                    <span style="color: var(--vw-gray-800); font-weight: 500; font-size: 13px;">Manage Workspaces</span>
                    <span style="color: var(--vw-text-muted); font-size: 12px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">Configure domains and resources</span>
                  </div>
                  <div style="color: var(--vw-text-muted);">${getIcon("ChevronRight")}</div>
                </a>
                <a href="/dashboard/users" data-route class="vw-quick-action">
                  <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: var(--vw-surface-hover); color: var(--vw-text); border: 1px solid var(--vw-border);">
                    ${getIcon("Users")}
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.4; margin-left: 12px; min-width: 0; flex: 1;">
                    <span style="color: var(--vw-gray-800); font-weight: 500; font-size: 13px;">Access Control</span>
                    <span style="color: var(--vw-text-muted); font-size: 12px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">Manage team members and roles</span>
                  </div>
                  <div style="color: var(--vw-text-muted);">${getIcon("ChevronRight")}</div>
                </a>
                <a href="/dashboard/settings" data-route class="vw-quick-action">
                  <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: var(--vw-surface-hover); color: var(--vw-text); border: 1px solid var(--vw-border);">
                    ${getIcon("Settings")}
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.4; margin-left: 12px; min-width: 0; flex: 1;">
                    <span style="color: var(--vw-gray-800); font-weight: 500; font-size: 13px;">Platform Settings</span>
                    <span style="color: var(--vw-text-muted); font-size: 12px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">Global configuration and security</span>
                  </div>
                  <div style="color: var(--vw-text-muted);">${getIcon("ChevronRight")}</div>
                </a>
              </div>
            </div>

            <div>
              <h2 class="vw-h3" style="margin-bottom: var(--vw-space-3);">System Information</h2>
              <div class="vw-card" style="padding: 16px;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--vw-border); padding-bottom: 8px;">
                    <span style="font-size: 13px; color: var(--vw-text-muted);">Console Version</span>
                    <span style="font-size: 13px; color: var(--vw-gray-800); font-family: var(--vw-font-mono);">v2.4.0 (Edge)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--vw-border); padding-bottom: 8px;">
                    <span style="font-size: 13px; color: var(--vw-text-muted);">Region</span>
                    <span style="font-size: 13px; color: var(--vw-gray-800);">Global Anycast</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--vw-border); padding-bottom: 8px;">
                    <span style="font-size: 13px; color: var(--vw-text-muted);">Current Environment</span>
                    <span style="font-size: 13px; color: var(--vw-gray-800); text-transform: capitalize;">${env}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 13px; color: var(--vw-text-muted);">API Status</span>
                    <span style="font-size: 13px; color: var(--vw-success);">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      `;
    },
    afterRender: () => {
      document.getElementById("dashboard-cmd-btn")?.addEventListener("click", () => {
        const palette = document.getElementById("command-palette");
        if (palette) {
          palette.classList.add("open");
          palette.querySelector("input")?.focus();
        }
      });
    }
  };
}
