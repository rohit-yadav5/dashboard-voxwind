import { AppShell, bindAppShell, updateSidebarActiveState } from "../components/layout.js";
import { session } from "./state.js";

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

function matchRoute(path, routeDef) {
  const pathParts = path.split('/').filter(Boolean);
  const routeParts = routeDef.split('/').filter(Boolean);
  
  if (pathParts.length !== routeParts.length) return null;
  
  const params = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      params[routeParts[i].slice(1)] = pathParts[i];
    } else if (routeParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export async function renderCurrentRoute() {
  const path = currentPath();
  const sessionActive = session.isAuthenticated;
  
  if (path !== "/login" && !sessionActive) {
    navigate("/login");
    return;
  }
  
  if (path === "/login" && sessionActive) {
    navigate("/dashboard");
    return;
  }

  // Find matching route
  let pageHandler = null;
  let params = null;
  
  for (const [routePattern, handler] of routes.entries()) {
    const matchedParams = matchRoute(path, routePattern);
    if (matchedParams) {
      params = matchedParams;
      // Handle the case where the handler is a function returning a page obj (factory with params)
      pageHandler = typeof handler === 'function' && !handler.render ? handler(params) : handler;
      break;
    }
  }

  if (!pageHandler) {
    const app = document.getElementById("app");
    if (app) app.innerHTML = `<h1>404 - Not Found</h1>`;
    return;
  }

  const app = document.getElementById("app");

  if (path === "/login") {
    // Standalone pages like login render directly into #app
    app.innerHTML = await pageHandler.render(params);
    pageHandler.afterRender?.(params);
    return;
  }
  
  // Render shell if not present
  if (!document.getElementById("main-content")) {
    app.innerHTML = AppShell();
    bindAppShell();
  }

  const mainContent = document.getElementById("main-content");
  
  // Basic permission guard check logic would go here, 
  // but for now we trust backend or component-level logic, or just fall back if missing route.
  const route = pageHandler;
  
  if (route) {
    mainContent.innerHTML = await route.render(params);
    route.afterRender?.(params);
  }
  
  updateSidebarActiveState(path);
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
