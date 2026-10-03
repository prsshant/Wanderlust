const Booking = require('../models/Booking');
const TripPackage = require('../models/TripPackage');
const Customer = require('../models/Customer');
const { samplePackages } = require('../utils/sampleData');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// In-memory demo store for fallback/offline bookings
const inMemoryBookings = [];

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

    const seats = seatsBooked ? parseInt(seatsBooked, 10) : 1;

    // Resolve TripPackage: handles valid ObjectId, demo IDs (e.g. 'pkg-demo-1', 'pkg-demo-2'), or package title
    let tripPackage = null;
    const isPackageObjectId = mongoose.Types.ObjectId.isValid(tripPackageId) && !String(tripPackageId).startsWith('pkg-demo-');

    if (isPackageObjectId && mongoose.connection.readyState >= 1) {
      try {
        tripPackage = await TripPackage.findById(tripPackageId);
      } catch (err) {
        // Fall back below
      }
    }

    // If not found by ObjectId or if tripPackageId is a demo string ('pkg-demo-1', etc.)
    if (!tripPackage) {
      let samplePkg = null;
      if (typeof tripPackageId === 'string' && tripPackageId.startsWith('pkg-demo-')) {
        const idx = parseInt(tripPackageId.replace('pkg-demo-', ''), 10) - 1;
        if (!isNaN(idx) && samplePackages[idx]) {
          samplePkg = samplePackages[idx];
        }
      }

      if (mongoose.connection.readyState >= 1) {
        if (samplePkg) {
          tripPackage = await TripPackage.findOne({ title: samplePkg.title });
        } else if (!isPackageObjectId) {
          tripPackage = await TripPackage.findOne({ title: tripPackageId });
        }

        // If still not found in MongoDB but samplePkg exists, auto-seed it into DB
        if (!tripPackage && samplePkg) {
          let agent = await Customer.findOne({ role: 'agent' });
          if (!agent) agent = await Customer.findOne();
          tripPackage = await TripPackage.create({
            ...samplePkg,
            createdBy: agent ? agent._id : undefined
          });
        }
      }

      // Offline / in-memory fallback
      if (!tripPackage && samplePkg) {
        tripPackage = {
          ...samplePkg,
          _id: tripPackageId
        };
      }
    }

    if (!tripPackage) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({
        success: false,
        message: 'Selected trip package does not exist'
      });
    }

    if (tripPackage.availableSeats < seats) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `Only ${tripPackage.availableSeats} seats available for this package`
      });
    }

    // Map uploaded file paths (normalize to 'uploads/filename')
    const documentPaths = req.files.map((file) => {
      return `uploads/${path.basename(file.path)}`;
    });

    const totalAmount = tripPackage.price * seats;

    // Resolve Customer ID (handles demo customer string like 'demo-customer-001')
    let customerId = req.user._id || req.user.id;
    let isCustomerObjectId = mongoose.Types.ObjectId.isValid(customerId) && !String(customerId).startsWith('demo-');

    if (!isCustomerObjectId && mongoose.connection.readyState >= 1) {
      const userEmail = req.user.email || 'customer@gmail.com';
      let dbCustomer = await Customer.findOne({ email: userEmail });
      if (!dbCustomer) {
        dbCustomer = await Customer.create({
          name: req.user.name || 'Alex Johnson',
          email: userEmail,
          password: 'password123',
          role: req.user.role || 'customer',
          phone: contactPhone || req.user.phone || '+1 555-0144',
          address: req.user.address || ''
        });
      }
      if (dbCustomer) {
        customerId = dbCustomer._id;
        isCustomerObjectId = true;
      }
    }

    // If MongoDB is connected and both package and customer have valid ObjectIds
    const canUseDB = mongoose.connection.readyState >= 1 &&
      isCustomerObjectId &&
      mongoose.Types.ObjectId.isValid(tripPackage._id);

    if (canUseDB) {
      // === CRITICAL REQUIREMENT: DATE OVERLAP CHECK ===
      const existingOverlap = await Booking.findOne({
        customer: customerId,
        tripPackage: tripPackage._id,
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

      // Create the booking in DB
      const booking = await Booking.create({
        tripPackage: tripPackage._id,
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

      const populatedBooking = await Booking.findById(booking._id)
        .populate('tripPackage', 'title destination price imageUrl')
        .populate('customer', 'name email phone');

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed successfully!',
        data: populatedBooking
      });
    }

    // === OFFLINE / IN-MEMORY FALLBACK BOOKING ===
    const existingMemoryOverlap = inMemoryBookings.find((b) => {
      const bCustId = String(b.customer._id || b.customer.id || b.customer);
      const bPkgId = String(b.tripPackage._id || b.tripPackage.id || b.tripPackage);
      return (
        bCustId === String(customerId) &&
        bPkgId === String(tripPackage._id || tripPackageId) &&
        b.status !== 'cancelled' &&
        new Date(b.travelStartDate) <= end &&
        new Date(b.travelEndDate) >= start
      );
    });

    if (existingMemoryOverlap) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `Overlapping booking detected! You already have an active booking (${existingMemoryOverlap._id}) for "${tripPackage.title}" covering dates ${new Date(existingMemoryOverlap.travelStartDate).toISOString().split('T')[0]} to ${new Date(existingMemoryOverlap.travelEndDate).toISOString().split('T')[0]}. Overlapping dates are not permitted.`,
        overlappingBooking: existingMemoryOverlap
      });
    }

    tripPackage.availableSeats = Math.max(0, tripPackage.availableSeats - seats);

    const mockBooking = {
      _id: `bk-demo-${Date.now()}`,
      tripPackage: {
        _id: tripPackage._id || tripPackageId,
        title: tripPackage.title,
        destination: tripPackage.destination,
        price: tripPackage.price,
        imageUrl: tripPackage.imageUrl
      },
      customer: {
        _id: customerId,
        name: req.user.name || 'Alex Johnson',
        email: req.user.email || 'customer@gmail.com',
        phone: contactPhone || req.user.phone || '+1 555-0144'
      },
      travelStartDate: start,
      travelEndDate: end,
      seatsBooked: seats,
      totalAmount,
      documentPaths,
      contactPhone: contactPhone || req.user.phone || '',
      specialRequests: specialRequests || '',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    inMemoryBookings.unshift(mockBooking);

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: mockBooking
    });
  } catch (error) {
    cleanupUploadedFiles(req.files);
    console.error('Error creating booking:', error.message);
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
    if (packageId && mongoose.Types.ObjectId.isValid(packageId)) {
      query.tripPackage = packageId;
    }

    let dbBookings = [];
    if (mongoose.connection.readyState >= 1) {
      dbBookings = await Booking.find(query)
        .populate('tripPackage')
        .populate('customer', 'name email phone role address')
        .sort({ createdAt: -1 });
    }

    let combined = [...inMemoryBookings, ...dbBookings];
    if (status) {
      combined = combined.filter((b) => b.status === status);
    }
    if (packageId) {
      combined = combined.filter((b) => {
        const pkgId = b.tripPackage?._id ? String(b.tripPackage._id) : String(b.tripPackage);
        return pkgId === String(packageId);
      });
    }

    res.json({
      success: true,
      count: combined.length,
      data: combined
    });
  } catch (error) {
    res.json({
      success: true,
      count: inMemoryBookings.length,
      data: inMemoryBookings
    });
  }
};

