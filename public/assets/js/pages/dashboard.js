import { appLayout, bindLayout } from "../components/layout.js";
import { chart, metric, pageHead, section } from "../components/ui.js";
import { getAnalytics, listTools } from "../services/admin-api.js";

export function dashboardPage() {
  return {
    render: async () => {
      const data = await getAnalytics();
      const tools = await listTools();
      const recentTools = tools.slice(0, 3).map((tool) => `
        <tr>
          <td><div class="tool-cell"><span class="tool-icon">${tool.icon}</span><strong>${tool.name}</strong></div></td>
          <td>${tool.category}</td>
          <td><span class="badge ${tool.status}">${tool.status}</span></td>
          <td>${tool.featured ? "Featured" : "Standard"}</td>
        </tr>
      `).join("");
      return appLayout(`
        ${pageHead("Dashboard", "Central operating surface for tools, content, settings, and publishing.", `
          <a class="btn btn-primary" href="/dashboard/tools/add" data-route>Add tool</a>
        `)}
        <div class="grid grid-4">
          ${metric("Total users", data.totals.users.toLocaleString(), "Mock auth population")}
          ${metric("Tool usage", data.totals.toolUsage.toLocaleString(), "Across registered tools")}
          ${metric("API requests", data.totals.apiRequests.toLocaleString(), "Last 30 days")}
          ${metric("Active tools", data.totals.activeTools, "Public or beta")}
        </div>
        <div class="grid grid-2" style="margin-top:16px">
          ${section("Growth", "Placeholder event trend for the future analytics pipeline.", chart(data.growth))}
          ${section("Recent events", "Mock audit and publishing activity.", `
            <div class="timeline">
              ${data.events.map((event) => `<div class="timeline-item"><span class="timeline-dot"></span><div>${event}<br><span class="muted small">Just now</span></div></div>`).join("")}
            </div>
          `)}
        </div>
        <div style="margin-top:16px">
          ${section("Tool registry preview", "Future website/tool config source of truth.", `
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Tool</th><th>Category</th><th>Status</th><th>Placement</th></tr></thead>
                <tbody>${recentTools}</tbody>
              </table>
            </div>
          `)}
        </div>
      `);
    },
    afterRender: bindLayout
  };
}
