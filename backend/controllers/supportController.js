/**
 * Support Controller
 * Handles support ticket lifecycle and messages
 */

const Order = require('../models/Order');
const SupportTicket = require('../models/SupportTicket');
const TicketMessage = require('../models/TicketMessage');
const { isAdminUser } = require('../utils/roles');

const SUPPORT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Create a new support ticket
 * POST /api/support
 */
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority, relatedOrderId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    let relatedOrder = null;
    if (relatedOrderId) {
      const order = await Order.findById(relatedOrderId).select('user');
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Related order not found',
        });
      }

      if (order.user.toString() !== req.user.id && !isAdminUser(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to link this order',
        });
      }

      relatedOrder = order._id;
    }

    const ticket = await SupportTicket.create({
      user: req.user.id,
      subject,
      description,
      priority:
        isAdminUser(req.user) && SUPPORT_PRIORITIES.includes(String(priority || '').toLowerCase())
          ? String(priority).toLowerCase()
          : 'medium',
      relatedOrder,
    });

    await TicketMessage.create({
      ticket: ticket._id,
      sender: req.user.id,
      isAdminReply: isAdminUser(req.user),
      message: description,
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'name email')
      .populate('relatedOrder', 'orderNumber tickets.eventTitle');

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: populatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get support tickets
 * GET /api/support
 */
exports.getTickets = async (req, res, next) => {
  try {
    const filter = isAdminUser(req.user) ? {} : { user: req.user.id };

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .populate('relatedOrder', 'orderNumber tickets.eventTitle')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single support ticket and its messages
 * GET /api/support/:id
 */
exports.getTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('relatedOrder', 'orderNumber tickets.eventTitle');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (ticket.user._id.toString() !== req.user.id && !isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket',
      });
    }

    const messages = await TicketMessage.find({ ticket: ticket._id })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      ticket,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update support ticket priority (Admin only)
 * PATCH /api/support/:id/priority
 */
exports.updateTicketPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;

    if (!priority || !SUPPORT_PRIORITIES.includes(String(priority).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${SUPPORT_PRIORITIES.join(', ')}`,
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.priority = String(priority).toLowerCase();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Issue priority updated successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to a support ticket
 * POST /api/support/:id/reply
 */
exports.replyToTicket = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required',
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (ticket.user.toString() !== req.user.id && !isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reply to this ticket',
      });
    }

    const ticketMessage = await TicketMessage.create({
      ticket: ticket._id,
      sender: req.user.id,
      isAdminReply: isAdminUser(req.user),
      message,
    });

    if (ticket.status === 'closed') {
      ticket.status = 'pending';
    } else if (isAdminUser(req.user) && ticket.status === 'open') {
      ticket.status = 'pending';
    } else if (!isAdminUser(req.user) && ticket.status === 'pending') {
      ticket.status = 'open';
    }

    await ticket.save();

    const populatedMessage = await TicketMessage.findById(ticketMessage._id).populate(
      'sender',
      'name email role'
    );

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      reply: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update support ticket status (Admin only)
 * PATCH /api/support/:id/status
 */
exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'pending', 'closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.status = status;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};
