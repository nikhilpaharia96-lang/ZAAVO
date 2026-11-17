// ═══════════════════════════════════════════════════════════
// ZAAVO — Subscription Routes
// save as: backend/routes/subscription.routes.js
// ═══════════════════════════════════════════════════════════

const express  = require('express');
const router   = express.Router();
const { protect, authorize, asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');
const { Subscription, Payment } = require('../models/Order.model');
const User = require('../models/User.model');
const Razorpay = require('razorpay');

const PLANS = {
  basic:       { name: 'Basic',       price: 999,  meals: 15, discount: 10 },
  pro_athlete: { name: 'Pro Athlete', price: 1999, meals: 30, discount: 20 },
  elite:       { name: 'Elite',       price: 3499, meals: 60, discount: 30 },
};

// ── GET /api/subscriptions/plans ─────────────────────────────
router.get('/plans', (req, res) => {
  return sendSuccess(res, { data: { plans: PLANS } });
});

// ── GET /api/subscriptions/my ─────────────────────────────────
router.get('/my', protect, asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user:   req.user._id,
    status: { $in: ['active', 'paused'] },
  }).sort({ createdAt: -1 });

  return sendSuccess(res, { data: { subscription } });
}));

// ── POST /api/subscriptions/subscribe ────────────────────────
router.post('/subscribe', protect, asyncHandler(async (req, res) => {
  const { plan, paymentId } = req.body;

  if (!PLANS[plan]) return sendError(res, 'Invalid subscription plan', 400);

  // Cancel existing active subscription
  await Subscription.updateMany(
    { user: req.user._id, status: 'active' },
    { status: 'cancelled' }
  );

  const planData = PLANS[plan];
  const endDate  = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const subscription = await Subscription.create({
    user:           req.user._id,
    plan,
    status:         'active',
    startDate:      new Date(),
    endDate,
    renewsAt:       endDate,
    mealsTotal:     planData.meals,
    mealsUsed:      0,
    mealsLeft:      planData.meals,
    pricePerMonth:  planData.price,
    paymentId,
    autoRenew:      true,
    preferences: {
      dietType:    req.user.dietPreference,
      fitnessGoal: req.user.fitnessGoal,
    },
  });

  // Update user subscription field
  await User.findByIdAndUpdate(req.user._id, {
    'subscription.plan':     plan,
    'subscription.mealsLeft': planData.meals,
    'subscription.renewsAt':  endDate,
    'subscription.isActive':  true,
  });

  // Award loyalty points for subscribing
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { loyaltyPoints: Math.floor(planData.price / 5) },
  });

  return sendSuccess(res, {
    data: { subscription },
  }, `🎉 Welcome to ZAAVO ${planData.name}! ${planData.meals} meals unlocked.`, 201);
}));

// ── POST /api/subscriptions/use-meal ─────────────────────────
router.post('/use-meal', protect, asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user:   req.user._id,
    status: 'active',
  });

  if (!subscription)         return sendError(res, 'No active subscription found', 404);
  if (subscription.mealsLeft <= 0) return sendError(res, 'No meals remaining this month. Please renew.', 400);

  subscription.mealsUsed += 1;
  subscription.mealsLeft -= 1;
  await subscription.save();

  await User.findByIdAndUpdate(req.user._id, {
    'subscription.mealsLeft': subscription.mealsLeft,
  });

  return sendSuccess(res, {
    data: { mealsLeft: subscription.mealsLeft, mealsUsed: subscription.mealsUsed },
  }, `Meal used! ${subscription.mealsLeft} meals remaining.`);
}));

// ── PATCH /api/subscriptions/cancel ──────────────────────────
router.patch('/cancel', protect, asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOneAndUpdate(
    { user: req.user._id, status: 'active' },
    { status: 'cancelled', autoRenew: false },
    { new: true }
  );

  if (!subscription) return sendError(res, 'No active subscription to cancel', 404);

  await User.findByIdAndUpdate(req.user._id, {
    'subscription.isActive': false,
  });

  return sendSuccess(res, { data: { subscription } }, 'Subscription cancelled. Valid till end of billing period.');
}));

// ── PATCH /api/subscriptions/pause ───────────────────────────
router.patch('/pause', protect, asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOneAndUpdate(
    { user: req.user._id, status: 'active' },
    { status: 'paused' },
    { new: true }
  );

  if (!subscription) return sendError(res, 'No active subscription found', 404);
  return sendSuccess(res, { data: { subscription } }, 'Subscription paused successfully.');
}));

// ── GET /api/subscriptions/history ───────────────────────────
router.get('/history', protect, asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return sendSuccess(res, { data: { subscriptions } });
}));

// ── POST /api/subscriptions/renew ─────────────────────────────
router.post('/renew', protect, asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user:   req.user._id,
    status: { $in: ['active', 'expired', 'cancelled'] },
  }).sort({ createdAt: -1 });

  if (!subscription) return sendError(res, 'No subscription found to renew', 404);

  const planData = PLANS[subscription.plan];
  const newEndDate = new Date();
  newEndDate.setMonth(newEndDate.getMonth() + 1);

  subscription.status    = 'active';
  subscription.startDate = new Date();
  subscription.endDate   = newEndDate;
  subscription.renewsAt  = newEndDate;
  subscription.mealsTotal = planData.meals;
  subscription.mealsUsed  = 0;
  subscription.mealsLeft  = planData.meals;
  await subscription.save();

  await User.findByIdAndUpdate(req.user._id, {
    'subscription.mealsLeft': planData.meals,
    'subscription.renewsAt':  newEndDate,
    'subscription.isActive':  true,
  });

  return sendSuccess(res, { data: { subscription } }, `Subscription renewed! ${planData.meals} fresh meals loaded.`);
}));

module.exports = router;
