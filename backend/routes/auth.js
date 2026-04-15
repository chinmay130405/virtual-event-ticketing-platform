/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register,
  registerOrganizer,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updateOrganizerBankDetails,
} = require('../controllers/authController');
const { requireRole } = require('../middleware/auth');

// Public routes
router.post('/register', authLimiter, register);
router.post('/register-organizer', authLimiter, registerOrganizer);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', protect, getProfile);
router.put('/update-profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.put('/organizer/bank-details', protect, requireRole(['organizer']), updateOrganizerBankDetails);

module.exports = router;
