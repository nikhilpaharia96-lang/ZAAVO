// ═══════════════════════════════════════════════════════════
// ZAAVO — Order Model
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  food:         { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  name:         String,
  image:        String,
  price:        Number,
  quantity:     { type: Number, required: true, min: 1 },
  addOns:       [{ name: String, price: Number }],
  variation:    String,
  totalPrice:   Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // ── References ──
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Order ID ──
  orderId: { type: String, unique: true }, // ZAV-XXXXX

  // ── Items ──
  items:       [orderItemSchema],

  // ── Pricing ──
  pricing: {
    subtotal:       { type: Number, required: true },
    deliveryFee:    { type: Number, default: 0 },
    tax:            { type: Number, default: 0 },
    discount:       { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    walletUsed:     { type: Number, default: 0 },
    total:          { type: Number, required: true },
  },

  // ── Delivery Address ──
  deliveryAddress: {
    label:      String,
    line1:      String,
    line2:      String,
    city:       String,
    pincode:    String,
    landmark:   String,
    coordinates: { lat: Number, lng: Number },
  },

  // ── Coupon ──
  coupon:      { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponCode:  String,

  // ── Payment ──
  payment: {
    method:        { type: String, enum: ['upi', 'card', 'cod', 'wallet', 'razorpay'], required: true },
    status:        { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: String,
    razorpayOrderId: String,
    paidAt:        Date,
  },

  // ── Status Tracking ──
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'placed',
  },

  statusHistory: [{
    status:    String,
    timestamp: { type: Date, default: Date.now },
    note:      String,
  }],

  // ── Delivery Tracking ──
  tracking: {
    estimatedDelivery: Date,
    pickedUpAt:        Date,
    deliveredAt:       Date,
    distance:          Number,
    duration:          Number,
    partnerLocation:   { lat: Number, lng: Number },
  },

  // ── Notes ──
  specialInstructions: String,
  isSubscriptionOrder: { type: Boolean, default: false },
  subscriptionId:      String,

  // ── Ratings ──
  isRated:         { type: Boolean, default: false },
  deliveryRating:  Number,
  foodRating:      Number,

}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ deliveryPartner: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderId: 1 });

// Auto-generate orderId
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ZAV-${String(count + 8001).padStart(5, '0')}`;
  }

  // Calculate item totals
  this.items = this.items.map(item => ({
    ...item,
    totalPrice: item.price * item.quantity + (item.addOns || []).reduce((s, a) => s + a.price, 0),
  }));
  next();
});

const Order = mongoose.model('Order', orderSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — Payment Model
// ═══════════════════════════════════════════════════════════

const paymentSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:            { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount:           { type: Number, required: true },
  currency:         { type: String, default: 'INR' },
  method:           { type: String, enum: ['upi', 'card', 'cod', 'wallet', 'razorpay'] },
  status:           { type: String, enum: ['created', 'attempted', 'paid', 'failed', 'refunded'], default: 'created' },
  razorpayOrderId:  String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  refundId:         String,
  refundAmount:     Number,
  refundReason:     String,
  refundedAt:       Date,
  metadata:         mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentSchema.index({ user: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — Coupon Model
// ═══════════════════════════════════════════════════════════

const couponSchema = new mongoose.Schema({
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:     String,
  type:            { type: String, enum: ['percentage', 'fixed', 'free_delivery', 'buy_x_get_y'], required: true },
  value:           { type: Number, required: true },
  maxDiscount:     Number,
  minOrderAmount:  { type: Number, default: 0 },
  maxUsage:        { type: Number, default: -1 }, // -1 = unlimited
  usedCount:       { type: Number, default: 0 },
  maxUsagePerUser: { type: Number, default: 1 },
  usedBy:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applicableTo:    { type: String, enum: ['all', 'restaurant', 'category', 'first_order', 'subscription'], default: 'all' },
  restaurant:      { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  category:        String,
  isActive:        { type: Boolean, default: true },
  expiresAt:       Date,
  startsAt:        { type: Date, default: Date.now },
  targetUserType:  [String], // e.g. ['student', 'gym_goer']
  image:           String,
  icon:            String,
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — Review Model
// ═══════════════════════════════════════════════════════════

const reviewSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  food:        { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  title:       String,
  comment:     { type: String, maxlength: 1000 },
  images:      [String],
  tags:        [String], // e.g. "Tasty", "Hot delivery", "Poor packaging"
  type:        { type: String, enum: ['food', 'restaurant', 'delivery'], required: true },
  isVerified:  { type: Boolean, default: true }, // verified order
  helpfulVotes: { type: Number, default: 0 },
  isHidden:    { type: Boolean, default: false },
  ownerReply:  { reply: String, repliedAt: Date },
}, { timestamps: true });

reviewSchema.index({ restaurant: 1, rating: -1 });
reviewSchema.index({ food: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ order: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — Notification Model
// ═══════════════════════════════════════════════════════════

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  type:    { type: String, enum: ['order', 'promo', 'system', 'delivery', 'payment', 'subscription'], default: 'system' },
  data:    mongoose.Schema.Types.Mixed,
  image:   String,
  isRead:  { type: Boolean, default: false },
  readAt:  Date,
  isSent:  { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — DeliveryPartner Model
// ═══════════════════════════════════════════════════════════

const deliveryPartnerSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType:    { type: String, enum: ['bicycle', 'motorcycle', 'scooter', 'car'], default: 'motorcycle' },
  vehicleNumber:  String,
  licenseNumber:  String,
  aadhaarNumber:  { type: String, select: false },
  isOnline:       { type: Boolean, default: false },
  isVerified:     { type: Boolean, default: false },
  currentLocation: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  activeOrder:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating:         { type: Number, default: 5, min: 0, max: 5 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings:  { type: Number, default: 0 },
  todayEarnings:  { type: Number, default: 0 },
  weekEarnings:   { type: Number, default: 0 },
  bankDetails: {
    accountNumber: { type: String, select: false },
    ifscCode:      { type: String, select: false },
    upiId:         String,
  },
}, { timestamps: true });

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ isOnline: 1 });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — Subscription Model
// ═══════════════════════════════════════════════════════════

const subscriptionSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan:           { type: String, enum: ['basic', 'pro_athlete', 'elite'], required: true },
  status:         { type: String, enum: ['active', 'paused', 'cancelled', 'expired'], default: 'active' },
  startDate:      { type: Date, default: Date.now },
  endDate:        Date,
  renewsAt:       Date,
  mealsTotal:     Number,
  mealsUsed:      { type: Number, default: 0 },
  mealsLeft:      Number,
  pricePerMonth:  Number,
  paymentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  autoRenew:      { type: Boolean, default: true },
  preferences: {
    dietType:    String,
    fitnessGoal: String,
    allergies:   [String],
  },
}, { timestamps: true });

subscriptionSchema.index({ user: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Order, Payment, Coupon, Review, Notification, DeliveryPartner, Subscription };
