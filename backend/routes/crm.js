/**
 * CRM Routes
 * Customer Relationship Management endpoints
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Review = require('../models/Review');
const MarketingCampaign = require('../models/MarketingCampaign');
const User = require('../models/User');
const Event = require('../models/Event');
const { isAdminUser } = require('../utils/roles');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'CRM API running' });
});

router.post('/reviews', protect, async (req, res) => {
  try {
    const { eventId, rating, title, comment } = req.body;
    
    const existingReview = await Review.findOne({ user: req.user.id, event: eventId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this event',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const review = await Review.create({
      user: req.user.id,
      event: eventId,
      rating,
      title,
      comment,
    });

    await review.populate('user', 'name email');

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reviews/event/:eventId', async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId, isActive: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ success: true, data: reviews, averageRating: avgRating, totalReviews: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reviews/my-reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('event', 'title eventDate bannerImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/reviews/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { rating, title, comment } = req.body;
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/reviews/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && !isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    review.isActive = false;
    await review.save();

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/campaigns', protect, admin, async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/campaigns', protect, admin, async (req, res) => {
  try {
    const campaign = await MarketingCampaign.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/campaigns/:id', protect, admin, async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/campaigns/:id', protect, admin, async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findByIdAndDelete(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', protect, admin, async (req, res) => {
  try {
    const { segment, minSpent, category, page = 1, limit = 20 } = req.query;

    let query = {};

    if (minSpent) {
      query.totalSpent = { $gte: parseFloat(minSpent) };
    }

    if (category) {
      query.preferences = category;
    }

    if (segment === 'vip') {
      query.totalSpent = { $gte: 500 };
    } else if (segment === 'new_users') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    } else if (segment === 'inactive') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      query.lastLogin = { $lte: ninetyDaysAgo };
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
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

router.get('/users/:id/crm', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const Order = require('../models/Order');
    const orders = await Order.find({ user: req.params.id });
    const Review = require('../models/Review');
    const reviews = await Review.find({ user: req.params.id });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalOrders: orders.length,
          totalSpent: user.totalSpent,
          loyaltyPoints: user.loyaltyPoints,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          reviewsCount: reviews.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id/preferences', protect, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() !== req.user.id && !isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    user.preferences = preferences || [];
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me/crm', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    const Order = require('../models/Order');
    const Review = require('../models/Review');
    
    const orders = await Order.find({ user: req.user.id });
    const reviews = await Review.find({ user: req.user.id });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalOrders: orders.length,
          totalSpent: user.totalSpent,
          loyaltyPoints: user.loyaltyPoints,
          preferences: user.preferences,
          reviewsCount: reviews.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
