/**
 * Admin Controller
 * Handles admin panel operations
 */

const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');
const { normalizeRole } = require('../utils/roles');
const { USER_PLATFORM_FEE_RATE } = require('../utils/coupons');

const PLATFORM_PROFIT_RATE = 0.3;

const getCouponUsageSummary = async () => {
  const raw = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        orderStatus: 'confirmed',
        couponCode: { $exists: true, $ne: '' },
      },
    },
    {
      $group: {
        _id: { code: '$couponCode', owner: '$couponOwner' },
        orders: { $sum: 1 },
        users: { $addToSet: '$user' },
        totalDiscount: { $sum: '$couponDiscountAmount' },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { totalDiscount: -1 } },
  ]);

  return raw.map((item) => ({
    couponCode: item._id.code,
    couponOwner: item._id.owner || 'Platform Promo Team',
    orders: item.orders || 0,
    usersCount: item.users?.length || 0,
    totalDiscount: Number((item.totalDiscount || 0).toFixed(2)),
    totalRevenue: Number((item.totalRevenue || 0).toFixed(2)),
  }));
};

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

    const revenueFilter = {
      orderStatus: 'confirmed',
      paymentStatus: 'completed',
    };

    const totalRevenue = await Order.aggregate([
      {
        $match: revenueFilter,
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          commissionRevenue: { $sum: '$commissionAmount' },
          userFeeRevenue: { $sum: '$userPlatformFeeAmount' },
        },
      },
    ]);

    const ticketsSold = await Order.aggregate([
      {
        $match: revenueFilter,
      },
      { $unwind: '$tickets' },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$tickets.quantity', 1] } },
        },
      },
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const allEventsRaw = await Event.find()
      .select('title ticketsAvailable price eventDate')
      .sort({ createdAt: -1 })
      .lean();

    const eventIds = allEventsRaw.map((event) => String(event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(eventIds);

    const eventsWithPerformance = allEventsRaw
      .map((event) => {
        const metrics =
          metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
        const revenue = (event.price || 0) * metrics.ticketsSold;
        const profit = revenue * PLATFORM_PROFIT_RATE;
        const occupancy =
          event.ticketsAvailable > 0 ? (metrics.ticketsSold * 100) / event.ticketsAvailable : 0;

        return {
          ...event,
          ticketsSold: metrics.ticketsSold,
          ticketsReserved: metrics.ticketsReserved,
          revenue,
          profit,
          occupancy: Number(occupancy.toFixed(2)),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const topEvents = eventsWithPerformance.slice(0, 5);

    const othersBucket = eventsWithPerformance.slice(5);
    const othersSummary = {
      eventsCount: othersBucket.length,
      revenue: othersBucket.reduce((sum, event) => sum + event.revenue, 0),
      profit: othersBucket.reduce((sum, event) => sum + event.profit, 0),
      ticketsSold: othersBucket.reduce((sum, event) => sum + event.ticketsSold, 0),
    };

    const trendDays = 7;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (trendDays - 1));

    const trendRaw = await Order.aggregate([
      {
        $match: {
          ...revenueFilter,
          createdAt: { $gte: startDate },
        },
      },
      { $unwind: '$tickets' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          commissionRevenue: { $sum: '$commissionAmount' },
          userFeeRevenue: { $sum: '$userPlatformFeeAmount' },
          tickets: { $sum: { $ifNull: ['$tickets.quantity', 1] } },
        },
      },
    ]);

    const trendMap = new Map(
      trendRaw.map((item) => [
        item._id,
        {
          revenue: item.revenue || 0,
          commissionRevenue: item.commissionRevenue || 0,
          userFeeRevenue: item.userFeeRevenue || 0,
          tickets: item.tickets || 0,
        },
      ])
    );

    const salesTrend = Array.from({ length: trendDays }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const trend = trendMap.get(key) || {
        revenue: 0,
        commissionRevenue: 0,
        userFeeRevenue: 0,
        tickets: 0,
      };
      const platformProfit = Number((trend.commissionRevenue + trend.userFeeRevenue).toFixed(2));

      return {
        key,
        day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: Number(trend.revenue.toFixed(2)),
        profit: platformProfit,
        tickets: trend.tickets,
      };
    });

    const revenueValue = totalRevenue[0]?.total || 0;
    const commissionRevenueValue = totalRevenue[0]?.commissionRevenue || 0;
    const userFeeRevenueValue = totalRevenue[0]?.userFeeRevenue || 0;
    const profitValue = commissionRevenueValue + userFeeRevenueValue;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalOrders,
        totalRevenue: revenueValue,
        totalProfit: Number(profitValue.toFixed(2)),
        platformProfitRate: PLATFORM_PROFIT_RATE,
        userPlatformFeeRate: USER_PLATFORM_FEE_RATE,
        commissionRevenue: Number(commissionRevenueValue.toFixed(2)),
        userFeeRevenue: Number(userFeeRevenueValue.toFixed(2)),
        ticketsSold: ticketsSold[0]?.total || 0,
        recentOrders,
        topEvents,
        salesTrend,
        eventPerformance: {
          topPerformers: topEvents,
          othersSummary,
        },
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
    const events = await Event.find().select('title category price ticketsAvailable eventDate').lean();
    const eventIds = events.map((event) => String(event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(eventIds);

    const analytics = events.map((event) => {
      const metrics = metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
      const revenue = event.price * metrics.ticketsSold;
      const occupancy =
        event.ticketsAvailable > 0 ? (metrics.ticketsSold * 100) / event.ticketsAvailable : 0;

      return {
        id: event._id,
        title: event.title,
        category: event.category,
        price: event.price,
        ticketsAvailable: event.ticketsAvailable,
        ticketsSold: metrics.ticketsSold,
        ticketsReserved: metrics.ticketsReserved,
        revenue,
        profit: Number((revenue * PLATFORM_PROFIT_RATE).toFixed(2)),
        occupancy: occupancy.toFixed(2),
        eventDate: event.eventDate,
      };
    });

    const sortedByRevenue = [...analytics].sort((a, b) => b.revenue - a.revenue);
    const topPerforming = sortedByRevenue.slice(0, 5);
    const otherEvents = sortedByRevenue.slice(5);
    const others = {
      eventsCount: otherEvents.length,
      revenue: Number(otherEvents.reduce((sum, event) => sum + event.revenue, 0).toFixed(2)),
      profit: Number(otherEvents.reduce((sum, event) => sum + event.profit, 0).toFixed(2)),
      ticketsSold: otherEvents.reduce((sum, event) => sum + event.ticketsSold, 0),
    };

    const categoryMap = analytics.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = {
          category: event.category,
          revenue: 0,
          profit: 0,
          ticketsSold: 0,
        };
      }

      acc[event.category].revenue += event.revenue;
      acc[event.category].profit += event.profit;
      acc[event.category].ticketsSold += event.ticketsSold;

      return acc;
    }, {});

    const categoryPerformance = Object.values(categoryMap)
      .map((item) => ({
        ...item,
        revenue: Number(item.revenue.toFixed(2)),
        profit: Number(item.profit.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const couponUsage = await getCouponUsageSummary();

    const userFeeTotals = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          commissionRevenue: { $sum: '$commissionAmount' },
          userFeeRevenue: { $sum: '$userPlatformFeeAmount' },
        },
      },
    ]);

    const commissionRevenue = userFeeTotals[0]?.commissionRevenue || 0;
    const userFeeRevenue = userFeeTotals[0]?.userFeeRevenue || 0;
    const totalPlatformProfit = commissionRevenue + userFeeRevenue;

    res.status(200).json({
      success: true,
      count: analytics.length,
      analytics,
      summary: {
        topPerforming,
        others,
        categoryPerformance,
        couponUsage,
        profitBreakdown: {
          commissionRevenue: Number(commissionRevenue.toFixed(2)),
          userFeeRevenue: Number(userFeeRevenue.toFixed(2)),
          userPlatformFeeRate: USER_PLATFORM_FEE_RATE,
          totalPlatformProfit: Number(totalPlatformProfit.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent verified/rejected payment checks
 * GET /api/admin/payments/recent-verifications
 */
exports.getRecentPaymentVerifications = async (req, res, next) => {
  try {
    const payments = await Order.find({
      paymentMethod: 'neft',
      neftVerificationStatus: { $in: ['verified', 'rejected'] },
    })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean();

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
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

/**
 * Get pending client event submissions
 * GET /api/admin/events/submissions/pending
 */
exports.getPendingEventSubmissions = async (req, res, next) => {
  try {
    const events = await Event.find({ approvalStatus: 'pending' })
      .populate({
        path: 'createdBy',
        select: 'name email role',
        match: { role: 'client' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const clientEvents = events.filter((event) => Boolean(event.createdBy));

    res.status(200).json({
      success: true,
      count: clientEvents.length,
      events: clientEvents,
    });
  } catch (error) {
    next(error);
  }
};
