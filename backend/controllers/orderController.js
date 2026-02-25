/**
 * Order Controller
 * Handles checkout and order management
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Event = require('../models/Event');
const { sendTicketConfirmation } = require('../utils/email');

/**
 * Create order from cart (Checkout)
 * POST /api/orders/checkout
 */
exports.checkout = async (req, res, next) => {
  try {
    const { attendeeEmail, attendeeName, attendeePhone, billingAddress, paymentMethod } = req.body;

    // Validation
    if (!attendeeEmail || !attendeeName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendee details',
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.event');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Check ticket availability and prepare tickets
    const tickets = [];
    const orderData = {
      user: req.user.id,
      attendeeEmail,
      attendeeName,
      attendeePhone: attendeePhone || '',
      billingAddress: billingAddress || {},
      paymentMethod: paymentMethod || 'credit_card',
      totalAmount: 0,
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
    };

    for (const item of cart.items) {
      const event = item.event;

      // Check availability
      const availableTickets = event.ticketsAvailable - event.ticketsSold;
      if (item.quantity > availableTickets) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableTickets} tickets available for ${event.title}`,
        });
      }

      // Create ticket entries
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          event: event._id,
          eventTitle: event.title,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          quantity: 1,
        });
      }

      // Update tickets sold
      event.ticketsSold += item.quantity;
      await event.save();

      // Calculate total
      orderData.totalAmount += event.price * item.quantity;
    }

    orderData.tickets = tickets;

    // Create order
    const order = await Order.create(orderData);

    // Send confirmation email (mock)
    await sendTicketConfirmation(attendeeEmail, {
      orderNumber: order.orderNumber,
      attendeeName,
      totalAmount: order.totalAmount,
      tickets: order.tickets,
    });

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
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
