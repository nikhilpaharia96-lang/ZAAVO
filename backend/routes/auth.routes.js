// ═══════════════════════════════════════════════════════════
// ZAAVO — Auth Routes
// ═══════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  register, login, verifyOTP, resendOTP, googleAuth,
  refreshToken, forgotPassword, resetPassword, logout, getMe
} = require('../controllers/auth.controller');

router.post('/register',           register);
router.post('/login',              login);
router.post('/google',             googleAuth);
router.post('/refresh-token',      refreshToken);
router.post('/forgot-password',    forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-otp',         protect, verifyOTP);
router.post('/resend-otp',         protect, resendOTP);
router.post('/logout',             protect, logout);
router.get('/me',                  protect, getMe);

module.exports = router;

// ═══════════════════════════════════════════════════════════
// Save above as routes/auth.routes.js
// Below are the other route files — save each separately
// ═══════════════════════════════════════════════════════════
