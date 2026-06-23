const routes = new Map();

export function registerRoute(path, route) {
  routes.set(path, route);
}

export function navigate(path) {
  window.history.pushState({}, "", path);
  renderCurrentRoute();
}

export function currentPath() {
  const path = window.location.pathname.replace(/\/$/, "");
  return path || "/dashboard";
}

export async function renderCurrentRoute() {
  const app = document.getElementById("app");
  const path = currentPath();
  const route = routes.get(path) || routes.get("/dashboard");
  app.innerHTML = await route.render();
  route.afterRender?.();
  document.dispatchEvent(new CustomEvent("route:changed", { detail: { path } }));
}

export function bindLinks(root = document) {
  root.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-route]");
    if (!link) return;
    event.preventDefault();
    navigate(link.getAttribute("href"));
  });
}

window.addEventListener("popstate", renderCurrentRoute);
