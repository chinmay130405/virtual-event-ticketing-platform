const Event = require('../models/Event');
const Order = require('../models/Order');

exports.getOrganizerEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user.id }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrganizerEarnings = async (req, res, next) => {
  try {
    const orders = await Order.find({
      'organizerSettlement.organizer': req.user.id,
      orderStatus: { $in: ['confirmed', 'pending'] },
    }).select(
      'totalAmount commissionAmount organizerPayoutAmount payoutStatus paymentStatus orderStatus createdAt'
    );

    const summary = orders.reduce(
      (acc, order) => {
        acc.grossSales += order.totalAmount || 0;
        acc.commissionDeducted += order.commissionAmount || 0;
        acc.netEarnings += order.organizerPayoutAmount || 0;

        if (order.payoutStatus === 'paid') {
          acc.paidOut += order.organizerPayoutAmount || 0;
        } else if (order.payoutStatus === 'pending' || order.payoutStatus === 'processing') {
          acc.pendingPayout += order.organizerPayoutAmount || 0;
        }

        return acc;
      },
      {
        grossSales: 0,
        commissionDeducted: 0,
        netEarnings: 0,
        pendingPayout: 0,
        paidOut: 0,
      }
    );

    res.status(200).json({
      success: true,
      summary,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrganizerPayouts = async (req, res, next) => {
  try {
    const payouts = await Order.find({
      'organizerSettlement.organizer': req.user.id,
      payoutStatus: { $ne: 'not_applicable' },
    })
      .select(
        'orderNumber organizerPayoutAmount payoutStatus payoutMethod payoutRequestedAt payoutProcessedAt payoutReference createdAt'
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payouts.length,
      payouts,
    });
  } catch (error) {
    next(error);
  }
};
