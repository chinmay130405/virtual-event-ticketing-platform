/**
 * Event Controller
 * Handles event management and retrieval
 */

const Event = require('../models/Event');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');

/**
 * Get all events with filtering and search
 * GET /api/events
 */
exports.getAllEvents = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy } = req.query;

    // Build filter object
    let filter = { isActive: true };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    let sortObj = { createdAt: -1 };
    if (sortBy === 'price_asc') {
      sortObj = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sortObj = { price: -1 };
    } else if (sortBy === 'date_asc') {
      sortObj = { eventDate: 1 };
    } else if (sortBy === 'date_desc') {
      sortObj = { eventDate: -1 };
    }

    // Execute query
    const events = await Event.find(filter)
      .sort(sortObj)
      .populate('createdBy', 'name email')
      .lean();

    const eventIds = events.map((event) => String(event._id));
    const metricsByEvent = await getTicketMetricsByEventIds(eventIds);
    const enrichedEvents = events.map((event) => {
      const metrics =
        metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };

      return {
        ...event,
        ticketsSold: metrics.ticketsSold,
        ticketsReserved: metrics.ticketsReserved,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedEvents.length,
      events: enrichedEvents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single event details
 * GET /api/events/:id
 */
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const metricsByEvent = await getTicketMetricsByEventIds([String(event._id)]);
    const metrics =
      metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        ticketsSold: metrics.ticketsSold,
        ticketsReserved: metrics.ticketsReserved,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new event (Admin only)
 * POST /api/events
 */
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      price,
      ticketsAvailable,
      eventDate,
      eventTime,
      duration,
      bannerImage,
      location,
      speaker,
      tags,
    } = req.body;

    // Validation
    if (!title || !description || !price || !ticketsAvailable || !eventDate || !eventTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const event = await Event.create({
      title,
      description,
      category: category || 'Other',
      price,
      ticketsAvailable,
      eventDate,
      eventTime,
      duration: duration || '2 hours',
      bannerImage:
        bannerImage || 'https://via.placeholder.com/800x400?text=Virtual+Event',
      location: location || 'Online',
      speaker: speaker || '',
      tags: Array.isArray(tags)
        ? tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 10)
        : [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update event (Admin only)
 * PUT /api/events/:id
 */
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Update fields
    const allowedFields = [
      'title',
      'description',
      'category',
      'price',
      'ticketsAvailable',
      'eventDate',
      'eventTime',
      'duration',
      'bannerImage',
      'location',
      'speaker',
      'isActive',
      'tags',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'tags' && Array.isArray(req.body[field])) {
          event[field] = req.body[field]
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 10);
        } else {
          event[field] = req.body[field];
        }
      }
    });

    event = await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete event (Admin only)
 * DELETE /api/events/:id
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get categories
 * GET /api/events/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = [
      'Technology',
      'Business',
      'Entertainment',
      'Sports',
      'Education',
      'Other',
    ];

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit feedback for an attended event
 * POST /api/events/:id/feedback
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required',
      });
    }

    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const order = await Order.findOne({
      user: req.user.id,
      orderStatus: 'confirmed',
      'tickets.event': eventId,
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You can only review events you attended',
      });
    }

    const feedback = await Feedback.findOneAndUpdate(
      { user: req.user.id, event: eventId },
      {
        rating,
        comment: comment || '',
      },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public feedback for an event
 * GET /api/events/:id/feedback
 */
exports.getEventFeedback = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;

    const event = await Event.findById(eventId).select('_id');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const feedbackItems = await Feedback.find({ event: eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const ratingsSummary = {
      average:
        feedbackItems.length > 0
          ? Number(
              (
                feedbackItems.reduce((sum, item) => sum + item.rating, 0) /
                feedbackItems.length
              ).toFixed(1)
            )
          : 0,
      total: feedbackItems.length,
    };

    res.status(200).json({
      success: true,
      summary: ratingsSummary,
      feedback: feedbackItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recommend events for current user
 * GET /api/events/recommendations/me
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const userOrders = await Order.find({
      user: req.user.id,
      orderStatus: 'confirmed',
    }).select('tickets.event');

    const attendedEventIds = new Set();
    userOrders.forEach((order) => {
      order.tickets.forEach((ticket) => {
        if (ticket.event) {
          attendedEventIds.add(ticket.event.toString());
        }
      });
    });

    if (attendedEventIds.size === 0) {
      const fallbackEvents = await Event.find({ isActive: true })
        .sort({ eventDate: 1, createdAt: -1 })
        .limit(6)
        .lean();

      return res.status(200).json({
        success: true,
        recommendations: fallbackEvents,
      });
    }

    const attendedEvents = await Event.find({
      _id: { $in: Array.from(attendedEventIds) },
    }).select('category tags');

    const categories = new Set();
    const tags = new Set();

    attendedEvents.forEach((event) => {
      if (event.category) {
        categories.add(event.category);
      }

      (event.tags || []).forEach((tag) => tags.add(tag));
    });

    const recommendationFilter = {
      isActive: true,
      _id: { $nin: Array.from(attendedEventIds) },
      $or: [],
    };

    if (categories.size > 0) {
      recommendationFilter.$or.push({ category: { $in: Array.from(categories) } });
    }

    if (tags.size > 0) {
      recommendationFilter.$or.push({ tags: { $in: Array.from(tags) } });
    }

    let recommendations = [];

    if (recommendationFilter.$or.length > 0) {
      recommendations = await Event.find(recommendationFilter)
        .sort({ eventDate: 1, createdAt: -1 })
        .limit(6)
        .lean();
    }

    if (recommendations.length < 6) {
      const existingIds = new Set(recommendations.map((event) => event._id.toString()));
      const fillEvents = await Event.find({
        isActive: true,
        _id: {
          $nin: [...Array.from(attendedEventIds), ...Array.from(existingIds)],
        },
      })
        .sort({ eventDate: 1, createdAt: -1 })
        .limit(6 - recommendations.length)
        .lean();

      recommendations = [...recommendations, ...fillEvents];
    }

    res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};
