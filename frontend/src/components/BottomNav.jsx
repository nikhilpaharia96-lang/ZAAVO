// ═══════════════════════════════════════════════════════════
// ZAAVO — BottomNav Component
// src/components/BottomNav.jsx
// ═══════════════════════════════════════════════════════════

import { NavLink, useLocation } from 'react-router-dom';
import { useSelector }          from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Dumbbell, ShoppingCart, User } from 'lucide-react';
import { selectCartCount } from '../store';

const TABS = [
  { to: '/',        icon: Home,         label: 'Home',    exact: true },
  { to: '/search',  icon: Search,       label: 'Search',  exact: false },
  { to: '/fitness', icon: Dumbbell,     label: 'Fitness', exact: false },
  { to: '/cart',    icon: ShoppingCart, label: 'Cart',    exact: false, showBadge: true },
  { to: '/profile', icon: User,         label: 'Me',      exact: false },
];

export default function BottomNav() {
  const cartCount = useSelector(selectCartCount);
  const location  = useLocation();

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="bottom-nav items-center justify-around px-1 pt-2 pb-safe safe-bottom">
      {TABS.map(({ to, icon: Icon, label, exact, showBadge }) => {
        const active = isActive(to, exact);
        return (
          <NavLink key={to} to={to} end={exact}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-colors relative min-w-[52px]"
            style={{ color: active ? '#FF5722' : '#666' }}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              {showBadge && cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-dark"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] font-semibold leading-none">{label}</span>
            {active && (
              <motion.div
                layoutId="bottom-indicator"
                className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-orange-500"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
