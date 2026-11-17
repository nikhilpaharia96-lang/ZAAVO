// ═══════════════════════════════════════════════════════════
// ZAAVO — Food Routes
// ═══════════════════════════════════════════════════════════
const express = require('express');
const { Food } = require('../models/Restaurant.model');
const { protect, authorize, optionalAuth, asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');

const foodRouter = express.Router();

// GET /api/foods — All foods (with filters)
foodRouter.get('/', asyncHandler(async (req, res) => {
  const { search, category, dietType, fitnessGoal, restaurant, sort = '-rating', page = 1, limit = 20, popular } = req.query;
  const query = { isAvailable: true };
  if (search)       query.$text       = { $search: search };
  if (category)     query.category    = category;
  if (dietType)     query.dietType    = dietType;
  if (fitnessGoal)  query.fitnessGoal = fitnessGoal;
  if (restaurant)   query.restaurant  = restaurant;
  if (popular)      query.isPopular   = true;

  const sortMap = { '-rating': { rating: -1 }, '-orders': { totalOrders: -1 }, 'price': { price: 1 }, '-price': { price: -1 } };

  const [foods, total] = await Promise.all([
    Food.find(query).populate('restaurant', 'name logo estimatedTime deliveryFee').sort(sortMap[sort] || { rating: -1 }).skip((page-1)*limit).limit(parseInt(limit)).lean(),
    Food.countDocuments(query),
  ]);

  return sendSuccess(res, { data: { foods, total, page: parseInt(page), pages: Math.ceil(total/limit) } });
}));

// GET /api/foods/categories — All categories
foodRouter.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Food.aggregate([
    { $match: { isAvailable: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return sendSuccess(res, { data: { categories } });
}));

// GET /api/foods/fitness — Fitness-specific meals
foodRouter.get('/fitness', asyncHandler(async (req, res) => {
  const { goal } = req.query;
  const query = { isAvailable: true, fitnessGoal: { $ne: 'none' } };
  if (goal) query.fitnessGoal = goal;
  const foods = await Food.find(query).populate('restaurant', 'name logo').sort({ rating: -1 }).lean();
  return sendSuccess(res, { data: { foods } });
}));

// GET /api/foods/:id
foodRouter.get('/:id', asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id).populate('restaurant', 'name logo cuisine estimatedTime deliveryFee freeDeliveryAbove');
  if (!food) return sendError(res, 'Food item not found', 404);
  return sendSuccess(res, { data: { food } });
}));

// POST /api/foods — Add food item (restaurant_owner)
foodRouter.post('/', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  const food = await Food.create(req.body);
  return sendSuccess(res, { data: { food } }, 'Food item added', 201);
}));

// PUT /api/foods/:id
foodRouter.put('/:id', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!food) return sendError(res, 'Food not found', 404);
  return sendSuccess(res, { data: { food } });
}));

// PATCH /api/foods/:id/availability
foodRouter.patch('/:id/availability', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, { isAvailable: req.body.isAvailable }, { new: true });
  return sendSuccess(res, { data: { food } });
}));

// DELETE /api/foods/:id
foodRouter.delete('/:id', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  await Food.findByIdAndDelete(req.params.id);
  return sendSuccess(res, {}, 'Food item deleted');
}));

module.exports = foodRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Order Routes (save as routes/order.routes.js)
// ═══════════════════════════════════════════════════════════
const orderRouter = express.Router();
const { placeOrder, getMyOrders, getOrder, updateOrderStatus, cancelOrder, getRestaurantOrders } = require('../controllers/order.controller');

orderRouter.post('/',                           protect, placeOrder);
orderRouter.get('/my',                          protect, getMyOrders);
orderRouter.get('/:id',                         protect, getOrder);
orderRouter.patch('/:id/status',                protect, authorize('restaurant_owner', 'delivery_partner', 'admin'), updateOrderStatus);
orderRouter.patch('/:id/cancel',                protect, cancelOrder);
orderRouter.get('/restaurant/:id',              protect, authorize('restaurant_owner', 'admin'), getRestaurantOrders);

module.exports = orderRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Payment Routes (save as routes/payment.routes.js)
// ═══════════════════════════════════════════════════════════
const paymentRouter = express.Router();
const { createPaymentOrder, verifyPayment, processRefund, getPaymentHistory, addToWallet } = require('../controllers/payment.controller');

paymentRouter.post('/create-order', protect, createPaymentOrder);
paymentRouter.post('/verify',       protect, verifyPayment);
paymentRouter.post('/refund',       protect, authorize('admin'), processRefund);
paymentRouter.get('/history',       protect, getPaymentHistory);
paymentRouter.post('/wallet/add',   protect, addToWallet);

