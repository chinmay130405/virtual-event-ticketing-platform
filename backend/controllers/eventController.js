/**
 * Event Controller
 * Handles event management and retrieval
 */

const Event = require('../models/Event');

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

    res.status(200).json({
      success: true,
      count: events.length,
      events,
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

    res.status(200).json({
      success: true,
      event,
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
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
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
