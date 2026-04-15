const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const {
  getOrganizerEvents,
  getOrganizerEarnings,
  getOrganizerPayouts,
} = require('../controllers/organizerController');

router.use(protect, requireRole(['organizer']));

router.get('/events', getOrganizerEvents);
router.get('/earnings', getOrganizerEarnings);
router.get('/payouts', getOrganizerPayouts);

module.exports = router;
