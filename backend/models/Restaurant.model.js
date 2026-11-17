// ═══════════════════════════════════════════════════════════
// ZAAVO — Restaurant Model
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const timingSchema = new mongoose.Schema({
  day:    { type: String, required: true },
  open:   String,
  close:  String,
  isOpen: { type: Boolean, default: true },
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  // ── Identity ──
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: [true, 'Restaurant name required'], trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  cuisine:     [{ type: String, trim: true }],
  images:      [String],
  logo:        String,
  coverImage:  String,

  // ── Location ──
  address: {
    line1:     String,
    city:      { type: String, required: true },
    pincode:   String,
    state:     String,
    landmark:  String,
  },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },

  // ── Contact ──
  phone:      String,
  email:      String,
  whatsapp:   String,

  // ── Business ──
  fssaiNumber:   String,
  gstNumber:     String,
  bankDetails: {
    accountNumber: { type: String, select: false },
    ifscCode:      { type: String, select: false },
    bankName:      String,
    accountName:   String,
  },

  // ── Ratings ──
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalOrders:  { type: Number, default: 0 },

  // ── Delivery ──
  minOrderAmount:    { type: Number, default: 0 },
  deliveryFee:       { type: Number, default: 30 },
  freeDeliveryAbove: { type: Number, default: 199 },
  estimatedTime:     { type: String, default: '20-30 min' },
  deliveryRadius:    { type: Number, default: 5 }, // km

  // ── Tags & Categories ──
  tags:    [String],   // e.g. "Budget Friendly", "High Protein"
  badges:  [String],   // e.g. "Top Rated", "New"

  // ── Status ──
  isOpen:     { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  // ── Timings ──
  timings:    [timingSchema],

  // ── Offers ──
  activeOffer: String,

  // ── Revenue ──
  totalRevenue:   { type: Number, default: 0 },
  commissionRate: { type: Number, default: 15 }, // % ZAAVO takes

}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ isActive: 1, isVerified: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);


// ═══════════════════════════════════════════════════════════
// ZAAVO — Food Model
// ═══════════════════════════════════════════════════════════

const foodSchema = new mongoose.Schema({
  // ── Identity ──
  restaurant:   { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name:         { type: String, required: [true, 'Food name required'], trim: true },
  description:  { type: String, maxlength: 500 },
  images:       [String],

  // ── Pricing ──
  price:         { type: Number, required: true, min: 0 },
  originalPrice: Number,
  discount:      { type: Number, default: 0, min: 0, max: 100 }, // percent

  // ── Classification ──
  category:  { type: String, required: true }, // e.g. "High Protein", "Budget Meal"
  dietType:  { type: String, enum: ['veg', 'non-veg', 'vegan', 'eggetarian'], required: true },
  tags:      [String], // e.g. "Keto", "Post Workout", "Late Night"
  fitnessGoal: { type: String, enum: ['bulking', 'cutting', 'weight_loss', 'high_protein', 'keto', 'vegan', 'none'], default: 'none' },

  // ── Nutrition (per serving) ──
  nutrition: {
    calories: { type: Number, default: 0 },
    protein:  { type: Number, default: 0 },  // grams
    carbs:    { type: Number, default: 0 },  // grams
    fat:      { type: Number, default: 0 },  // grams
    fiber:    { type: Number, default: 0 },
    sugar:    { type: Number, default: 0 },
    sodium:   { type: Number, default: 0 },  // mg
  },

  servingSize:  String, // e.g. "350g" or "1 bowl"
  servings:     { type: Number, default: 1 },
  allergens:    [String],

  // ── Customization Options ──
  addOns: [{
    name:  String,
    price: Number,
  }],
  variations: [{
    name:   String,  // e.g. "Size"
    options: [{ label: String, extraPrice: Number }],
  }],

  // ── Stats ──
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalOrders:  { type: Number, default: 0 },
  isPopular:    { type: Boolean, default: false },

  // ── Status ──
  isAvailable:  { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },
  prepTime:     { type: Number, default: 15 }, // minutes

}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

foodSchema.index({ restaurant: 1 });
foodSchema.index({ category: 1 });
foodSchema.index({ dietType: 1 });
foodSchema.index({ fitnessGoal: 1 });
foodSchema.index({ isAvailable: 1 });
foodSchema.index({ name: 'text', description: 'text', tags: 'text' });

foodSchema.virtual('discountedPrice').get(function() {
  if (!this.discount) return this.price;
  return Math.round(this.price * (1 - this.discount / 100));
});

const Food = mongoose.model('Food', foodSchema);

module.exports = { Food };
