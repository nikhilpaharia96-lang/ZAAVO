// ═══════════════════════════════════════════════════════════
// ZAAVO — User Model
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const addressSchema = new mongoose.Schema({
  label:      { type: String, enum: ['Home', 'College', 'Gym', 'Hostel', 'Other'], default: 'Home' },
  line1:      { type: String, required: true },
  line2:      String,
  city:       { type: String, required: true },
  state:      String,
  pincode:    String,
  landmark:   String,
  isDefault:  { type: Boolean, default: false },
  coordinates: {
    lat: Number,
    lng: Number,
  },
}, { _id: true });

const userSchema = new mongoose.Schema({
  // ── Identity ──
  name:       { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
  email:      { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
                match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Invalid email'] },
  phone:      { type: String, sparse: true, unique: true,
                match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'] },
  password:   { type: String, minlength: 6, select: false },
  avatar:     { type: String, default: '' },

  // ── Role ──
  role:       { type: String, enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'], default: 'customer' },
  userType:   { type: String, enum: ['student', 'gym_goer', 'faculty', 'hostelite', 'other'], default: 'student' },

  // ── Campus Info ──
  institution:  String,
  hostelBlock:  String,
  roomNumber:   String,
  city:         String,

  // ── Auth ──
  googleId:          String,
  isVerified:        { type: Boolean, default: false },
  isActive:          { type: Boolean, default: true },
  otp:               { type: String, select: false },
  otpExpire:         { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpire: { type: Date, select: false },
  refreshToken:      { type: String, select: false },

  // ── Preferences ──
  dietPreference:    { type: String, enum: ['veg', 'non-veg', 'vegan', 'eggetarian'], default: 'non-veg' },
  fitnessGoal:       { type: String, enum: ['bulking', 'cutting', 'weight_loss', 'maintenance', 'none'], default: 'none' },
  allergies:         [String],

  // ── Wallet & Points ──
  walletBalance:     { type: Number, default: 0, min: 0 },
  loyaltyPoints:     { type: Number, default: 0, min: 0 },
  referralCode:      { type: String, unique: true, sparse: true },
  referredBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Addresses ──
  addresses:         [addressSchema],

  // ── Subscription ──
  subscription: {
    plan:        { type: String, enum: ['none', 'basic', 'pro_athlete', 'elite'], default: 'none' },
    mealsLeft:   { type: Number, default: 0 },
    renewsAt:    Date,
    isActive:    { type: Boolean, default: false },
  },

  // ── FCM for push notifications ──
  fcmTokens:   [String],

  // ── Metadata ──
  lastActive:  { type: Date, default: Date.now },
  totalOrders: { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Indexes ─────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtual ─────────────────────────────────────────────────
userSchema.virtual('initials').get(function() {
  return this.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
});

// ─── Pre-save: Hash password ─────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Pre-save: Generate referral code ────────────────────────
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = `ZAV-${this.name.slice(0,3).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  }
  next();
});

// ─── Methods ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpire = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000);
  return otp;
};

userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    userType: this.userType,
    institution: this.institution,
    hostelBlock: this.hostelBlock,
    city: this.city,
    isVerified: this.isVerified,
    dietPreference: this.dietPreference,
    fitnessGoal: this.fitnessGoal,
    walletBalance: this.walletBalance,
    loyaltyPoints: this.loyaltyPoints,
    referralCode: this.referralCode,
    subscription: this.subscription,
    addresses: this.addresses,
    totalOrders: this.totalOrders,
    totalSpent: this.totalSpent,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
