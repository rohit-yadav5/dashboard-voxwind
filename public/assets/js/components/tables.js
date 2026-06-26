export function Table({ headers = [], rows = [] }) {
  return `
    <div class="vw-table-container">
      <table class="vw-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? `
            <tr>
              <td colspan="${headers.length}" style="text-align: center; padding: var(--vw-space-5); color: var(--vw-text-muted);">
                No data available
              </td>
            </tr>
          ` : rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}