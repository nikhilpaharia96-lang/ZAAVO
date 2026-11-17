// ═══════════════════════════════════════════════════════════
// ZAAVO — Checkout Page
// src/pages/Checkout.jsx
// ═══════════════════════════════════════════════════════════

import { useState }          from 'react';
import { useNavigate }       from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion }            from 'framer-motion';
import {
  ShieldCheck, Loader2, CheckCircle,
  CreditCard, Smartphone, Banknote, Wallet,
} from 'lucide-react';
import {
  selectCartItems, selectCartSubtotal, selectCartDeliveryFee, selectCartTotal,
  clearCart, placeOrder,
} from '../store';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const loadRazorpay = () =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const items     = useSelector(selectCartItems);
  const subtotal  = useSelector(selectCartSubtotal);
  const delivery  = useSelector(selectCartDeliveryFee);
  const total     = useSelector(selectCartTotal);
  const { user }  = useSelector(s => s.auth);
  const { couponDiscount, paymentMethod, deliveryAddress, appliedCoupon } = useSelector(s => s.cart);
  const { placing } = useSelector(s => s.orders);

  const [step, setStep] = useState(1); // 1=review, 2=processing, 3=success
  const [orderId, setOrderId] = useState(null);
  const tax = Math.round(subtotal * 0.05);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress && !user?.addresses?.length) {
      toast.error('Please add a delivery address first');
      return;
    }

    setStep(2);

    const orderData = {
      restaurantId:    items[0]?.restaurant,
      items:           items.map(i => ({ food: i._id, name: i.name, image: i.image, price: i.price, quantity: i.quantity })),
      deliveryAddress: deliveryAddress || user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0],
      paymentMethod,
      couponCode:      appliedCoupon?.code,
      specialInstructions: '',
    };

    try {
      // For Razorpay payments
      if (paymentMethod === 'razorpay' || paymentMethod === 'upi' || paymentMethod === 'card') {
        const loaded = await loadRazorpay();
        if (!loaded) { toast.error('Payment gateway failed to load. Try again.'); setStep(1); return; }

        // Create Razorpay order
        const { data: rzpData } = await paymentAPI.createOrder({ amount: total, orderId: 'temp' });

        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key:       rzpData.data.keyId,
            amount:    rzpData.data.amount,
            currency:  'INR',
            name:      'ZAAVO',
            description: 'Campus Food Delivery',
            order_id:  rzpData.data.razorpayOrderId,
            prefill: { name: user?.name, email: user?.email, contact: user?.phone },
            theme: { color: '#FF5722' },
            handler: async (response) => {
              // Verify payment
              await paymentAPI.verify({
                razorpayOrderId:  response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId:          'temp',
              });
              resolve(response);
            },
            modal: { ondismiss: () => reject(new Error('Payment dismissed')) },
          });
          rzp.open();
        });
      }

      // Place order in backend
      const result = await dispatch(placeOrder(orderData));
      if (placeOrder.fulfilled.match(result)) {
        const newOrderId = result.payload.order._id;
        setOrderId(newOrderId);
        setStep(3);
        dispatch(clearCart());
        setTimeout(() => navigate(`/order/${newOrderId}/track`), 2500);
      } else {
        throw new Error(result.payload || 'Order failed');
      }
    } catch (err) {
      if (err.message !== 'Payment dismissed') {
        toast.error(err.message || 'Order failed. Try again.');
      }
      setStep(1);
    }
  };

  // ── Step 3: Success screen ─────────────────────────────
  if (step === 3) return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 bg-lime-500/15 border-2 border-lime-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-lime-400" />
        </motion.div>
        <h2 className="font-display font-black text-3xl text-white mb-2">Order Placed! 🎉</h2>
        <p className="text-gray-400 mb-2">Your food is being prepared</p>
        <p className="text-orange-400 font-semibold">Redirecting to live tracking...</p>
      </motion.div>
    </div>
  );

  // ── Step 2: Processing ─────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="font-display font-bold text-white text-xl mb-2">Processing your order...</h2>
        <p className="text-gray-400 text-sm">Please do not close this page</p>
      </div>
    </div>
  );

  // ── Step 1: Review ─────────────────────────────────────
  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="font-display font-black text-3xl text-white mb-8">
          Review & Place Order
        </motion.h1>

        <div className="space-y-5">
          {/* Order Items */}
          <div className="glass border border-white/5 rounded-3xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Order Items ({items.length})</h3>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">{item.image || '🍽️'}</div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{item.name}</div>
                    <div className="text-gray-500 text-xs">{item.quantity}× ₹{item.price}</div>
                  </div>
                  <div className="text-white font-bold text-sm">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="glass border border-white/5 rounded-3xl p-5">
            <h3 className="font-display font-semibold text-white mb-3">Delivering To</h3>
            {deliveryAddress || user?.addresses?.[0] ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">📍</div>
                <div>
                  <div className="text-white font-medium text-sm">{(deliveryAddress || user.addresses[0])?.label || 'Home'}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{(deliveryAddress || user.addresses[0])?.line1}, {(deliveryAddress || user.addresses[0])?.city}</div>
                </div>
              </div>
            ) : (
              <p className="text-red-400 text-sm">⚠️ No delivery address. Please go back and add one.</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="glass border border-white/5 rounded-3xl p-5">
            <h3 className="font-display font-semibold text-white mb-3">Payment</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">
                {{ upi: '📲', card: '💳', cod: '💵', wallet: '👛' }[paymentMethod] || '💳'}
              </div>
              <span className="text-white text-sm font-medium capitalize">{paymentMethod?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Bill */}
          <div className="glass border border-white/5 rounded-3xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Bill Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-gray-400"><span>Delivery</span><span className={delivery === 0 ? 'text-lime-400' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
              <div className="flex justify-between text-gray-400"><span>GST (5%)</span><span>₹{tax}</span></div>
              {couponDiscount > 0 && <div className="flex justify-between text-lime-400 font-semibold"><span>Coupon Discount</span><span>−₹{couponDiscount}</span></div>}
              <div className="border-t border-white/8 pt-3 flex justify-between font-display font-black text-white text-xl">
                <span>Total</span><span className="text-orange-400">₹{total}</span>
              </div>
            </div>
          </div>

          {/* Place Order */}
          <button onClick={handlePlaceOrder} disabled={placing}
            className="btn-primary w-full py-5 rounded-3xl font-display font-black text-xl flex items-center justify-center gap-3 animate-pulse-glow">
            {placing
              ? <><Loader2 size={22} className="animate-spin" />Placing Order...</>
              : <>🛵 Place Order — ₹{total}</>}
          </button>

          <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
            <ShieldCheck size={13} />
            <span>256-bit encrypted · Secured by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
