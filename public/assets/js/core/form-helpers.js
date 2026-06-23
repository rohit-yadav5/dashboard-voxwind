export function serializeForm(form) {
  const formData = new FormData(form);
  const result = {};
  for (const [key, value] of formData.entries()) {
    const inputEl = form.querySelector(`[name="${key}"]`);
    if (inputEl && inputEl.type === "checkbox") {
      result[key] = true;
    } else {
      result[key] = value;
    }
  }
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    if (!cb.checked) {
      result[cb.name] = false;
    }
  });
  return result;
}

export function parseCommaList(value) {
  return String(value || "").split(",").map((v) => v.trim()).filter(Boolean);
}

export function parseJsonField(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
