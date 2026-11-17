// ═══════════════════════════════════════════════════════════
// ZAAVO — Notification Routes
// save as: backend/routes/notification.routes.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { protect, authorize, asyncHandler, sendSuccess, sendError } = require('../middleware/auth.middleware');
const { Notification } = require('../models/Order.model');

// ── GET /api/notifications — Get user notifications ───────────
router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { user: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, {
    data: { notifications, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / limit) },
  });
}));

// ── PATCH /api/notifications/read-all — Mark all read ────────
router.patch('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return sendSuccess(res, {}, 'All notifications marked as read.');
}));

// ── PATCH /api/notifications/:id/read — Mark single read ─────
router.patch('/:id/read', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return sendError(res, 'Notification not found', 404);
  return sendSuccess(res, { data: { notification } });
}));

// ── DELETE /api/notifications/:id ────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  return sendSuccess(res, {}, 'Notification deleted.');
}));

// ── DELETE /api/notifications — Clear all ────────────────────
router.delete('/', protect, asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  return sendSuccess(res, {}, 'All notifications cleared.');
}));

// ── POST /api/notifications/register-token — FCM token ───────
router.post('/register-token', protect, asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return sendError(res, 'FCM token required');

  const User = require('../models/User.model');
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { fcmTokens: token },
  });

  return sendSuccess(res, {}, 'Push notification token registered.');
}));

// ── POST /api/notifications/send — Admin send to user ────────
router.post('/send', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { userId, title, body, type = 'system', data } = req.body;
  const io = req.app.get('io');

  const notification = await Notification.create({ user: userId, title, body, type, data });

  // Real-time push via Socket.io
  if (io) io.to(`user:${userId}`).emit('notification:new', notification);

  return sendSuccess(res, { data: { notification } }, 'Notification sent.', 201);
}));

module.exports = router;
