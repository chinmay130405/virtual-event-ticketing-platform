/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  checkout,
  getUserOrders,
  getOrderById,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
  downloadTicket,
  getOrderStats,
  verifyNeftPayment,
  requestOrganizerPayout,
} = require('../controllers/orderController');

// Protected user routes
router.post('/checkout', protect, checkout);
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.get('/:orderId/tickets/:ticketId/download', protect, downloadTicket);
router.post('/payouts/request', protect, requireRole(['organizer']), requestOrganizerPayout);

// Protected admin routes
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/verify-neft', protect, admin, verifyNeftPayment);
router.get('/admin/stats', protect, admin, getOrderStats);

module.exports = router;