module.exports = paymentRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Coupon Routes (save as routes/coupon.routes.js)
// ═══════════════════════════════════════════════════════════
const couponRouter = express.Router();
const { Coupon } = require('../models/Order.model');

// GET /api/coupons — List public coupons
couponRouter.get('/', asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } })
    .select('-usedBy').lean();
  return sendSuccess(res, { data: { coupons } });
}));

// POST /api/coupons/validate — Validate a coupon code
couponRouter.post('/validate', protect, asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });

  if (!coupon) return sendError(res, 'Invalid or expired coupon code');
  if (orderAmount < coupon.minOrderAmount) return sendError(res, `Minimum order ₹${coupon.minOrderAmount} required`);

  const alreadyUsed = coupon.usedBy.includes(req.user._id);
  if (alreadyUsed && coupon.maxUsagePerUser === 1) return sendError(res, 'Coupon already used');

  let discount = 0;
  if (coupon.type === 'percentage') discount = Math.min(Math.round(orderAmount * coupon.value / 100), coupon.maxDiscount || Infinity);
  else if (coupon.type === 'fixed') discount = coupon.value;
  else if (coupon.type === 'free_delivery') discount = 30;

  return sendSuccess(res, { data: { coupon: { code: coupon.code, type: coupon.type, value: coupon.value, discount } } }, `Coupon applied! You save ₹${discount}`);
}));

// POST /api/coupons — Create (admin)
couponRouter.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return sendSuccess(res, { data: { coupon } }, 'Coupon created', 201);
}));

module.exports = couponRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — User Routes (save as routes/user.routes.js)
// ═══════════════════════════════════════════════════════════
const userRouter = express.Router();
const User = require('../models/User.model');

// GET /api/users/profile
userRouter.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, { data: { user: user.toPublicJSON() } });
}));

// PUT /api/users/profile
userRouter.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'dietPreference', 'fitnessGoal', 'allergies', 'institution', 'hostelBlock', 'city', 'avatar'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  return sendSuccess(res, { data: { user: user.toPublicJSON() } }, 'Profile updated');
}));

// POST /api/users/addresses
userRouter.post('/addresses', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(req.body);
  await user.save();
  return sendSuccess(res, { data: { addresses: user.addresses } }, 'Address added', 201);
}));

// DELETE /api/users/addresses/:addressId
userRouter.delete('/addresses/:addressId', protect, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: { _id: req.params.addressId } } });
  return sendSuccess(res, {}, 'Address removed');
}));

// GET /api/users/wishlist
userRouter.get('/wishlist', protect, asyncHandler(async (req, res) => {
  // Wishlist stored in user doc
  const user = await User.findById(req.user._id).populate('wishlist');
  return sendSuccess(res, { data: { wishlist: user.wishlist || [] } });
}));

// POST /api/users/change-password
userRouter.post('/change-password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) return sendError(res, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return sendSuccess(res, {}, 'Password changed successfully');
}));

module.exports = userRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Review Routes (save as routes/review.routes.js)
// ═══════════════════════════════════════════════════════════
const reviewRouter = express.Router();
const { Review } = require('../models/Order.model');
const { Order }  = require('../models/Order.model');

reviewRouter.post('/', protect, asyncHandler(async (req, res) => {
  const { orderId, restaurantId, foodId, rating, comment, tags, type } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id, status: 'delivered' });
  if (!order) return sendError(res, 'Order not found or not delivered yet');

  const existing = await Review.findOne({ order: orderId, type });
  if (existing) return sendError(res, 'Already reviewed');

  const review = await Review.create({
    user: req.user._id,
    order: orderId,
    restaurant: restaurantId,
    food: foodId,
    rating, comment, tags, type,
  });

  // Update restaurant rating
  if (restaurantId) {
    const stats = await Review.aggregate([
      { $match: { restaurant: restaurantId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length) {
      const Restaurant = require('../models/Restaurant.model');
      await Restaurant.findByIdAndUpdate(restaurantId, { rating: stats[0].avg.toFixed(1), totalReviews: stats[0].count });
    }
  }

  order.isRated = true;
  await order.save();

  return sendSuccess(res, { data: { review } }, 'Review submitted! +50 loyalty points', 201);
}));

reviewRouter.get('/restaurant/:id', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ restaurant: req.params.id, type: 'restaurant' })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20);
  return sendSuccess(res, { data: { reviews } });
}));

