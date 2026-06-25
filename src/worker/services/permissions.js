export async function getUserContext(db, userId) {
  // 1. Get user profile details
  const user = await db.prepare(
    `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`
  ).bind(userId).first();

  if (!user) return null;

  // 2. Get user roles
  const rolesRows = await db.prepare(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ?`
  ).bind(userId).all();
  const roles = (rolesRows.results || []).map(r => r.name);

  // 3. Get user permissions
  const permRows = await db.prepare(
    `SELECT DISTINCT p.name FROM role_permissions rp
     JOIN permissions p ON rp.permission_id = p.id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ?`
  ).bind(userId).all();
  const permissions = (permRows.results || []).map(p => p.name);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      status: user.status
    },
    roles,
    permissions
  };
}
