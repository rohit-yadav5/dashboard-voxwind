import { bindLinks, registerRoute, renderCurrentRoute } from "./core/router.js";
import { initializeSession } from "./core/state.js";
import { loginPage } from "./pages/login.js";
import { dashboardPage } from "./pages/dashboard.js";
import { toolsPage } from "./pages/tools.js";
import { addToolPage } from "./pages/add-tool.js";
import { editToolPage } from "./pages/edit-tool.js";
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

registerRoute("/login", loginPage());
registerRoute("/dashboard", dashboardPage());
registerRoute("/dashboard/tools", toolsPage());
registerRoute("/dashboard/tools/add", addToolPage());
registerRoute("/dashboard/tools/edit", editToolPage());
registerRoute("/dashboard/users", usersPage());
registerRoute("/dashboard/homepage", homepagePage());
registerRoute("/dashboard/announcements", announcementsPage());
registerRoute("/dashboard/feature-flags", flagsPage());
registerRoute("/dashboard/media", mediaPage());
registerRoute("/dashboard/seo", seoPage());
registerRoute("/dashboard/settings", settingsPage());
registerRoute("/dashboard/analytics", analyticsPage());

async function init() {
  await initializeSession();
  bindLinks();
  renderCurrentRoute();
}

init();

