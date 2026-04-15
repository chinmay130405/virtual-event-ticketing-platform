/**
 * Event Routes
 */

const express = require('express');
const router = express.Router();
const { protect, admin, requireRole } = require('../middleware/auth');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getCategories,
  submitFeedback,
  getEventFeedback,
  getRecommendations,
} = require('../controllers/eventController');

// Public routes
router.get('/', getAllEvents);
router.get('/categories', getCategories);
router.get('/recommendations/me', protect, getRecommendations);
router.get('/:id/feedback', getEventFeedback);
router.get('/:id', getEventById);

// Protected user routes
router.post('/:id/feedback', protect, submitFeedback);

// Protected routes (Admin and organizer)
router.post('/', protect, requireRole(['admin', 'organizer']), createEvent);
router.put('/:id', protect, requireRole(['admin', 'organizer']), updateEvent);
router.delete('/:id', protect, requireRole(['admin', 'organizer']), deleteEvent);

module.exports = router;
