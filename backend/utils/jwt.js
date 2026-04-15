/**
 * JWT Token Utilities
 * Generate and manage JWT tokens
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {('user'|'organizer'|'admin'|boolean)} roleOrIsAdmin - Role or legacy admin boolean
 * @returns {string} JWT token
 */
const generateToken = (userId, roleOrIsAdmin = 'user') => {
  let role = 'user';

  if (typeof roleOrIsAdmin === 'boolean') {
    role = roleOrIsAdmin ? 'admin' : 'user';
  } else if (roleOrIsAdmin) {
    role = roleOrIsAdmin;
  }

  const isAdmin = role === 'admin';

  return jwt.sign(
    {
      id: userId,
      role,
      isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = { generateToken };
