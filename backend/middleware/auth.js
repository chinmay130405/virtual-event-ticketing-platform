/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and attach user to request
 */
const protect = (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token is not valid',
    });
  }
};

/**
 * Check if user is admin
 */
const admin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to admin users',
    });
  }
  next();
};

module.exports = { protect, admin };
