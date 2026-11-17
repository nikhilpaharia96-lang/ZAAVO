// ═══════════════════════════════════════════════════════════
// ZAAVO — Order Controller
// Full order lifecycle: place → confirm → prepare → deliver
// ═══════════════════════════════════════════════════════════

const { Order }      = require('../models/Order.model');
const { Coupon }     = require('../models/Order.model');
const { Notification } = require('../models/Order.model');
const User           = require('../models/User.model');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');

// ─── Helper: Emit socket event ───────────────────────────────
const emitOrderUpdate = (io, order, event = 'order:update') => {
  if (!io) return;
  io.to(`user:${order.user}`).emit(event, { orderId: order._id, status: order.status, order });
  io.to(`restaurant:${order.restaurant}`).emit(event, { orderId: order._id, status: order.status, order });
  if (order.deliveryPartner) io.to(`delivery:${order.deliveryPartner}`).emit(event, { orderId: order._id, status: order.status });
};

// ─── Helper: Create notification ─────────────────────────────
const createNotification = async (userId, title, body, type = 'order', data = {}) => {
  try {
    await Notification.create({ user: userId, title, body, type, data });
  } catch (_) {}
};

// ─── @POST /api/orders — Place Order ────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const {
    restaurantId, items, deliveryAddress,
    paymentMethod, couponCode, useWallet, specialInstructions,
  } = req.body;

  if (!items || items.length === 0) return sendError(res, 'Cart is empty');

  // Calculate subtotal
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  let deliveryFee = subtotal >= 199 ? 0 : 30;
  let tax = Math.round(subtotal * 0.05); // 5% GST
  let discount = 0;
  let couponDiscount = 0;
  let walletUsed = 0;
  let couponRef = null;

  // Apply coupon
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: Date.now() } });
    if (coupon) {
      if (coupon.maxUsage !== -1 && coupon.usedCount >= coupon.maxUsage) {
        return sendError(res, 'Coupon usage limit reached');
      }
      const alreadyUsed = coupon.usedBy.includes(req.user._id);
      if (alreadyUsed && coupon.maxUsagePerUser === 1) return sendError(res, 'Coupon already used by you');

      if (subtotal < coupon.minOrderAmount) return sendError(res, `Minimum order ₹${coupon.minOrderAmount} required`);

      if (coupon.type === 'percentage') {
        couponDiscount = Math.min(Math.round(subtotal * coupon.value / 100), coupon.maxDiscount || Infinity);
      } else if (coupon.type === 'fixed') {
        couponDiscount = coupon.value;
      } else if (coupon.type === 'free_delivery') {
        deliveryFee = 0;
      }

      couponRef = coupon._id;
      coupon.usedCount += 1;
      coupon.usedBy.push(req.user._id);
      await coupon.save();
    }
  }

  // Apply wallet
  if (useWallet && req.user.walletBalance > 0) {
    const maxWallet = Math.min(req.user.walletBalance, subtotal * 0.5);
    walletUsed = Math.min(maxWallet, subtotal + deliveryFee + tax - couponDiscount);
  }

  const total = Math.max(0, subtotal + deliveryFee + tax - couponDiscount - walletUsed);

  const order = await Order.create({
    user: req.user._id,
    restaurant: restaurantId,
    items,
    pricing: { subtotal, deliveryFee, tax, discount, couponDiscount, walletUsed, total },
    deliveryAddress: deliveryAddress || req.user.addresses.find(a => a.isDefault),
    payment: { method: paymentMethod, status: paymentMethod === 'cod' ? 'pending' : 'pending' },
    coupon: couponRef,
    couponCode,
    specialInstructions,
    statusHistory: [{ status: 'placed', timestamp: new Date(), note: 'Order placed successfully' }],
  });

  // Deduct wallet
  if (walletUsed > 0) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -walletUsed } });
  }

  // Award loyalty points (₹1 = 1 point)
  const pointsEarned = Math.floor(total / 10);
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalOrders: 1, totalSpent: total, loyaltyPoints: pointsEarned },
  });

  // Populate and respond
  const populated = await Order.findById(order._id).populate('restaurant', 'name logo estimatedTime').populate('items.food', 'name image');

  // Real-time notification
  emitOrderUpdate(io, order, 'order:new');
  io.to(`restaurant:${restaurantId}`).emit('order:new', { order: populated });

  await createNotification(req.user._id, '🎉 Order Placed!', `Your order from ${populated.restaurant?.name} has been placed.`, 'order', { orderId: order._id });

  return sendSuccess(res, { data: { order: populated, pointsEarned } }, 'Order placed successfully!', 201);
});

// ─── @GET /api/orders — Get My Orders ───────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('restaurant', 'name logo cuisine estimatedTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  return sendSuccess(res, { data: { orders, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
});

// ─── @GET /api/orders/:id — Get Single Order ─────────────────
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('restaurant', 'name logo phone address')
    .populate('deliveryPartner', 'name phone avatar')
    .populate('items.food', 'name image');

  if (!order) return sendError(res, 'Order not found', 404);
  return sendSuccess(res, { data: { order } });
});

// ─── @PATCH /api/orders/:id/status — Update Status (Restaurant/Admin) ──
const updateOrderStatus = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { status, note } = req.body;
  const validStatuses = ['confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) return sendError(res, 'Invalid status');

  const order = await Order.findById(req.params.id);
  if (!order) return sendError(res, 'Order not found', 404);

  order.status = status;
  order.statusHistory.push({ status, timestamp: new Date(), note: note || `Order ${status}` });

  if (status === 'delivered') {
    order.tracking.deliveredAt = new Date();
    order.payment.status = 'paid';

    // Update restaurant revenue
    const Restaurant = require('../models/Restaurant.model');
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      $inc: { totalRevenue: order.pricing.total, totalOrders: 1 },
    });
  }

  await order.save();

  // Real-time update
  emitOrderUpdate(io, order);

  const statusMessages = {
    confirmed:         '✅ Order confirmed by restaurant!',
    preparing:         '👨‍🍳 Your food is being prepared...',
    ready:             '📦 Order ready for pickup!',
    picked_up:         '🛵 Delivery partner picked up your order!',
    out_for_delivery:  '🛵 On the way to you!',
    delivered:         '🎉 Delivered! Enjoy your meal!',
    cancelled:         '❌ Order cancelled.',
  };

  await createNotification(order.user, statusMessages[status] || `Order ${status}`, '', 'order', { orderId: order._id, status });

  return sendSuccess(res, { data: { order } }, `Order status updated to ${status}`);
});

// ─── @PATCH /api/orders/:id/cancel — Cancel Order ───────────
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return sendError(res, 'Order not found', 404);

  const cancellableStatuses = ['placed', 'confirmed'];
  if (!cancellableStatuses.includes(order.status)) {
    return sendError(res, `Cannot cancel order in '${order.status}' status`);
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: req.body.reason || 'Cancelled by user' });

  // Refund to wallet
  if (order.pricing.total > 0 && order.payment.status === 'paid') {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: order.pricing.total },
    });
    order.status = 'refunded';
  }

  await order.save();

  return sendSuccess(res, { data: { order } }, 'Order cancelled. Refund will be processed.');
});

// ─── @GET /api/orders/restaurant/:id — Restaurant Orders ─────
const getRestaurantOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = { restaurant: req.params.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  return sendSuccess(res, { data: { orders } });
});

module.exports = { placeOrder, getMyOrders, getOrder, updateOrderStatus, cancelOrder, getRestaurantOrders };
