// ═══════════════════════════════════════════════════════════
// ZAAVO — useSocket Hook
// src/hooks/useSocket.js
// Manages Socket.io connection lifecycle
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { updateOrderStatus, addNotification } from '../store';

let socketInstance = null;

export default function useSocket() {
  const dispatch    = useDispatch();
  const { isLoggedIn, token } = useSelector(s => s.auth);
  const socketRef   = useRef(null);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      // Disconnect if logged out
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    // Re-use existing connection
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth:           { token },
      transports:     ['websocket', 'polling'],
      reconnection:   true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    socketInstance   = socket;
    socketRef.current = socket;

    // ── Connect ──────────────────────────────────────────
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️  Socket connection failed:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    // ── Order Updates ────────────────────────────────────
    socket.on('order:update', ({ orderId, status, order }) => {
      dispatch(updateOrderStatus({ orderId, status }));

      const messages = {
        confirmed:        { msg: '✅ Order confirmed!', icon: '✅' },
        preparing:        { msg: '👨‍🍳 Your food is being prepared', icon: '👨‍🍳' },
        ready:            { msg: '📦 Order ready for pickup', icon: '📦' },
        picked_up:        { msg: '🛵 Rider picked up your order', icon: '🛵' },
        out_for_delivery: { msg: '🛵 Your order is on the way!', icon: '🛵' },
        delivered:        { msg: '🎉 Order delivered! Enjoy!', icon: '🎉' },
        cancelled:        { msg: '❌ Order was cancelled', icon: '❌' },
      };

      const info = messages[status];
      if (info) toast(info.msg, { icon: info.icon });
    });

    // ── New Notification ─────────────────────────────────
    socket.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
      toast(notification.title, {
        icon: notification.type === 'promo' ? '🎁' : notification.type === 'order' ? '📦' : '🔔',
      });
    });

    // ── Broadcast (admin promos) ─────────────────────────
    socket.on('notification:broadcast', ({ title, body }) => {
      dispatch(addNotification({ title, body, type: 'promo', createdAt: new Date() }));
      toast(`📣 ${title}`, { duration: 5000 });
    });

    // ── Delivery location (for order tracking page) ───────
    socket.on('delivery:location', (data) => {
      // Re-emit as custom DOM event for OrderTracking page to consume
      window.dispatchEvent(new CustomEvent('delivery:location', { detail: data }));
    });

    // ── Chat messages ────────────────────────────────────
    socket.on('chat:message', (message) => {
      window.dispatchEvent(new CustomEvent('chat:message', { detail: message }));
    });

    return () => {
      // Don't disconnect on component unmount — keep alive
      // Only disconnect on logout (handled above)
    };
  }, [isLoggedIn, token, dispatch]);

  // ── Public API ──────────────────────────────────────────
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const trackOrder = useCallback((orderId) => {
    socketRef.current?.emit('order:track', { orderId });
  }, []);

  const untrackOrder = useCallback((orderId) => {
    socketRef.current?.emit('order:untrack', { orderId });
  }, []);

  const sendChat = useCallback((orderId, message, to) => {
    socketRef.current?.emit('chat:message', { orderId, message, to });
  }, []);

  const updateLocation = useCallback((lat, lng, orderId) => {
    socketRef.current?.emit('delivery:location_update', { lat, lng, orderId });
  }, []);

  const toggleOnline = useCallback((isOnline) => {
    socketRef.current?.emit('delivery:toggle_status', { isOnline });
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emit,
    trackOrder,
    untrackOrder,
    sendChat,
    updateLocation,
    toggleOnline,
  };
}

// Export singleton for non-hook usage (e.g. thunks)
export const getSocket = () => socketInstance;
