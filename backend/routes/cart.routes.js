// POST /api/cart/validate — re-price cart items server-side before checkout
const express = require('express');
const router = express.Router();
const { Food } = require('../models/Restaurant.model');
const { protect, asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');

router.post('/validate', protect, asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) return sendError(res, 'Cart is empty');
  const foods = await Food.find({ _id: { $in: items.map(i => i._id || i.food) } }).lean();
  const byId = Object.fromEntries(foods.map(f => [f._id.toString(), f]));
  const result = items.map(i => {
    const f = byId[(i._id || i.food).toString()];
    return { id: i._id || i.food, available: !!f?.isAvailable, price: f?.price, quantity: i.quantity };
  });
  const subtotal = result.reduce((s, i) => s + (i.available ? i.price * i.quantity : 0), 0);
  return sendSuccess(res, { data: { items: result, subtotal, allAvailable: result.every(i => i.available) } });
}));

module.exports = router;
