import { getIcon } from "../core/icons.js";

// Typography & Headers
export function PageHeader({ title, subtitle, actions = "" }) {
  return `
    <div class="vw-page-header">
      <div>
        <h1 class="vw-h1">${title}</h1>
        ${subtitle ? `<p class="vw-text-muted" style="margin-top: 8px;">${subtitle}</p>` : ""}
      </div>
      ${actions ? `<div class="vw-page-actions">${actions}</div>` : ""}
    </div>
  `;
}

// Buttons
export function Button({ label, icon = "", variant = "primary", disabled = false, href = "", extraAttrs = "" }) {
  const inner = `${icon ? getIcon(icon) : ""}${label}`;
  const classes = `vw-btn vw-btn-${variant}`;
  
  if (href) {
    return `<a href="${href}" class="${classes}" data-route ${extraAttrs}>${inner}</a>`;
  }
  return `<button class="${classes}" ${disabled ? "disabled" : ""} ${extraAttrs}>${inner}</button>`;
}

export function IconButton({ icon, label = "", extraAttrs = "" }) {
  return `
    <button class="vw-icon-btn" aria-label="${label}" ${extraAttrs}>
      ${getIcon(icon)}
    </button>
  `;
}

// Data Display
export function Badge({ label, tone = "default" }) {
  // tone: success, warning, danger, default
  const toneClass = tone !== "default" ? `vw-badge-${tone}` : "";
  return `<span class="vw-badge ${toneClass}">${label}</span>`;
}

export function Avatar({ initial = "V" }) {
  return `<div class="vw-avatar">${initial}</div>`;
}

// Toast Notification
export function Toast({ message, type = "info" }) {
  return `
    <div class="toast toast-${type}">
      ${message}
    </div>
  `;
}
