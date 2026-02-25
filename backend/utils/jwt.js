/**
 * JWT Token Utilities
 * Generate and manage JWT tokens
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Is user an admin
 * @returns {string} JWT token
 */
const generateToken = (userId, isAdmin = false) => {
  return jwt.sign(
    {
      id: userId,
      isAdmin: isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = { generateToken };
