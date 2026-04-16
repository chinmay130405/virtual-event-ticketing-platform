/**
 * JWT Token Utilities
 * Generate and manage JWT tokens
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {('user'|'organizer'|'admin')} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role = 'user') => {

  return jwt.sign(
    {
      id: userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = { generateToken };
