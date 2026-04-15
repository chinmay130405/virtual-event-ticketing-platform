const express = require('express');

const {
  createOrder,
  verifyPayment,
  getBankTransferInstructions,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/bank-transfer-instructions', protect, getBankTransferInstructions);

module.exports = router;