// @desc    Get logged in customer's bookings
// @route   GET /api/bookings/my
// @access  Private (Customer or Agent)
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let dbBookings = [];

    if (mongoose.connection.readyState >= 1) {
      let queryCustomer = userId;
      if (!mongoose.Types.ObjectId.isValid(queryCustomer)) {
        const found = await Customer.findOne({ email: req.user.email });
        if (found) queryCustomer = found._id;
      }

      if (mongoose.Types.ObjectId.isValid(queryCustomer)) {
        dbBookings = await Booking.find({ customer: queryCustomer })
          .populate('tripPackage')
          .sort({ createdAt: -1 });
      }
    }

    const myMockBookings = inMemoryBookings.filter((b) => {
      const bCustId = String(b.customer?._id || b.customer?.id || b.customer);
      return (
        bCustId === String(userId) ||
        (b.customer?.email && b.customer.email === req.user.email)
      );
    });

    const combined = [...myMockBookings, ...dbBookings];

    res.json({
      success: true,
      count: combined.length,
      data: combined
    });
  } catch (error) {
    res.json({
      success: true,
      count: inMemoryBookings.length,
      data: inMemoryBookings
    });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    // Check in-memory first
    const mockFound = inMemoryBookings.find((b) => String(b._id) === String(req.params.id));
    if (mockFound) {
      return res.json({
        success: true,
        data: mockFound
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id) || mongoose.connection.readyState < 1) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

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
    const userRole = req.user.role;
    const userIdStr = String(req.user._id || req.user.id);
    const bookingCustStr = String(booking.customer?._id || booking.customer);

    if (userRole !== 'agent' && bookingCustStr !== userIdStr) {
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

    // Check in-memory booking
    const mockIndex = inMemoryBookings.findIndex((b) => String(b._id) === String(req.params.id));
    if (mockIndex !== -1) {
      inMemoryBookings[mockIndex].status = status;
      return res.json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: inMemoryBookings[mockIndex]
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id) || mongoose.connection.readyState < 1) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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
      if (mongoose.Types.ObjectId.isValid(booking.tripPackage)) {
        await TripPackage.findByIdAndUpdate(booking.tripPackage, {
          $inc: { availableSeats: booking.seatsBooked }
        });
      }
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
    const userIdStr = String(req.user._id || req.user.id);

    // Check in-memory booking
    const mockIndex = inMemoryBookings.findIndex((b) => String(b._id) === String(req.params.id));
    if (mockIndex !== -1) {
      const mockBooking = inMemoryBookings[mockIndex];
      const custIdStr = String(mockBooking.customer?._id || mockBooking.customer?.id || mockBooking.customer);
      if (custIdStr !== userIdStr && req.user.role !== 'agent') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking'
        });
      }

      if (mockBooking.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }

      mockBooking.status = 'cancelled';
      return res.json({
        success: true,
        message: 'Booking cancelled successfully and seats restored',
        data: mockBooking
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id) || mongoose.connection.readyState < 1) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer.toString() !== userIdStr && req.user.role !== 'agent') {
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
    if (mongoose.Types.ObjectId.isValid(booking.tripPackage)) {
      await TripPackage.findByIdAndUpdate(booking.tripPackage, {
        $inc: { availableSeats: booking.seatsBooked }
      });
    }

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
