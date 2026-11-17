// ═══════════════════════════════════════════════════════════
// ZAAVO — Order Tracking Page
// src/pages/OrderTracking.jsx
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, Link }     from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, Star, MapPin, Clock, ChevronRight, CheckCircle2, Package, ChefHat, Bike, PartyPopper } from 'lucide-react';
import { fetchOrderById }  from '../store';
import useSocket           from '../hooks/useSocket';

const STATUS_STEPS = [
  { key: 'placed',           label: 'Order Placed',        icon: Package,       color: 'text-orange-400' },
  { key: 'confirmed',        label: 'Confirmed',           icon: CheckCircle2,  color: 'text-blue-400' },
  { key: 'preparing',        label: 'Being Prepared',      icon: ChefHat,       color: 'text-yellow-400' },
  { key: 'out_for_delivery', label: 'Out for Delivery',    icon: Bike,          color: 'text-purple-400' },
  { key: 'delivered',        label: 'Delivered!',          icon: PartyPopper,   color: 'text-lime-400' },
];

const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]));

export default function OrderTracking() {
  const { id }       = useParams();
  const dispatch     = useDispatch();
  const { current, loading } = useSelector(s => s.orders);
  const { trackOrder, untrackOrder } = useSocket();
  const [riderPos,   setRiderPos]   = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating,     setRating]     = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
      trackOrder(id);
    }
    return () => { if (id) untrackOrder(id); };
  }, [id, dispatch, trackOrder, untrackOrder]);

  // Listen for real-time rider location
  useEffect(() => {
    const handler = (e) => setRiderPos(e.detail);
    window.addEventListener('delivery:location', handler);
    return () => window.removeEventListener('delivery:location', handler);
  }, []);

  // Show rating prompt when delivered
  useEffect(() => {
    if (current?.status === 'delivered' && !current?.isRated) {
      const t = setTimeout(() => setShowRating(true), 2000);
      return () => clearTimeout(t);
    }
  }, [current?.status, current?.isRated]);

  if (loading || !current) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">🛵</div>
        <p className="text-gray-400">Loading order details...</p>
      </div>
    </div>
  );

  const currentStepIdx = STATUS_INDEX[current.status] ?? 0;
  const isDelivered    = current.status === 'delivered';
  const isCancelled    = current.status === 'cancelled';

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="text-6xl mb-3 animate-float">
            {isCancelled ? '❌' : isDelivered ? '🎉' : '🛵'}
          </div>
          <h1 className="font-display font-black text-2xl text-white">{current.orderId}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {current.restaurant?.name} · ₹{current.pricing?.total}
          </p>
          {current.tracking?.estimatedDelivery && !isDelivered && (
            <div className="inline-flex items-center gap-2 mt-3 tag-orange px-3 py-1.5 rounded-full text-sm">
              <Clock size={13} />
              <span>Est. delivery: {new Date(current.tracking.estimatedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </motion.div>

        {/* Status Timeline */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass border border-white/5 rounded-3xl p-6 mb-5">
            <div className="space-y-1">
              {STATUS_STEPS.map((step, idx) => {
                const Icon      = step.icon;
                const isDone    = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isPending = idx > currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                        ${isDone    ? 'bg-lime-500/20 border-2 border-lime-500/50' : ''}
                        ${isCurrent ? 'bg-orange-500/20 border-2 border-orange-500 animate-pulse-glow' : ''}
                        ${isPending ? 'bg-white/5 border border-white/10' : ''}
                      `}>
                        <Icon size={18} className={isDone ? 'text-lime-400' : isCurrent ? step.color : 'text-gray-600'} />
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 rounded-full transition-all duration-700 ${isDone ? 'bg-lime-500/30' : 'bg-white/6'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`font-semibold text-sm ${isDone ? 'text-lime-400' : isCurrent ? 'text-white' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-orange-400/70 text-xs mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping-slow" />
                          In progress…
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Map placeholder */}
        {!isDelivered && !isCancelled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="glass border border-white/5 rounded-3xl overflow-hidden mb-5 h-44 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-3 to-dark-4 opacity-80" />
            <div className="relative text-center z-10">
              <MapPin size={32} className="text-orange-400 mx-auto mb-2 animate-bounce" />
              <p className="text-gray-400 text-sm">Live map · Connect Google Maps API</p>
              {riderPos && <p className="text-lime-400 text-xs mt-1">Rider at {riderPos.lat.toFixed(4)}, {riderPos.lng.toFixed(4)}</p>}
            </div>
          </motion.div>
        )}

        {/* Delivery Partner */}
        {current.deliveryPartner && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass border border-white/5 rounded-3xl p-4 mb-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-bold text-white">
              {current.deliveryPartner.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{current.deliveryPartner.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-gray-400 text-xs">4.9 · Delivery Partner</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="glass border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors">
                <Phone size={17} />
              </button>
              <button className="glass border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors">
                <MessageCircle size={17} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Items Summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass border border-white/5 rounded-3xl p-5 mb-5">
          <h3 className="font-display font-semibold text-white mb-3">Order Items</h3>
          <div className="space-y-2">
            {current.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.quantity}× {item.name}</span>
                <span className="text-white font-semibold">₹{item.totalPrice}</span>
              </div>
            ))}
            <div className="border-t border-white/6 pt-2 flex justify-between font-bold text-white">
              <span>Total</span>
              <span className="text-orange-400">₹{current.pricing?.total}</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/orders" className="flex-1 btn-secondary py-3.5 rounded-2xl font-semibold text-sm text-center">
            View All Orders
          </Link>
          {isDelivered && (
            <button onClick={() => setShowRating(true)} className="flex-1 btn-primary py-3.5 rounded-2xl font-display font-bold text-sm">
              Rate Order ⭐
            </button>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowRating(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="glass border border-white/10 rounded-3xl p-7 w-full max-w-sm mx-4 mb-4 sm:mb-0"
              onClick={e => e.stopPropagation()}>
              <div className="swipe-handle" />
              <div className="text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-display font-black text-white text-xl mb-1">How was your order?</h3>
                <p className="text-gray-400 text-sm mb-6">Your feedback helps us improve</p>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)}
                      className={`text-4xl transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-400' : 'text-gray-700'}`}>
                      ★
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowRating(false)} disabled={!rating}
                  className={`w-full py-4 rounded-2xl font-display font-bold text-base transition-all ${rating ? 'btn-primary' : 'glass border border-white/5 text-gray-600 cursor-not-allowed'}`}>
                  Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// ZAAVO — OrderHistory Page
// src/pages/OrderHistory.jsx  (save separately)
// ═══════════════════════════════════════════════════════════

// import { useEffect, useState } from 'react';
// import { Link }                from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { motion }              from 'framer-motion';
// import { ChevronRight, RotateCcw } from 'lucide-react';
// import { fetchMyOrders }       from '../store';
//
// const STATUS_COLORS = {
//   placed:           'tag-orange',
//   confirmed:        'tag-blue',
//   preparing:        'tag-orange',
//   out_for_delivery: 'tag-blue',
//   delivered:        'tag-lime',
//   cancelled:        'tag-red',
// };
//
// export default function OrderHistory() {
//   const dispatch = useDispatch();
//   const { list, loading } = useSelector(s => s.orders);
//   const [filter, setFilter] = useState('all');
//
//   useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);
//
//   const filtered = filter === 'all' ? list : list.filter(o => o.status === filter);
//
//   return (
//     <div className="min-h-screen pt-28 pb-24 px-4">
//       <div className="max-w-2xl mx-auto">
//         <h1 className="font-display font-black text-3xl text-white mb-6">My Orders</h1>
//         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
//           {['all','delivering','delivered','cancelled'].map(f => (
//             <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter===f ? 'bg-gradient-zaavo text-white' : 'glass border border-white/5 text-gray-400 hover:text-white'}`}>
//               {f.charAt(0).toUpperCase() + f.slice(1)}
//             </button>
//           ))}
//         </div>
//         {loading ? (
//           <div className="space-y-4">
//             {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="text-center py-20">
//             <div className="text-6xl mb-4">📦</div>
//             <p className="text-gray-400">No orders found</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {filtered.map((order, i) => (
//               <motion.div key={order._id}
//                 initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
//                 className="glass border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
//                 <div className="flex items-start gap-3">
//                   <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
//                     🍱
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <span className="font-semibold text-white text-sm">{order.restaurant?.name}</span>
//                       <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'tag-orange'}`}>
//                         {order.status?.replace('_', ' ')}
//                       </span>
//                     </div>
//                     <p className="text-gray-500 text-xs truncate">
//                       {order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
//                     </p>
//                     <div className="flex items-center justify-between mt-2">
//                       <span className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
//                       <span className="font-bold text-white text-sm">₹{order.pricing?.total}</span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
//                   <Link to={`/order/${order._id}/track`} className="flex-1 text-center text-xs text-orange-400 font-semibold hover:text-orange-300 transition-colors flex items-center justify-center gap-1">
//                     Track <ChevronRight size={13} />
//                   </Link>
//                   <button className="flex-1 text-center text-xs text-gray-400 font-semibold hover:text-white transition-colors flex items-center justify-center gap-1">
//                     <RotateCcw size={13} /> Reorder
//                   </button>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// ═══════════════════════════════════════════════════════════
// ZAAVO — NotFound (404) Page
// src/pages/NotFound.jsx  (save separately)
// ═══════════════════════════════════════════════════════════

// import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Home, Search } from 'lucide-react';
//
// export default function NotFound() {
//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 text-center bg-hero-gradient">
//       <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
//         <div className="text-9xl mb-6 animate-float">🍔</div>
//         <h1 className="font-display font-black text-6xl text-white mb-3">404</h1>
//         <h2 className="font-display font-bold text-2xl text-gray-300 mb-3">Page Not Found</h2>
//         <p className="text-gray-500 mb-8 max-w-sm mx-auto">
//           Looks like this page got delivered to the wrong address. Let's get you back on track.
//         </p>
//         <div className="flex gap-3 justify-center">
//           <Link to="/" className="btn-primary px-6 py-3 rounded-2xl font-display font-bold flex items-center gap-2">
//             <Home size={18} /> Go Home
//           </Link>
//           <Link to="/search" className="btn-secondary px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
//             <Search size={18} /> Search Food
//           </Link>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
