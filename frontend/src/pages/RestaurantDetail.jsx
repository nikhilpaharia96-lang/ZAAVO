// ═══════════════════════════════════════════════════════════
// ZAAVO — RestaurantDetail Page
// src/pages/RestaurantDetail.jsx
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, Link }     from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence }  from 'framer-motion';
import {
  Star, Clock, MapPin, Phone, Tag, ChevronDown,
  Heart, Share2, Info, UtensilsCrossed, MessageSquare,
  Leaf, Flame,
} from 'lucide-react';
import { fetchRestaurantById, openFoodModal } from '../store';
import FoodCard  from '../components/FoodCard';

// ── Skeleton ──────────────────────────────────────────────
const DetailSkeleton = () => (
  <div>
    <div className="skeleton h-48 w-full" />
    <div className="max-w-5xl mx-auto px-4 mt-6 space-y-3">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-4 w-full" />
    </div>
  </div>
);

// ── Review Card ───────────────────────────────────────────
const ReviewCard = ({ review, index }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
    className="glass border border-white/5 rounded-2xl p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-zaavo flex items-center justify-center font-bold text-white text-sm">
        {review.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'AN'}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-white text-sm">{review.user?.name || 'Anonymous'}</div>
        <div className="flex items-center gap-1 mt-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} className={i < review.rating ? 'star-filled fill-yellow-400' : 'star-empty'} />
          ))}
          <span className="text-gray-500 text-xs ml-1">{new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
    <p className="text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
    {review.tags?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {review.tags.map(t => (
          <span key={t} className="tag-lime text-xs px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    )}
  </motion.div>
);

// ── Page ──────────────────────────────────────────────────
export default function RestaurantDetail() {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const { selected: restaurant, menu, loading } = useSelector(s => s.restaurants);

  const [activeTab,    setActiveTab]    = useState('menu');
  const [dietFilter,   setDietFilter]   = useState('all');
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    if (id) dispatch(fetchRestaurantById(id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, dispatch]);

  if (loading || !restaurant) return <DetailSkeleton />;

  const TABS = [
    { id: 'menu',    label: 'Menu',    icon: UtensilsCrossed },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'info',    label: 'Info',    icon: Info },
  ];

  const categories = Object.keys(menu.grouped || {});

  const filteredFoods = (activeCategory
    ? menu.grouped[activeCategory] || []
    : menu.foods
  ).filter(f => dietFilter === 'all' || f.dietType === dietFilter || (dietFilter === 'veg' && (f.dietType === 'veg' || f.dietType === 'vegan')));

  const ratingStars = Array.from({ length: 5 }, (_, i) => i < Math.round(restaurant.rating || 0));

  return (
    <div className="min-h-screen pb-24">
      {/* Hero section */}
      <div className={`pt-20 pb-8 bg-gradient-to-br from-orange-900/30 to-dark-2 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,87,34,0.4) 0%, transparent 60%)`,
        }} />
        <div className="max-w-5xl mx-auto px-4 pt-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Logo */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 glass border border-white/10 rounded-3xl flex items-center justify-center text-6xl shrink-0 animate-float">
              {restaurant.logo || '🍽️'}
            </motion.div>

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {restaurant.badges?.map(b => (
                  <span key={b} className="tag-lime text-xs px-2.5 py-0.5 rounded-full font-bold">{b}</span>
                ))}
                <span className={`text-sm font-bold ${restaurant.isOpen ? 'text-lime-400' : 'text-red-400'}`}>
                  {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                </span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-gray-300 text-sm mt-1">{restaurant.cuisine?.join(' · ')}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  {ratingStars.map((filled, i) => (
                    <Star key={i} size={14} className={filled ? 'star-filled fill-yellow-400' : 'star-empty'} />
                  ))}
                  <span className="text-white font-bold ml-1">{restaurant.rating?.toFixed(1)}</span>
                  <span className="text-gray-500">({restaurant.totalReviews?.toLocaleString()} reviews)</span>
                </div>
                <span className="flex items-center gap-1"><Clock size={13} />{restaurant.estimatedTime}</span>
                <span className="flex items-center gap-1">
                  {restaurant.deliveryFee === 0
                    ? <span className="text-lime-400 font-semibold flex items-center gap-1"><MapPin size={13} />Free delivery</span>
                    : <><MapPin size={13} />₹{restaurant.deliveryFee} delivery</>}
                </span>
              </div>

              {restaurant.activeOffer && (
                <div className="inline-flex items-center gap-1.5 mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
                  <Tag size={12} className="text-orange-400" />
                  <span className="text-orange-200 text-xs font-medium">{restaurant.activeOffer}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button className="glass border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors">
                <Heart size={18} />
              </button>
              <button className="glass border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-dark/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm border-b-2 transition-all ${activeTab === id ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ── MENU TAB ── */}
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Diet filter */}
              <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
                {[['all', '🍽️ All'], ['veg', '🌿 Veg'], ['non-veg', '🍖 Non-Veg'], ['vegan', '🌱 Vegan']].map(([v, l]) => (
                  <button key={v} onClick={() => setDietFilter(v)}
                    className={`filter-chip px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${dietFilter === v ? 'active border-orange-500/50 bg-orange-500/8 text-white' : 'glass'}`}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Category pills */}
              {categories.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                  <button onClick={() => setActiveCategory(null)}
                    className={`filter-chip px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${!activeCategory ? 'active border-orange-500/50 bg-orange-500/8 text-white' : 'glass'}`}>
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`filter-chip px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? 'active border-orange-500/50 bg-orange-500/8 text-white' : 'glass'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {filteredFoods.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🍽️</div>
                  <p className="text-gray-400">No items found for this filter</p>
                </div>
              ) : activeCategory ? (
                <div>
                  <h3 className="font-display font-bold text-white text-lg mb-4">{activeCategory}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFoods.map((food, i) => <FoodCard key={food._id} food={food} index={i} />)}
                  </div>
                </div>
              ) : (
                categories.length > 0 ? categories.map(cat => {
                  const catFoods = (menu.grouped[cat] || []).filter(f =>
                    dietFilter === 'all' || f.dietType === dietFilter ||
                    (dietFilter === 'veg' && (f.dietType === 'veg' || f.dietType === 'vegan'))
                  );
                  if (catFoods.length === 0) return null;
                  return (
                    <div key={cat} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-display font-bold text-white text-lg">{cat}</h3>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-gray-500 text-xs">{catFoods.length} items</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {catFoods.map((food, i) => <FoodCard key={food._id} food={food} index={i} />)}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFoods.map((food, i) => <FoodCard key={food._id} food={food} index={i} />)}
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Rating summary */}
              <div className="glass border border-white/5 rounded-3xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                  <div className="font-display font-black text-6xl text-white">{restaurant.rating?.toFixed(1)}</div>
                  <div className="flex items-center gap-1 justify-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.round(restaurant.rating) ? 'star-filled fill-yellow-400' : 'star-empty'} />
                    ))}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{restaurant.totalReviews?.toLocaleString()} reviews</div>
                </div>
                <div className="flex-1 w-full space-y-2">
                  {[5, 4, 3, 2, 1].map(n => {
                    const pct = n === 5 ? 65 : n === 4 ? 20 : n === 3 ? 8 : n === 2 ? 4 : 3;
                    return (
                      <div key={n} className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs w-2">{n}</span>
                        <Star size={11} className="star-filled fill-yellow-400 shrink-0" />
                        <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 * (6 - n) }}
                            className="h-full bg-yellow-400 rounded-full" />
                        </div>
                        <span className="text-gray-500 text-xs w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mock reviews */}
              <div className="space-y-4">
                {[
                  { user: { name: 'Rohan Sharma' }, rating: 5, comment: 'Best protein meals on campus! The High Protein Bowl is absolutely fire. Delivery is always on time.', tags: ['Quick Delivery', 'Tasty'], createdAt: new Date() },
                  { user: { name: 'Priya Mehta' }, rating: 4, comment: 'Really good quality food. The Keto Platter is exactly what my macros needed. Slightly pricey but worth it.', tags: ['Good Portions', 'Healthy'], createdAt: new Date() },
                  { user: { name: 'Arjun Reddy' }, rating: 5, comment: 'Always consistent! Never had a bad experience. The packing is good and food arrives hot.', tags: ['Hot Delivery', 'Good Packing'], createdAt: new Date() },
                ].map((r, i) => <ReviewCard key={i} review={r} index={i} />)}
              </div>
            </motion.div>
          )}

          {/* ── INFO TAB ── */}
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: '📍', label: 'Address', value: `${restaurant.address?.line1 || ''}, ${restaurant.address?.city || ''}` },
                  { icon: '📞', label: 'Phone', value: restaurant.phone || 'Not available' },
                  { icon: '💳', label: 'Payment Methods', value: 'UPI, Card, Cash on Delivery, ZAAVO Wallet' },
                  { icon: '🚴', label: 'Delivery', value: restaurant.deliveryFee === 0 ? 'Always FREE!' : `₹${restaurant.deliveryFee} (Free above ₹${restaurant.freeDeliveryAbove})` },
                  { icon: '📦', label: 'Min. Order', value: `₹${restaurant.minOrderAmount || 0}` },
                  { icon: '⏱️', label: 'Prep Time', value: restaurant.estimatedTime },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="glass border border-white/5 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <div className="text-gray-500 text-xs mb-0.5">{label}</div>
                        <div className="text-white text-sm font-medium">{value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timings */}
              {restaurant.timings?.length > 0 && (
                <div className="glass border border-white/5 rounded-2xl p-5 mt-4">
                  <h3 className="font-display font-bold text-white mb-4">Opening Hours</h3>
                  <div className="space-y-2">
                    {restaurant.timings.map(t => (
                      <div key={t.day} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 w-24">{t.day}</span>
                        <span className={t.isOpen ? 'text-white' : 'text-red-400'}>
                          {t.isOpen ? `${t.open} – ${t.close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
