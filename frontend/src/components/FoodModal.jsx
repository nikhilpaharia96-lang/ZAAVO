// ═══════════════════════════════════════════════════════════
// ZAAVO — FoodModal Component
// src/components/FoodModal.jsx
// ═══════════════════════════════════════════════════════════

import { useState }             from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence }  from 'framer-motion';
import {
  X, Plus, Minus, Heart, Star, Zap,
  Flame, Dumbbell, Wheat, Droplets, ShieldCheck,
} from 'lucide-react';
import {
  addToCart, closeFoodModal, toggleWishlist, selectIsWishlisted,
} from '../store';
import toast from 'react-hot-toast';

// ── Macro bar sub-component ───────────────────────────────
const MacroBar = ({ label, value, max, color, emoji }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400 flex items-center gap-1">{emoji} {label}</span>
        <span className="text-xs font-bold text-white">{value}g</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

// ── Add-on chip ───────────────────────────────────────────
const AddOnChip = ({ addon, selected, onToggle }) => (
  <button
    onClick={() => onToggle(addon)}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
      selected
        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
        : 'border-white/8 glass text-gray-400 hover:border-white/20 hover:text-white'
    }`}
  >
    {addon.name}
    <span className={selected ? 'text-orange-300' : 'text-gray-600'}>+₹{addon.price}</span>
  </button>
);

export default function FoodModal() {
  const dispatch     = useDispatch();
  const { selectedFood: food, foodModalOpen } = useSelector(s => s.ui);
  const { restaurantId, restaurantName }      = useSelector(s => s.cart);
  const isWishlisted = useSelector(food ? selectIsWishlisted(food._id) : () => false);
  const { isLoggedIn } = useSelector(s => s.auth);

  const [qty,          setQty]          = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [activeTab,    setActiveTab]    = useState('nutrition');

  if (!food || !foodModalOpen) return null;

  const addonsTotal  = selectedAddons.reduce((s, a) => s + a.price, 0);
  const lineTotal    = (food.price + addonsTotal) * qty;

  const handleClose = () => {
    dispatch(closeFoodModal());
    setQty(1);
    setSelectedAddons([]);
    setActiveTab('nutrition');
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
      food: { ...food, addOns: selectedAddons },
      quantity:       qty,
      restaurantId:   food.restaurant?._id || food.restaurant,
      restaurantName: food.restaurant?.name || restaurantName || '',
    }));
    toast.success(`${food.name} added to cart!`, { icon: '🛒', duration: 2000 });
    handleClose();
  };

  const handleWishlist = () => {
    if (!isLoggedIn) { toast.error('Login to save items'); return; }
    dispatch(toggleWishlist(food));
    toast(isWishlisted ? 'Removed from wishlist' : 'Saved!', { icon: isWishlisted ? '💔' : '❤️' });
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const isDifferentRestaurant = restaurantId &&
    restaurantId !== (food.restaurant?._id || food.restaurant)?.toString();

  const dietLabel = { veg: '🟢 Veg', 'non-veg': '🔴 Non-Veg', vegan: '🌱 Vegan', eggetarian: '🥚 Eggetarian' };
  const goalLabel = { bulking: '💪 Bulking', cutting: '✂️ Cutting', weight_loss: '⚖️ Weight Loss', high_protein: '🥩 High Protein', keto: '👑 Keto', vegan: '🌱 Vegan', none: null };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/88 backdrop-blur-md z-[1000] flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <motion.div
          key="modal"
          initial={{ y: 60, opacity: 0, scale: 0.97 }}
          animate={{ y: 0,  opacity: 1, scale: 1 }}
          exit={{   y: 60, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto no-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          {/* Swipe handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Hero image area */}
          <div className={`relative h-52 flex items-center justify-center bg-gradient-to-br ${
            food.dietType === 'veg' || food.dietType === 'vegan'
              ? 'from-green-900/50 to-lime-900/50'
              : 'from-orange-900/50 to-red-900/50'
          }`}>
            <span className="text-8xl animate-float">{food.image || '🍽️'}</span>

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              className="absolute top-3 left-3 w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center transition-colors"
            >
              <Heart size={15} className={isWishlisted ? 'fill-red-400 text-red-400' : 'text-gray-300'} />
            </button>

            {/* Popular */}
            {food.isPopular && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 rounded-full px-2.5 py-1">
                <Zap size={11} className="text-orange-400" />
                <span className="text-orange-300 text-xs font-bold">Trending</span>
              </div>
            )}
          </div>

          <div className="p-5">
            {/* Name + Restaurant */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="font-display font-black text-xl text-white leading-tight">{food.name}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{food.restaurant?.name || food.restaurant}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-1">
                <Star size={14} className="star-filled fill-yellow-400" />
                <span className="text-white font-bold">{food.rating?.toFixed(1)}</span>
                <span className="text-gray-500 text-xs">({food.totalOrders})</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-gray-400 font-medium">
                {dietLabel[food.dietType] || food.dietType}
              </span>
              {goalLabel[food.fitnessGoal] && (
                <span className="tag-lime text-xs px-2.5 py-1 rounded-full font-bold">
                  {goalLabel[food.fitnessGoal]}
                </span>
              )}
              {food.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="tag-orange text-xs px-2.5 py-1 rounded-full font-bold">{tag}</span>
              ))}
              {food.prepTime && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-gray-400">
                  ⏱ {food.prepTime} min
                </span>
              )}
            </div>

            {/* Description */}
            {food.description && (
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{food.description}</p>
            )}

            {/* Calorie headline */}
            {food.nutrition && (
              <div className="flex items-center gap-2 mb-4 bg-orange-500/8 border border-orange-500/15 rounded-2xl px-4 py-3">
                <Flame size={18} className="text-orange-400 shrink-0" />
                <span className="text-orange-200 text-sm font-semibold">
                  {food.nutrition.calories} kcal · {food.nutrition.protein}g protein · {food.servingSize || '1 serving'}
                </span>
              </div>
            )}

            {/* Tabs: Nutrition / Allergens */}
            <div className="flex gap-1 border-b border-white/8 mb-4">
              {['nutrition', 'allergens'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-all ${
                    activeTab === t ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Nutrition panel */}
            {activeTab === 'nutrition' && food.nutrition && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-5">
                {/* Macro grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { e: '🔥', v: food.nutrition.calories, u: 'kcal',    l: 'Calories' },
                    { e: '💪', v: `${food.nutrition.protein}g`, u: '',   l: 'Protein' },
                    { e: '🌾', v: `${food.nutrition.carbs}g`,   u: '',   l: 'Carbs' },
                    { e: '🫙', v: `${food.nutrition.fat}g`,     u: '',   l: 'Fat' },
                  ].map(({ e, v, u, l }) => (
                    <div key={l} className="glass rounded-xl p-2 text-center">
                      <div className="text-lg mb-0.5">{e}</div>
                      <div className="font-bold text-white text-xs">{v}{u}</div>
                      <div className="text-gray-500" style={{ fontSize: '10px' }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Macro bars */}
                <MacroBar label="Protein" value={food.nutrition.protein} max={80}  color="bg-blue-400"   emoji="💪" />
                <MacroBar label="Carbs"   value={food.nutrition.carbs}   max={150} color="bg-yellow-400" emoji="🌾" />
                <MacroBar label="Fat"     value={food.nutrition.fat}     max={50}  color="bg-orange-400" emoji="🫙" />
                {food.nutrition.fiber > 0 && (
                  <MacroBar label="Fiber" value={food.nutrition.fiber}   max={30}  color="bg-green-400"  emoji="🥦" />
                )}
              </motion.div>
            )}

            {/* Allergens panel */}
            {activeTab === 'allergens' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                {food.allergens?.length > 0 ? (
                  <div>
                    <p className="text-gray-400 text-sm mb-3">Contains:</p>
                    <div className="flex flex-wrap gap-2">
                      {food.allergens.map(a => (
                        <span key={a} className="tag-red text-xs px-3 py-1 rounded-full font-semibold">{a}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-lime-400 text-sm">
                    <ShieldCheck size={16} />
                    <span>No major allergens declared</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Add-ons */}
            {food.addOns?.length > 0 && (
              <div className="mb-5">
                <h4 className="text-white font-semibold text-sm mb-3">Add-ons</h4>
                <div className="flex flex-wrap gap-2">
                  {food.addOns.map(addon => (
                    <AddOnChip
                      key={addon.name}
                      addon={addon}
                      selected={!!selectedAddons.find(a => a.name === addon.name)}
                      onToggle={toggleAddon}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Different restaurant warning */}
            {isDifferentRestaurant && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 text-sm text-orange-300">
                ⚠️ Adding this will clear your current cart (from a different restaurant).
              </motion.div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 glass border border-white/10 rounded-2xl px-4 py-3">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="font-bold text-white w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 py-3.5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
              >
                Add to Cart — ₹{lineTotal}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
