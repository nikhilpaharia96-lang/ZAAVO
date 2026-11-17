// ═══════════════════════════════════════════════════════════
// ZAAVO — App.jsx  (Root Router)
// Handles: routing, auth init, socket connection, theme
// ═══════════════════════════════════════════════════════════

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { fetchMe } from './store';
import useSocket from './hooks/useSocket';

// Layout
import Navbar    from './components/Navbar';
import BottomNav from './components/BottomNav';
import CartToast from './components/CartToast';
import PageLoader from './components/PageLoader';

// Eager-loaded pages (above fold)
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Lazy-loaded pages
const Restaurants      = lazy(() => import('./pages/Restaurants'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const Fitness          = lazy(() => import('./pages/Fitness'));
const Cart             = lazy(() => import('./pages/Cart'));
const Checkout         = lazy(() => import('./pages/Checkout'));
const OrderTracking    = lazy(() => import('./pages/OrderTracking'));
const Profile          = lazy(() => import('./pages/Profile'));
const Search           = lazy(() => import('./pages/Search'));
const Offers           = lazy(() => import('./pages/Offers'));
const Subscription     = lazy(() => import('./pages/Subscription'));
const OrderHistory     = lazy(() => import('./pages/OrderHistory'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword    = lazy(() => import('./pages/ResetPassword'));
const NotFound         = lazy(() => import('./pages/NotFound'));

// ─── Protected Route ─────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, initialized } = useSelector(s => s.auth);
  if (!initialized) return <PageLoader />;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// ─── Guest Route (redirect if logged in) ─────────────────────
const GuestRoute = ({ children }) => {
  const { isLoggedIn } = useSelector(s => s.auth);
  return isLoggedIn ? <Navigate to="/" replace /> : children;
};

// ─── Pages that hide the Navbar ──────────────────────────────
const FULLSCREEN_PAGES = ['/login', '/signup', '/forgot-password'];
const hideNavOn        = (path) => FULLSCREEN_PAGES.some(p => path.startsWith(p));

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const dispatch   = useDispatch();
  const location   = useLocation();
  const { isLoggedIn } = useSelector(s => s.auth);

  // Initialize auth from stored token
  useEffect(() => {
    const token = localStorage.getItem('zaavo_token');
    if (token) dispatch(fetchMe());
    else {
      // Mark as initialized even if no token
      dispatch({ type: 'auth/fetchMe/rejected' });
    }
  }, [dispatch]);

  // Socket.io — only when logged in
  useSocket();

  const showNav = !hideNavOn(location.pathname);

  return (
    <div className="min-h-screen bg-zaavo-dark font-body antialiased">
      {showNav && <Navbar />}

      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            {/* Public */}
            <Route path="/"                   element={<Home />} />
            <Route path="/restaurants"        element={<Restaurants />} />
            <Route path="/restaurants/:id"    element={<RestaurantDetail />} />
            <Route path="/fitness"            element={<Fitness />} />
            <Route path="/search"             element={<Search />} />
            <Route path="/offers"             element={<Offers />} />
            <Route path="/subscription"       element={<Subscription />} />

            {/* Guest only */}
            <Route path="/login"              element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup"             element={<GuestRoute><Signup /></GuestRoute>} />
            <Route path="/forgot-password"    element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

            {/* Protected */}
            <Route path="/cart"               element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout"           element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order/:id/track"    element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
            <Route path="/orders"             element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/profile"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:tab"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*"                   element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {showNav && <BottomNav />}
      {isLoggedIn && <CartToast />}
    </div>
  );
}
