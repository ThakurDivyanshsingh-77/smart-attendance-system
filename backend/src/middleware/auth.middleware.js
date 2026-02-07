const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// 1. Protect: Token verify karne ke liye
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Bearer token se token nikalna
    token = req.headers.authorization.split(' ')[1];
  }

  // Agar token nahi hai
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User ko request object mein store karna
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// 2. Authorize: Role check karne ke liye (Teacher/Admin)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
         return res.status(401).json({ success: false, message: 'User not found in request' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};