/**
 * Order Controller
 * Handles checkout and order management
 */

const crypto = require('crypto');
const Cart = require('../models/Cart');
const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendTicketConfirmation, sendRefundConfirmation } = require('../utils/email');

/**
 * Create order from cart (Checkout)
 * POST /api/orders/checkout
 */
exports.checkout = async (req, res, next) => {
  try {
    const {
      attendeeEmail,
      attendeeName,
      attendeePhone,
      billingAddress,
      paymentMethod,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      neftReferenceNumber,
    } = req.body;

    if (!attendeeEmail || !attendeeName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendee details',
      });
    }

    const isNeft = paymentMethod === 'neft';

    if (!isNeft && (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Razorpay payment details',
      });
    }

    if (isNeft && !neftReferenceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide NEFT reference number (UTR)',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.event');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    if (!isNeft) {
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
    }

    const tickets = [];
    const orderData = {
      user: req.user.id,
      attendeeEmail,
      attendeeName,
      attendeePhone: attendeePhone || '',
      billingAddress: billingAddress || {},
      paymentMethod: paymentMethod || 'razorpay',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      neftReferenceNumber: neftReferenceNumber || '',
      neftVerificationStatus: isNeft ? 'pending' : undefined,
      totalAmount: 0,
      paymentStatus: isNeft ? 'pending' : 'completed',
      orderStatus: isNeft ? 'pending' : 'confirmed',
    };

    for (const item of cart.items) {
      const event = item.event;

      const availableTickets = event.ticketsAvailable - event.ticketsSold;
      if (item.quantity > availableTickets) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableTickets} tickets available for ${event.title}`,
        });
      }

      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          event: event._id,
          eventTitle: event.title,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          quantity: 1,
        });
      }

      if (!isNeft) {
        event.ticketsSold += item.quantity;
        await event.save();
      }

      orderData.totalAmount += event.price * item.quantity;
    }

    orderData.tickets = tickets;

    const order = await Order.create(orderData);

    const pointsEarned = Math.floor(orderData.totalAmount);
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalSpent: orderData.totalAmount, loyaltyPoints: pointsEarned },
    });

    await sendTicketConfirmation(attendeeEmail, {
      orderNumber: order.orderNumber,
      attendeeName,
      totalAmount: order.totalAmount,
      tickets: order.tickets,
    });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: isNeft ? 'Order created successfully. Payment pending NEFT verification.' : 'Order created successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 * GET /api/orders/my-orders
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('tickets.event')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order details
 * GET /api/orders/:id
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('tickets.event');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders (Admin only)
 * GET /api/orders
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.query;

    let filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('tickets.event')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order (Admin or user)
 * PUT /api/orders/:id/cancel
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authorization
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    // Update order status
    order.orderStatus = 'cancelled';
    await order.save();

    // Refund tickets (update event ticketsSold)
    for (const ticket of order.tickets) {
      const event = await Event.findById(ticket.event);
      if (event) {
        event.ticketsSold -= ticket.quantity;
        await event.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (Admin only)
 * PUT /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'cancelled', 'refunded'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousStatus = order.orderStatus;

    // Prevent redundant updates
    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${status}`,
      });
    }

    // Restore inventory when moving to cancelled/refunded from confirmed
    if (
      previousStatus === 'confirmed' &&
      (status === 'cancelled' || status === 'refunded')
    ) {
      for (const ticket of order.tickets) {
        const event = await Event.findById(ticket.event);
        if (event) {
          event.ticketsSold = Math.max(0, event.ticketsSold - ticket.quantity);
          await event.save();
        }
      }
    }

    // Deduct inventory when re-confirming a cancelled/refunded order
    if (
      (previousStatus === 'cancelled' || previousStatus === 'refunded') &&
      status === 'confirmed'
    ) {
      for (const ticket of order.tickets) {
        const event = await Event.findById(ticket.event);
        if (event) {
          const remaining = event.ticketsAvailable - event.ticketsSold;
          if (ticket.quantity > remaining) {
            return res.status(400).json({
              success: false,
              message: `Not enough tickets available for "${event.title}" to re-confirm`,
            });
          }
          event.ticketsSold += ticket.quantity;
          await event.save();
        }
      }
    }

    order.orderStatus = status;
    if (status === 'refunded') {
      order.refundedAt = new Date();
      order.paymentStatus = 'failed';
      await sendRefundConfirmation(order.attendeeEmail, {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        refundedAt: order.refundedAt,
      });
    }
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify NEFT payment (Admin only)
 * PUT /api/orders/:id/verify-neft
 */
exports.verifyNeftPayment = async (req, res, next) => {
  try {
    const { action } = req.body;

    if (!action || !['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "verify" or "reject".',
      });
    }

    const order = await Order.findById(req.params.id).populate('tickets.event');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.paymentMethod !== 'neft') {
      return res.status(400).json({
        success: false,
        message: 'This order is not a NEFT payment',
      });
    }

    if (order.neftVerificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `NEFT verification already ${order.neftVerificationStatus}`,
      });
    }

    if (action === 'verify') {
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';
      order.neftVerificationStatus = 'verified';

      for (const ticket of order.tickets) {
        const event = await Event.findById(ticket.event);
        if (event) {
          event.ticketsSold += ticket.quantity;
          await event.save();
        }
      }
    } else {
      order.paymentStatus = 'failed';
      order.orderStatus = 'cancelled';
      order.neftVerificationStatus = 'rejected';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: action === 'verify' ? 'NEFT payment verified successfully' : 'NEFT payment rejected',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download ticket PDF
 * GET /api/orders/:orderId/tickets/:ticketId/download
 */
exports.downloadTicket = async (req, res, next) => {
  try {
    const { orderId, ticketId } = req.params;

    const order = await Order.findById(orderId).populate('tickets.event');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authorization
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this ticket',
      });
    }

    const ticket = order.tickets.find((t) => t._id.toString() === ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // In production, generate actual PDF using pdfkit
    // For now, return mock response
    res.status(200).json({
      success: true,
      message: 'Ticket PDF would be generated here',
      ticketData: {
        ticketNumber: ticket.ticketNumber,
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        eventTime: ticket.eventTime,
        attendeeName: order.attendeeName,
        attendeeEmail: order.attendeeEmail,
        quantity: ticket.quantity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics (Admin only)
 * GET /api/orders/stats
 */
exports.getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
