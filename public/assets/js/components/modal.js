import { Button } from "./ui.js";

export function openModal({ title, body, actions = "" }) {
  closeModal();
  const wrap = document.createElement("div");
  wrap.className = "vw-modal-backdrop";
  wrap.id = "modal-root";
  wrap.innerHTML = `
    <section class="vw-modal" role="dialog" aria-modal="true">
      <div class="vw-modal-header">
        <h2 class="vw-h2" style="margin: 0;">${title}</h2>
        ${Button({ label: "Close", variant: "ghost", extraAttrs: "data-close-modal" })}
      </div>
      <div class="vw-modal-body">${body}</div>
      ${actions ? `<div class="vw-modal-footer">${actions}</div>` : ""}
    </section>
  `;
  document.body.appendChild(wrap);
  wrap.addEventListener("click", (event) => {
    if (event.target === wrap || event.target.closest("[data-close-modal]")) closeModal();
  });
}

export function closeModal() {
  document.getElementById("modal-root")?.remove();
}
