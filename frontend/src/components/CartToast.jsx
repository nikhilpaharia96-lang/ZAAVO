// ═══════════════════════════════════════════════════════════
// ZAAVO — CartToast Component
// src/components/CartToast.jsx
// Floating CTA shown when cart has items
// ═══════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector }              from 'react-redux';
import { motion, AnimatePresence }  from 'framer-motion';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { selectCartCount, selectCartTotal } from '../store';

const HIDE_ON = ['/cart', '/checkout', '/order/'];

export default function CartToast() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const cartCount   = useSelector(selectCartCount);
  const cartTotal   = useSelector(selectCartTotal);
  const restaurantName = useSelector(s => s.cart.restaurantName);

  const shouldShow = cartCount > 0 && !HIDE_ON.some(p => location.pathname.includes(p));

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm"
        >
          <button
            onClick={() => navigate('/cart')}
            className="w-full btn-primary rounded-2xl py-4 px-5 flex items-center gap-3 shadow-2xl shadow-orange-500/30"
            style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
          >
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart size={18} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-display font-black text-base leading-tight">
                {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
              </div>
              {restaurantName && (
                <div className="text-orange-200 text-xs truncate">{restaurantName}</div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-display font-black text-lg">₹{cartTotal}</span>
              <ChevronRight size={18} className="opacity-70" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
