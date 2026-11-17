// ═══════════════════════════════════════════════════════════
// ZAAVO — ResetPassword Page
// src/pages/ResetPassword.jsx
// ═══════════════════════════════════════════════════════════

import { useState }          from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion }            from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { authAPI }           from '../services/api';
import toast                 from 'react-hot-toast';

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [form,     setForm]     = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3;

  const strengthLabel = ['', 'Too weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-lime-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center">
        <div className="w-20 h-20 bg-lime-500/15 border-2 border-lime-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-lime-400" />
        </div>
        <h2 className="font-display font-black text-2xl text-white mb-2">Password Reset!</h2>
        <p className="text-gray-400">Redirecting to login...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-hero-gradient">
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="font-display font-black text-3xl text-white">Set New Password</h1>
          <p className="text-gray-400 mt-2 text-sm">Choose a strong password for your account</p>
        </div>
        <div className="glass border border-white/10 rounded-3xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field w-full rounded-2xl pl-11 pr-11 py-3.5 text-sm" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(n => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= strength ? strengthColor : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{strengthLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="password" value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  className={`input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm ${form.confirm && form.password !== form.confirm ? 'border-red-500/50' : ''}`}
                  placeholder="Repeat password" />
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={20} className="animate-spin" />Resetting...</> : 'Reset Password'}
            </button>
          </form>
          <Link to="/login" className="block text-center text-gray-500 text-sm hover:text-white transition-colors mt-4">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// ZAAVO — NotFound (404) Page
// src/pages/NotFound.jsx
// ═══════════════════════════════════════════════════════════

// import { Link }         from 'react-router-dom';
// import { motion }       from 'framer-motion';
// import { Home, Search } from 'lucide-react';
//
// export default function NotFound() {
//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 text-center bg-hero-gradient">
//       <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
//         <div className="text-9xl mb-5 animate-float">🍔</div>
//         <h1 className="font-display font-black text-7xl text-white mb-2">404</h1>
//         <h2 className="font-display font-bold text-2xl text-gray-300 mb-3">Page Not Found</h2>
//         <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
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


// ═══════════════════════════════════════════════════════════
// ZAAVO — PageLoader Component
// src/components/PageLoader.jsx
// ═══════════════════════════════════════════════════════════

// export default function PageLoader() {
//   return (
//     <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center z-50">
//       <div className="text-center">
//         <div className="relative w-16 h-16 mx-auto mb-5">
//           <div className="w-full h-full rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-3xl animate-pulse">Z</div>
//           <div className="absolute inset-0 rounded-2xl bg-gradient-zaavo opacity-30 animate-ping" />
//         </div>
//         <div className="flex gap-1.5 justify-center">
//           {[0,1,2].map(i => (
//             <div key={i} className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay:`${i*0.15}s` }} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


// ═══════════════════════════════════════════════════════════
// ZAAVO — BottomNav Component
// src/components/BottomNav.jsx
// ═══════════════════════════════════════════════════════════

// import { NavLink }      from 'react-router-dom';
// import { useSelector }  from 'react-redux';
// import { motion }       from 'framer-motion';
// import { Home, Search, ShoppingCart, User, Dumbbell } from 'lucide-react';
// import { selectCartCount } from '../store';
//
// const TABS = [
//   { to:'/',          label:'Home',    Icon:Home,         end:true  },
//   { to:'/search',    label:'Search',  Icon:Search,       end:false },
//   { to:'/fitness',   label:'Fitness', Icon:Dumbbell,     end:false },
//   { to:'/cart',      label:'Cart',    Icon:ShoppingCart, end:false, showBadge:true },
//   { to:'/profile',   label:'Profile', Icon:User,         end:false },
// ];
//
// export default function BottomNav() {
//   const cartCount = useSelector(selectCartCount);
//   return (
//     <nav className="bottom-nav items-center justify-around px-1 py-2 safe-bottom">
//       {TABS.map(({ to, label, Icon, end, showBadge }) => (
//         <NavLink key={to} to={to} end={end}
//           className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative min-w-0 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-500'}`}>
//           {({ isActive }) => (<>
//             <div className="relative">
//               <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
//               {showBadge && cartCount > 0 && (
//                 <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-[#0A0A0A]">
//                   {cartCount > 9 ? '9+' : cartCount}
//                 </span>
//               )}
//             </div>
//             <span className="text-[10px] font-semibold truncate">{label}</span>
//             {isActive && <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 rounded-full bg-orange-500" />}
//           </>)}
//         </NavLink>
//       ))}
//     </nav>
//   );
// }


// ═══════════════════════════════════════════════════════════
// ZAAVO — CartToast Component
// src/components/CartToast.jsx
// ═══════════════════════════════════════════════════════════

// import { useSelector }      from 'react-redux';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { motion, AnimatePresence }  from 'framer-motion';
// import { ShoppingCart, ChevronRight } from 'lucide-react';
// import { selectCartCount, selectCartTotal } from '../store';
//
// const HIDE_ON = ['/cart', '/checkout', '/order/'];
//
// export default function CartToast() {
//   const count    = useSelector(selectCartCount);
//   const total    = useSelector(selectCartTotal);
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const hidden   = HIDE_ON.some(p => pathname.includes(p));
//   if (hidden || count === 0) return null;
//   return (
//     <motion.button
//       initial={{ y:100, opacity:0 }} animate={{ y:0, opacity:1 }}
//       exit={{ y:100, opacity:0 }}
//       transition={{ type:'spring', stiffness:320, damping:30 }}
//       onClick={() => navigate('/cart')}
//       className="fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 z-40 btn-primary px-6 py-3.5 rounded-2xl font-display font-bold flex items-center gap-3 shadow-2xl shadow-orange-500/30 animate-pulse-glow whitespace-nowrap"
//     >
//       <ShoppingCart size={19} />
//       <span>{count} item{count !== 1 ? 's' : ''} in cart</span>
//       <span className="bg-white/20 px-2.5 py-1 rounded-xl text-sm font-bold">₹{total}</span>
//       <ChevronRight size={17} />
//     </motion.button>
//   );
// }


// ═══════════════════════════════════════════════════════════
// ZAAVO — RestaurantCard Component
// src/components/RestaurantCard.jsx
// ═══════════════════════════════════════════════════════════

// import { Link }  from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Star, Clock, MapPin, Tag } from 'lucide-react';
//
// const BG = ['from-green-900/40 to-lime-900/40','from-orange-900/40 to-red-900/40','from-blue-900/40 to-purple-900/40',
//             'from-yellow-900/40 to-amber-900/40','from-teal-900/40 to-cyan-900/40','from-red-900/40 to-pink-900/40'];
//
// export default function RestaurantCard({ restaurant: r, index = 0 }) {
//   const bg = BG[index % BG.length];
//   return (
//     <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:index*0.06, duration:0.4 }}>
//       <Link to={`/restaurants/${r._id}`}>
//         <div className="glass border border-white/5 rounded-2xl overflow-hidden card-hover group">
//           <div className={`h-40 bg-gradient-to-br ${bg} flex items-center justify-center relative`}>
//             <span className="text-7xl transition-transform duration-500 group-hover:scale-110">{r.logo || '🍽️'}</span>
//             {r.badges?.[0] && <span className="absolute top-3 left-3 tag-lime text-xs px-2.5 py-0.5 rounded-full font-bold">{r.badges[0]}</span>}
//             {!r.isOpen && <div className="absolute inset-0 bg-black/65 flex items-center justify-center"><span className="glass border border-white/10 text-gray-300 text-sm px-4 py-1.5 rounded-full font-semibold">Closed Now</span></div>}
//           </div>
//           <div className="p-4">
//             <div className="flex items-start justify-between mb-1.5">
//               <h3 className="font-display font-bold text-white text-base leading-tight flex-1">{r.name}</h3>
//               <div className="flex items-center gap-1 ml-2 shrink-0"><Star size={13} className="star-filled fill-yellow-400" /><span className="text-white text-sm font-bold">{r.rating?.toFixed(1)}</span></div>
//             </div>
//             <p className="text-gray-400 text-xs mb-2 truncate">{r.cuisine?.join(' · ')}</p>
//             <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
//               <span className="flex items-center gap-1"><Clock size={11}/>{r.estimatedTime}</span>
//               <span>·</span>
//               <span>{r.deliveryFee===0 ? <span className="text-lime-400 font-semibold">FREE delivery</span> : `₹${r.deliveryFee} del`}</span>
//             </div>
//             {r.activeOffer && <div className="flex items-center gap-1.5 bg-orange-500/8 border border-orange-500/15 rounded-xl px-3 py-1.5"><Tag size={11} className="text-orange-400 shrink-0"/><span className="text-orange-300 text-xs font-medium truncate">{r.activeOffer}</span></div>}
//           </div>
//         </div>
//       </Link>
//     </motion.div>
//   );
// }
