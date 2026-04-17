/**
 * Event Controller
 * Handles event management and retrieval
 */

const Event = require('../models/Event');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');
const { isAdminUser } = require('../utils/roles');

const DEFAULT_EVENT_BANNER =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';
const DEFAULT_PLATFORM_FEE_RATE = 0.3;
const HIGHLIGHT_COST_PER_WEEK = 10000;

const sanitizeBannerImage = (bannerImage) => {
  const trimmed = String(bannerImage || '').trim();

  if (!trimmed) {
    return DEFAULT_EVENT_BANNER;
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return DEFAULT_EVENT_BANNER;
    }
    return trimmed;
  } catch (error) {
    return DEFAULT_EVENT_BANNER;
  }
};

const clampDiscountPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(80, Math.max(0, numeric));
};

const calculateEffectiveTicketPrice = (eventLike) => {
  const basePrice = Math.max(0, Number(eventLike?.price) || 0);
  const discountPercent = clampDiscountPercent(eventLike?.discountPercent);
  const discounted = basePrice * (1 - discountPercent / 100);
  return Number(discounted.toFixed(2));
};

const applyHighlightSettings = (event, highlightWeeksInput) => {
  if (highlightWeeksInput === undefined) {
    return;
  }

  const highlightWeeks = Math.max(0, Math.min(52, Number(highlightWeeksInput) || 0));

  event.highlightWeeks = highlightWeeks;
  event.isHighlighted = highlightWeeks > 0;
  event.highlightFeePaid = highlightWeeks * HIGHLIGHT_COST_PER_WEEK;

  if (highlightWeeks > 0) {
    const until = new Date();
    until.setDate(until.getDate() + highlightWeeks * 7);
    event.highlightUntil = until;
  } else {
    event.highlightUntil = null;
  }
};

const enrichEventPricing = (eventLike) => {
  const now = Date.now();
  const highlightUntilTime = eventLike?.highlightUntil ? new Date(eventLike.highlightUntil).getTime() : 0;
  const isHighlightActive = Boolean(eventLike?.isHighlighted) && highlightUntilTime > now;
  const effectivePrice = calculateEffectiveTicketPrice(eventLike);
  const basePrice = Math.max(0, Number(eventLike?.price) || 0);
  const platformFeePerTicket = Number((effectivePrice * DEFAULT_PLATFORM_FEE_RATE).toFixed(2));
  const creatorEarningPerTicket = Number((effectivePrice - platformFeePerTicket).toFixed(2));

  return {
    ...eventLike,
    discountPercent: clampDiscountPercent(eventLike?.discountPercent),
    effectivePrice,
    platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
    platformFeePerTicket,
    creatorEarningPerTicket,
    originalPrice: basePrice,
    isHighlightActive,
  };
};

/**
 * Get all events with filtering and search
 * GET /api/events
 */
