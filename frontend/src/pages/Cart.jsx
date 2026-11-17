// ═══════════════════════════════════════════════════════════
// ZAAVO — Cart Page
// src/pages/Cart.jsx
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, Tag, ShieldCheck, ChevronRight, MapPin, Wallet } from 'lucide-react';
import {
  selectCartItems, selectCartSubtotal, selectCartDeliveryFee, selectCartTotal,
  updateQuantity, removeFromCart, applyCoupon, removeCoupon,
  setPaymentMethod, setDeliveryAddress,
} from '../store';
import { couponAPI } from '../services/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'upi',       label: 'UPI',             icon: '📲' },
  { id: 'card',      label: 'Card',            icon: '💳' },
  { id: 'cod',       label: 'Cash on Delivery', icon: '💵' },
  { id: 'wallet',    label: 'ZAAVO Wallet',    icon: '👛' },
];

const SUGGESTED_COUPONS = ['CAMPUS20', 'ZAAVO100', 'GYMPOWER', 'NIGHT50'];

export default function Cart() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const items       = useSelector(selectCartItems);
  const subtotal    = useSelector(selectCartSubtotal);
  const delivery    = useSelector(selectCartDeliveryFee);
  const total       = useSelector(selectCartTotal);
  const { appliedCoupon, couponDiscount, paymentMethod } = useSelector(s => s.cart);
  const { user }    = useSelector(s => s.auth);

  const [couponInput,  setCouponInput]  = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { type: 'success'|'error', msg }
  const [validating,   setValidating]   = useState(false);
  const [activeAddr,   setActiveAddr]   = useState(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]);

  const tax = Math.round(subtotal * 0.05);

  const handleQty = (id, delta) => {
    const item = items.find(i => i._id === id);
    if (!item) return;
    const next = item.quantity + delta;
    if (next <= 0) dispatch(removeFromCart(id));
    else dispatch(updateQuantity({ id, quantity: next }));
  };

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidating(true);
    setCouponStatus(null);
    try {
      const { data } = await couponAPI.validate(couponInput.trim(), subtotal);
      dispatch(applyCoupon({ coupon: data.data.coupon, discount: data.data.coupon.discount }));
      setCouponStatus({ type: 'success', msg: `✓ Saved ₹${data.data.coupon.discount}!` });
      toast.success(`Coupon applied! You save ₹${data.data.coupon.discount}`);
    } catch (err) {
      setCouponStatus({ type: 'error', msg: err.response?.data?.message || 'Invalid coupon code' });
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponInput('');
    setCouponStatus(null);
  };

  if (items.length === 0) return (
    <div className="min-h-screen pt-28 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="text-center">
        <div className="text-8xl mb-6 animate-float">🛒</div>
        <h2 className="font-display font-black text-3xl text-white mb-3">Your cart is empty!</h2>
        <p className="text-gray-400 mb-8">Time to fuel up. Add some meals to get started.</p>
        <Link to="/restaurants" className="btn-primary px-8 py-4 rounded-2xl font-display font-bold text-lg inline-flex items-center gap-2">
          Browse Restaurants <ChevronRight size={18} />
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-28 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="font-display font-black text-3xl text-white mb-2">
          Your Cart
        </motion.h1>
        <p className="text-gray-400 mb-8">{items.length} item{items.length !== 1 ? 's' : ''} · {items[0]?.restaurant || ''}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Items + Address + Payment ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Cart Items */}
            <div className="glass border border-white/5 rounded-3xl overflow-hidden">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl shrink-0">
                      {item.image || '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm leading-tight truncate">{item.name}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{item.restaurant}</p>
                      {item.nutrition && (
                        <p className="text-gray-600 text-xs mt-0.5">{item.nutrition.calories} kcal · {item.nutrition.protein}g protein</p>
                      )}
                      <p className="text-orange-400 font-bold mt-1">₹{item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleQty(item._id, -1)}
                        className="w-8 h-8 rounded-xl glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                        {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
                      </button>
                      <span className="font-bold text-white w-5 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => handleQty(item._id, 1)}
                        className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 hover:bg-orange-500/25 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Delivery Address */}
            <div className="glass border border-white/5 rounded-3xl p-5">
              <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-4">
                <MapPin size={17} className="text-orange-400" /> Delivery Address
              </h3>
              {user?.addresses?.length > 0 ? (
                <div className="space-y-2">
                  {user.addresses.map(addr => (
                    <button key={addr._id} onClick={() => { setActiveAddr(addr); dispatch(setDeliveryAddress(addr)); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${activeAddr?._id === addr._id ? 'border-orange-500/40 bg-orange-500/8 text-white' : 'border-white/5 glass text-gray-300 hover:border-white/15'}`}>
                      <div className="font-semibold text-sm">{addr.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}</div>
                    </button>
                  ))}
                  <button className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-gray-500 text-sm hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Add New Address
                  </button>
                </div>
              ) : (
                <div>
                  <textarea rows={2} className="input-field w-full rounded-2xl px-4 py-3 text-sm resize-none"
                    placeholder="Enter delivery address..." onChange={e => dispatch(setDeliveryAddress({ line1: e.target.value }))} />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="glass border border-white/5 rounded-3xl p-5">
              <h3 className="font-display font-semibold text-white mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => dispatch(setPaymentMethod(m.id))}
                    className={`flex items-center gap-2 py-3 px-4 rounded-2xl border text-sm font-semibold transition-all ${paymentMethod === m.id ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-white/5 glass text-gray-400 hover:border-white/15 hover:text-white'}`}>
                    <span>{m.icon}</span><span>{m.label}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === 'wallet' && user?.walletBalance > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Wallet size={14} className="text-orange-400" />
                  <span className="text-gray-400">Available: </span>
                  <span className="text-white font-bold">₹{user.walletBalance}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Summary ── */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="glass border border-white/5 rounded-3xl p-5">
              <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-4">
                <Tag size={16} className="text-orange-400" /> Apply Coupon
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center gap-3 bg-lime-500/10 border border-lime-500/20 rounded-2xl px-4 py-3">
                  <span className="text-lime-400 text-sm font-bold flex-1">{appliedCoupon.code} — Saved ₹{couponDiscount}</span>
                  <button onClick={handleRemoveCoupon} className="text-gray-500 hover:text-red-400 transition-colors">✕</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-2">
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleValidateCoupon()}
                      className="input-field flex-1 rounded-2xl px-4 py-2.5 text-sm font-mono tracking-widest"
                      placeholder="ENTER CODE" />
                    <button onClick={handleValidateCoupon} disabled={validating}
                      className="btn-primary px-4 py-2.5 rounded-2xl text-sm font-bold">
                      {validating ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponStatus && (
                    <p className={`text-xs font-semibold ${couponStatus.type === 'success' ? 'text-lime-400' : 'text-red-400'}`}>
                      {couponStatus.msg}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {SUGGESTED_COUPONS.map(code => (
                      <button key={code} onClick={() => setCouponInput(code)}
                        className="text-xs tag-orange px-2.5 py-1 rounded-lg font-mono font-bold hover:bg-orange-500/20 transition-colors">
                        {code}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bill Summary */}
            <div className="glass border border-white/5 rounded-3xl p-5">
              <h3 className="font-display font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery Fee</span>
                  <span className={delivery === 0 ? 'text-lime-400 font-semibold' : ''}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-lime-400 font-semibold">
                    <span>Coupon Discount</span>
                    <span>−₹{couponDiscount}</span>
                  </div>
                )}
                <div className="border-t border-white/8 pt-3 flex justify-between font-display font-black text-white text-xl">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              {subtotal < 199 && (
                <div className="mt-3 text-xs text-orange-300/70 bg-orange-500/8 rounded-xl px-3 py-2">
                  Add ₹{199 - subtotal} more for free delivery!
                </div>
              )}

              <button onClick={() => navigate('/checkout')}
                className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-lg mt-4 flex items-center justify-center gap-2">
                Proceed to Checkout
                <ChevronRight size={20} />
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-gray-600 text-xs">
                <ShieldCheck size={13} />
                <span>Secured & encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
