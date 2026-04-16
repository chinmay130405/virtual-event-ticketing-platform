/**
 * Admin Controller
 * Handles admin panel operations
 */

const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');
const { normalizeRole } = require('../utils/roles');

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user details (Admin only)
 * GET /api/admin/users/:id
 */
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's orders
    const orders = await Order.find({ user: user._id });

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (Admin only)
 * PUT /api/admin/users/:id/role
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const normalizedRole = normalizeRole(role);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        role: normalizedRole,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard statistics (Admin only)
 * GET /api/admin/dashboard/stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    const ticketsSold = await Order.aggregate([
      {
        $match: {
          orderStatus: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $size: '$tickets' } },
        },
      },
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const topEventsRaw = await Event.find()
      .select('title ticketsAvailable price eventDate')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const topEventIds = topEventsRaw.map((event) => String(event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(topEventIds);

    const topEvents = topEventsRaw
      .map((event) => {
        const metrics =
          metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };

        return {
          ...event,
          ticketsSold: metrics.ticketsSold,
          ticketsReserved: metrics.ticketsReserved,
        };
      })
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ticketsSold: ticketsSold[0]?.total || 0,
        recentOrders,
        topEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get events analytics (Admin only)
 * GET /api/admin/events/analytics
 */
exports.getEventsAnalytics = async (req, res, next) => {
  try {
    const events = await Event.find().select('title price ticketsAvailable eventDate').lean();
    const eventIds = events.map((event) => String(event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(eventIds);

    const analytics = events.map((event) => ({
      id: event._id,
      title: event.title,
      price: event.price,
      ticketsAvailable: event.ticketsAvailable,
      ticketsSold: (metricsByEvent.get(String(event._id)) || { ticketsSold: 0 }).ticketsSold,
      ticketsReserved:
        (metricsByEvent.get(String(event._id)) || { ticketsReserved: 0 }).ticketsReserved,
      revenue:
        event.price * (metricsByEvent.get(String(event._id)) || { ticketsSold: 0 }).ticketsSold,
      occupancy:
        event.ticketsAvailable > 0
          ? (
              (((metricsByEvent.get(String(event._id)) || { ticketsSold: 0 }).ticketsSold * 100) /
                event.ticketsAvailable)
            ).toFixed(2)
          : '0.00',
      eventDate: event.eventDate,
    }));

    res.status(200).json({
      success: true,
      count: analytics.length,
      analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales report (Admin only)
 * GET /api/admin/reports/sales
 */
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const report = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          tickets: { $sum: { $size: '$tickets' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending organizer verifications
 * GET /api/admin/organizers/pending
 */
exports.getPendingOrganizers = async (req, res, next) => {
  try {
    const organizers = await User.find({
      role: 'organizer',
      verificationStatus: 'pending',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify organizer account
 * PUT /api/admin/organizers/:id/verify
 */
exports.verifyOrganizer = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const validActions = ['approve', 'reject'];

    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject',
      });
    }

    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    organizer.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    organizer.verificationReason = reason ? String(reason).trim() : '';
    organizer.verifiedAt = new Date();
    organizer.verifiedBy = req.user.id;

    await organizer.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message:
        action === 'approve'
          ? 'Organizer approved successfully'
          : 'Organizer rejected successfully',
      organizer,
    });
  } catch (error) {
    next(error);
  }
};
