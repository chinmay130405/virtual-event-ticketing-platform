const Razorpay = require('razorpay');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');
const { calculateCheckoutPricing } = require('../utils/coupons');

const getEffectiveEventPrice = (event) => {
  const basePrice = Math.max(0, Number(event?.price) || 0);
  const discountPercent = Math.min(80, Math.max(0, Number(event?.discountPercent) || 0));
  return Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
};

exports.createOrder = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
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

  let subtotalAmount = 0;
    const eventIds = cart.items.map((item) => String(item.event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(eventIds);

    for (const item of cart.items) {
      if (!item.event) {
        return res.status(400).json({
          success: false,
          message: 'One or more cart items are invalid',
        });
      }

      const metrics =
        metricsByEvent.get(String(item.event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
      const availableTickets =
        item.event.ticketsAvailable - metrics.ticketsSold - metrics.ticketsReserved;
      if (item.quantity > availableTickets) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableTickets} tickets available for ${item.event.title}`,
        });
      }

      subtotalAmount += getEffectiveEventPrice(item.event) * item.quantity;
    }

    const pricing = calculateCheckoutPricing({ subtotal: subtotalAmount, couponCode });

    const amountInPaise = Math.round(pricing.payableAmount * 100);

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
      pricing,
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

exports.getBankTransferInstructions = async (req, res, next) => {
  try {
    const organizerId = req.query.organizerId;

    if (!organizerId) {
      return res.status(400).json({
        success: false,
        message: 'organizerId is required',
      });
    }

    const organizer = await User.findById(organizerId).select('role bankDetails verificationStatus');
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.verificationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Organizer is not approved for payouts yet',
      });
    }

    const details = organizer.bankDetails || {};
    if (!details.accountNumber || !details.ifscCode || !details.accountHolderName) {
      return res.status(400).json({
        success: false,
        message: 'Organizer bank details are incomplete',
      });
    }

    const accountNumber = String(details.accountNumber);
    const maskedAccount = accountNumber.length > 4
      ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
      : accountNumber;

    return res.status(200).json({
      success: true,
      payoutMethod: 'bank_transfer',
      bankDetails: {
        accountHolderName: details.accountHolderName,
        bankName: details.bankName,
        ifscCode: details.ifscCode,
        maskedAccountNumber: maskedAccount,
      },
      message: 'Use these details for NEFT/Bank transfer payout.',
    });
  } catch (error) {
    next(error);
  }
};
