/**
 * ERP Routes
 * Enterprise Resource Planning endpoints
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Resource = require('../models/Resource');
const Expense = require('../models/Expense');
const Event = require('../models/Event');
const Order = require('../models/Order');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');

const PLATFORM_FEE_RATE = 0.3;

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ERP API running' });
});

router.get('/resources', protect, admin, async (req, res) => {
  try {
    const { type, isActive } = req.query;
    let query = {};

    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/resources', protect, admin, async (req, res) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      availableCapacity: req.body.totalCapacity,
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/resources/:id', protect, admin, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/resources/:id', protect, admin, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/resources/available', async (req, res) => {
  try {
    const { type, capacity } = req.query;
    let query = { isActive: true, availableCapacity: { $gte: parseInt(capacity) || 1 } };

    if (type) query.type = type;

    const resources = await Resource.find(query);

    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/expenses', protect, admin, async (req, res) => {
  try {
    const { eventId, category, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    let query = {};

    if (eventId) query.event = eventId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .populate('event', 'title eventDate')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ expenseDate: -1 });

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/expenses', protect, admin, async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user.id,
    });

    await expense.populate('event', 'title');
    await expense.populate('createdBy', 'name');

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/expenses/:id', protect, admin, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('event', 'title').populate('createdBy', 'name');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/expenses/:id', protect, admin, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/expenses/event/:eventId/total', async (req, res) => {
  try {
    const expenses = await Expense.aggregate([
      { $match: { event: require('mongoose').Types.ObjectId(req.params.eventId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const total = expenses.length > 0 ? expenses[0].total : 0;

    res.json({ success: true, data: { totalExpenses: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/finances/summary', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const revenueResult = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'completed', 
          orderStatus: 'confirmed',
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        }
      },
      {
        $group: {
          _id: null,
          grossSales: { $sum: '$totalAmount' },
          commissionRevenue: { $sum: '$commissionAmount' },
          userFeeRevenue: { $sum: '$userPlatformFeeAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const expenseResult = await Expense.aggregate([
      { 
        $match: { 
          status: 'paid',
          ...(startDate || endDate ? { expenseDate: dateFilter } : {})
        }
      },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
    ]);

  const grossSales = revenueResult.length > 0 ? revenueResult[0].grossSales : 0;
  const commissionRevenue = revenueResult.length > 0 ? revenueResult[0].commissionRevenue : 0;
  const userFeeRevenue = revenueResult.length > 0 ? revenueResult[0].userFeeRevenue : 0;
  const revenue = Number((commissionRevenue + userFeeRevenue).toFixed(2));
    const expenses = expenseResult.length > 0 ? expenseResult[0].totalExpenses : 0;
    const profit = revenue - expenses;
  const profitMargin = grossSales > 0 ? ((revenue / grossSales) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        revenue,
        grossSales,
  commissionRevenue,
  userFeeRevenue,
        expenses,
        profit,
        profitMargin,
        platformFeeRate: PLATFORM_FEE_RATE,
        totalOrders: revenueResult.length > 0 ? revenueResult[0].count : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/finances/event/:eventId', protect, admin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const orders = await Order.find({ 
      'tickets.event': req.params.eventId, 
      paymentStatus: 'completed' 
    });
    
    const grossSales = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const commissionRevenue = orders.reduce((sum, order) => sum + Number(order.commissionAmount || 0), 0);
    const userFeeRevenue = orders.reduce((sum, order) => sum + Number(order.userPlatformFeeAmount || 0), 0);
    const revenue = Number((commissionRevenue + userFeeRevenue).toFixed(2));

    const expenses = await Expense.aggregate([
      { $match: { event: require('mongoose').Types.ObjectId(req.params.eventId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
    const profit = revenue - totalExpenses;
  const margin = grossSales > 0 ? ((revenue / grossSales) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        event: { id: event._id, title: event.title, budget: event.budget },
        grossSales,
        revenue,
  commissionRevenue,
  userFeeRevenue,
        expenses: totalExpenses,
        profit,
        profitMargin: margin,
        platformFeeRate: PLATFORM_FEE_RATE,
        ticketsSold: event.ticketsSold,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/finances/chart', protect, admin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let dateFormat, groupBy;

    if (period === 'year') {
      dateFormat = '%Y';
      groupBy = { year: '$createdAt' };
    } else if (period === 'week') {
      dateFormat = '%Y-%U';
      groupBy = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
    } else {
      dateFormat = '%Y-%m';
      groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    }

    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'completed', orderStatus: 'confirmed' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const expenseData = await Expense.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: groupBy,
          expenses: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenueData,
        expenses: expenseData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/insights', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const startWindow = new Date(now);
    startWindow.setMonth(startWindow.getMonth() - 5);
    startWindow.setDate(1);
    startWindow.setHours(0, 0, 0, 0);

    const salesByMonth = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
          createdAt: { $gte: startWindow },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          grossSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          ticketsSold: { $sum: { $size: '$tickets' } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const expensesByMonth = await Expense.aggregate([
      {
        $match: {
          status: 'paid',
          expenseDate: { $gte: startWindow },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          expenses: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const salesLookup = new Map(
      salesByMonth.map((item) => [
        `${item._id.year}-${item._id.month}`,
        {
          grossSales: item.grossSales || 0,
          platformRevenue: Number(((item.grossSales || 0) * PLATFORM_FEE_RATE).toFixed(2)),
          orderCount: item.orderCount || 0,
          ticketsSold: item.ticketsSold || 0,
        },
      ])
    );
    const expenseLookup = new Map(
      expensesByMonth.map((item) => [
        `${item._id.year}-${item._id.month}`,
        {
          expenses: item.expenses || 0,
        },
      ])
    );

    const cashFlowTrend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(startWindow);
      date.setMonth(startWindow.getMonth() + index);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const sales = salesLookup.get(key) || {
        grossSales: 0,
        platformRevenue: 0,
        orderCount: 0,
        ticketsSold: 0,
      };
      const expense = expenseLookup.get(key) || { expenses: 0 };

      return {
        period: date.toLocaleDateString('en-IN', { month: 'short' }),
        grossSales: Number(sales.grossSales.toFixed(2)),
        platformRevenue: Number(sales.platformRevenue.toFixed(2)),
        expenses: Number(expense.expenses.toFixed(2)),
        profit: Number((sales.platformRevenue - expense.expenses).toFixed(2)),
        orders: sales.orderCount,
      };
    });

    const expenseCategoryRaw = await Expense.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]);

    const expenseCategoryMix = expenseCategoryRaw.map((item) => ({
      category: item._id,
      total: Number((item.total || 0).toFixed(2)),
    }));

    const resources = await Resource.find({ isActive: true })
      .select('name type totalCapacity availableCapacity usedCapacity unit')
      .lean();

    const resourceUtilization = resources.map((resource) => {
      const used =
        Number(resource.usedCapacity || 0) > 0
          ? Number(resource.usedCapacity || 0)
          : Math.max(
              Number(resource.totalCapacity || 0) - Number(resource.availableCapacity || 0),
              0
            );
      const total = Number(resource.totalCapacity || 0);
      const utilization = total > 0 ? (used / total) * 100 : 0;

      return {
        name: resource.name,
        type: resource.type,
        unit: resource.unit,
        utilized: used,
        total,
        utilization: Number(utilization.toFixed(2)),
      };
    });

    const totals = cashFlowTrend.reduce(
      (acc, item) => {
        acc.grossSales += item.grossSales;
        acc.platformRevenue += item.platformRevenue;
        acc.expenses += item.expenses;
        acc.orders += item.orders;
        return acc;
      },
      { grossSales: 0, platformRevenue: 0, expenses: 0, orders: 0 }
    );

    const unitEconomics = {
      avgOrderValue:
        totals.orders > 0 ? Number((totals.grossSales / totals.orders).toFixed(2)) : 0,
      platformMargin:
        totals.grossSales > 0
          ? Number(((totals.platformRevenue / totals.grossSales) * 100).toFixed(2))
          : 0,
      netProfit: Number((totals.platformRevenue - totals.expenses).toFixed(2)),
    };

    const headlineRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          totalTickets: { $sum: { $size: '$tickets' } },
        },
      },
    ]);

    const totalRevenue = Number((headlineRevenue[0]?.totalRevenue || 0).toFixed(2));
    const totalTransactions = headlineRevenue[0]?.totalTransactions || 0;
    const totalTickets = headlineRevenue[0]?.totalTickets || 0;
    const avgTicketPrice = totalTickets > 0
      ? Number((totalRevenue / totalTickets).toFixed(2))
      : 0;

    const refundsProcessed = await Order.countDocuments({
      orderStatus: 'refunded',
    });

    const allEventsRaw = await Event.find()
      .select('title price ticketsAvailable')
      .lean();

    const eventIds = allEventsRaw.map((event) => String(event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(eventIds);

    const eventPerformance = allEventsRaw
      .map((event) => {
        const metrics =
          metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
        const revenue = Number(((event.price || 0) * (metrics.ticketsSold || 0)).toFixed(2));
        const profit = Number((revenue * PLATFORM_FEE_RATE).toFixed(2));

        return {
          id: String(event._id),
          eventName: event.title,
          ticketsSold: metrics.ticketsSold || 0,
          revenueGenerated: revenue,
          profit,
        };
      })
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .slice(0, 12);

    const recentTransactionsRaw = await Order.find()
      .populate('user', 'name email')
      .select('orderNumber user tickets totalAmount paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const transactions = recentTransactionsRaw.map((order) => ({
      transactionId: order.orderNumber || String(order._id),
      user: order.user?.name || order.attendeeName || 'Guest User',
      event: Array.from(
        new Set((order.tickets || []).map((ticket) => ticket.eventTitle).filter(Boolean))
      ).join(', ') || 'Event Booking',
      amount: Number((order.totalAmount || 0).toFixed(2)),
      paymentStatus: order.paymentStatus || 'pending',
      date: order.createdAt,
    }));

    res.json({
      success: true,
      data: {
        cashFlowTrend,
        expenseCategoryMix,
        resourceUtilization,
        unitEconomics,
        kpis: {
          totalRevenue,
          totalTransactions,
          refundsProcessed,
          avgTicketPrice,
        },
        eventPerformance,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;