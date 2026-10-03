const Booking = require('../models/Booking');
const TripPackage = require('../models/TripPackage');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper to remove uploaded files if booking fails
const cleanupUploadedFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach((file) => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.error('Error removing file during cleanup:', err.message);
      }
    });
  }
};

// @desc    Create new booking with multiple document uploads & date-overlap check
// @route   POST /api/bookings
// @access  Private (Customer or Agent)
const createBooking = async (req, res) => {
  try {
    const {
      tripPackageId,
      travelStartDate,
      travelEndDate,
      seatsBooked,
      specialRequests,
      contactPhone
    } = req.body;

    // Check if uploaded documents are present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Identity documents are required. Please upload at least one document (Passport, ID Card, etc.)'
      });
    }

    if (!tripPackageId || !travelStartDate || !travelEndDate) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Please provide tripPackageId, travelStartDate, and travelEndDate'
      });
    }

    const start = new Date(travelStartDate);
    const end = new Date(travelEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Invalid travel start or end date format'
      });
    }

    if (start > end) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Travel end date must be on or after travel start date'
      });
    }

    // Verify trip package exists
    const tripPackage = await TripPackage.findById(tripPackageId);
    if (!tripPackage) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({
        success: false,
        message: 'Selected trip package does not exist'
      });
    }

    const seats = seatsBooked ? parseInt(seatsBooked, 10) : 1;
    if (tripPackage.availableSeats < seats) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `Only ${tripPackage.availableSeats} seats available for this package`
      });
    }

    const customerId = req.user._id;

    // === CRITICAL REQUIREMENT: DATE OVERLAP CHECK ===
    // "A customer cannot book the same trip package twice for overlapping travel dates."
    // Overlap condition:
    // Existing booking travelStartDate <= New booking travelEndDate
    // AND Existing booking travelEndDate >= New booking travelStartDate
    const existingOverlap = await Booking.findOne({
      customer: customerId,
      tripPackage: tripPackageId,
      status: { $ne: 'cancelled' },
      travelStartDate: { $lte: end },
      travelEndDate: { $gte: start }
    });

    if (existingOverlap) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `Overlapping booking detected! You already have an active booking (${existingOverlap._id}) for "${tripPackage.title}" covering dates ${existingOverlap.travelStartDate.toISOString().split('T')[0]} to ${existingOverlap.travelEndDate.toISOString().split('T')[0]}. Overlapping dates are not permitted.`,
        overlappingBooking: existingOverlap
      });
    }

    // Map uploaded file paths (relative to uploads root so they can be served/viewed)
    const documentPaths = req.files.map((file) => {
      // normalize to 'uploads/filename'
      return `uploads/${path.basename(file.path)}`;
    });

    const totalAmount = tripPackage.price * seats;

    // Create the booking
    const booking = await Booking.create({
      tripPackage: tripPackageId,
      customer: customerId,
      travelStartDate: start,
      travelEndDate: end,
      seatsBooked: seats,
      totalAmount,
      documentPaths,
      contactPhone: contactPhone || req.user.phone || '',
      specialRequests: specialRequests || '',
      status: 'confirmed'
    });

    // Decrement available seats in package
    tripPackage.availableSeats = Math.max(0, tripPackage.availableSeats - seats);
    await tripPackage.save();

    // Populate package and customer details for return
    const populatedBooking = await Booking.findById(booking._id)
      .populate('tripPackage', 'title destination price imageUrl')
      .populate('customer', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: populatedBooking
    });
  } catch (error) {
    cleanupUploadedFiles(req.files);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing booking'
    });
  }
};

// @desc    Get all bookings (Agent only - review uploaded documents & bookings)
// @route   GET /api/bookings
// @access  Private (Agent only)
const getAllBookings = async (req, res) => {
  try {
    const { status, packageId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (packageId) query.tripPackage = packageId;

    let bookings = [];
    if (mongoose.connection.readyState >= 1) {
      bookings = await Booking.find(query)
        .populate('tripPackage')
        .populate('customer', 'name email phone role address')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.json({
      success: true,
      count: 0,
      data: []
    });
  }
};

// @desc    Get logged in customer's bookings
// @route   GET /api/bookings/my
// @access  Private (Customer or Agent)
const getMyBookings = async (req, res) => {
  try {
    let bookings = [];
    if (mongoose.connection.readyState >= 1) {
      bookings = await Booking.find({ customer: req.user._id })
        .populate('tripPackage')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.json({
      success: true,
      count: 0,
      data: []
    });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tripPackage')
      .populate('customer', 'name email phone role address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Ensure only the customer who booked or an agent can view
    if (
      req.user.role !== 'agent' &&
      booking.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching booking'
    });
  }
};

// @desc    Update booking status (Agent only: approve/reject/cancel)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Agent only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: pending, confirmed, cancelled, rejected'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // If cancelling/rejecting an active booking, restore package seats
    if (
      (status === 'cancelled' || status === 'rejected') &&
      booking.status !== 'cancelled' &&
      booking.status !== 'rejected'
    ) {
      await TripPackage.findByIdAndUpdate(booking.tripPackage, {
        $inc: { availableSeats: booking.seatsBooked }
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating booking status'
    });
  }
};

// @desc    Cancel a booking by customer
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (Customer)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Restore available seats
    await TripPackage.findByIdAndUpdate(booking.tripPackage, {
      $inc: { availableSeats: booking.seatsBooked }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully and seats restored',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling booking'
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
};
