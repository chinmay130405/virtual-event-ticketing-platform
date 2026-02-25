/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getProfile);
router.put('/update-profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

module.exports = router;
