/**
 * SCM Routes
 * Supply Chain Management and operational flow insights
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Event = require('../models/Event');
const Order = require('../models/Order');
const Resource = require('../models/Resource');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'SCM API running' });
});

router.get('/insights', protect, admin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [events, orders, resources] = await Promise.all([
      Event.find({ approvalStatus: 'approved', isActive: true })
        .select('title category eventMode ticketsAvailable eventDate location')
        .lean(),
      Order.find({ orderStatus: { $in: ['confirmed', 'pending'] } })
        .select('orderStatus paymentStatus tickets createdAt')
        .lean(),
      Resource.find({ isActive: true })
        .select('name type totalCapacity availableCapacity usedCapacity unit')
        .lean(),
    ]);

    const eventMap = new Map(events.map((event) => [String(event._id), event]));

    const eventFlowMap = new Map();
    const ensureFlow = (eventId) => {
      if (!eventFlowMap.has(eventId)) {
        eventFlowMap.set(eventId, { sold: 0, reserved: 0 });
      }
      return eventFlowMap.get(eventId);
    };

    orders.forEach((order) => {
      (order.tickets || []).forEach((ticket) => {
        const eventId = String(ticket.event);
        if (!eventMap.has(eventId)) {
          return;
        }

        const quantity = Number(ticket.quantity || 1);
        const flow = ensureFlow(eventId);

        if (order.orderStatus === 'confirmed' && order.paymentStatus === 'completed') {
          flow.sold += quantity;
        } else if (order.orderStatus === 'pending') {
          flow.reserved += quantity;
        }
      });
    });

    const eventsWithFlow = events.map((event) => {
      const flow = eventFlowMap.get(String(event._id)) || { sold: 0, reserved: 0 };
      const ticketsAvailable = Number(event.ticketsAvailable || 0);
      const remaining = Math.max(ticketsAvailable - flow.sold - flow.reserved, 0);
      const occupancy =
        ticketsAvailable > 0 ? Number(((flow.sold / ticketsAvailable) * 100).toFixed(2)) : 0;
      const inventoryLeftPercent =
        ticketsAvailable > 0 ? Number(((remaining / ticketsAvailable) * 100).toFixed(2)) : 0;

      const eventDate = event.eventDate ? new Date(event.eventDate) : null;
      const eventDateKey = eventDate ? new Date(eventDate) : null;
      if (eventDateKey) {
        eventDateKey.setHours(0, 0, 0, 0);
      }

      const isSoldOut = remaining <= 0;
      const isOngoing =
        !isSoldOut && eventDateKey ? eventDateKey.getTime() <= today.getTime() : false;
      const status = isSoldOut ? 'sold_out' : isOngoing ? 'ongoing' : 'upcoming';
  const lowInventory = !isSoldOut && inventoryLeftPercent < 40;

      return {
        id: event._id,
        title: event.title,
        category: event.category,
        eventMode: event.eventMode,
        location: event.location,
        eventDate: event.eventDate,
        ticketsAvailable,
        sold: flow.sold,
        reserved: flow.reserved,
        remaining,
        occupancy,
        inventoryLeftPercent,
        status,
        lowInventory,
      };
    });

    const totalPlannedCapacity = eventsWithFlow.reduce(
      (sum, event) => sum + Number(event.ticketsAvailable || 0),
      0
    );
    const totalFulfilled = eventsWithFlow.reduce((sum, event) => sum + Number(event.sold || 0), 0);
    const totalReserved = eventsWithFlow.reduce(
      (sum, event) => sum + Number(event.reserved || 0),
      0
    );

    const fillRate =
      totalPlannedCapacity > 0
        ? Number(((totalFulfilled / totalPlannedCapacity) * 100).toFixed(2))
        : 0;

    const soldOutEvents = eventsWithFlow.filter((event) => event.status === 'sold_out').length;
    const lowInventoryEvents = eventsWithFlow.filter((event) => event.lowInventory).length;

    const atRiskEvents = eventsWithFlow
      .filter((event) => event.lowInventory || event.remaining <= 20 || event.occupancy >= 80)
      .sort((a, b) => a.inventoryLeftPercent - b.inventoryLeftPercent)
      .slice(0, 8);

    const demandByCategoryMap = eventsWithFlow.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = { category: event.category, sold: 0, reserved: 0 };
      }
      acc[event.category].sold += Number(event.sold || 0);
      acc[event.category].reserved += Number(event.reserved || 0);
      return acc;
    }, {});

    const demandByCategory = Object.values(demandByCategoryMap).sort((a, b) => b.sold - a.sold);

    const modeMixMap = eventsWithFlow.reduce((acc, event) => {
      if (!acc[event.eventMode]) {
        acc[event.eventMode] = { mode: event.eventMode, sold: 0 };
      }
      acc[event.eventMode].sold += Number(event.sold || 0);
      return acc;
    }, {});

    const modeMix = Object.values(modeMixMap).sort((a, b) => b.sold - a.sold);

    const ticketInsights = [...eventsWithFlow]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 12)
      .map((event) => ({
        id: event.id,
        title: event.title,
        sold: event.sold,
        ticketsAvailable: event.ticketsAvailable,
        remaining: event.remaining,
      }));

    const resourceCapacity = resources.map((resource) => {
      const total = Number(resource.totalCapacity || 0);
      const used =
        Number(resource.usedCapacity || 0) > 0
          ? Number(resource.usedCapacity || 0)
          : Math.max(total - Number(resource.availableCapacity || 0), 0);
      const utilization = total > 0 ? Number(((used / total) * 100).toFixed(2)) : 0;

      return {
        name: resource.name,
        type: resource.type,
        unit: resource.unit,
        used,
        total,
        utilization,
      };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalEvents: eventsWithFlow.length,
          totalTicketsAvailable: totalPlannedCapacity,
          ticketsSold: totalFulfilled,
          soldOutEvents,
          lowInventoryEvents,
          totalPlannedCapacity,
          totalFulfilled,
          totalReserved,
          fillRate,
        },
        events: eventsWithFlow,
        ticketInsights,
        atRiskEvents,
        demandByCategory,
        modeMix,
        resourceCapacity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
