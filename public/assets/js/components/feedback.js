import { getIcon } from "../core/icons.js";

export function EmptyState({ icon = "Overview", title, description, actions = "" }) {
  return `
    <div class="vw-empty">
      <div class="vw-empty-icon">${getIcon(icon)}</div>
      <h2 class="vw-empty-title">${title}</h2>
      <p class="vw-empty-desc">${description}</p>
      ${actions ? `<div style="margin-top: var(--vw-space-4);">${actions}</div>` : ""}
    </div>
  `;
}

export function SkeletonLoader({ rows = 3 }) {
  let skeletonHtml = "";
  for(let i=0; i<rows; i++) {
    skeletonHtml += `<div style="height: 24px; background: var(--vw-surface-hover); border-radius: 4px; margin-bottom: 8px; width: ${100 - (i % 3) * 15}%;"></div>`;
  }
  return `
    <div style="animation: pulse 2s infinite ease-in-out;">
      ${skeletonHtml}
    </div>
  `;
}