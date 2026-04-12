const Razorpay = require('razorpay');
const crypto = require('crypto');
const Cart = require('../models/Cart');

exports.createOrder = async (req, res, next) => {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay keys are not configured',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.event');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    let totalAmount = 0;

    for (const item of cart.items) {
      if (!item.event) {
        return res.status(400).json({
          success: false,
          message: 'One or more cart items are invalid',
        });
      }

      const availableTickets = item.event.ticketsAvailable - item.event.ticketsSold;
      if (item.quantity > availableTickets) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableTickets} tickets available for ${item.event.title}`,
        });
      }

      totalAmount += item.event.price * item.quantity;
    }

    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart total amount',
      });
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });
    } catch (rzpErr) {
      console.error('Razorpay API Error:', rzpErr);
      return res.status(500).json({
        success: false,
        message: 'Razorpay API Error: ' + (rzpErr.error?.description || rzpErr.message || 'Verification Failed'),
      });
    }

    res.status(200).json({
      success: true,
      order,
      amount: amountInPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Razorpay payment details',
      });
    }

    const { RAZORPAY_KEY_SECRET } = process.env;

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay key secret is not configured',
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const hasSameLength = generatedSignature.length === razorpaySignature.length;
    const isSignatureValid =
      hasSameLength &&
      crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpaySignature));

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully',
    });
  } catch (error) {
    next(error);
  }
};
