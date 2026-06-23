export function pageHead(title, subtitle, actions = "") {
  return `
    <div class="page-head">
      <div class="page-title">
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ""}
    </div>
  `;
}

export function metric(label, value, note = "") {
  return `
    <article class="metric-card card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
      ${note ? `<div class="metric-note">${note}</div>` : ""}
    </article>
  `;
}

export function badge(value, tone = "") {
  return `<span class="badge ${tone || String(value).toLowerCase()}">${value}</span>`;
}

export function switchEl(on, label) {
  return `<button class="switch ${on ? "on" : ""}" type="button" aria-label="${label}" aria-pressed="${on ? "true" : "false"}"></button>`;
}

export function section(title, subtitle, body, actions = "") {
  return `
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
        ${actions}
      </div>
      ${body}
    </section>
  `;
}

export function chart(values) {
  const max = Math.max(...values, 1);
  return `<div class="chart-bars">${values.map((value) => (
    `<div class="chart-bar" style="height:${Math.max(8, (value / max) * 100)}%" title="${value}"></div>`
  )).join("")}</div>`;
}

export function forbidden() {
  return `
    <div class="empty-state">
      <h2 style="margin-top:0">Permission required</h2>
      <p>This mock role cannot access this route. Change the role selector in the topbar to preview role behavior.</p>
    </div>
  `;
}
