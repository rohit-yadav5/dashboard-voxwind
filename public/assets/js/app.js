import { bindLinks, registerRoute, renderCurrentRoute } from "./core/router.js";
import { initializeSession } from "./core/state.js";
import { loginPage } from "./pages/login.js";
import { dashboardPage } from "./pages/dashboard.js";
import { toolsPage } from "./pages/tools.js";
import { addToolPage } from "./pages/add-tool.js";
import { editToolPage } from "./pages/edit-tool.js";
import { sitesPage } from "./pages/sites.js";
import { createSitePage } from "./pages/create-site.js";
import { siteDetailsPage } from "./pages/site-details.js";
import { comingSoonPage } from "./pages/coming-soon.js";
import {
  analyticsPage,
  announcementsPage,
  flagsPage,
  homepagePage,
  mediaPage,
  seoPage,
  settingsPage,
  usersPage
} from "./pages/simple-pages.js";

// Login
registerRoute("/login", loginPage());

// Overview
registerRoute("/dashboard", dashboardPage());

// Workspace
registerRoute("/dashboard/sites", sitesPage());
registerRoute("/dashboard/sites/new", createSitePage());
registerRoute("/dashboard/sites/:id", (params) => siteDetailsPage(params.id));
registerRoute("/dashboard/media", mediaPage());

// Management
registerRoute("/dashboard/users", usersPage());
registerRoute("/dashboard/roles", comingSoonPage("Roles", "Configure and assign platform access roles and responsibilities.", [
  "Create granular support, admin, and editor roles",
  "Inheritance rules for workspace permissions",
  "Bulk role re-assignments",
  "Audit log tracking for role updates"
]));
registerRoute("/dashboard/permissions", comingSoonPage("Permissions", "System permission definitions governing console and API access.", [
  "Declare custom workspace permissions",
  "Dynamic capability lookup mapping",
  "Security constraint policies",
  "API token permission filters"
]));

// Content
registerRoute("/dashboard/homepage", homepagePage());
registerRoute("/dashboard/announcements", announcementsPage());
registerRoute("/dashboard/seo", seoPage());

// Platform
registerRoute("/dashboard/tools", toolsPage());
registerRoute("/dashboard/tools/add", addToolPage());
registerRoute("/dashboard/tools/edit", editToolPage());
registerRoute("/dashboard/feature-flags", flagsPage());
registerRoute("/dashboard/analytics", analyticsPage());

// System
registerRoute("/dashboard/audit-logs", comingSoonPage("Audit Logs", "Track system-wide security, deployment, and configuration events.", [
  "Real-time event logging in D1",
  "Filter by user, action, or resource",
  "Export audit trails as CSV/JSON",
  "Tamper-proof log signature verification"
]));
registerRoute("/dashboard/settings", settingsPage());


async function init() {
  await initializeSession();
  bindLinks();
  renderCurrentRoute();
}

init();

