const VALID_ROLES = new Set(['user', 'organizer', 'admin']);

const normalizeRole = (role) => {
  if (VALID_ROLES.has(role)) {
    return role;
  }

  return 'user';
};

const isAdminUser = (user) => {
  if (!user) {
    return false;
  }

  const normalizedRole = normalizeRole(user.role);
  return normalizedRole === 'admin';
};

const hasAnyRole = (user, allowedRoles = []) => {
  if (!user || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  const normalizedRole = normalizeRole(user.role);
  return allowedRoles.includes(normalizedRole);
};

const getPublicRegistrationRole = (requestedRole) => {
  const role = normalizeRole(requestedRole);
  return role === 'admin' || role === 'organizer' ? 'user' : role;
};

module.exports = {
  normalizeRole,
  isAdminUser,
  hasAnyRole,
  getPublicRegistrationRole,
};