exports.getAllEvents = async (req, res, next) => {
  try {
    const { search, category, location, eventMode, minPrice, maxPrice, sortBy } = req.query;

    // Build filter object
    let filter = { isActive: true, approvalStatus: 'approved' };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filter
    if (location) {
      filter.location = { $regex: String(location).trim(), $options: 'i' };
    }

    // Event mode filter
    if (eventMode) {
      filter.eventMode = String(eventMode).trim().toLowerCase();
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

      return enrichEventPricing({
        ...event,
        ticketsSold: metrics.ticketsSold,
        ticketsReserved: metrics.ticketsReserved,
      });
    });

    if (sortBy === 'price_asc') {
      enrichedEvents.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (sortBy === 'price_desc') {
      enrichedEvents.sort((a, b) => b.effectivePrice - a.effectivePrice);
    }

    enrichedEvents.sort((a, b) => {
      const highlightDiff = Number(Boolean(b.isHighlightActive)) - Number(Boolean(a.isHighlightActive));
      if (highlightDiff !== 0) {
        return highlightDiff;
      }
      return 0;
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

    const isPrivilegedViewer =
      req.user && (req.user.role === 'admin' || req.user.id === String(event.createdBy?._id || event.createdBy));

    if (event.approvalStatus !== 'approved' && !isPrivilegedViewer) {
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
      event: enrichEventPricing({
        ...event.toObject(),
        ticketsSold: metrics.ticketsSold,
        ticketsReserved: metrics.ticketsReserved,
      }),
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
  eventMode,
      speaker,
      venueDescription,
      organizerName,
      tags,
      discountPercent,
      highlightWeeks,
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
  discountPercent: clampDiscountPercent(discountPercent),
      ticketsAvailable,
      eventDate,
      eventTime,
      duration: duration || '2 hours',
      bannerImage: sanitizeBannerImage(bannerImage),
      location: location || 'Online',
      eventMode: eventMode || 'in-person',
      speaker: speaker || '',
      venueDescription: venueDescription || '',
      organizerName: organizerName || '',
      approvalStatus: req.user.role === 'client' ? 'pending' : 'approved',
      approvalComment:
        req.user.role === 'client'
          ? 'Awaiting admin verification'
          : 'Auto-approved for admin/organizer submission',
      status: req.user.role === 'client' ? 'draft' : 'published',
      isActive: req.user.role === 'client' ? false : true,
      verifiedAt: req.user.role === 'client' ? null : new Date(),
      verifiedBy: req.user.role === 'client' ? null : req.user.id,
      tags: Array.isArray(tags)
        ? tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 10)
        : [],
      createdBy: req.user.id,
      organizer: req.user.role === 'organizer' ? req.user.id : null,
      platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
    });

    applyHighlightSettings(event, highlightWeeks);
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
      note:
        req.user.role === 'client'
          ? 'Event submitted for admin verification. It will be visible after approval.'
          : 'Event published successfully.',
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
    if (event.createdBy.toString() !== req.user.id && !isAdminUser(req.user)) {
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
    'eventMode',
      'speaker',
    'venueDescription',
      'organizerName',
      'isActive',
      'tags',
      'discountPercent',
      'highlightWeeks',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'tags' && Array.isArray(req.body[field])) {
          event[field] = req.body[field]
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 10);
        } else if (field === 'bannerImage') {
          event[field] = sanitizeBannerImage(req.body[field]);
        } else if (field === 'discountPercent') {
          event[field] = clampDiscountPercent(req.body[field]);
        } else if (field === 'highlightWeeks') {
          applyHighlightSettings(event, req.body[field]);
        } else {
          event[field] = req.body[field];
        }
      }
    });

    event.platformFeeRate = DEFAULT_PLATFORM_FEE_RATE;

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
    if (event.createdBy.toString() !== req.user.id && !isAdminUser(req.user)) {
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

/**
 * Get current user's event submissions
 * GET /api/events/my-submissions
 */
exports.getMyEventSubmissions = async (req, res, next) => {
  try {
    const submissions = await Event.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: submissions.length,
      events: submissions.map((event) => enrichEventPricing(event)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify client event submission (Admin only)
 * PUT /api/events/:id/verify
 */
exports.verifyEventSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, comment } = req.body;

    if (!['approved', 'rejected'].includes(String(approvalStatus || '').toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'approvalStatus must be either approved or rejected',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const normalizedStatus = String(approvalStatus).toLowerCase();
    event.approvalStatus = normalizedStatus;
    event.approvalComment = String(comment || '').trim();
    event.verifiedAt = new Date();
    event.verifiedBy = req.user.id;

    if (normalizedStatus === 'approved') {
      event.isActive = true;
      event.status = 'published';
      if (!event.approvalComment) {
        event.approvalComment = 'Approved by admin';
      }
    } else {
      event.isActive = false;
      event.status = 'draft';
      if (!event.approvalComment) {
        event.approvalComment = 'Rejected by admin';
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message:
        normalizedStatus === 'approved'
          ? 'Event approved and published'
          : 'Event rejected and hidden from listings',
      event,
    });
  } catch (error) {
    next(error);
  }
};
