const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_travel_booking_key_2026');
    let customer = null;

    if (mongoose.connection.readyState >= 1 && !String(decoded.id).startsWith('demo-')) {
      try {
        customer = await Customer.findById(decoded.id).select('-password');
      } catch (err) {
        // Fall back to decoded payload
      }
    }

    if (!customer) {
      customer = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.role === 'agent' ? 'Sarah Connor (Senior Agent)' : 'Alex Johnson',
        email: decoded.email || (decoded.role === 'agent' ? 'agent@travel.com' : 'customer@gmail.com'),
        role: decoded.role || 'customer',
        phone: '+1 555-0144',
        address: '742 Evergreen Terrace, Travel City'
      };
    }

    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

// Restrict to specific roles (e.g. 'agent' or 'customer')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource. Required role: [${roles.join(', ')}]`
      });
    }
    next();
  }
};

module.exports = {
  protect,
  authorize
};
