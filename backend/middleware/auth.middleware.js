// ═══════════════════════════════════════════════════════════
// ZAAVO — Auth Middleware
// ═══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// ─── Protect Route (JWT Required) ────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp -otpExpire');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── Role-based Access Control ───────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

// ─── Optional Auth (attach user if token present) ────────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -otp');
    }
  } catch (_) {}
  next();
};

// ─── Verified User Only ──────────────────────────────────────
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your phone/email first.' });
  }
  next();
};

module.exports = { protect, authorize, optionalAuth, requireVerified };


// ════════════════════════════════════════════════════════════
// ZAAVO — Error Handler Utility
// ════════════════════════════════════════════════════════════

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const sendError = (res, message = 'Error', statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = {
  protect, authorize, optionalAuth, requireVerified,
  AppError, asyncHandler, sendSuccess, sendError,
};
