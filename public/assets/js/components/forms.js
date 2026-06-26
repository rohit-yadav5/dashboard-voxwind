import { getIcon } from "../core/icons.js";

export function TextInput({ id, label, placeholder = "", value = "", type = "text", name = "" }) {
  const nameAttr = name || id;
  return `
    <div class="vw-field">
      <label class="vw-label" for="${id}">${label}</label>
      <input type="${type}" id="${id}" name="${nameAttr}" class="vw-input" placeholder="${placeholder}" value="${value}">
    </div>
  `;
}

export function Textarea({ id, label, placeholder = "", value = "", name = "" }) {
  const nameAttr = name || id;
  return `
    <div class="vw-field">
      <label class="vw-label" for="${id}">${label}</label>
      <textarea id="${id}" name="${nameAttr}" class="vw-textarea" placeholder="${placeholder}">${value}</textarea>
    </div>
  `;
}


export function SearchInput({ id, placeholder = "Search..." }) {
  return `
    <div class="vw-search">
      ${getIcon("Search")}
      <input type="text" id="${id}" class="vw-input" placeholder="${placeholder}">
    </div>
  `;
}

export function Toggle({ id, label, checked = false }) {
  return `
    <div style="display: flex; align-items: center; gap: var(--vw-space-3);">
      <button class="switch ${checked ? "on" : ""}" type="button" id="${id}" role="switch" aria-checked="${checked ? "true" : "false"}"></button>
      <label class="vw-label" for="${id}" style="cursor: pointer;">${label}</label>
    </div>
  `;
}