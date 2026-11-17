// ═══════════════════════════════════════════════════════════
// ZAAVO — Socket.io Real-time Event Handler
// Live order tracking, notifications, delivery location
// ═══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

module.exports = (io) => {
  // ─── Middleware: Auth ───────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('name role');
      if (!user)  return next(new Error('User not found'));

      socket.userId   = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connected Users Map ────────────────────────────────────
  const connectedUsers = new Map(); // userId → socketId

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userName} (${socket.userRole}) — ${socket.id}`);
    connectedUsers.set(socket.userId, socket.id);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // ── Delivery Partner Events ─────────────────────────────
    if (socket.userRole === 'delivery_partner') {
      socket.join(`delivery:${socket.userId}`);

      // Partner toggles online/offline
      socket.on('delivery:toggle_status', async ({ isOnline }) => {
        try {
          const { DeliveryPartner } = require('../models/Order.model');
          await DeliveryPartner.findOneAndUpdate({ user: socket.userId }, { isOnline });
          socket.emit('delivery:status_updated', { isOnline });
          console.log(`🛵 ${socket.userName} is now ${isOnline ? 'online' : 'offline'}`);
        } catch (e) {
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      // Partner updates live location
      socket.on('delivery:location_update', async ({ lat, lng, orderId }) => {
        try {
          const { DeliveryPartner } = require('../models/Order.model');
          await DeliveryPartner.findOneAndUpdate(
            { user: socket.userId },
            { currentLocation: { type: 'Point', coordinates: [lng, lat] } }
          );

          if (orderId) {
            // Broadcast to user tracking this order
            io.to(`order:${orderId}`).emit('delivery:location', { lat, lng, orderId });
          }
        } catch (e) {}
      });

      // Partner accepts an order
      socket.on('delivery:accept_order', async ({ orderId }) => {
        try {
          const { Order, DeliveryPartner } = require('../models/Order.model');
          const partner = await DeliveryPartner.findOne({ user: socket.userId });

          await Order.findByIdAndUpdate(orderId, {
            deliveryPartner: socket.userId,
            status: 'picked_up',
          });

          await DeliveryPartner.findByIdAndUpdate(partner._id, { activeOrder: orderId });

          io.to(`order:${orderId}`).emit('delivery:partner_assigned', {
            partnerId: socket.userId,
            partnerName: socket.userName,
          });

          socket.emit('delivery:order_accepted', { orderId });
        } catch (e) {
          socket.emit('error', { message: 'Failed to accept order' });
        }
      });
    }

    // ── Restaurant Events ───────────────────────────────────
    if (socket.userRole === 'restaurant_owner') {
      socket.on('restaurant:join', ({ restaurantId }) => {
        socket.join(`restaurant:${restaurantId}`);
        console.log(`🍽  Restaurant ${restaurantId} joined`);
      });

      socket.on('restaurant:order_ready', ({ orderId }) => {
        io.to(`order:${orderId}`).emit('order:ready_for_pickup', { orderId });
        // Notify available delivery partners
        io.to('delivery:available').emit('delivery:new_pickup', { orderId });
      });
    }

    // ── User Events ─────────────────────────────────────────
    // User joins order tracking room
    socket.on('order:track', ({ orderId }) => {
      socket.join(`order:${orderId}`);
      console.log(`📍 ${socket.userName} tracking order ${orderId}`);
    });

    socket.on('order:untrack', ({ orderId }) => {
      socket.leave(`order:${orderId}`);
    });

    // ── Chat Events ─────────────────────────────────────────
    socket.on('chat:message', ({ orderId, message, to }) => {
      const payload = {
        from:      socket.userId,
        fromName:  socket.userName,
        message,
        timestamp: new Date(),
        orderId,
      };
      io.to(`user:${to}`).emit('chat:message', payload);
      socket.emit('chat:message_sent', payload);
    });

    // ── Ping/Pong ────────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));

    // ── Disconnect ───────────────────────────────────────────
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 Socket disconnected: ${socket.userName}`);

      if (socket.userRole === 'delivery_partner') {
        const { DeliveryPartner } = require('../models/Order.model');
        DeliveryPartner.findOneAndUpdate({ user: socket.userId }, { isOnline: false }).catch(() => {});
      }
    });
  });

  // ─── Admin Broadcast ────────────────────────────────────────
  io.adminBroadcast = (event, data) => {
    io.emit(event, data);
  };

  // ─── Send to specific user ──────────────────────────────────
  io.sendToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  console.log('✅ Socket.io handler initialized');
};