module.exports = reviewRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Delivery Routes (save as routes/delivery.routes.js)
// ═══════════════════════════════════════════════════════════
const deliveryRouter = express.Router();
const { DeliveryPartner } = require('../models/Order.model');

deliveryRouter.get('/dashboard', protect, authorize('delivery_partner'), asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id }).populate('activeOrder');
  if (!partner) return sendError(res, 'Delivery partner profile not found', 404);

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const deliveries = await Order.find({ deliveryPartner: req.user._id, 'tracking.deliveredAt': { $gte: todayStart } }).lean();

  return sendSuccess(res, { data: { partner, todayDeliveries: deliveries.length, earnings: partner.todayEarnings } });
}));

deliveryRouter.post('/register', protect, asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.create({ user: req.user._id, ...req.body });
  return sendSuccess(res, { data: { partner } }, 'Delivery partner registered! Awaiting verification.', 201);
}));

module.exports = deliveryRouter;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Admin Routes (save as routes/admin.routes.js)
// ═══════════════════════════════════════════════════════════
const adminRouter = express.Router();
const Restaurant = require('../models/Restaurant.model');
const { Notification } = require('../models/Order.model');

// All admin routes require admin role
adminRouter.use(protect, authorize('admin'));

// GET /api/admin/dashboard — Platform stats
adminRouter.get('/dashboard', asyncHandler(async (req, res) => {
  const [users, restaurants, orders, revenue] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
  ]);

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayOrders   = await Order.countDocuments({ createdAt: { $gte: todayStart } });
  const activeRestaurants = await Restaurant.countDocuments({ isActive: true, isOpen: true });

  return sendSuccess(res, {
    data: {
      stats: {
        totalUsers: users,
        totalRestaurants: restaurants,
        totalOrders: orders,
        totalRevenue: revenue[0]?.total || 0,
        todayOrders,
        activeRestaurants,
      },
    },
  });
}));

// GET /api/admin/users
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (role)   query.role = role;
  if (search) query.$or  = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit)).lean(),
    User.countDocuments(query),
  ]);
  return sendSuccess(res, { data: { users, total } });
}));

// PATCH /api/admin/restaurants/:id/approve
adminRouter.patch('/restaurants/:id/approve', asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { isVerified: true, isActive: true },
    { new: true }
  );
  if (!restaurant) return sendError(res, 'Restaurant not found', 404);
  return sendSuccess(res, { data: { restaurant } }, 'Restaurant approved!');
}));

// GET /api/admin/orders — All platform orders
adminRouter.get('/orders', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const query = {};
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .populate('restaurant', 'name')
    .sort({ createdAt: -1 })
    .skip((page-1)*limit)
    .limit(parseInt(limit))
    .lean();

  return sendSuccess(res, { data: { orders } });
}));

// GET /api/admin/analytics/revenue
adminRouter.get('/analytics/revenue', asyncHandler(async (req, res) => {
  const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const revenue = await Order.aggregate([
    { $match: { createdAt: { $gte: last30days }, 'payment.status': 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue:  { $sum: '$pricing.total' },
        orders:   { $sum: 1 },
        avgOrder: { $avg: '$pricing.total' },
      }
    },
    { $sort: { _id: 1 } },
  ]);

  const topRestaurants = await Order.aggregate([
    { $match: { 'payment.status': 'paid' } },
    { $group: { _id: '$restaurant', orders: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
    { $unwind: '$restaurant' },
    { $project: { name: '$restaurant.name', orders: 1, revenue: 1 } },
  ]);

  return sendSuccess(res, { data: { revenue, topRestaurants } });
}));

// POST /api/admin/broadcast — Push notification to all users
adminRouter.post('/broadcast', asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { title, body, type = 'promo' } = req.body;

  io.emit('notification:broadcast', { title, body, type, timestamp: new Date() });

  // Save to all users (batch)
  const users = await User.find({}, '_id').lean();
  const notifications = users.map(u => ({ user: u._id, title, body, type }));
  await Notification.insertMany(notifications, { ordered: false });

  return sendSuccess(res, {}, `Broadcast sent to ${users.length} users`);
}));

// All remaining route modules needed by server.js
module.exports = {
  foodRoutes:          foodRouter,
  orderRoutes:         orderRouter,
  paymentRoutes:       paymentRouter,
  couponRoutes:        couponRouter,
  userRoutes:          userRouter,
  reviewRoutes:        reviewRouter,
  deliveryRoutes:      deliveryRouter,
  adminRoutes:         adminRouter,
};
