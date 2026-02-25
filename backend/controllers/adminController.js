/**
 * Admin Controller
 * Handles admin panel operations
 */

const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');

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
    const { isAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin },
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

    const topEvents = await Event.find()
      .sort({ ticketsSold: -1 })
      .limit(5);

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
    const events = await Event.find().select(
      'title price ticketsAvailable ticketsSold eventDate'
    );

    const analytics = events.map((event) => ({
      id: event._id,
      title: event.title,
      price: event.price,
      ticketsAvailable: event.ticketsAvailable,
      ticketsSold: event.ticketsSold,
      revenue: event.price * event.ticketsSold,
      occupancy: ((event.ticketsSold / event.ticketsAvailable) * 100).toFixed(2),
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
