// ═══════════════════════════════════════════════════════════
// ZAAVO — Offers Page
// src/pages/Offers.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion }              from 'framer-motion';
import { Copy, Check, Tag, Clock, Zap } from 'lucide-react';
import { couponAPI }           from '../services/api';
import toast                   from 'react-hot-toast';

const STATIC_OFFERS = [
  { code:'CAMPUS20', title:'Student Saver',     desc:'20% off every order above ₹199', color:'from-orange-600 to-red-600',   icon:'🎓', minOrder:199,  type:'percentage', value:20 },
  { code:'GYMPOWER', title:'Gym Warrior',       desc:'Free delivery on all fitness meals', color:'from-lime-600 to-green-600',  icon:'💪', minOrder:249,  type:'free_delivery' },
  { code:'NIGHT50',  title:'Midnight Muncher',  desc:'50% off after 10 PM every night',  color:'from-purple-600 to-indigo-600',icon:'🌙', minOrder:149,  type:'percentage', value:50 },
  { code:'ZAAVO100', title:'First Order',       desc:'Flat ₹100 off your first delivery',color:'from-blue-600 to-cyan-600',   icon:'🎉', minOrder:299,  type:'fixed', value:100 },
  { code:'VEGAN15',  title:'Plant Power',       desc:'15% off on all vegan meals',       color:'from-teal-600 to-emerald-600', icon:'🌱', minOrder:149,  type:'percentage', value:15 },
  { code:'HOSTEL49', title:'Hostel Special',    desc:'Free delivery every order',        color:'from-pink-600 to-rose-600',   icon:'🏠', minOrder:49,   type:'free_delivery' },
];

export default function Offers() {
  const [coupons,   setCoupons]   = useState(STATIC_OFFERS);
  const [copied,    setCopied]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    couponAPI.getAll()
      .then(res => {
        const fetched = res.data.data.coupons;
        if (fetched?.length) setCoupons(fetched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    toast.success(`${code} copied!`, { icon: '📋' });
    setTimeout(() => setCopied(null), 2500);
  };

  const tabs = [
    { id: 'all',      label: '🎁 All Offers' },
    { id: 'student',  label: '🎓 Student' },
    { id: 'fitness',  label: '💪 Fitness' },
    { id: 'new',      label: '✨ New User' },
  ];

  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
          <div className="section-label tag-orange mb-4 mx-auto w-fit">
            <Tag size={12} className="text-orange-400" /> Limited time deals
          </div>
          <h1 className="font-display font-black text-5xl text-white mb-3">
            Exclusive <span className="gradient-text">Deals</span> 🎉
          </h1>
          <p className="text-gray-400 text-lg">Campus-crafted offers that actually make sense for your budget</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-8 overflow-x-auto no-scrollbar pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeTab===t.id ? 'bg-gradient-zaavo text-white' : 'glass border border-white/5 text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Deals grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((offer, i) => (
              <motion.div key={offer.code}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-gradient-to-br ${offer.color || offer.gradient || 'from-orange-600 to-red-600'} rounded-3xl p-6 relative overflow-hidden group`}>

                {/* BG decoration */}
                <div className="absolute -right-6 -top-6 text-8xl opacity-15 group-hover:opacity-25 transition-opacity">
                  {offer.icon}
                </div>

                <div className="relative z-10">
                  <div className="text-4xl mb-4">{offer.icon}</div>
                  <h3 className="font-display font-black text-white text-xl mb-1.5">{offer.title || offer.description}</h3>
                  <p className="text-white/70 text-sm mb-2 leading-relaxed">{offer.desc || offer.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {offer.minOrderAmount > 0 && (
                      <span className="bg-black/20 text-white/80 text-xs px-2.5 py-1 rounded-full font-medium">
                        Min. ₹{offer.minOrderAmount || offer.minOrder}
                      </span>
                    )}
                    {offer.expiresAt && (
                      <span className="bg-black/20 text-white/80 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <Clock size={10} /> Expires {new Date(offer.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Copy button */}
                  <button onClick={() => copyCode(offer.code)}
                    className="flex items-center justify-between w-full bg-black/30 hover:bg-black/45 border border-white/20 rounded-2xl px-4 py-3 transition-colors group/btn">
                    <span className="font-mono font-black text-white tracking-widest text-sm">{offer.code}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${copied === offer.code ? 'bg-lime-500 text-black' : 'bg-white/15 text-white group-hover/btn:bg-white/25'}`}>
                      {copied === offer.code ? <Check size={14} /> : <Copy size={14} />}
                    </div>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* How to apply */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="mt-12 glass border border-white/5 rounded-3xl p-8">
          <h2 className="font-display font-black text-2xl text-white mb-6 text-center">How to Apply a Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              ['1', '🛒', 'Add to Cart', 'Choose your meals and add them to your cart'],
              ['2', '🏷️', 'Enter Code', 'Paste your coupon code in the cart page coupon field'],
              ['3', '🎉', 'Save Instantly', 'Discount applied automatically before checkout'],
            ].map(([step, icon, title, desc]) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-lg mx-auto mb-3">{step}</div>
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-display font-bold text-white mb-1">{title}</div>
                <div className="text-gray-400 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
