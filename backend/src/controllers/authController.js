const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_travel_booking_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new Customer or Agent
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const userExists = await Customer.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Create user
    const customer = await Customer.create({
      name,
      email,
      password,
      role: role === 'agent' ? 'agent' : 'customer',
      phone: phone || '',
      address: address || ''
    });

    const token = generateToken(customer._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const customer = await Customer.findOne({ email }).select('+password');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(customer._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
