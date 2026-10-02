const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tripPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripPackage',
      required: [true, 'Trip package reference is required']
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required']
    },
    travelStartDate: {
      type: Date,
      required: [true, 'Travel start date is required']
    },
    travelEndDate: {
      type: Date,
      required: [true, 'Travel end date is required'],
      validate: {
        validator: function (value) {
          return this.travelStartDate <= value;
        },
        message: 'Travel end date must be on or after travel start date'
      }
    },
    seatsBooked: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'At least 1 seat must be booked'],
      default: 1
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    // Array of identity document paths uploaded via Multer
    documentPaths: {
      type: [String],
      required: [true, 'At least one identity document is required for travel booking'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'Please upload at least one identity document (Passport, National ID, etc.)'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'rejected'],
      default: 'confirmed'
    },
    specialRequests: {
      type: String,
      trim: true,
      default: ''
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    bookingDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
