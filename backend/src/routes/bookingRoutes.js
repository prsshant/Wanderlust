const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadDocuments } = require('../middleware/uploadMiddleware');

// Customer and Agent routes
router.post('/', protect, uploadDocuments, createBooking);
router.get('/my', protect, getMyBookings);

// Agent-only routes for viewing all customer bookings and reviewing documents
router.get('/', protect, authorize('agent'), getAllBookings);
router.patch('/:id/status', protect, authorize('agent'), updateBookingStatus);

// Individual booking operations
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
