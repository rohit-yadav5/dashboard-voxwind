export function Card({ title = "", children, actions = "" }) {
  const headerHtml = title || actions ? `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--vw-space-4);">
      ${title ? `<h2 class="vw-h3" style="margin: 0;">${title}</h2>` : ""}
      ${actions ? `<div>${actions}</div>` : ""}
    </div>
  ` : "";

  return `
    <div class="vw-card">
      ${headerHtml}
      ${children}
    </div>
  `;
}

export function MetricCard({ label, value }) {
  return `
    <div class="vw-metric-card">
      <div class="vw-metric-label">${label}</div>
      <div class="vw-metric-value">${value}</div>
    </div>
  `;
}