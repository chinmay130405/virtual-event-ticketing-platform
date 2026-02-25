/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getEventsAnalytics,
  getSalesReport,
} = require('../controllers/adminController');

// All admin routes require protection and admin role
router.use(protect, admin);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Analytics
router.get('/events/analytics', getEventsAnalytics);

// Reports
router.get('/reports/sales', getSalesReport);

module.exports = router;
