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
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');
const { isAdminUser } = require('../utils/roles');
const {
  DEFAULT_PLATFORM_COMMISSION_RATE,
  calculateCommissionBreakdown,
} = require('../utils/commission');

const aggregateOrderTicketQuantities = (order) => {
  const map = new Map();

  (order.tickets || []).forEach((ticket) => {
    const eventId = String(ticket.event);
    map.set(eventId, (map.get(eventId) || 0) + (ticket.quantity || 1));
  });

  return map;
};

const syncEventTicketMetrics = async (eventIds) => {
  const uniqueEventIds = Array.from(new Set((eventIds || []).map((id) => String(id))));
  if (uniqueEventIds.length === 0) {
    return;
  }

  const metricsByEvent = await getTicketMetricsByEventIds(uniqueEventIds);

  const bulkOps = uniqueEventIds.map((eventId) => {
    const metrics = metricsByEvent.get(eventId) || { ticketsSold: 0, ticketsReserved: 0 };

    return {
      updateOne: {
        filter: { _id: eventId },
        update: {
          $set: {
            ticketsSold: metrics.ticketsSold,
            ticketsReserved: metrics.ticketsReserved,
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) {
    await Event.bulkWrite(bulkOps);
  }
};

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
    let commissionAmount = 0;
    let organizerPayoutAmount = 0;
    let organizerSettlement = { organizer: null, event: null };
    let payoutStatus = 'not_applicable';
    let payoutMethod = 'none';

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
      ticketsInventoryState: isNeft ? 'reserved' : 'sold',
      totalAmount: 0,
      commissionRate: DEFAULT_PLATFORM_COMMISSION_RATE,
      commissionAmount: 0,
      organizerPayoutAmount: 0,
      payoutStatus,
      payoutMethod,
      organizerSettlement,
      paymentStatus: isNeft ? 'pending' : 'completed',
      orderStatus: isNeft ? 'pending' : 'confirmed',
    };

    const cartEventIds = cart.items.map((item) => String(item.event._id));
    const ticketMetricsByEvent = await getTicketMetricsByEventIds(cartEventIds);

    for (const item of cart.items) {
      const event = item.event;

      const eventMetrics =
        ticketMetricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
      const availableTickets =
        event.ticketsAvailable - eventMetrics.ticketsSold - eventMetrics.ticketsReserved;
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

      const lineTotal = event.price * item.quantity;
      orderData.totalAmount += lineTotal;

      if (event.organizer) {
        const breakdown = calculateCommissionBreakdown({
          grossAmount: lineTotal,
          commissionRate: DEFAULT_PLATFORM_COMMISSION_RATE,
        });

        commissionAmount += breakdown.commissionAmount;
        organizerPayoutAmount += breakdown.netPayoutAmount;
        payoutStatus = 'pending';
        payoutMethod = 'razorpay';

        if (!organizerSettlement.organizer) {
          organizerSettlement = {
            organizer: event.organizer,
            event: event._id,
          };
        }
      }
    }

    orderData.tickets = tickets;
    orderData.commissionAmount = commissionAmount;
    orderData.organizerPayoutAmount = organizerPayoutAmount;
    orderData.payoutStatus = payoutStatus;
    orderData.payoutMethod = payoutMethod;
    orderData.organizerSettlement = organizerSettlement;

    const order = await Order.create(orderData);
    await syncEventTicketMetrics(cartEventIds);

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
    if (order.user.toString() !== req.user.id && !isAdminUser(req.user)) {
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
    if (order.user.toString() !== req.user.id && !isAdminUser(req.user)) {
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

    const orderEventIds = Array.from(new Set((order.tickets || []).map((ticket) => String(ticket.event))));

    // Update order status
    order.orderStatus = 'cancelled';
    order.ticketsInventoryState = 'released';
    await order.save();

    await syncEventTicketMetrics(orderEventIds);

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
    const previousInventoryState = order.ticketsInventoryState;
    const orderEventIds = Array.from(new Set((order.tickets || []).map((ticket) => String(ticket.event))));

    // Prevent redundant updates
    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${status}`,
      });
    }

    if (status === 'confirmed') {
      order.ticketsInventoryState = 'sold';
    } else if (status === 'cancelled' || status === 'refunded') {
      order.ticketsInventoryState = 'released';
    }

    if (
      previousInventoryState === 'released' &&
      order.ticketsInventoryState !== 'released' &&
      orderEventIds.length > 0
    ) {
      const events = await Event.find({ _id: { $in: orderEventIds } }).select('title ticketsAvailable');
      const metricsByEvent = await getTicketMetricsByEventIds(orderEventIds);
      const orderTicketTotals = aggregateOrderTicketQuantities(order);

      for (const event of events) {
        const metrics =
          metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
        const requiredQty = orderTicketTotals.get(String(event._id)) || 0;
        const available = event.ticketsAvailable - metrics.ticketsSold - metrics.ticketsReserved;

        if (requiredQty > available) {
          return res.status(400).json({
            success: false,
            message: `Not enough tickets available for "${event.title}" to re-confirm`,
          });
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
    await syncEventTicketMetrics(orderEventIds);

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
      order.ticketsInventoryState = 'sold';
    } else {
      order.paymentStatus = 'failed';
      order.orderStatus = 'cancelled';
      order.neftVerificationStatus = 'rejected';
      order.ticketsInventoryState = 'released';
    }

    await order.save();
    const orderEventIds = Array.from(new Set((order.tickets || []).map((ticket) => String(ticket.event))));
    await syncEventTicketMetrics(orderEventIds);

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
    if (order.user.toString() !== req.user.id && !isAdminUser(req.user)) {
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

/**
 * Request payout for organizer-linked orders
 * POST /api/orders/payouts/request
 */
exports.requestOrganizerPayout = async (req, res, next) => {
  try {
    const { orderIds = [], payoutMethod = 'bank_transfer' } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderIds must be a non-empty array',
      });
    }

    const orders = await Order.find({
      _id: { $in: orderIds },
      'organizerSettlement.organizer': req.user.id,
      payoutStatus: 'pending',
    });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: 'No eligible pending payout orders found',
      });
    }

    const validPayoutMethods = ['razorpay', 'bank_transfer', 'neft'];
    if (!validPayoutMethods.includes(payoutMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payout method. Must be one of: ${validPayoutMethods.join(', ')}`,
      });
    }

    let totalRequested = 0;
    for (const order of orders) {
      order.payoutStatus = 'processing';
      order.payoutMethod = payoutMethod;
      order.payoutRequestedAt = new Date();
      totalRequested += order.organizerPayoutAmount || 0;
      await order.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      message: 'Payout request submitted successfully',
      summary: {
        ordersCount: orders.length,
        totalRequested,
        payoutMethod,
      },
    });
  } catch (error) {
    next(error);
  }
};
