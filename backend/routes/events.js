/**
 * Event Routes
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getCategories,
} = require('../controllers/eventController');

// Public routes
router.get('/', getAllEvents);
router.get('/categories', getCategories);
router.get('/:id', getEventById);

// Protected routes (Admin only)
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;
