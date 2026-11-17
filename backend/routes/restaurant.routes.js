// ═══════════════════════════════════════════════════════════
// ZAAVO — Restaurant Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');
const Restaurant = require('../models/Restaurant.model');
const { Food }   = require('../models/Restaurant.model');

// GET /api/restaurants — List all (with filters)
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search, cuisine, city, sort = '-rating', page = 1, limit = 20, lat, lng, radius = 10 } = req.query;

  const query = { isActive: true, isVerified: true };

  if (search) query.$text = { $search: search };
  if (cuisine) query.cuisine = { $in: cuisine.split(',') };
  if (city) query['address.city'] = new RegExp(city, 'i');

  let sortObj = {};
  if (sort === '-rating')    sortObj = { rating: -1 };
  if (sort === 'deliveryFee') sortObj = { deliveryFee: 1 };
  if (sort === 'time')        sortObj = { estimatedTime: 1 };
  if (sort === '-orders')     sortObj = { totalOrders: -1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(query).sort(sortObj).skip((page-1)*limit).limit(parseInt(limit)).select('-bankDetails').lean(),
    Restaurant.countDocuments(query),
  ]);

  return sendSuccess(res, { data: { restaurants, total, page: parseInt(page), pages: Math.ceil(total/limit) } });
}));

// GET /api/restaurants/featured
router.get('/featured', asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find({ isActive: true, isVerified: true, isFeatured: true })
    .sort({ rating: -1 }).limit(6).select('-bankDetails').lean();
  return sendSuccess(res, { data: { restaurants } });
}));

// GET /api/restaurants/nearby  (geo-query)
router.get('/nearby', asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  if (!lat || !lng) return sendError(res, 'lat and lng required');

  const restaurants = await Restaurant.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
    isActive: true, isVerified: true,
  }).limit(20).lean();

  return sendSuccess(res, { data: { restaurants } });
}));

// GET /api/restaurants/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name phone').lean();
  if (!restaurant) return sendError(res, 'Restaurant not found', 404);
  return sendSuccess(res, { data: { restaurant } });
}));

// GET /api/restaurants/:id/menu
router.get('/:id/menu', asyncHandler(async (req, res) => {
  const { category, dietType, fitnessGoal } = req.query;
  const query = { restaurant: req.params.id, isAvailable: true };
  if (category)    query.category    = category;
  if (dietType)    query.dietType    = dietType;
  if (fitnessGoal) query.fitnessGoal = fitnessGoal;

  const foods = await Food.find(query).sort({ isPopular: -1, rating: -1 }).lean();

  // Group by category
  const grouped = foods.reduce((acc, food) => {
    if (!acc[food.category]) acc[food.category] = [];
    acc[food.category].push(food);
    return acc;
  }, {});

  return sendSuccess(res, { data: { foods, grouped } });
}));

// POST /api/restaurants — Create (restaurant_owner)
router.post('/', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create({ ...req.body, owner: req.user._id });
  return sendSuccess(res, { data: { restaurant } }, 'Restaurant created! Pending admin approval.', 201);
}));

// PUT /api/restaurants/:id — Update
router.put('/:id', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!restaurant) return sendError(res, 'Restaurant not found or unauthorized', 404);
  return sendSuccess(res, { data: { restaurant } });
}));

// PATCH /api/restaurants/:id/toggle — Toggle open/close
router.patch('/:id/toggle', protect, authorize('restaurant_owner', 'admin'), asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return sendError(res, 'Restaurant not found', 404);
  restaurant.isOpen = !restaurant.isOpen;
  await restaurant.save();
  return sendSuccess(res, { data: { isOpen: restaurant.isOpen } }, `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`);
}));

module.exports = router;


// ═══════════════════════════════════════════════════════════
// ZAAVO — Food Routes (save as routes/food.routes.js)
// ═══════════════════════════════════════════════════════════
