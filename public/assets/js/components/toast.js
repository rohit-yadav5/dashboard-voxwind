import { getIcon } from "../core/icons.js";

export function toast(message, type = "info") {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "true");
    document.body.appendChild(root);
  }

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  
  const iconName = type === "success" ? "Check" : type === "error" ? "AlertCircle" : type === "warning" ? "ShieldAlert" : "Info";
  
  el.innerHTML = `
    ${getIcon(iconName)}
    <div style="flex: 1; min-width: 0; word-break: break-word;">${message}</div>
    <button class="toast-close-btn" style="background: none; border: none; padding: 2px; color: var(--vw-text-subtle); cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: color var(--vw-transition-fast), background var(--vw-transition-fast);" aria-label="Close Notification">
      ${getIcon("Close")}
    </button>
  `;
  
  root.appendChild(el);

  // Bind close event handler
  const closeBtn = el.querySelector(".toast-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px) scale(0.95)";
      setTimeout(() => el.remove(), 200);
    });
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "var(--vw-surface-hover)";
      closeBtn.style.color = "var(--vw-text)";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "none";
      closeBtn.style.color = "var(--vw-text-subtle)";
    });
  }

  // Auto dismiss after 4 seconds
  const autoDismissTimer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px) scale(0.95)";
    setTimeout(() => el.remove(), 200);
  }, 4000);
}
