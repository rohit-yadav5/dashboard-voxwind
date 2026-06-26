import { getIcon } from "../core/icons.js";

export function comingSoonPage(title = "Coming Soon", description = "This feature is currently in development.", planned = []) {
  return {
    render: async () => {
      const plannedHtml = planned.length > 0 ? `
        <div style="margin-top: var(--vw-space-5); text-align: left; background: var(--vw-bg); padding: var(--vw-space-4); border-radius: var(--vw-radius-md); display: inline-block;">
          <h4 style="margin: 0 0 var(--vw-space-3); color: var(--vw-text); font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Planned Capabilities</h4>
          <ul style="margin: 0; padding-left: 20px; color: var(--vw-text-muted); font-size: 14px; line-height: 1.6;">
            ${planned.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      ` : '';

      return `
        <div class="vw-page-header">
          <div>
            <h1 class="vw-h1">${title}</h1>
            <p class="vw-text-muted" style="margin-top: 8px;">Development Status: <strong>In Progress</strong></p>
          </div>
        </div>
        
        <div class="vw-card vw-empty" style="min-height: 400px;">
          <div class="vw-empty-icon">${getIcon("Tools")}</div>
          <h2 class="vw-empty-title">Under Construction</h2>
          <p class="vw-empty-desc">${description}</p>
          ${plannedHtml}
          <div style="margin-top: var(--vw-space-6);">
            <a href="/dashboard" class="vw-btn vw-btn-secondary" data-route>
              ${getIcon("Overview")} Back to Overview
            </a>
          </div>
        </div>
      `;
    },
    afterRender: () => {}
  };
}