/**
 * Cart Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

// Protected routes
router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update/:eventId', protect, updateCartItem);
router.delete('/remove/:eventId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;
