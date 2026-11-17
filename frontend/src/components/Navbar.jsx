// ═══════════════════════════════════════════════════════════
// ZAAVO — Navbar Component
// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, UtensilsCrossed, Dumbbell, Search,
  ShoppingCart, User, Menu, X, Bell, Tag, Gift,
} from 'lucide-react';
import { selectCartCount } from '../store';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isLoggedIn, user, logout }    = useAuth();
  const cartCount   = useSelector(selectCartCount);
  const unreadCount = useSelector(s => s.ui.unreadCount);
  const notifications = useSelector(s => s.ui.notifications).slice(0, 5);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setNotifOpen(false); }, [location]);

  const NAV_LINKS = [
    { to: '/',            label: 'Home',        icon: Home },
    { to: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { to: '/fitness',     label: 'Gym Meals',   icon: Dumbbell },
    { to: '/offers',      label: 'Offers',      icon: Tag },
  ];

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-white/5 py-3' : 'py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-lg">Z</div>
          <span className="font-display font-black text-2xl tracking-tight text-white">
            ZA<span className="gradient-text">AVO</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 ml-6">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-link text-sm font-medium ${isActive(to) ? 'active text-white' : 'text-gray-400'}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate('/search')} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white" aria-label="Search">
            <Search size={19} />
          </button>

          <Link to="/cart" className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white" aria-label="Cart">
            <ShoppingCart size={19} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="notification-dot"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Notifications */}
          {isLoggedIn && (
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white" aria-label="Notifications">
                <Bell size={19} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                  >
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                      <span className="font-display font-bold text-white text-sm">Notifications</span>
                      {unreadCount > 0 && <span className="text-orange-400 text-xs font-semibold">{unreadCount} new</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No notifications yet</div>
                      ) : notifications.map((n, i) => (
                        <div key={i} className={`px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors ${!n.isRead ? 'bg-orange-500/5' : ''}`}>
                          <div className="text-white text-sm font-medium">{n.title}</div>
                          {n.body && <div className="text-gray-400 text-xs mt-0.5">{n.body}</div>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Auth */}
          {isLoggedIn ? (
            <div className="relative group">
              <button className="w-9 h-9 rounded-xl bg-gradient-zaavo flex items-center justify-center font-bold text-white text-sm ml-1">
                {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ME'}
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link to="/profile"    className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">👤 Profile</Link>
                <Link to="/orders"     className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">📦 My Orders</Link>
                <Link to="/subscription" className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">⭐ Subscription</Link>
                <button onClick={logout} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/5 transition-colors border-t border-white/5">🚪 Logout</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary px-5 py-2 rounded-xl text-sm font-display font-bold ml-1">Login</Link>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 rounded-xl hover:bg-white/5 text-gray-400 ml-1" aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(to) ? 'bg-orange-500/10 text-orange-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <Icon size={18} />{label}
                </Link>
              ))}
              {isLoggedIn && (
                <>
                  <Link to="/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                    📦 My Orders
                  </Link>
                  <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/5 transition-colors w-full text-left">
                    🚪 Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}


// ═══════════════════════════════════════════════════════════
// ZAAVO — BottomNav Component
// src/components/BottomNav.jsx — save separately
// ═══════════════════════════════════════════════════════════

// import { NavLink, useLocation } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { Home, Search, ShoppingCart, User, Dumbbell } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { selectCartCount } from '../store';
//
// export default function BottomNav() {
//   const cartCount = useSelector(selectCartCount);
//
//   const tabs = [
//     { to: '/',           icon: Home,         label: 'Home'    },
//     { to: '/search',     icon: Search,       label: 'Search'  },
//     { to: '/fitness',    icon: Dumbbell,     label: 'Fitness' },
//     { to: '/cart',       icon: ShoppingCart, label: 'Cart', badge: cartCount },
//     { to: '/profile',    icon: User,         label: 'Profile' },
//   ];
//
//   return (
//     <div className="bottom-nav items-center justify-around px-2 py-2 safe-bottom">
//       {tabs.map(({ to, icon: Icon, label, badge }) => (
//         <NavLink key={to} to={to} end={to === '/'}
//           className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative ${isActive ? 'text-orange-500' : 'text-gray-500'}`}
//         >
//           {({ isActive }) => (
//             <>
//               <div className="relative">
//                 <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
//                 {badge > 0 && (
//                   <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-[#0A0A0A]">
//                     {badge > 9 ? '9+' : badge}
//                   </span>
//                 )}
//               </div>
//               <span className="text-[10px] font-semibold">{label}</span>
//               {isActive && (
//                 <motion.div layoutId="bottom-dot" className="absolute -bottom-1 w-1 h-1 rounded-full bg-orange-500" />
//               )}
//             </>
//           )}
//         </NavLink>
//       ))}
//     </div>
//   );
// }


// ═══════════════════════════════════════════════════════════
// ZAAVO — CartToast Component
// src/components/CartToast.jsx — save separately
// ═══════════════════════════════════════════════════════════

// import { useSelector } from 'react-redux';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ShoppingCart, ChevronRight } from 'lucide-react';
// import { selectCartCount, selectCartTotal } from '../store';
//
// export default function CartToast() {
//   const cartCount   = useSelector(selectCartCount);
//   const cartTotal   = useSelector(selectCartTotal);
//   const navigate    = useNavigate();
//   const location    = useLocation();
//   const hideOn      = ['/cart', '/checkout', '/order/'];
//   const shouldShow  = cartCount > 0 && !hideOn.some(p => location.pathname.includes(p));
//
//   return (
//     <AnimatePresence>
//       {shouldShow && (
//         <motion.button
//           initial={{ y: 100, opacity: 0 }}
//           animate={{ y: 0,   opacity: 1 }}
//           exit={{   y: 100, opacity: 0 }}
//           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//           onClick={() => navigate('/cart')}
//           className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 btn-primary px-6 py-3.5 rounded-2xl font-display font-bold flex items-center gap-3 shadow-2xl shadow-orange-500/30 animate-pulse-glow"
//         >
//           <ShoppingCart size={20} />
//           <span>{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</span>
//           <span className="bg-white/20 px-2.5 py-1 rounded-xl text-sm">₹{cartTotal}</span>
//           <ChevronRight size={18} />
//         </motion.button>
//       )}
//     </AnimatePresence>
//   );
// }


// ═══════════════════════════════════════════════════════════
// ZAAVO — PageLoader Component
// src/components/PageLoader.jsx — save separately
// ═══════════════════════════════════════════════════════════

// export default function PageLoader() {
//   return (
//     <div className="fixed inset-0 bg-zaavo-dark flex items-center justify-center z-50">
//       <div className="text-center">
//         <div className="w-16 h-16 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-3xl mx-auto mb-4 animate-pulse">
//           Z
//         </div>
//         <div className="text-gray-500 text-sm animate-pulse">Loading...</div>
//       </div>
//     </div>
//   );
// }
