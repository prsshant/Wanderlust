const mongoose = require('mongoose');

const tripPackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide package title'],
      trim: true
    },
    destination: {
      type: String,
      required: [true, 'Please provide package destination'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide package description']
    },
    price: {
      type: Number,
      required: [true, 'Please provide package price'],
      min: [0, 'Price cannot be negative']
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide package start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide package end date'],
      validate: {
        validator: function (value) {
          return this.startDate <= value;
        },
        message: 'End date must be on or after the start date'
      }
    },
    capacity: {
      type: Number,
      default: 20,
      min: [1, 'Capacity must be at least 1']
    },
    availableSeats: {
      type: Number,
      default: function () {
        return this.capacity || 20;
      },
      min: [0, 'Available seats cannot be negative']
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80'
    },
    itinerary: [
      {
        day: { type: Number, required: true },
        activity: { type: String, required: true }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false
    }
  },
  {
    timestamps: true
  }
);

const TripPackage = mongoose.model('TripPackage', tripPackageSchema);
module.exports = TripPackage;
