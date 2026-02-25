/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  checkout,
  getUserOrders,
  getOrderById,
  getAllOrders,
  cancelOrder,
  downloadTicket,
  getOrderStats,
} = require('../controllers/orderController');

// Protected user routes
router.post('/checkout', protect, checkout);
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.get('/:orderId/tickets/:ticketId/download', protect, downloadTicket);

// Protected admin routes
router.get('/', protect, admin, getAllOrders);
router.get('/admin/stats', protect, admin, getOrderStats);

module.exports = router;
