// ═══════════════════════════════════════════════════════════
// ZAAVO — Fitness Page  (src/pages/Fitness.jsx)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useDispatch }         from 'react-redux';
import { Link }                from 'react-router-dom';
import { motion }              from 'framer-motion';
import { Flame, Plus, CheckCircle, Zap } from 'lucide-react';
import { addToCart, openFoodModal } from '../store';
import { foodAPI }             from '../services/api';
import toast                   from 'react-hot-toast';

const GOALS = ['All', 'High Protein', 'Bulking', 'Cutting', 'Weight Loss', 'Keto', 'Vegan'];

const GOAL_COLORS = {
  'High Protein': 'from-blue-600 to-indigo-600',
  Bulking:        'from-orange-600 to-red-600',
  Cutting:        'from-green-600 to-teal-600',
  'Weight Loss':  'from-cyan-600 to-sky-600',
  Keto:           'from-purple-600 to-pink-600',
  Vegan:          'from-lime-600 to-green-600',
};

const GOAL_ICONS = { 'High Protein': '💪', Bulking: '🏋️', Cutting: '✂️', 'Weight Loss': '⚖️', Keto: '👑', Vegan: '🌱' };

const MacroBar = ({ v, max, color }) => (
  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((v / max) * 100, 100)}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`h-full rounded-full ${color}`} />
  </div>
);

const SUBSCRIPTION_PLANS = [
  { id: 'basic',       name: 'Basic',       price: 999,  meals: 15, discount: '10%', features: ['15 meals/month', 'Priority delivery', '₹50 credits/meal', 'Nutrition tracking'], highlight: false },
  { id: 'pro_athlete', name: 'Pro Athlete', price: 1999, meals: 30, discount: '20%', features: ['30 meals/month', 'Express delivery', 'Macro tracking', 'Custom meal plans', 'Gym partner discounts'], highlight: true },
  { id: 'elite',       name: 'Elite',       price: 3499, meals: 60, discount: '30%', features: ['60 meals/month', 'Zero delivery fees', 'Personal nutrition coach', 'Advanced analytics', 'Priority support', 'Community access'], highlight: false },
];

