// ═══════════════════════════════════════════════════════════
// ZAAVO — Subscription Page
// src/pages/Subscription.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useSelector }         from 'react-redux';
import { Link, useNavigate }   from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, CheckCircle, Zap, Gift, Copy, Check,
  RotateCcw, TrendingDown, Loader2, ArrowRight,
} from 'lucide-react';
import { subscriptionAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id:       'basic',
    name:     'Basic',
    price:    999,
    meals:    15,
    discount: '10%',
    savings:  '₹150/month',
    color:    'from-gray-700 to-gray-800',
    accent:   'border-white/10',
    badge:    null,
    features: [
      '15 macro-tracked meals/month',
      'Priority delivery (< 25 min)',
      '₹50 credits per meal',
      'Basic nutrition dashboard',
      'Email support',
    ],
  },
  {
    id:       'pro_athlete',
    name:     'Pro Athlete',
    price:    1999,
    meals:    30,
    discount: '20%',
    savings:  '₹600/month',
    color:    'from-orange-800/80 to-red-900/80',
    accent:   'border-orange-500/30',
    badge:    'Most Popular',
    badgeColor: 'bg-gradient-zaavo',
    features: [
      '30 macro-tracked meals/month',
      'Express delivery (< 18 min)',
      'Full macro & calorie tracking',
      'Custom meal plans',
      'Gym partner discounts (15%)',
      'Priority support',
    ],
  },
  {
    id:       'elite',
    name:     'Elite',
    price:    3499,
    meals:    60,
    discount: '30%',
    savings:  '₹1,500/month',
    color:    'from-lime-900/60 to-green-900/60',
    accent:   'border-lime-500/25',
    badge:    'Best Value',
    badgeColor: 'bg-gradient-lime',
    features: [
      '60 macro-tracked meals/month',
      'Zero delivery fees forever',
      'Personal nutrition coach (weekly call)',
      'Advanced performance analytics',
      'Highest priority support',
      'Exclusive community access',
      'Free subscription for a friend',
    ],
  },
];

