export function openModal({ title, body, actions = "" }) {
  closeModal();
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.id = "modal-root";
  wrap.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2>${title}</h2>
        <button class="btn btn-ghost" type="button" data-close-modal>Close</button>
      </div>
      <div>${body}</div>
      ${actions ? `<div class="page-actions" style="margin-top:16px">${actions}</div>` : ""}
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
