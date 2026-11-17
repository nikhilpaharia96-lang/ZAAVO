// ═══════════════════════════════════════════════════════════
// ZAAVO — Payment Controller
// Razorpay integration, verification, refunds
// ═══════════════════════════════════════════════════════════

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { Payment, Order } = require('../models/Order.model');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── @POST /api/payments/create-order ────────────────────────
// Creates Razorpay order for frontend checkout
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, orderId, currency = 'INR' } = req.body;

  if (!amount || amount <= 0) return sendError(res, 'Invalid amount');

  const options = {
    amount:   Math.round(amount * 100), // paise
    currency,
    receipt:  `zaavo_${orderId}_${Date.now()}`,
    notes:    { orderId, userId: req.user._id.toString() },
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Record pending payment
  await Payment.create({
    user:            req.user._id,
    order:           orderId,
    amount,
    currency,
    method:          'razorpay',
    status:          'created',
    razorpayOrderId: razorpayOrder.id,
  });

  return sendSuccess(res, {
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    },
  }, 'Payment order created');
});

// ─── @POST /api/payments/verify ──────────────────────────────
// Verifies Razorpay payment signature
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  const body      = razorpayOrderId + '|' + razorpayPaymentId;
  const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  const isValid   = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));

  if (!isValid) {
    await Payment.findOneAndUpdate({ razorpayOrderId }, { status: 'failed' });
    return sendError(res, 'Payment verification failed. Possible fraud attempt.', 400);
  }

  // Update payment record
  await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { status: 'paid', razorpayPaymentId, razorpaySignature },
  );

  // Update order payment status
  const order = await Order.findByIdAndUpdate(
    orderId,
    { 'payment.status': 'paid', 'payment.transactionId': razorpayPaymentId, 'payment.paidAt': new Date() },
    { new: true }
  );

  return sendSuccess(res, { data: { order } }, '✅ Payment verified successfully!');
});

// ─── @POST /api/payments/refund ──────────────────────────────
const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  const payment = await Payment.findOne({ razorpayPaymentId: paymentId });

  if (!payment) return sendError(res, 'Payment not found', 404);
  if (payment.status === 'refunded') return sendError(res, 'Already refunded');

  const refund = await razorpay.payments.refund(paymentId, {
    amount: amount ? Math.round(amount * 100) : undefined,
    notes:  { reason: reason || 'Customer request' },
  });

  payment.status       = 'refunded';
  payment.refundId     = refund.id;
  payment.refundAmount = refund.amount / 100;
  payment.refundReason = reason;
  payment.refundedAt   = new Date();
  await payment.save();

  return sendSuccess(res, { data: { refund } }, 'Refund initiated successfully');
});

// ─── @GET /api/payments/history ──────────────────────────────
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('order', 'orderId pricing.total status')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return sendSuccess(res, { data: { payments } });
});

// ─── @POST /api/payments/wallet/add ──────────────────────────
const addToWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 10) return sendError(res, 'Minimum ₹10 required');

  // In production: verify razorpay payment first
  const user = await require('../models/User.model').findByIdAndUpdate(
    req.user._id,
    { $inc: { walletBalance: amount } },
    { new: true }
  );

  return sendSuccess(res, { data: { walletBalance: user.walletBalance } }, `₹${amount} added to wallet`);
});

module.exports = { createPaymentOrder, verifyPayment, processRefund, getPaymentHistory, addToWallet };
