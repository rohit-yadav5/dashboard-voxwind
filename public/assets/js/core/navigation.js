export const navigationConfig = [
  { title: "Overview", icon: "Overview", route: "/dashboard", section: "Overview", requiredPermission: null },
  { title: "Sites", icon: "Sites", route: "/dashboard/sites", section: "Workspace", requiredPermission: "sites.read" },
  { title: "Media", icon: "Media", route: "/dashboard/media", section: "Workspace", requiredPermission: "media.read" },
  { title: "Users", icon: "Users", route: "/dashboard/users", section: "Management", requiredPermission: "users.read" },
  { title: "Roles", icon: "Roles", route: "/dashboard/roles", section: "Management", requiredPermission: "roles.read" },
  { title: "Permissions", icon: "Permissions", route: "/dashboard/permissions", section: "Management", requiredPermission: "permissions.read" },
  { title: "Homepage", icon: "Homepage", route: "/dashboard/homepage", section: "Content", requiredPermission: "homepage.read" },
  { title: "Announcements", icon: "Announcements", route: "/dashboard/announcements", section: "Content", requiredPermission: "announcements.read" },
  { title: "SEO", icon: "SEO", route: "/dashboard/seo", section: "Content", requiredPermission: "seo.read" },
  { title: "Tools", icon: "Tools", route: "/dashboard/tools", section: "Platform", requiredPermission: "tools.read" },
  { title: "Analytics", icon: "Analytics", route: "/dashboard/analytics", section: "Platform", requiredPermission: "analytics.read" },
  { title: "Feature Flags", icon: "FeatureFlags", route: "/dashboard/feature-flags", section: "Platform", requiredPermission: "flags.read" },
  { title: "Audit Logs", icon: "AuditLogs", route: "/dashboard/audit-logs", section: "System", requiredPermission: "audit.read" },
  { title: "Settings", icon: "Settings", route: "/dashboard/settings", section: "System", requiredPermission: "settings.read" }
];

export function getSections() {
  return [...new Set(navigationConfig.map(item => item.section))];
}

export function getVisibleNavigation(userPermissions) {
  // If userPermissions is '*', return all.
  // Otherwise, filter by checking if user has the required permission.
  if (userPermissions && userPermissions.includes('*')) {
    return navigationConfig;
  }
  return navigationConfig.filter(item => {
    if (!item.requiredPermission) return true;
    return userPermissions ? userPermissions.includes(item.requiredPermission) : false;
  });
}