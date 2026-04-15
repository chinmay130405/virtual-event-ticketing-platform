const VALID_ROLES = new Set(['user', 'organizer', 'admin']);

const normalizeRole = (role, isAdmin = false) => {
  if (isAdmin === true) {
    return 'admin';
  }

  if (VALID_ROLES.has(role)) {
    return role;
  }

  if (isAdmin === false) {
    return 'user';
  }

  return 'user';
};

const isAdminUser = (user) => {
  if (!user) {
    return false;
  }

  const normalizedRole = normalizeRole(user.role, user.isAdmin);
  return normalizedRole === 'admin';
};

const hasAnyRole = (user, allowedRoles = []) => {
  if (!user || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  const normalizedRole = normalizeRole(user.role, user.isAdmin);
  return allowedRoles.includes(normalizedRole);
};

const getPublicRegistrationRole = (requestedRole) => {
  const role = normalizeRole(requestedRole, false);
  return role === 'admin' || role === 'organizer' ? 'user' : role;
};

module.exports = {
  normalizeRole,
  isAdminUser,
  hasAnyRole,
  getPublicRegistrationRole,
};