export default function Fitness() {
  const dispatch = useDispatch();
  const [activeGoal, setActiveGoal]   = useState('All');
  const [meals,      setMeals]        = useState([]);
  const [loading,    setLoading]      = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = activeGoal === 'All' ? {} : { goal: activeGoal.toLowerCase().replace(' ', '_') };
    foodAPI.getFitnessMeals(params)
      .then(res => setMeals(res.data.data.foods || []))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false));
  }, [activeGoal]);

  const handleAdd = (meal) => {
    dispatch(addToCart({ food: meal, quantity: 1, restaurantId: meal.restaurant?._id || meal.restaurant, restaurantName: meal.restaurant?.name || '' }));
    toast.success(`${meal.name} added to cart!`, { icon: '💪' });
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="section-label tag-lime mb-4 mx-auto w-fit">
            <Flame size={12} className="text-lime-400" /> Science-backed nutrition
          </div>
          <h1 className="font-display font-black text-5xl text-white mb-3">
            Gym Warrior <span className="gradient-text">Meal Plans</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Every meal macro-tracked, chef-crafted, and optimised for your specific fitness goal.
          </p>
        </motion.div>

        {/* Goal filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {GOALS.map(goal => (
            <button key={goal} onClick={() => setActiveGoal(goal)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeGoal === goal ? 'bg-lime-500/15 border border-lime-500/40 text-lime-300' : 'glass border border-white/5 text-gray-400 hover:text-white'}`}>
              {GOAL_ICONS[goal] || '🍽️'} {goal}
            </button>
          ))}
        </div>

        {/* Meals grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-80 rounded-3xl" />)}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-16 mb-16">
            <div className="text-5xl mb-3">🥗</div>
            <p className="text-gray-400">No meals found for this goal. Try a different filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {meals.map((meal, i) => {
              const goalKey = meal.fitnessGoal?.replace('_', ' ')
                .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              const bgColor = GOAL_COLORS[goalKey] || 'from-gray-700 to-gray-800';

              return (
                <motion.div key={meal._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass border border-white/5 rounded-3xl overflow-hidden card-hover">

                  {/* Hero */}
                  <div className={`bg-gradient-to-r ${bgColor} p-7 flex flex-col items-center text-center cursor-pointer`}
                    onClick={() => dispatch(openFoodModal(meal))}>
                    <span className="text-7xl mb-3 animate-float" style={{ animationDelay: `${i * 0.3}s` }}>{meal.image || '🍽️'}</span>
                    <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">{goalKey}</span>
                    <h3 className="font-display font-black text-white text-xl leading-tight">{meal.name}</h3>
                    {meal.description && <p className="text-white/70 text-xs mt-1">{meal.description}</p>}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {meal.nutrition && (
                      <>
                        <div className="space-y-2.5 mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">💪 Protein</span><span className="text-white font-bold">{meal.nutrition.protein}g</span>
                          </div>
                          <MacroBar v={meal.nutrition.protein} max={80}  color="bg-blue-400" />
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">🌾 Carbs</span><span className="text-white font-bold">{meal.nutrition.carbs}g</span>
                          </div>
                          <MacroBar v={meal.nutrition.carbs}   max={200} color="bg-yellow-400" />
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">🫙 Fat</span><span className="text-white font-bold">{meal.nutrition.fat}g</span>
                          </div>
                          <MacroBar v={meal.nutrition.fat}     max={50}  color="bg-orange-400" />
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 mb-5">
                          {[['🔥', meal.nutrition.calories, 'kcal'], ['💪', `${meal.nutrition.protein}g`, 'prot'], ['🌾', `${meal.nutrition.carbs}g`, 'carbs'], ['🫙', `${meal.nutrition.fat}g`, 'fat']].map(([e, v, l]) => (
                            <div key={l} className="glass rounded-xl p-2 text-center">
                              <div className="text-sm">{e}</div>
                              <div className="font-bold text-white text-xs">{v}</div>
                              <div className="text-gray-500" style={{ fontSize: '10px' }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-display font-black text-2xl text-white">₹{meal.price}</span>
                        {meal.originalPrice > meal.price && <span className="text-gray-500 text-xs line-through ml-1">₹{meal.originalPrice}</span>}
                        <div className="text-gray-500 text-xs">per serving · {meal.servingSize}</div>
                      </div>
                      <button onClick={() => handleAdd(meal)}
                        className="btn-primary px-5 py-2.5 rounded-2xl font-display font-bold flex items-center gap-1.5">
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Subscription Plans */}
        <div className="mb-8 text-center">
          <h2 className="font-display font-black text-3xl text-white mb-2">Subscription Plans</h2>
          <p className="text-gray-400">Lock in your macros. Save big. Stay consistent.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass border border-white/8 rounded-3xl p-6 ${plan.highlight ? 'ring-2 ring-orange-500/30 shadow-2xl shadow-orange-500/15 scale-105' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-zaavo text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">Most Popular</span>
                </div>
              )}
              <h3 className="font-display font-black text-2xl text-white mb-1">{plan.name}</h3>
              <div className="mb-3">
                <span className="font-black text-4xl text-white">₹{plan.price.toLocaleString()}</span>
                <span className="text-gray-300 text-sm">/month</span>
              </div>
              <div className="text-orange-200 text-sm mb-5 font-semibold">{plan.meals} meals · Save {plan.discount}</div>
              <ul className="space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-200 text-sm">
                    <CheckCircle size={15} className="text-lime-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/subscription">
                <button className={`w-full py-3.5 rounded-2xl font-display font-bold text-base ${plan.highlight ? 'btn-primary animate-pulse-glow' : 'btn-secondary'}`}>
                  Choose {plan.name}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
