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
  getMyEventSubmissions,
  verifyEventSubmission,
} = require('../controllers/eventController');

// Public routes
router.get('/', getAllEvents);
router.get('/categories', getCategories);
router.get('/recommendations/me', protect, getRecommendations);
router.get('/my-submissions', protect, requireRole(['client', 'organizer', 'admin']), getMyEventSubmissions);
router.get('/:id/feedback', getEventFeedback);
router.get('/:id', getEventById);

// Protected user routes
router.post('/:id/feedback', protect, submitFeedback);

// Protected routes (client submissions + admin oversight)
router.post('/', protect, requireRole(['client']), createEvent);
router.put('/:id', protect, requireRole(['client', 'admin']), updateEvent);
router.delete('/:id', protect, requireRole(['client', 'admin']), deleteEvent);
router.put('/:id/verify', protect, requireRole(['admin']), verifyEventSubmission);

module.exports = router;
