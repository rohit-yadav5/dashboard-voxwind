import { getIcon } from "../core/icons.js";

// Typography & Headers
export function PageHeader({ title, subtitle, actions = "" }) {
  return `
    <div class="vw-page-header">
      <div>
        <h1 class="vw-page-title">${title}</h1>
        ${subtitle ? `<p class="vw-page-subtitle">${subtitle}</p>` : ""}
      </div>
      ${actions ? `<div class="vw-page-actions">${actions}</div>` : ""}
    </div>
  `;
}

// Buttons
export function Button({ label, icon = "", variant = "primary", disabled = false, loading = false, href = "", extraAttrs = "" }) {
  const spinnerHtml = loading ? `<span class="vw-spinner"></span>` : "";
  const iconHtml = !loading && icon ? getIcon(icon) : "";
  const inner = `${spinnerHtml}${iconHtml}<span>${label}</span>`;
  const classes = `vw-btn vw-btn-${variant}${loading ? ' vw-btn-loading' : ''}`;
  
  if (href && !loading) {
    return `<a href="${href}" class="${classes}" data-route ${extraAttrs}>${inner}</a>`;
  }
  return `<button class="${classes}" ${disabled || loading ? "disabled" : ""} ${extraAttrs}>${inner}</button>`;
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
  // tone: success, warning, danger, info, default
  const toneClass = tone !== "default" ? `vw-badge-${tone}` : "";
  return `<span class="vw-badge ${toneClass}">${label}</span>`;
}

export function Avatar({ initial = "V" }) {
  return `<div class="vw-avatar">${initial}</div>`;
}

export function Card({ title = "", children, actions = "" }) {
  const headerHtml = title || actions ? `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--vw-space-4); border-bottom: 1px solid var(--vw-border); padding-bottom: var(--vw-space-3);">
      ${title ? `<h3 class="vw-h3" style="margin: 0; font-weight: 600;">${title}</h3>` : ""}
      ${actions ? `<div style="display: flex; gap: var(--vw-space-2);">${actions}</div>` : ""}
    </div>
  ` : "";

  return `
    <div class="vw-card">
      ${headerHtml}
      <div class="vw-card-body">${children}</div>
    </div>
  `;
}

export function MetricCard(labelOrObj, value, description = "", icon = "", trend = "") {
  let l, v, d, i, t;
  if (typeof labelOrObj === "object" && labelOrObj !== null) {
    l = labelOrObj.label;
    v = labelOrObj.value;
    d = labelOrObj.description || "";
    i = labelOrObj.icon || "";
    t = labelOrObj.trend || "";
  } else {
    l = labelOrObj;
    v = value;
    d = description;
    i = icon;
    t = trend;
  }
  return `
    <div class="vw-metric-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
        <div class="vw-metric-label">${l}</div>
        ${i ? `<div style="color: var(--vw-text-muted); width: 16px; height: 16px;">${getIcon(i)}</div>` : ""}
      </div>
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <div class="vw-metric-value">${v}</div>
        ${t ? `<div style="font-size: 11px; font-weight: 500; color: var(--vw-success); background: var(--vw-success-bg); padding: 1px 5px; border-radius: 4px;">${t}</div>` : ""}
      </div>
      ${d ? `<div style="font-size: 12px; color: var(--vw-text-muted); margin-top: 6px; line-height: 1.4;">${d}</div>` : ""}
    </div>
  `;
}

// Empty State with Dual Signature support
export function EmptyState({ icon = "Overview", title, description, actions = "", actionLabel = "", actionHref = "" }) {
  let ctaHtml = actions;
  if (!ctaHtml && actionLabel) {
    ctaHtml = Button({ label: actionLabel, href: actionHref, variant: "secondary" });
  }
  return `
    <div class="vw-empty">
      <div class="vw-empty-icon">${getIcon(icon)}</div>
      <h3 class="vw-empty-title">${title}</h3>
      <p class="vw-empty-desc">${description}</p>
      ${ctaHtml ? `
        <div style="margin-top: var(--vw-space-4);">
          ${ctaHtml}
        </div>
      ` : ""}
    </div>
  `;
}

// Skeleton Loader
export function SkeletonLoader({ rows = 3 }) {
  let skeletonHtml = "";
  for (let i = 0; i < rows; i++) {
    skeletonHtml += `<div style="height: 18px; background: var(--vw-surface-hover); border-radius: var(--vw-radius-sm); margin-bottom: var(--vw-space-2); width: ${100 - (i % 3) * 15}%;"></div>`;
  }
  return `
    <div style="animation: pulse 2s infinite ease-in-out; padding: var(--vw-space-4); border: 1px solid var(--vw-border); border-radius: var(--vw-radius-md); background: var(--vw-surface); width: 100%;">
      ${skeletonHtml}
    </div>
  `;
}

// Toast Notification
export function Toast({ message, type = "info" }) {
  return `
    <div class="toast toast-${type}">
      ${getIcon(type === "success" ? "Check" : type === "error" ? "AlertCircle" : type === "warning" ? "ShieldAlert" : "Info")}
      <span>${message}</span>
    </div>
  `;
}
