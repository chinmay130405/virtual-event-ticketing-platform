const mongoose = require('mongoose');
const Order = require('../models/Order');

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

const getTicketMetricsByEventIds = async (eventIds) => {
  const objectIds = (eventIds || []).map(toObjectId).filter(Boolean);

  if (objectIds.length === 0) {
    return new Map();
  }

  const metrics = await Order.aggregate([
    {
      $match: {
        orderStatus: { $in: ['confirmed', 'pending'] },
      },
    },
    { $unwind: '$tickets' },
    {
      $match: {
        'tickets.event': { $in: objectIds },
      },
    },
    {
      $group: {
        _id: '$tickets.event',
        ticketsSold: {
          $sum: {
            $cond: [
              { $eq: ['$orderStatus', 'confirmed'] },
              { $ifNull: ['$tickets.quantity', 1] },
              0,
            ],
          },
        },
        ticketsReserved: {
          $sum: {
            $cond: [
              { $eq: ['$orderStatus', 'pending'] },
              { $ifNull: ['$tickets.quantity', 1] },
              0,
            ],
          },
        },
      },
    },
  ]);

  const map = new Map();
  metrics.forEach((item) => {
    map.set(String(item._id), {
      ticketsSold: item.ticketsSold || 0,
      ticketsReserved: item.ticketsReserved || 0,
    });
  });

  return map;
};

module.exports = {
  getTicketMetricsByEventIds,
};