const loadRazorpay = () =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function Subscription() {
  const navigate  = useNavigate();
  const { user, isLoggedIn } = useSelector(s => s.auth);
  const [currentSub,  setCurrentSub]  = useState(null);
  const [subLoading,  setSubLoading]  = useState(true);
  const [buying,      setBuying]      = useState(null);
  const [billing,     setBilling]     = useState('monthly');
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { setSubLoading(false); return; }
    subscriptionAPI.getMine()
      .then(r => setCurrentSub(r.data.data.subscription))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [isLoggedIn]);

  const handleSubscribe = async (plan) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setBuying(plan.id);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment failed to load. Try again.'); setBuying(null); return; }

      const { data } = await paymentAPI.createOrder({ amount: plan.price, orderId: `sub_${plan.id}` });

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         data.data.keyId,
          amount:      data.data.amount,
          currency:    'INR',
          name:        'ZAAVO Subscription',
          description: `${plan.name} Plan — ${plan.meals} meals/month`,
          order_id:    data.data.razorpayOrderId,
          prefill:     { name: user?.name, email: user?.email, contact: user?.phone },
          theme:       { color: '#FF5722' },
          notes:       { plan: plan.id },
          handler: async (response) => {
            await paymentAPI.verify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId:           `sub_${plan.id}`,
            });
            await subscriptionAPI.subscribe(plan.id, response.razorpay_payment_id);
            setCurrentSub({ plan: plan.id, mealsLeft: plan.meals, mealsTotal: plan.meals, mealsUsed: 0, status: 'active' });
            toast.success(`🎉 Welcome to ${plan.name}! ${plan.meals} meals unlocked.`, { duration: 5000 });
            resolve();
          },
          modal: { ondismiss: () => reject(new Error('dismissed')) },
        });
        rzp.open();
      });
    } catch (err) {
      if (err.message !== 'dismissed') toast.error('Subscription failed. Try again.');
    } finally {
      setBuying(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel subscription? You keep access till period end.')) return;
    try {
      await subscriptionAPI.cancel();
      setCurrentSub(p => ({ ...p, status: 'cancelled' }));
      toast('Subscription cancelled. Valid till end of billing period.', { icon: '😢' });
    } catch { toast.error('Failed to cancel. Contact support.'); }
  };

  const copyReferral = () => {
    navigator.clipboard?.writeText(user?.referralCode || 'ZAAVO-REF-001').catch(() => {});
    setReferralCopied(true);
    toast.success('Referral code copied!', { icon: '🎁' });
    setTimeout(() => setReferralCopied(false), 3000);
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center mb-12">
          <div className="section-label tag-lime mb-4 mx-auto w-fit">
            <Crown size={12} className="text-lime-400" /> Meal Subscriptions
          </div>
          <h1 className="font-display font-black text-5xl text-white mb-3">
            Eat Smart. <span className="gradient-text">Save Big.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Monthly plans crafted for campus athletes, gym warriors, and budget-conscious students.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-semibold ${billing==='monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button onClick={() => setBilling(b => b==='monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 rounded-full bg-orange-500/30 border border-orange-500/50 relative transition-colors">
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-orange-500 transition-all duration-300 ${billing==='annual' ? 'left-6' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${billing==='annual' ? 'text-white' : 'text-gray-500'}`}>
              Annual <span className="tag-lime text-xs px-1.5 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Current subscription status */}
        {isLoggedIn && !subLoading && currentSub && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            className="glass-orange rounded-3xl p-6 mb-10 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-8xl opacity-10">👑</div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1">
                <div className="tag-orange text-xs px-3 py-1 rounded-full font-bold inline-block mb-2">
                  {currentSub.status === 'active' ? '✅ Active Plan' : '⚠️ ' + currentSub.status}
                </div>
                <h3 className="font-display font-black text-2xl text-white capitalize">
                  {currentSub.plan?.replace('_', ' ')} Plan
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  {currentSub.mealsLeft} meals remaining · Renews {currentSub.renewsAt ? new Date(currentSub.renewsAt).toLocaleDateString() : 'N/A'}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Meals used</span>
                    <span className="text-white font-bold">{currentSub.mealsUsed} / {currentSub.mealsTotal}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${(currentSub.mealsUsed/currentSub.mealsTotal)*100}%` }}
                      transition={{ duration:0.8 }} className="h-full progress-bar" />
                  </div>
                </div>
              </div>
              {currentSub.status === 'active' && (
                <button onClick={handleCancel}
                  className="shrink-0 border border-red-500/30 bg-red-500/8 text-red-400 px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-red-500/15 transition-colors">
                  Cancel Plan
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const isCurrentPlan = currentSub?.plan === plan.id && currentSub?.status === 'active';
            const annualPrice   = billing === 'annual' ? Math.round(plan.price * 12 * 0.8) : null;

            return (
              <motion.div key={plan.id}
                initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.12, type:'spring', stiffness:200 }}
                className={`relative bg-gradient-to-br ${plan.color} rounded-3xl p-6 border ${plan.accent} ${plan.badge === 'Most Popular' ? 'scale-105 shadow-2xl shadow-orange-500/20' : ''}`}>

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`${plan.badgeColor} text-sm px-5 py-1 rounded-full font-bold shadow-lg ${plan.id==='elite' ? 'text-black' : 'text-white'}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Current plan indicator */}
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="tag-lime text-xs px-2.5 py-1 rounded-full font-bold">Current</span>
                  </div>
                )}

                <h3 className="font-display font-black text-2xl text-white mb-1">{plan.name}</h3>

                <div className="mb-2">
                  {billing === 'annual' ? (
                    <>
                      <span className="font-black text-4xl text-white">₹{Math.round(annualPrice / 12).toLocaleString()}</span>
                      <span className="text-gray-300 text-sm">/month</span>
                      <div className="text-xs text-lime-400 font-semibold">₹{annualPrice.toLocaleString()} billed annually</div>
                    </>
                  ) : (
                    <>
                      <span className="font-black text-4xl text-white">₹{plan.price.toLocaleString()}</span>
                      <span className="text-gray-300 text-sm">/month</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <Zap size={13} className="text-orange-300" />
                  <span className="text-orange-200 text-sm font-semibold">
                    {plan.meals} meals · Save {plan.discount} · {plan.savings}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-gray-100 text-sm">
                      <CheckCircle size={15} className="text-lime-400 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                  disabled={buying === plan.id || isCurrentPlan}
                  className={`w-full py-3.5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all ${
                    isCurrentPlan
                      ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                      : plan.badge === 'Most Popular'
                        ? 'btn-primary animate-pulse-glow'
                        : 'btn-secondary hover:border-white/30'
                  }`}
                >
                  {buying === plan.id
                    ? <><Loader2 size={18} className="animate-spin" />Processing...</>
                    : isCurrentPlan
                      ? '✅ Current Plan'
                      : <>Choose {plan.name} <ArrowRight size={16} /></>
                  }
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            ['🔄 Can I cancel anytime?', 'Yes! Cancel anytime with no penalties. Your plan stays active till the billing period ends.'],
            ['📦 Unused meals?', 'Unused meals do not roll over, but you can pause your plan up to 2 times per year.'],
            ['💳 Which payments?', 'UPI, all major credit/debit cards, net banking, and ZAAVO Wallet — all through Razorpay.'],
            ['🥗 Can I customise meals?', 'Pro and Elite members can set diet preferences, allergies, and fitness goals for personalised recommendations.'],
          ].map(([q, a]) => (
            <div key={q} className="glass border border-white/5 rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-2">{q}</div>
              <div className="text-gray-400 text-sm leading-relaxed">{a}</div>
            </div>
          ))}
        </div>

        {/* Referral */}
        {isLoggedIn && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            className="glass border border-white/5 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-3">🎁</div>
            <h2 className="font-display font-black text-2xl text-white mb-2">Refer & Earn</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Share your referral code. Get <span className="text-orange-400 font-bold">₹200 ZAAVO credits</span> for every friend who subscribes to any plan.
            </p>
            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              <div className="flex-1 glass border border-white/10 rounded-2xl px-5 py-3 text-sm text-gray-200 font-mono font-bold tracking-widest text-center">
                {user?.referralCode || 'ZAAVO-REF-001'}
              </div>
              <button onClick={copyReferral}
                className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${referralCopied ? 'bg-lime-500/15 border border-lime-500/30 text-lime-400' : 'btn-primary'}`}>
                {referralCopied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
