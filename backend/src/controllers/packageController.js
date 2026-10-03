const TripPackage = require('../models/TripPackage');
const Customer = require('../models/Customer');
const { samplePackages } = require('../utils/sampleData');

// Helper to ensure demo users and packages exist in the database
const ensureSeededData = async () => {
  if (mongoose.connection.readyState < 1) return;
  try {
    const count = await TripPackage.countDocuments();
    if (count === 0) {
      console.log('Database empty: auto-seeding demo users and packages...');
      let agent = await Customer.findOne({ email: 'agent@travel.com' });
      if (!agent) {
        agent = await Customer.create({
          name: 'Sarah Connor (Senior Agent)',
          email: 'agent@travel.com',
          password: 'password123',
          role: 'agent',
          phone: '+1 555-0199',
          address: '742 Evergreen Terrace, Travel City'
        });
      }

      let customer = await Customer.findOne({ email: 'customer@gmail.com' });
      if (!customer) {
        await Customer.create({
          name: 'Alex Johnson',
          email: 'customer@gmail.com',
          password: 'password123',
          role: 'customer',
          phone: '+1 555-0144',
          address: '100 Broadway St, New York, NY'
        });
      }

      const packagesWithCreator = samplePackages.map(pkg => ({
        ...pkg,
        createdBy: agent._id
      }));
      await TripPackage.insertMany(packagesWithCreator);
      console.log('Auto-seed completed successfully!');
    }
  } catch (err) {
    console.warn('Auto-seed note:', err.message);
  }
};

// @desc    Get all trip packages (with optional search, destination filter, date filter)
// @route   GET /api/packages
// @access  Public
const getPackages = async (req, res) => {
  try {
    const { destination, search, minPrice, maxPrice, upcoming } = req.query;
    let query = {};

    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    let packages = [];
    if (mongoose.connection.readyState >= 1) {
      await ensureSeededData();
      packages = await TripPackage.find(query)
        .populate('createdBy', 'name email role')
        .sort({ startDate: 1 });
    }

    // Only fallback to samplePackages if DB returned nothing and no query filter is active
    if ((!packages || packages.length === 0) && Object.keys(query).length === 0) {
      packages = samplePackages.map((pkg, idx) => ({
        ...pkg,
        _id: `pkg-demo-${idx + 1}`
      }));
    }

    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error.message);
    const fallback = samplePackages.map((pkg, idx) => ({
      ...pkg,
      _id: `pkg-demo-${idx + 1}`
    }));
    res.json({
      success: true,
      count: fallback.length,
      data: fallback
    });
  }
};

// @desc    Get single trip package by ID
// @route   GET /api/packages/:id
// @access  Public
const getPackageById = async (req, res) => {
  try {
    let tripPackage = null;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && !req.params.id.startsWith('pkg-demo-');

    if (isObjectId && mongoose.connection.readyState >= 1) {
      tripPackage = await TripPackage.findById(req.params.id)
        .populate('createdBy', 'name email role');
    }

    if (!tripPackage) {
      const idx = parseInt(req.params.id.replace('pkg-demo-', ''), 10) - 1;
      if (!isNaN(idx) && samplePackages[idx]) {
        if (mongoose.connection.readyState >= 1) {
          tripPackage = await TripPackage.findOne({ title: samplePackages[idx].title })
            .populate('createdBy', 'name email role');
        }
        if (!tripPackage) {
          tripPackage = {
            ...samplePackages[idx],
            _id: req.params.id
          };
        }
      }
    }

    if (!tripPackage) {
      return res.status(404).json({
        success: false,
        message: 'Trip package not found'
      });
    }

    res.json({
      success: true,
      data: tripPackage
    });
  } catch (error) {
    const idx = parseInt(req.params.id.replace('pkg-demo-', ''), 10) - 1;
    if (!isNaN(idx) && samplePackages[idx]) {
      return res.json({
        success: true,
        data: { ...samplePackages[idx], _id: req.params.id }
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching package details'
    });
  }
};

// @desc    Create new trip package
// @route   POST /api/packages
// @access  Private (Agent only)
const createPackage = async (req, res) => {
  try {
    const {
      title,
      destination,
      description,
      price,
      startDate,
      endDate,
      capacity,
      imageUrl,
      itinerary
    } = req.body;

    if (!title || !destination || !description || !price || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, destination, description, price, startDate, endDate'
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be on or after start date'
      });
    }

    const tripPackage = await TripPackage.create({
      title,
      destination,
      description,
      price: Number(price),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity: capacity ? Number(capacity) : 20,
      availableSeats: capacity ? Number(capacity) : 20,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80',
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Trip package created successfully',
      data: tripPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating trip package'
    });
  }
};

// @desc    Update trip package
// @route   PUT /api/packages/:id
// @access  Private (Agent only)
const updatePackage = async (req, res) => {
  try {
    let tripPackage = await TripPackage.findById(req.params.id);

    if (!tripPackage) {
      return res.status(404).json({
        success: false,
        message: 'Trip package not found'
      });
    }

    const { startDate, endDate } = req.body;
    const finalStartDate = startDate ? new Date(startDate) : tripPackage.startDate;
    const finalEndDate = endDate ? new Date(endDate) : tripPackage.endDate;

    if (finalStartDate > finalEndDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date'
      });
    }

    tripPackage = await TripPackage.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Trip package updated successfully',
      data: tripPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating trip package'
    });
  }
};

// @desc    Delete trip package
// @route   DELETE /api/packages/:id
// @access  Private (Agent only)
const deletePackage = async (req, res) => {
  try {
    const tripPackage = await TripPackage.findById(req.params.id);

    if (!tripPackage) {
      return res.status(404).json({
        success: false,
        message: 'Trip package not found'
      });
    }

    await TripPackage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Trip package deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting trip package'
    });
  }
};

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
};
