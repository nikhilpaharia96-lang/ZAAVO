// ═══════════════════════════════════════════════════════════
// ZAAVO — Auth Controller
// Handles: Register, Login, OTP, Google, Refresh, Logout
// ═══════════════════════════════════════════════════════════

const User = require('../models/User.model');
const { asyncHandler, sendSuccess, sendError, AppError } = require('../middleware/auth.middleware');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// ─── Email Transporter ───────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOTPEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from:    `"ZAAVO 🍔" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Your ZAAVO Verification Code',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0A0A0A;color:#fff;padding:32px;border-radius:16px">
        <h2 style="color:#FF5722">ZAAVO 🍔</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#FF5722;text-align:center;padding:20px 0">${otp}</div>
        <p style="color:#888">This code expires in 10 minutes. Do not share it with anyone.</p>
        <hr style="border-color:#222;margin:20px 0">
        <p style="color:#666;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

// ─── @POST /api/auth/register ─────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, userType, institution, hostelBlock, city } = req.body;

  // Check duplicates
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Phone';
    return sendError(res, `${field} already registered`, 400);
  }

  const user = await User.create({ name, email, phone, password, userType, institution, hostelBlock, city });

  // Generate & send OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  try {
    await sendOTPEmail(email, name, otp);
  } catch (e) {
    console.error('Email error:', e.message);
  }

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken  = refreshToken;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    data: { user: user.toPublicJSON(), accessToken, refreshToken },
  }, 'Registration successful. Please verify your email.', 201);
});

// ─── @POST /api/auth/login ────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return sendError(res, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  if (!user) return sendError(res, 'Invalid credentials', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return sendError(res, 'Invalid credentials', 401);

  if (!user.isActive) return sendError(res, 'Account deactivated. Contact support.', 403);

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken  = refreshToken;
  user.lastActive    = new Date();
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    data: { user: user.toPublicJSON(), accessToken, refreshToken },
  }, 'Login successful');
});

// ─── @POST /api/auth/verify-otp ──────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id).select('+otp +otpExpire');

  if (!user.otp || user.otp !== otp) return sendError(res, 'Invalid OTP', 400);
  if (user.otpExpire < Date.now())   return sendError(res, 'OTP expired. Request a new one.', 400);

  user.isVerified = true;
  user.otp        = undefined;
  user.otpExpire  = undefined;

  // Reward first-time verification
  user.walletBalance  += 50;
  user.loyaltyPoints  += 100;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { data: { user: user.toPublicJSON() } }, 'Phone/Email verified! ₹50 added to wallet.');
});

// ─── @POST /api/auth/resend-otp ──────────────────────────────
const resendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+otp +otpExpire');
  const otp  = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  try {
    await sendOTPEmail(user.email, user.name, otp);
  } catch (e) {
    return sendError(res, 'Failed to send OTP. Try again.', 500);
  }

  return sendSuccess(res, {}, 'OTP sent successfully');
});

// ─── @POST /api/auth/google ───────────────────────────────────
const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, email, name, avatar } = req.body;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({ name, email, googleId, avatar, isVerified: true, walletBalance: 50 });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.isVerified = true;
    await user.save();
  }

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken  = refreshToken;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { data: { user: user.toPublicJSON(), accessToken, refreshToken } }, 'Google login successful');
});

// ─── @POST /api/auth/refresh-token ───────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return sendError(res, 'Refresh token required', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) return sendError(res, 'Invalid refresh token', 401);

    const newAccessToken  = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    user.refreshToken     = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch {
    return sendError(res, 'Refresh token expired. Please login again.', 401);
  }
});

// ─── @POST /api/auth/forgot-password ────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user) return sendError(res, 'No account with that email exists', 404);

  const resetToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  user.passwordResetToken  = resetToken;
  user.passwordResetExpire = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await transporter.sendMail({
      from:    `"ZAAVO 🍔" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: 'ZAAVO Password Reset',
      html: `<p>Click to reset: <a href="${resetUrl}" style="color:#FF5722">${resetUrl}</a></p><p>Expires in 30 minutes.</p>`,
    });
    return sendSuccess(res, {}, 'Password reset link sent to your email');
  } catch {
    user.passwordResetToken  = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return sendError(res, 'Failed to send email. Try again.', 500);
  }
});

// ─── @POST /api/auth/reset-password/:token ───────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetToken:  req.params.token,
    passwordResetExpire: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpire');

  if (!user) return sendError(res, 'Invalid or expired reset token', 400);

  user.password            = req.body.password;
  user.passwordResetToken  = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  const accessToken = user.generateAccessToken();
  return sendSuccess(res, { data: { accessToken } }, 'Password reset successful');
});

// ─── @POST /api/auth/logout ───────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  return sendSuccess(res, {}, 'Logged out successfully');
});

// ─── @GET /api/auth/me ────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, { data: { user: user.toPublicJSON() } });
});

module.exports = { register, login, verifyOTP, resendOTP, googleAuth, refreshToken, forgotPassword, resetPassword, logout, getMe };
